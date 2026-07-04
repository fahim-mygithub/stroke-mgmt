import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
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

  // Android's WebView reports a short preliminary height on the first layout
  // event and only grows to its final height once images/reflow settle (see
  // partials/script.ejs: notify() fires immediately, then again on 'load').
  // The one-shot scrollToEnd below lands against that short height, leaving a
  // freshly-appended step below the fold so the user has to scroll by hand.
  // Re-pin to the end as the height grows, but only during a brief window
  // right after append so later user-driven changes (e.g. expanding an outcome
  // dropdown) never yank the list. iOS/web report a stable height first, so
  // they keep the original single-shot behaviour untouched.
  const maxHeightRef = useRef(0);
  const settleUntilRef = useRef(0);

  const eventHandler = useMemo(
    () =>
      new WebViewEventHandler({
        layout: ({ height: h }) => {
          setHeight(h);
          if (isBeforeLayout) {
            setIsBeforeLayout(false);
            maxHeightRef.current = h;
            settleUntilRef.current = Date.now() + 2500;
            onFirstLayout();
          } else if (
            Platform.OS === 'android' &&
            h > maxHeightRef.current &&
            Date.now() < settleUntilRef.current
          ) {
            maxHeightRef.current = h;
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
