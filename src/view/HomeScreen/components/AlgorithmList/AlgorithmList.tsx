import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { theme } from '@/view/theme';
import { Eyebrow } from '@/view/components';
import type { AlgorithmId, Algorithm } from '@/domain/models/Algorithm';
import { AlgorithmListFilled } from '@/view/HomeScreen/components/AlgorithmList/AlgorithmListFilled';
import { AlgorithmListError } from '@/view/HomeScreen/components/AlgorithmList/AlgorithmListError';
import { AlgorithmListLoading } from '@/view/HomeScreen/components/AlgorithmList/AlgorithmListLoading';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UseQueryResultView } from '@/view/lib/UseQueryResultView';
import { AlgorithmListEmpty } from '@/view/HomeScreen/components/AlgorithmList/AlgorithmListEmpty';

type AlgorithmListProps = {
  getAllAlgorithms: (cb: (as: Algorithm[]) => void) => Promise<Algorithm[]>;
  onSelectAlgorithm: (id: AlgorithmId) => void;
  style?: StyleProp<ViewStyle>;
};

function AlgorithmList({
  getAllAlgorithms,
  onSelectAlgorithm,
  style = {},
}: AlgorithmListProps) {
  const queryClient = useQueryClient();
  const onAlgorithmsStale = (algorithms: Algorithm[]) =>
    queryClient.setQueryData(['algorithms'], algorithms);

  const query = useQuery({
    queryKey: ['algorithms'],
    queryFn: () => getAllAlgorithms(onAlgorithmsStale),
  });

  return (
    <View style={style}>
      <Eyebrow>TREATMENT ALGORITHMS</Eyebrow>
      <Text style={styles.title}>Build a treatment algorithm</Text>
      <Text style={styles.subtitle}>
        Start with an assessment pathway. The app walks you through each decision
        and keeps a running record of your treatment plan.
      </Text>
      <UseQueryResultView
        query={query}
        renderData={useCallback(
          (data: Algorithm[]) =>
            data.length !== 0 ? (
              <AlgorithmListFilled
                data={data}
                onSelectAlgorithm={onSelectAlgorithm}
              />
            ) : (
              <AlgorithmListEmpty />
            ),
          [onSelectAlgorithm]
        )}
        renderError={useCallback(
          (error) => (
            <AlgorithmListError error={error} />
          ),
          []
        )}
        renderLoading={useCallback(
          () => (
            <AlgorithmListLoading />
          ),
          []
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    ...theme.fonts.sectionTitle,
    color: theme.colors.ink,
    marginTop: theme.spaces.sm,
    marginBottom: theme.spaces.xs,
  },
  subtitle: {
    ...theme.fonts.bodyMedium,
    fontSize: 14,
    color: theme.colors.ink2,
  },
});

export { AlgorithmList };
