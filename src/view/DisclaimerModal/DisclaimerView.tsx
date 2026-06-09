import React, { useCallback, useMemo, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import {
  HtmlWebView,
  type HtmlWebViewMessageEvent,
} from '@/view/components/HtmlWebView';
import { theme } from '@/view/theme';
import type { WebViewEvent } from '@/infrastructure/rendering/WebViewEvent';
import { WebViewEventHandler } from '@/infrastructure/rendering/WebViewEvent';

type Props = {
  html: string;
  onPressExternalLink: (url: string) => void;
};

function DisclaimerView({ html, onPressExternalLink }: Props) {
  const { width, height } = useWindowDimensions();
  // minus padding of modal
  const maxWebviewWidth = 480 - theme.spaces.lg * 2;
  // minus margin of screen and padding of modal
  const screenWidthMinusSpace =
    width - theme.spaces.md * 2 - theme.spaces.lg * 2;

  const webViewWidth = Math.min(screenWidthMinusSpace, maxWebviewWidth);
  const [webViewInnerHeight, setWebViewInnerHeight] = useState(1);
  // minus button (44), button margin and padding of modal
  const maxWebviewHeight = Math.min(height, 560) - theme.spaces.lg * 3 - 44;
  const webViewHeight = Math.min(webViewInnerHeight, maxWebviewHeight);

  const eventHandler = useMemo(
    () =>
      new WebViewEventHandler({
        layout: ({ height: h }) => setWebViewInnerHeight(h),
        linkpressed: ({ href }) => {
          onPressExternalLink(href);
        },
      }),
    [onPressExternalLink]
  );

  const handleMessage = useCallback(
    ({ nativeEvent }: HtmlWebViewMessageEvent) => {
      const event = JSON.parse(nativeEvent.data) as WebViewEvent;
      eventHandler.handle(event);
    },
    [eventHandler]
  );

  return (
    <View style={{ height: webViewHeight }}>
      <HtmlWebView
        html={html}
        style={{
          width: webViewWidth,
          backgroundColor: theme.colors.surface,
        }}
        onMessage={handleMessage}
        scrollEnabled={webViewInnerHeight > maxWebviewHeight}
      />
    </View>
  );
}

export { DisclaimerView };
