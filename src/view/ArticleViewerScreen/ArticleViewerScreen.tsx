import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { AppNavigationProps } from '@/view/Router';
import type { RenderArticleByIdAction } from '@/application/RenderArticleByIdAction';
import { WebViewEventHandler } from '@/infrastructure/rendering/WebViewEvent';
import { ArticleId } from '@/domain/models/Article';
import { ArticleView } from '@/view/ArticleViewerScreen/components';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UseQueryResultView } from '@/view/lib/UseQueryResultView';
import { LoadingSpinnerView } from '@/view/components';
import { ScreenErrorView } from '@/view/error-handling';

function factory(renderArticleByIdAction: RenderArticleByIdAction) {
  return function ArticleViewerScreen({
    route,
    navigation,
  }: AppNavigationProps<'ArticleViewerScreen'>) {
    const { id } = route.params;
    const queryClient = useQueryClient();
    const onStale = (html: string) =>
      queryClient.setQueryData(['article', id], html);

    const query = useQuery({
      queryKey: ['article', id],
      queryFn: () => renderArticleByIdAction.execute(id, onStale),
      retry: false,
    });

    const eventHandler = useMemo(
      () =>
        new WebViewEventHandler({
          articlelinkpressed: ({ articleId }) => {
            // push, not navigate: navigate() to the route we're already on
            // just swaps params, so back would skip the linking article and
            // land on the home screen. Pushing keeps the previous article
            // mounted (scroll position intact) and back returns to it.
            navigation.push('ArticleViewerScreen', {
              id: new ArticleId(articleId),
            });
          },
          linkpressed: ({ href }) => {
            navigation.navigate('ExternalLinkModal', { url: href });
          },
        }),
      [navigation]
    );

    return (
      <View style={styles.container}>
        <UseQueryResultView
          query={query}
          renderData={useCallback(
            (html: string) => (
              <ArticleView html={html} eventHandler={eventHandler} />
            ),
            [eventHandler]
          )}
          renderError={useCallback(
            (error) => (
              <ScreenErrorView
                error={error}
                message={`We couldn't display this article (id: ${id}). If there is internet, then refreshing or clearing the cache may help. Restarting the app might also help.`}
              />
            ),
            [id]
          )}
          renderLoading={useCallback(
            () => (
              <LoadingSpinnerView />
            ),
            []
          )}
        />
      </View>
    );
  };
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});

factory.$inject = ['renderArticleByIdAction'];

export { factory };
export type Type = ReturnType<typeof factory>;
