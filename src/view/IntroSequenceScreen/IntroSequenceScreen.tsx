import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { AppNavigationProps } from '@/view/Router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UseQueryResultView } from '@/view/lib/UseQueryResultView';
import { LoadingSpinnerView } from '@/view/components';
import { theme } from '@/view/theme';
import { useSetAndroidBottomNavigationBarColor } from '@/view/lib/useSetAndroidBottomNavigationBarColor';
import { ScreenErrorView } from '@/view/error-handling';
import type { GetIntroSequenceAction } from '@/application/GetIntroSequenceAction';
import type { IntroSequence } from '@/domain/models/IntroSequence';
import type { RenderArticleByIdAction } from '@/application/RenderArticleByIdAction';
import { IntroArticleView } from '@/view/IntroSequenceScreen/IntroArticleView';
import { IntroSequenceBottomBar } from '@/view/IntroSequenceScreen/IntroSequenceBottomBar';
import { useShouldShow } from '@/view/IntroSequenceScreen/useShouldShow';
import type { ArticleId } from '@/domain/models/Article';
import {
  isFirstIndex,
  isLastIndex,
  nextIndex,
  prevIndex,
} from '@/view/IntroSequenceScreen/slideIndex';

function factory(
  getIntroSequenceAction: GetIntroSequenceAction,
  renderArticleByIdAction: RenderArticleByIdAction
) {
  return function IntroSequenceScreen({
    navigation,
    route,
  }: AppNavigationProps<'IntroSequenceScreen'>) {
    useSetAndroidBottomNavigationBarColor(theme.colors.surface, 'dark');

    const sequenceCursor = route.params.cursor;
    const setSequenceCursor = useCallback(
      (cursor: number) => navigation.setParams({ cursor }),
      [navigation]
    );
    const queryClient = useQueryClient();
    const onIntroStale = (seq: IntroSequence) => {
      queryClient.setQueryData(['intro-sequence'], seq);
      setSequenceCursor(0);
    };
    const query = useQuery({
      queryKey: ['intro-sequence'],
      queryFn: () => getIntroSequenceAction.execute(onIntroStale),
    });

    const slideCount =
      !query.isLoading && query.data ? query.data.getArticleIds().length : 0;
    const isLastArticle = !query.isLoading && !!query.data && isLastIndex(
      sequenceCursor,
      slideCount
    );

    const [checkboxValue, setCheckboxValue, saveShouldShow] = useShouldShow();

    const [seenEvalPtModal, setSeenEvalPtModal] = useState(false);

    const handlePressNext = useCallback(() => {
      if (query.isError) {
        navigation.reset({ index: 0, routes: [{ name: 'HomeScreen' }] });
        return;
      }
      if (query.isLoading || !query.data) return;
      const suggestAfterId = query.data.getSuggestAlgorithmAfterArticleId();
      const currentId = query.data.getArticleIds()[sequenceCursor];
      const suggestedAlgorithmId = query.data.getSuggestedAlgorithmId();
      if (suggestAfterId.is(currentId) && !seenEvalPtModal) {
        setSeenEvalPtModal(true);
        navigation.navigate('EvaluatingPatientModal', { suggestedAlgorithmId });
        return;
      }
      const count = query.data.getArticleIds().length;
      if (!isLastIndex(sequenceCursor, count)) {
        // not done with sequence
        setSequenceCursor(nextIndex(sequenceCursor, count));
      } else {
        // done with sequence
        saveShouldShow();
        navigation.reset({ index: 0, routes: [{ name: 'HomeScreen' }] });
      }
    }, [
      navigation,
      query.data,
      query.isError,
      query.isLoading,
      saveShouldShow,
      seenEvalPtModal,
      sequenceCursor,
      setSequenceCursor,
    ]);

    const handlePressPrevious = useCallback(() => {
      if (query.isLoading || !query.data) return;
      const count = query.data.getArticleIds().length;
      setSequenceCursor(prevIndex(sequenceCursor, count));
    }, [query.data, query.isLoading, sequenceCursor, setSequenceCursor]);

    const handlePressExternalLink = useCallback(
      (url: string) => navigation.navigate('ExternalLinkModal', { url }),
      [navigation]
    );

    const handlePressArticleLink = useCallback(
      (id: ArticleId) => navigation.navigate('ArticleViewerScreen', { id }),
      [navigation]
    );

    const renderData = useCallback(
      (seq: IntroSequence) => (
        <IntroArticleView
          id={seq.getArticleIds()[sequenceCursor]}
          renderArticleByIdAction={renderArticleByIdAction}
          onPressExternalLink={handlePressExternalLink}
          onPressArticleLink={handlePressArticleLink}
        />
      ),
      [handlePressArticleLink, handlePressExternalLink, sequenceCursor]
    );

    const renderError = useCallback(
      (error: unknown) => (
        <ScreenErrorView
          error={error}
          message="We had trouble retrieving the list of introductory articles. If there is internet, then refreshing or clearing the cache may help. Restarting the app might also help."
        />
      ),
      []
    );

    const renderLoading = useCallback(() => <LoadingSpinnerView />, []);

    return (
      <View style={styles.container}>
        <View style={styles.slideArea}>
          <UseQueryResultView
            query={query}
            renderData={renderData}
            renderError={renderError}
            renderLoading={renderLoading}
          />
        </View>
        <IntroSequenceBottomBar
          onPressNext={handlePressNext}
          onPressPrevious={handlePressPrevious}
          onChangeCheckbox={setCheckboxValue}
          checkboxValue={checkboxValue}
          isFirst={isFirstIndex(sequenceCursor)}
          isLast={isLastArticle}
          nextTitle={
            query.isError ? 'Go Home' : isLastArticle ? 'Get Started' : 'Next'
          }
        />
      </View>
    );
  };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  slideArea: { flex: 1 },
});

factory.$inject = ['getIntroSequenceAction', 'renderArticleByIdAction'];

export { factory };
export type Type = ReturnType<typeof factory>;
