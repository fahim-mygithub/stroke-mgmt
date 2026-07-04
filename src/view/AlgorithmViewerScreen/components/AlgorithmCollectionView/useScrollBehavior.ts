import { useCallback, useRef } from 'react';
import type {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { useHeaderScrollResponder } from '@/view/Router/HeaderScrollContext';

export function useScrollBehavior() {
  const flatList = useRef<FlatList>(null);
  const scrollToEnd = useCallback(() => {
    flatList.current?.scrollToEnd({ animated: true });
  }, []);
  const scrollToIndex = useCallback((index: number) => {
    flatList.current?.scrollToIndex({ index, animated: true, viewPosition: 0 });
  }, []);
  // Items are variable-height WebViews with no getItemLayout, so scrolling to
  // an unmeasured index can fail: approximate the offset, then retry once the
  // target has had a chance to render.
  const handleScrollToIndexFailed = useCallback(
    (info: { index: number; averageItemLength: number }) => {
      flatList.current?.scrollToOffset({
        offset: info.averageItemLength * info.index,
        animated: true,
      });
      setTimeout(() => {
        flatList.current?.scrollToIndex({
          index: info.index,
          animated: true,
          viewPosition: 0,
        });
      }, 250);
    },
    []
  );
  const handleScroll = useHeaderScrollResponder<
    NativeSyntheticEvent<NativeScrollEvent>
  >(useCallback((e) => e.nativeEvent.contentOffset.y, []));
  return {
    scrollToEnd,
    scrollToIndex,
    handleScrollToIndexFailed,
    flatList,
    handleScroll,
  };
}
