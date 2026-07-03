import React, { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StackActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { GetAllArticlesAction } from '@/application/GetAllArticlesAction';
import type { Article, ArticleId } from '@/domain/models/Article';
import type { RootNavigationProps } from '@/view/Router/Router';
import { IconButton, LoadingSpinnerView } from '@/view/components';
import { UseQueryResultView } from '@/view/lib/UseQueryResultView';
import { decodeHtmlEntities } from '@/view/lib/decodeHtmlEntities';
import { theme } from '@/view/theme';

type Props = RootNavigationProps<'SearchModal'>;

const MAX_RESULTS = 15;

// In-memory, case-insensitive match against the decoded title, the summary
// (when the CMS provided one), and tag names. Titles arrive HTML-entity-encoded
// (e.g. "LKW &gt; 24 hrs"), so decode before comparing.
function searchArticles(articles: Article[], query: string): Article[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  const results: Article[] = [];
  for (let i = 0; i < articles.length && results.length < MAX_RESULTS; i += 1) {
    const article = articles[i];
    const summary = article.getSummaryOrNull();
    const matches =
      decodeHtmlEntities(article.getTitle()).toLowerCase().includes(needle) ||
      (!!summary &&
        decodeHtmlEntities(summary).toLowerCase().includes(needle)) ||
      article.getTags().some((t) => t.getName().toLowerCase().includes(needle));
    if (matches) results.push(article);
  }
  return results;
}

type SearchResultRowProps = {
  article: Article;
  onSelectArticle: (id: ArticleId) => void;
};

function SearchResultRow({ article, onSelectArticle }: SearchResultRowProps) {
  const handlePress = useCallback(
    () => onSelectArticle(article.getId()),
    [article, onSelectArticle]
  );

  const tags = article.getTags();

  return (
    <TouchableHighlight
      onPress={handlePress}
      style={styles.resultRow}
      underlayColor={theme.colors.brandSofter}
      activeOpacity={1}
    >
      <View>
        <Text style={styles.resultTag} numberOfLines={1}>
          {(tags.length > 0 ? tags[0].getName() : 'Article').toUpperCase()}
        </Text>
        <Text style={styles.resultTitle} numberOfLines={2}>
          {decodeHtmlEntities(article.getTitle())}
        </Text>
      </View>
    </TouchableHighlight>
  );
}

function factory(getAllArticlesAction: GetAllArticlesAction) {
  return function SearchModal({ navigation }: Props) {
    const { top: safeAreaTop } = useSafeAreaInsets();

    const [query, setQuery] = useState('');

    const queryClient = useQueryClient();
    const onArticlesStale = (articles: Article[]) =>
      queryClient.setQueryData(['articles'], articles);

    // Same action and query key as the home screen's ArticleList, so the modal
    // reuses the already-fetched article cache instead of refetching.
    const articleQuery = useQuery({
      queryKey: ['articles'],
      queryFn: () => getAllArticlesAction.execute(onArticlesStale),
      retry: false,
    });

    const handleRequestDismiss = useCallback(() => {
      navigation.goBack();
    }, [navigation]);

    const handleSelectArticle = useCallback(
      (id: ArticleId) => {
        // navigate() would swap params in place when an ArticleViewerScreen
        // is already focused, so back would skip the article the user was
        // reading — the same trap ArticleViewerScreen avoids with push().
        // Close the modal, then push onto the nested App stack directly.
        const appState = navigation
          .getState()
          .routes.find((r) => r.name === 'App')?.state;
        navigation.goBack();
        if (appState?.key) {
          navigation.dispatch({
            ...StackActions.push('ArticleViewerScreen', { id }),
            target: appState.key,
          });
        } else {
          navigation.navigate('App', {
            screen: 'ArticleViewerScreen',
            params: { id },
          });
        }
      },
      [navigation]
    );

    const hasQuery = query.trim().length > 0;

    // Hoisted above the JSX because the results section renders conditionally
    // (hooks must not be called conditionally).
    const renderData = useCallback(
      (data: Article[]) => {
        const results = searchArticles(data, query);
        if (results.length === 0)
          return <Text style={styles.message}>No articles found.</Text>;
        return (
          <ScrollView
            style={styles.results}
            keyboardShouldPersistTaps="handled"
          >
            {results.map((article) => (
              <SearchResultRow
                key={article.getId().toString()}
                article={article}
                onSelectArticle={handleSelectArticle}
              />
            ))}
          </ScrollView>
        );
      },
      [query, handleSelectArticle]
    );

    const renderError = useCallback(
      () => (
        <Text style={styles.message}>
          Couldn&apos;t load articles. Please try again later.
        </Text>
      ),
      []
    );

    const renderLoading = useCallback(
      () => (
        <View style={styles.loading}>
          <LoadingSpinnerView />
        </View>
      ),
      []
    );

    return (
      <View style={styles.container}>
        <TouchableWithoutFeedback onPress={handleRequestDismiss}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        <View style={[styles.panel, { marginTop: safeAreaTop + theme.spaces.md }]}>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.input}
              value={query}
              onChangeText={setQuery}
              placeholder="Search articles"
              placeholderTextColor={theme.colors.ink3}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            <IconButton
              variant="boxed"
              iconName="times"
              onPress={handleRequestDismiss}
              iconStyle={styles.closeIcon}
              style={styles.closeButton}
            />
          </View>
          {!hasQuery ? (
            <Text style={styles.message}>
              Search the Reference Library by title, summary, or tag.
            </Text>
          ) : (
            <UseQueryResultView
              query={articleQuery}
              renderData={renderData}
              renderError={renderError}
              renderLoading={renderLoading}
            />
          )}
        </View>
      </View>
    );
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: theme.spaces.md,
  },
  backdrop: {
    backgroundColor: theme.colors.ink,
    opacity: 0.3,
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  panel: {
    backgroundColor: theme.colors.surface,
    ...theme.elevations.lg,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spaces.md,
    width: '100%',
    maxWidth: 480,
    maxHeight: '75%',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spaces.sm + theme.spaces.xs,
    fontFamily: theme.fontFamily.regular,
    fontSize: 15,
    color: theme.colors.ink,
    backgroundColor: theme.colors.surface,
  },
  closeButton: {
    marginLeft: theme.spaces.sm,
  },
  closeIcon: {
    color: theme.colors.ink2,
  },
  message: {
    ...theme.fonts.bodyMedium,
    color: theme.colors.ink2,
    marginTop: theme.spaces.md,
    paddingHorizontal: theme.spaces.xs,
  },
  results: {
    marginTop: theme.spaces.sm,
    flexGrow: 0,
  },
  resultRow: {
    paddingHorizontal: theme.spaces.sm + theme.spaces.xs,
    paddingVertical: theme.spaces.sm + 2,
    borderRadius: theme.radii.sm,
  },
  resultTag: {
    ...theme.fonts.eyebrow,
    color: theme.colors.brand,
  },
  resultTitle: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: 15,
    lineHeight: 20,
    color: theme.colors.ink,
    marginTop: 2,
  },
  loading: {
    height: 120,
    justifyContent: 'center',
  },
});

factory.$inject = ['getAllArticlesAction'];

export { factory };
export type Type = ReturnType<typeof factory>;
