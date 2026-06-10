import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AppNavigationProps } from '@/view/Router';
import type { PdfExporter } from '@/application/ports/PdfExporter';
import { theme } from '@/view/theme';
import { Button, Eyebrow } from '@/view/components';
import { useTreatmentTrail } from '@/view/lib/TreatmentTrail';
import { buildTreatmentHandoffHtml } from '@/view/TreatmentSummaryScreen/buildTreatmentHandoffHtml';

function factory(pdfExporter: PdfExporter) {
  return function TreatmentSummaryScreen({
    navigation,
  }: AppNavigationProps<'TreatmentSummaryScreen'>) {
    const { steps, reset } = useTreatmentTrail();
    const [exporting, setExporting] = useState(false);

    const finalRecommendation =
      steps.length > 0 ? steps[steps.length - 1].outcomeTitle ?? '—' : '—';

    const handleExport = useCallback(async () => {
      if (exporting) return;
      setExporting(true);
      try {
        const generatedAt = new Date().toLocaleString();
        const html = buildTreatmentHandoffHtml(steps, generatedAt);
        await pdfExporter.exportHtmlToPdf(html, 'Treatment Handoff');
      } finally {
        setExporting(false);
      }
    }, [exporting, steps]);

    const handleStartOver = useCallback(() => {
      reset();
      navigation.reset({ index: 0, routes: [{ name: 'HomeScreen' }] });
    }, [navigation, reset]);

    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
      >
        <View style={styles.hero}>
          <Eyebrow style={styles.heroEyebrow}>Treatment summary</Eyebrow>
          <Text style={styles.heroTitle}>Your treatment plan is ready</Text>
          <Text style={styles.heroSubtitle}>
            Review the path below, then export a handoff document for the
            receiving team.
          </Text>
          <View style={styles.heroActions}>
            <Button
              title={exporting ? 'Generating…' : 'Export PDF'}
              onPress={handleExport}
              backgroundColor="#ffffff"
              textColor={theme.colors.brand}
              underlayColor={theme.colors.brandSoft}
              style={styles.heroButton}
            />
            <Button
              title="Start over"
              onPress={handleStartOver}
              outlined
              backgroundColor="transparent"
              textColor="#ffffff"
              outlineColor="rgba(255,255,255,0.5)"
              underlayColor={theme.colors.brandHover}
              style={styles.heroButton}
            />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.recommendation}>
            <Eyebrow style={styles.recoLabel}>Final recommendation</Eyebrow>
            <Text style={styles.recoValue}>{finalRecommendation}</Text>
          </View>

          <Text style={styles.sectionTitle}>Decision path</Text>
          {steps.map((step, i) => (
            <View
              // eslint-disable-next-line react/no-array-index-key
              key={`${step.algorithmId}-${i}`}
              style={styles.step}
            >
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{i + 1}</Text>
              </View>
              <View style={styles.stepBody}>
                <Text style={styles.stepAlgo}>{step.algorithmTitle}</Text>
                <Text style={styles.stepOutcome}>
                  {step.outcomeTitle ?? '—'}
                </Text>
                {step.score !== null && (
                  <Text style={styles.stepScore}>Score: {step.score}</Text>
                )}
              </View>
            </View>
          ))}
          {steps.length === 0 && (
            <Text style={styles.empty}>No steps recorded yet.</Text>
          )}
        </View>
      </ScrollView>
    );
  };
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.canvas },
  content: { padding: theme.spaces.md, paddingBottom: theme.spaces.xl },
  hero: {
    backgroundColor: theme.colors.brand,
    borderRadius: theme.radii.lg,
    padding: theme.spaces.lg,
    marginBottom: theme.spaces.md,
  },
  heroEyebrow: { color: 'rgba(255,255,255,0.7)' },
  heroTitle: {
    ...theme.fonts.screenTitle,
    color: '#ffffff',
    marginTop: 6,
  },
  heroSubtitle: {
    ...theme.fonts.bodyMedium,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 8,
  },
  heroActions: {
    flexDirection: 'row',
    gap: theme.spaces.sm,
    marginTop: theme.spaces.lg,
  },
  heroButton: { flex: 1 },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spaces.lg,
    ...theme.elevations.xs,
  },
  recommendation: {
    backgroundColor: theme.colors.brandSoft,
    borderWidth: 1,
    borderColor: theme.colors.brand,
    borderRadius: theme.radii.md,
    padding: theme.spaces.md,
    marginBottom: theme.spaces.lg,
  },
  recoLabel: { color: theme.colors.brand },
  recoValue: {
    ...theme.fonts.titleMedium,
    color: theme.colors.ink,
    marginTop: 4,
  },
  sectionTitle: {
    ...theme.fonts.eyebrow,
    color: theme.colors.ink3,
    marginBottom: theme.spaces.sm,
  },
  step: {
    flexDirection: 'row',
    gap: theme.spaces.sm,
    paddingVertical: theme.spaces.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border2,
  },
  badge: {
    width: 26,
    height: 26,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...theme.fonts.labelLarge,
    fontFamily: theme.fontFamily.bold,
    fontWeight: '700',
    fontSize: 12,
    color: theme.colors.brand,
  },
  stepBody: { flex: 1 },
  stepAlgo: {
    ...theme.fonts.bodyMedium,
    fontFamily: theme.fontFamily.semibold,
    fontWeight: '600',
    color: theme.colors.ink,
  },
  stepOutcome: {
    ...theme.fonts.bodyMedium,
    fontSize: 13,
    color: theme.colors.ink2,
    marginTop: 2,
  },
  stepScore: {
    ...theme.fonts.bodyMedium,
    fontSize: 12,
    color: theme.colors.ink3,
    marginTop: 2,
  },
  empty: {
    ...theme.fonts.bodyMedium,
    color: theme.colors.ink3,
  },
});

factory.$inject = ['pdfExporter'];

export { factory };
export type Type = ReturnType<typeof factory>;
