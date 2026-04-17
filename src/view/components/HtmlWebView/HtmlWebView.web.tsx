import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';

type HtmlWebViewMessageEvent = { nativeEvent: { data: string } };
type HtmlWebViewScrollEvent = {
  nativeEvent: { contentOffset: { x: number; y: number } };
};

type Props = {
  html: string;
  style?: StyleProp<ViewStyle>;
  scrollEnabled?: boolean;
  textInteractionEnabled?: boolean;
  onMessage: (event: HtmlWebViewMessageEvent) => void;
  onScroll?: (event: HtmlWebViewScrollEvent) => void;
};

const BRIDGE_SCRIPT = `
<script>
(function() {
  var id = String(Math.random());
  window.__rnwvId = id;
  window.ReactNativeWebView = {
    postMessage: function(data) {
      window.parent.postMessage({ __rnwv: id, type: 'message', data: data }, '*');
    }
  };
  var lastY = 0;
  window.addEventListener('scroll', function() {
    var y = window.scrollY || document.documentElement.scrollTop || 0;
    if (Math.abs(y - lastY) < 1) return;
    lastY = y;
    window.parent.postMessage({ __rnwv: id, type: 'scroll', y: y }, '*');
  }, { passive: true });
})();
</script>`;

function injectBridge(html: string) {
  if (html.includes('</head>')) {
    return html.replace('</head>', `${BRIDGE_SCRIPT}</head>`);
  }
  if (html.includes('<body')) {
    return html.replace(/<body([^>]*)>/, `<body$1>${BRIDGE_SCRIPT}`);
  }
  return `${BRIDGE_SCRIPT}${html}`;
}

function flattenStyle(
  style: StyleProp<ViewStyle>
): Record<string, string | number> {
  const flat = StyleSheet.flatten(style) ?? {};
  const css: Record<string, string | number> = {};
  Object.keys(flat).forEach((k) => {
    const value = (flat as Record<string, unknown>)[k];
    if (typeof value === 'number' || typeof value === 'string') {
      css[k] = value;
    }
  });
  return css;
}

type IframeWindow = Window & {
  __rnwvId?: string;
  notifyLayout?: (p: { width: number; height: number }) => void;
};

function HtmlWebView({
  html,
  style,
  scrollEnabled,
  onMessage,
  onScroll,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const bridgeIdRef = useRef<string | null>(null);

  const enriched = useMemo(() => injectBridge(html), [html]);

  // Register message listener synchronously before the iframe's script can
  // post anything. Using a ref for bridgeId avoids stale-closure issues where
  // the first message arrives before React has re-rendered with the id.
  const handleMessage = useCallback(
    (e: MessageEvent) => {
      const payload = e.data as
        | { __rnwv?: string; type?: string; data?: string; y?: number }
        | undefined;
      if (!payload || typeof payload.__rnwv !== 'string') return;
      const current = bridgeIdRef.current;
      if (current !== null && current !== payload.__rnwv) return;
      if (payload.type === 'message' && typeof payload.data === 'string') {
        onMessage({ nativeEvent: { data: payload.data } });
      } else if (payload.type === 'scroll' && onScroll) {
        onScroll({
          nativeEvent: { contentOffset: { x: 0, y: payload.y ?? 0 } },
        });
      }
    },
    [onMessage, onScroll]
  );

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  // On iframe load, capture the bridge id and re-fire notifyLayout. The
  // template's initial notifyLayout can race with this listener attachment
  // and be dropped; re-emitting after load guarantees the parent sees a
  // layout size at least once.
  useEffect(() => {
    if (!iframeRef.current) return undefined;
    let cancelled = false;
    const iframe = iframeRef.current;
    const onLoad = () => {
      if (cancelled) return;
      try {
        const w = iframe.contentWindow as IframeWindow;
        bridgeIdRef.current = w?.__rnwvId ?? null;
        if (typeof w?.notifyLayout === 'function' && w.document?.body) {
          w.notifyLayout({
            width: w.document.body.offsetWidth,
            height: w.document.body.offsetHeight,
          });
        }
      } catch {
        bridgeIdRef.current = null;
      }
    };
    iframe.addEventListener('load', onLoad);
    return () => {
      cancelled = true;
      iframe.removeEventListener('load', onLoad);
    };
  }, [enriched]);

  const css = flattenStyle(style);
  const iframeStyle: React.CSSProperties = {
    border: 'none',
    width: '100%',
    height: '100%',
    overflow: scrollEnabled === false ? 'hidden' : undefined,
    ...(css as React.CSSProperties),
  };

  return (
    <iframe title="html-webview" ref={iframeRef} srcDoc={enriched} style={iframeStyle} />
  );
}

export { HtmlWebView };
export type { HtmlWebViewMessageEvent, HtmlWebViewScrollEvent };
