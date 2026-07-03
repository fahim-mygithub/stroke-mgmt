import React from 'react';
import { View } from 'react-native';
import sanitizeHtml from 'sanitize-html';
import type { Article, ArticleId } from '@/domain/models/Article';
import { ArticleRow } from '@/view/HomeScreen/components/ArticleList/ArticleRow';
import { decodeHtmlEntities } from '@/view/lib/decodeHtmlEntities';

type Props = {
  data: Article[];
  onSelectArticle: (id: ArticleId) => void;
  columnWidth: number;
  maxRows: number;
};

function ArticleListColumn({
  data,
  onSelectArticle,
  columnWidth,
  maxRows,
}: Props) {
  return (
    <View style={{ width: columnWidth, minHeight: maxRows * 88 }}>
      {data.map((a) => (
        <ArticleRow
          key={a.getId().toString()}
          title={decodeHtmlEntities(a.getTitle())}
          subtitle={a.getSummary((h) => sanitizeHtml(h, { allowedTags: [] }))}
          id={a.getId()}
          imageUri={a.getThumbnail().getUri()}
          onSelectArticle={onSelectArticle}
        />
      ))}
    </View>
  );
}

export { ArticleListColumn };
