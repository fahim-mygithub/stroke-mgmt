import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import sanitizeHtml from 'sanitize-html';
import type { Article, ArticleId } from '@/domain/models/Article';
import { theme } from '@/view/theme';
import { ArticleRow } from '@/view/HomeScreen/components/ArticleList/ArticleRow';

type Props = {
  data: Article[];
  onSelectArticle: (id: ArticleId) => void;
};

function getFirstTagName(article: Article): string | undefined {
  const tags = article.getTags();
  return tags.length > 0 ? tags[0].getName() : undefined;
}

/**
 * Responsive article grid from the redesign mockup: a single column on phone,
 * two columns at tablet width and above.
 */
function ArticleListGrid({ data, onSelectArticle }: Props) {
  const { width } = useWindowDimensions();
  const isTablet = width >= theme.breakpoints.width.tablet;
  const columns = isTablet ? 2 : 1;

  return (
    <View style={styles.grid}>
      {data.map((a) => (
        <View
          key={a.getId().toString()}
          style={[styles.cell, { width: `${100 / columns}%` }]}
        >
          <ArticleRow
            title={a.getTitle()}
            subtitle={a.getSummary((h) => sanitizeHtml(h, { allowedTags: [] }))}
            id={a.getId()}
            imageUri={a.getThumbnail().getUri()}
            tag={getFirstTagName(a)}
            onSelectArticle={onSelectArticle}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    marginTop: theme.spaces.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -theme.spaces.sm / 2,
  },
  cell: {
    paddingHorizontal: theme.spaces.sm / 2,
    marginBottom: theme.spaces.sm + theme.spaces.xs,
  },
});

export { ArticleListGrid };
