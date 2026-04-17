import React, { useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import WebView from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import type { WebViewScrollEvent } from 'react-native-webview/lib/WebViewTypes';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArticleId } from '@/domain/models/Article';
import type { WebViewEvent } from '@/infrastructure/rendering/WebViewEvent';
import { WebViewEventHandler } from '@/infrastructure/rendering/WebViewEvent';
import type { RenderArticleByIdAction } from '@/application/RenderArticleByIdAction';
import { theme } from '@/view/theme';
import { UseQueryResultView } from '@/view/lib/UseQueryResultView';
import { ScreenErrorView } from '@/view/error-handling';
import { LoadingSpinnerView } from '@/view/components';
import { useHeaderScrollResponder } from '@/view/Router/HeaderScrollContext';

type Props = {
  id: ArticleId;
  renderArticleByIdAction: RenderArticleByIdAction;
  onPressExternalLink: (url: string) => void;
  onPressArticleLink: (id: ArticleId) => void;
};

function IntroArticleView({
  id,
  renderArticleByIdAction,
  onPressExternalLink,
  onPressArticleLink,
}: Props) {
  const eventHandler = useMemo(
    () =>
      new WebViewEventHandler({
        linkpressed: ({ href }) => {
          onPressExternalLink(href);
        },
        articlelinkpressed: ({ articleId }) => {
          onPressArticleLink(new ArticleId(articleId));
        },
      }),
    [onPressArticleLink, onPressExternalLink]
  );

  const handleMessage = useCallback(
    ({ nativeEvent }: WebViewMessageEvent) => {
      const event = JSON.parse(nativeEvent.data) as WebViewEvent;
      eventHandler.handle(event);
    },
    [eventHandler]
  );

  const handleScroll = useHeaderScrollResponder<WebViewScrollEvent>(
    useCallback((e: WebViewScrollEvent) => e.nativeEvent.contentOffset.y, [])
  );

  const queryClient = useQueryClient();
  const onStale = (html: string) =>
    queryClient.setQueryData(['article', id], html);

  const query = useQuery({
    queryKey: ['article', id],
    queryFn: () => renderArticleByIdAction.execute(id, onStale),
  });

  const renderData = useCallback(
    (html: string) => (
      <WebView
        source={{ html }}
        originWhitelist={['*']}
        onMessage={handleMessage}
        // react-native-webview's WebViewScrollEvent has optional zoomScale; RN 0.83's
        // NativeScrollEvent requires it. Cast until the library types catch up.
        onScroll={handleScroll as unknown as WebView['props']['onScroll']}
        style={styles.webView}
      />
    ),
    [handleMessage, handleScroll]
  );

  const renderError = useCallback(
    (error: unknown) => (
      <ScreenErrorView
        error={error}
        message={`We had trouble retrieving the intro article (id: ${id}). If there is internet, then refreshing or clearing the cache may help. Restarting the app might also help.`}
      />
    ),
    [id]
  );

  const renderLoading = useCallback(() => <LoadingSpinnerView />, []);

  return (
    <UseQueryResultView
      query={query}
      renderData={renderData}
      renderError={renderError}
      renderLoading={renderLoading}
    />
  );
}

const styles = StyleSheet.create({
  webView: {
    backgroundColor: theme.colors.background,
  },
});

export { IntroArticleView };
