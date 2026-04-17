import React, { useCallback } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import {
  HtmlWebView,
  type HtmlWebViewMessageEvent,
  type HtmlWebViewScrollEvent,
} from '@/view/components/HtmlWebView';
import type {
  WebViewEvent,
  WebViewEventHandler,
} from '@/infrastructure/rendering/WebViewEvent';
import { useHeaderScrollResponder } from '@/view/Router/HeaderScrollContext';
import { theme } from '@/view/theme';

type Props = {
  html: string;
  eventHandler: WebViewEventHandler;
};

function ArticleView({ html, eventHandler }: Props) {
  const handleMessage = useCallback(
    ({ nativeEvent }: HtmlWebViewMessageEvent) => {
      const event = JSON.parse(nativeEvent.data) as WebViewEvent;
      eventHandler.handle(event);
    },
    [eventHandler]
  );

  const { width } = useWindowDimensions();

  const handleScroll = useHeaderScrollResponder<HtmlWebViewScrollEvent>(
    useCallback((e: HtmlWebViewScrollEvent) => e.nativeEvent.contentOffset.y, [])
  );

  return (
    <HtmlWebView
      html={html}
      style={[styles.webView, { width }]}
      onMessage={handleMessage}
      onScroll={handleScroll}
    />
  );
}

const styles = StyleSheet.create({
  webView: {
    backgroundColor: theme.colors.background,
  },
});

export { ArticleView };
