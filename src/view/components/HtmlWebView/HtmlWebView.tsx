import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { NativeSyntheticEvent } from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';

type HtmlWebViewMessageEvent = NativeSyntheticEvent<{ data: string }>;
type HtmlWebViewScrollEvent = NativeSyntheticEvent<{
  contentOffset: { x: number; y: number };
}>;

type Props = {
  html: string;
  style?: StyleProp<ViewStyle>;
  scrollEnabled?: boolean;
  textInteractionEnabled?: boolean;
  onMessage: (event: HtmlWebViewMessageEvent) => void;
  onScroll?: (event: HtmlWebViewScrollEvent) => void;
};

function HtmlWebView({
  html,
  style,
  scrollEnabled,
  textInteractionEnabled,
  onMessage,
  onScroll,
}: Props) {
  return (
    <WebView
      source={{ html }}
      originWhitelist={['*']}
      style={style}
      scrollEnabled={scrollEnabled}
      textInteractionEnabled={textInteractionEnabled}
      onMessage={onMessage as (e: WebViewMessageEvent) => void}
      // react-native-webview's WebViewScrollEvent has optional zoomScale while
      // RN 0.83's NativeScrollEvent requires it; cast until the library catches up.
      onScroll={onScroll as unknown as WebView['props']['onScroll']}
    />
  );
}

export { HtmlWebView };
export type { HtmlWebViewMessageEvent, HtmlWebViewScrollEvent };
