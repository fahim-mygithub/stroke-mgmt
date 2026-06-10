// Palette adopted from the 2026 redesign mockup (stroke-mgmt-mockup/index.html).
// Existing Material-style token NAMES are preserved so all current consumers keep
// working; their VALUES are remapped to the new blue/canvas system. New brand/ink
// tokens are added for components built against the redesign directly.
export const colors = {
  // brand (was green primary -> mockup blue)
  primary: '#1E4E8C',
  onPrimary: '#ffffff',
  primaryContainer: '#EAF0F8', // brand-soft
  onPrimaryContainer: '#0B1220',
  secondary: '#0891B2', // accent cyan
  onSecondary: '#ffffff',
  secondaryContainer: '#F3F7FB', // brand-softer
  onSecondaryContainer: '#0B1220',

  // surfaces
  background: '#F7F5F2', // canvas
  onBackground: '#0B1220',
  surface: '#ffffff',
  onSurface: '#0B1220',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#FAFBFC', // surface-2
  surfaceContainer: '#F3F7FB',
  surfaceContainerHigh: '#EAF0F8',
  surfaceContainerHighest: '#E4E7EB',
  surfaceVariant: '#F3F7FB',
  onSurfaceVariant: '#475467', // ink-2

  inverseSurface: '#0B1220',
  inverseOnSurface: '#F7F5F2',
  inversePrimary: '#EAF0F8',

  outline: '#E4E7EB', // border
  outlineVariable: '#EEF0F3', // border-2

  error: '#cb0e01',
  onError: '#ffffff',
  errorContainer: '#ffd0cc',
  onErrorContainer: '#330400',

  // --- redesign tokens (mockup :root) ---
  brand: '#1E4E8C',
  brandHover: '#163B6E',
  brandSoft: '#EAF0F8',
  brandSofter: '#F3F7FB',
  accent: '#0891B2',
  canvas: '#F7F5F2',
  ink: '#0B1220',
  ink2: '#475467',
  ink3: '#667085',
  border: '#E4E7EB',
  border2: '#EEF0F3',

  opacity: (opacity: number) => ({
    onSurface: `rgba(11, 18, 32, ${opacity})`,
    onPrimaryContainer: `rgba(11, 18, 32, ${opacity})`,
  }),
} as const;
