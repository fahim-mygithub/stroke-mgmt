import React, { useCallback } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import type { WebViewMessageEvent } from 'react-native-webview';
import WebView from 'react-native-webview';
import type {
  WebViewEvent,
  WebViewEventHandler,
} from '@/infrastructure/rendering/WebViewEvent';
import type { WebViewScrollEvent } from 'react-native-webview/lib/WebViewTypes';
import { useHeaderScrollResponder } from '@/view/Router/HeaderScrollContext';
import { theme } from '@/view/theme';

type Props = {
  html: string;
  eventHandler: WebViewEventHandler;
};

function ArticleView({ html, eventHandler }: Props) {
  const handleMessage = useCallback(
    ({ nativeEvent }: WebViewMessageEvent) => {
      const event = JSON.parse(nativeEvent.data) as WebViewEvent;
      eventHandler.handle(event);
    },
    [eventHandler]
  );

  const { width } = useWindowDimensions();

  const handleScroll = useHeaderScrollResponder<WebViewScrollEvent>(
    useCallback((e: WebViewScrollEvent) => e.nativeEvent.contentOffset.y, [])
  );

  return (
    <WebView
      source={{ html }}
      originWhitelist={['*']}
      style={[styles.webView, { width }]}
      onMessage={handleMessage}
      // react-native-webview's WebViewScrollEvent has optional zoomScale; RN 0.83's
      // NativeScrollEvent requires it. Cast until the library types catch up.
      onScroll={handleScroll as unknown as WebView['props']['onScroll']}
    />
  );
}

const styles = StyleSheet.create({
  webView: {
    backgroundColor: theme.colors.background,
  },
});

export { ArticleView };
