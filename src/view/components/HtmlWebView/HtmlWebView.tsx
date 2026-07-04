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
      // baseUrl gives the document a real https origin. Without it the page
      // has a null origin and sends no Referer, and YouTube's embedder
      // identity check (enforced July 2025) rejects playback with
      // "Error 153 – Video player configuration error". All page resources
      // are inline or data:/absolute-https URIs, so nothing resolves against
      // the base.
      source={{ html, baseUrl: 'https://stroke-mgmt-cms.a2hosted.com' }}
      originWhitelist={['*']}
      // Play YouTube embeds inside the article instead of forcing the iOS
      // fullscreen native player; the gesture requirement must be off for the
      // embedded player to initialize its playback config (embeds never
      // carry autoplay, so nothing plays unprompted).
      allowsInlineMediaPlayback
      allowsFullscreenVideo
      mediaPlaybackRequiresUserAction={false}
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
