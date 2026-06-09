// Inter type system from the redesign mockup. In React Native a custom font's
// weight is encoded in the family name (Inter_600SemiBold), so each scale entry
// carries an explicit `fontFamily`; `fontWeight` is kept for fallback before the
// font finishes loading. Existing scale names are preserved (and remapped to the
// mockup sizes); new redesign names are added below.

export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const fonts = {
  // --- existing scale names (remapped to mockup sizing) ---
  headlineLarge: {
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  headlineSmall: {
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 30,
  },
  titleLarge: {
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0,
  },
  titleMedium: {
    fontFamily: fontFamily.semibold,
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
  },
  labelLarge: {
    fontFamily: fontFamily.medium,
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
  },
  bodyLarge: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0,
  },

  // --- redesign scale (mockup) ---
  eyebrow: {
    fontFamily: fontFamily.semibold,
    fontWeight: '600',
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.9,
  },
  cardTitle: {
    fontFamily: fontFamily.semibold,
    fontWeight: '600',
    fontSize: 17,
    lineHeight: 22,
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  screenTitle: {
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.4,
  },
  articleTitle: {
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    fontSize: 34,
    lineHeight: 39,
    letterSpacing: -0.6,
  },
} as const;
