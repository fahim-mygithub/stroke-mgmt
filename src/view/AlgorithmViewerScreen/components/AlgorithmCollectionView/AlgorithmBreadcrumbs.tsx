import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  PressableStateCallbackType,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import type { RenderedAlgorithm } from '@/domain/models/Algorithm';
import type { AlgorithmIdWithUuid } from '@/view/AlgorithmViewerScreen/components/AlgorithmCollectionView/AlgorithmCollection';
import { buildCrumbs } from '@/view/AlgorithmViewerScreen/components/AlgorithmCollectionView/breadcrumbs';
import { decodeHtmlEntities } from '@/view/lib/decodeHtmlEntities';
import { theme } from '@/view/theme';

type Props = {
  items: AlgorithmIdWithUuid[];
  onPressCrumb: (index: number) => void;
};

// Web fades the leftmost 32px with a CSS mask to hint at crumbs scrolled
// off-screen; no gradient dependency exists here, so approximate it with
// stepped canvas-colored slices laid over the scroller.
const FADE_WIDTH = 32;
const FADE_SLICE_COUNT = 8;
const FADE_SLICES = Array.from({ length: FADE_SLICE_COUNT }, (_, i) => i);

// Titles live in the react-query cache: each AlgorithmCollectionItem owns the
// ['algorithm', id] query. We read + subscribe to the cache directly instead
// of mounting our own query observers — an extra observer would swap the
// query's options and could clobber the item's custom structuralSharing,
// which drives the stale-content drop behavior.
function useCrumbTitles(items: AlgorithmIdWithUuid[]): Record<string, string> {
  const queryClient = useQueryClient();
  const [titles, setTitles] = useState<Record<string, string>>({});

  useEffect(() => {
    const readTitles = () => {
      setTitles((prev) => {
        const next: Record<string, string> = {};
        items.forEach(({ id, uuid }) => {
          const rendered = queryClient.getQueryData<RenderedAlgorithm>([
            'algorithm',
            id.toString(),
          ]);
          // keep the last-known title if the cache entry is gone
          const title = rendered
            ? decodeHtmlEntities(rendered.getAlgorithm().getTitle())
            : prev[uuid];
          if (title !== undefined) next[uuid] = title;
        });
        const changed =
          Object.keys(next).length !== Object.keys(prev).length ||
          Object.keys(next).some((uuid) => next[uuid] !== prev[uuid]);
        return changed ? next : prev;
      });
    };
    readTitles();
    return queryClient.getQueryCache().subscribe((event) => {
      if (event.query.queryKey[0] === 'algorithm') readTitles();
    });
  }, [items, queryClient]);

  return titles;
}

const crumbPressableStyle = ({
  pressed,
}: PressableStateCallbackType): StyleProp<ViewStyle> => [
  styles.crumb,
  pressed && styles.crumbPressed,
];

type CrumbButtonProps = {
  index: number;
  label: string;
  fullTitle: string;
  isCurrent: boolean;
  onPress: (index: number) => void;
};

function CrumbButton({
  index,
  label,
  fullTitle,
  isCurrent,
  onPress,
}: CrumbButtonProps) {
  const handlePress = useCallback(() => onPress(index), [index, onPress]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={fullTitle}
      onPress={handlePress}
      style={crumbPressableStyle}
    >
      {({ pressed }) => (
        <Text
          style={[
            isCurrent ? styles.currentLabel : styles.pastLabel,
            pressed && styles.pastLabelPressed,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

function BaseAlgorithmBreadcrumbs({ items, onPressCrumb }: Props) {
  const titles = useCrumbTitles(items);
  const scrollView = useRef<ScrollView>(null);

  const uuids = useMemo(() => items.map((item) => item.uuid), [items]);
  const crumbs = useMemo(() => buildCrumbs(uuids, titles), [uuids, titles]);

  // Match web: keep the newest (rightmost) crumb in view on every change.
  const handleContentSizeChange = useCallback(() => {
    scrollView.current?.scrollToEnd({ animated: true });
  }, []);

  if (crumbs.length === 0) return null;

  return (
    <View style={styles.bar}>
      <ScrollView
        ref={scrollView}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
        onContentSizeChange={handleContentSizeChange}
      >
        {crumbs.map((crumb) => (
          <React.Fragment key={crumb.uuid}>
            {crumb.index > 0 && (
              <Text
                style={styles.separator}
                accessibilityElementsHidden
                importantForAccessibility="no"
              >
                ›
              </Text>
            )}
            {/* The current crumb is tappable too: after jumping back via an
                earlier crumb, it is the one-tap way to return to the newest
                step in the chain. */}
            <CrumbButton
              index={crumb.index}
              label={crumb.label}
              fullTitle={crumb.fullTitle}
              isCurrent={crumb.isCurrent}
              onPress={onPressCrumb}
            />
          </React.Fragment>
        ))}
      </ScrollView>
      <View pointerEvents="none" style={styles.leftFade}>
        {FADE_SLICES.map((i) => (
          <View
            key={i}
            style={[styles.fadeSlice, { opacity: 1 - i / FADE_SLICE_COUNT }]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: theme.colors.canvas,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border2,
  },
  content: {
    paddingHorizontal: theme.spaces.lg,
    paddingVertical: theme.spaces.sm,
    alignItems: 'center',
    gap: 6,
  },
  crumb: {
    paddingVertical: theme.spaces.xs,
    paddingHorizontal: theme.spaces.sm,
    borderRadius: theme.radii.sm,
  },
  crumbPressed: {
    backgroundColor: theme.colors.brandSofter,
  },
  pastLabel: {
    fontFamily: theme.fontFamily.medium,
    fontWeight: '500',
    fontSize: 12.5,
    lineHeight: 17,
    color: theme.colors.ink3,
  },
  pastLabelPressed: {
    color: theme.colors.ink,
  },
  currentLabel: {
    fontFamily: theme.fontFamily.semibold,
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 17,
    color: theme.colors.ink,
  },
  separator: {
    fontFamily: theme.fontFamily.regular,
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.ink3,
    opacity: 0.6,
  },
  leftFade: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: FADE_WIDTH,
    flexDirection: 'row',
  },
  fadeSlice: {
    flex: 1,
    backgroundColor: theme.colors.canvas,
  },
});

export const AlgorithmBreadcrumbs = React.memo(BaseAlgorithmBreadcrumbs);
