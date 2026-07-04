import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import {
  HtmlWebView,
  type HtmlWebViewMessageEvent,
} from '@/view/components/HtmlWebView';
import type { Algorithm, ScoredAlgorithm } from '@/domain/models/Algorithm';
import { AlgorithmId, SwitchId } from '@/domain/models/Algorithm';
import type { WebViewEvent } from '@/infrastructure/rendering/WebViewEvent';
import {
  WebViewEventHandler,
  WebViewError,
} from '@/infrastructure/rendering/WebViewEvent';
import { LevelId } from '@/domain/models/Algorithm/Switch';
import { ArticleId } from '@/domain/models/Article';

type ScoredAlgorithmViewProps = {
  html: string;
  width: number;
  algorithm: ScoredAlgorithm;
  onChangeAlgorithm: (algo: ScoredAlgorithm) => void;
  onNextAlgorithm: (id: AlgorithmId, thisAlgorithm: Algorithm) => void;
  onPressArticleLink: (id: ArticleId) => void;
  onPressExternalLink: (url: string) => void;
  onFirstLayout: () => void;
};

function ScoredAlgorithmView({
  html,
  width,
  algorithm,
  onChangeAlgorithm,
  onNextAlgorithm,
  onPressArticleLink,
  onPressExternalLink,
  onFirstLayout,
}: ScoredAlgorithmViewProps) {
  const [height, setHeight] = useState(1);

  const [isBeforeLayout, setIsBeforeLayout] = useState(true);

  const eventHandler = useMemo(
    () =>
      new WebViewEventHandler({
        layout: ({ height: h }) => {
          setHeight(h);
          if (isBeforeLayout) {
            setIsBeforeLayout(false);
            onFirstLayout();
          }
        },
        error: ({ name, message }) => {
          throw new WebViewError(name, message);
        },
        switchchanged: ({ id, levelId }) => {
          const newAlgo = algorithm.setSwitchById(
            new SwitchId(id),
            new LevelId(levelId)
          );
          onChangeAlgorithm(newAlgo);
        },
        nextpressed: ({ id }) =>
          onNextAlgorithm(new AlgorithmId(id), algorithm),
        articlelinkpressed: ({ articleId }) =>
          onPressArticleLink(new ArticleId(articleId)),
        linkpressed: ({ href }) => {
          onPressExternalLink(href);
        },
      }),
    [
      algorithm,
      isBeforeLayout,
      onChangeAlgorithm,
      onFirstLayout,
      onNextAlgorithm,
      onPressArticleLink,
      onPressExternalLink,
    ]
  );

  const handleMessage = useCallback(
    ({ nativeEvent }: HtmlWebViewMessageEvent) => {
      const event = JSON.parse(nativeEvent.data) as WebViewEvent;
      eventHandler.handle(event);
    },
    [eventHandler]
  );

  return (
    <View style={{ height }}>
      <HtmlWebView
        html={html}
        style={{ width }}
        onMessage={handleMessage}
        scrollEnabled={false}
        textInteractionEnabled
      />
    </View>
  );
}

export { ScoredAlgorithmView };
