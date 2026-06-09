import React, { useCallback } from 'react';
import { View, StyleSheet, Text, TouchableWithoutFeedback } from 'react-native';
import type { RootNavigationProps } from '@/view/Router';
import { theme } from '@/view/theme';
import { Button, TextButton } from '@/view/components';

function EvaluatingPatientModal({
  route,
  navigation,
}: RootNavigationProps<'EvaluatingPatientModal'>) {
  const handleDismiss = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const { suggestedAlgorithmId } = route.params;

  const handlePressYes = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'App',
          state: {
            index: 1,
            routes: [
              { name: 'HomeScreen' },
              {
                name: 'AlgorithmViewerScreen',
                params: { id: suggestedAlgorithmId },
              },
            ],
          },
        },
      ],
    });
  }, [navigation, suggestedAlgorithmId]);

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={handleDismiss}>
        <View style={styles.background} />
      </TouchableWithoutFeedback>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Start AIS algorithm?</Text>
        <Text style={styles.subtitle}>
          Would you like to skip the articles and begin the acute ischemic
          stroke algorithm? This may be helpful if you are currently evaluating
          a patient.
        </Text>
        <View style={styles.buttonGroup}>
          <TextButton
            title="No"
            onPress={handleDismiss}
            textColor={theme.colors.ink2}
            style={styles.btnSecondary}
          />
          <Button title="Yes" onPress={handlePressYes} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spaces.md,
  },
  background: {
    backgroundColor: theme.colors.ink,
    opacity: 0.5,
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  contentContainer: {
    backgroundColor: theme.colors.surface,
    ...theme.elevations.lg,
    padding: theme.spaces.lg,
    width: '100%',
    minWidth: 280,
    maxWidth: 480,
    borderRadius: theme.radii.lg,
  },
  buttonGroup: {
    marginTop: theme.spaces.lg,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: theme.spaces.sm,
  },
  btnSecondary: {
    alignSelf: 'center',
  },
  title: {
    ...theme.fonts.titleLarge,
    color: theme.colors.ink,
  },
  subtitle: {
    ...theme.fonts.bodyMedium,
    color: theme.colors.ink2,
    marginTop: theme.spaces.sm,
  },
});

export { EvaluatingPatientModal };
