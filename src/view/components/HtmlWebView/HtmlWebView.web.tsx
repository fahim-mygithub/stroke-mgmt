import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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

function HtmlWebView({
  html,
  style,
  scrollEnabled,
  onMessage,
  onScroll,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [bridgeId, setBridgeId] = useState<string | null>(null);

  const enriched = useMemo(() => injectBridge(html), [html]);

  // Capture the bridge id the iframe generated so we only respond to its posts.
  useEffect(() => {
    if (!iframeRef.current) return undefined;
    let cancelled = false;
    const iframe = iframeRef.current;
    const onLoad = () => {
      if (cancelled) return;
      try {
        const w = iframe.contentWindow as Window & { __rnwvId?: string };
        setBridgeId(w?.__rnwvId ?? null);
      } catch {
        setBridgeId(null);
      }
    };
    iframe.addEventListener('load', onLoad);
    return () => {
      cancelled = true;
      iframe.removeEventListener('load', onLoad);
    };
  }, [enriched]);

  const handleMessage = useCallback(
    (e: MessageEvent) => {
      const payload = e.data as
        | { __rnwv?: string; type?: string; data?: string; y?: number }
        | undefined;
      if (!payload || payload.__rnwv !== bridgeId) return;
      if (payload.type === 'message' && typeof payload.data === 'string') {
        onMessage({ nativeEvent: { data: payload.data } });
      } else if (payload.type === 'scroll' && onScroll) {
        onScroll({
          nativeEvent: { contentOffset: { x: 0, y: payload.y ?? 0 } },
        });
      }
    },
    [bridgeId, onMessage, onScroll]
  );

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  const css = flattenStyle(style);
  const iframeStyle: React.CSSProperties = {
    border: 'none',
    width: '100%',
    height: '100%',
    overflow: scrollEnabled === false ? 'hidden' : undefined,
    ...(css as React.CSSProperties),
  };

  return <iframe title="html-webview" ref={iframeRef} srcDoc={enriched} style={iframeStyle} />;
}

export { HtmlWebView };
export type { HtmlWebViewMessageEvent, HtmlWebViewScrollEvent };
