import React, { useCallback } from 'react';
import {
  HtmlWebView,
  type HtmlWebViewMessageEvent,
} from '@/view/components/HtmlWebView';
import type {
  WebViewEvent,
  WebViewEventHandler,
} from '@/infrastructure/rendering/WebViewEvent';

type Props = {
  html: string;
  eventHandler: WebViewEventHandler;
};

function AboutUsView({ html, eventHandler }: Props) {
  const handleMessage = useCallback(
    ({ nativeEvent }: HtmlWebViewMessageEvent) => {
      const event = JSON.parse(nativeEvent.data) as WebViewEvent;
      eventHandler.handle(event);
    },
    [eventHandler]
  );

  return <HtmlWebView html={html} onMessage={handleMessage} />;
}

export { AboutUsView };
