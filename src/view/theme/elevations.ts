// Softer 4-level shadow scale approximating the mockup's --shadow-xs/sm/md/lg.
// Keeps numeric-index access (1/2/3) for existing consumers and adds named
// xs/sm/md/lg for redesign components. Values are RN shadow props (iOS) plus
// `elevation` (Android).
const xs = {
  shadowColor: '#101828',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 2,
  elevation: 1,
} as const;

const sm = {
  shadowColor: '#101828',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 3,
  elevation: 2,
} as const;

const md = {
  shadowColor: '#101828',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 4,
} as const;

const lg = {
  shadowColor: '#101828',
  shadowOffset: { width: 0, height: 12 },
  shadowOpacity: 0.1,
  shadowRadius: 24,
  elevation: 8,
} as const;

export const elevations = {
  // numeric aliases preserved for existing consumers
  1: xs,
  2: sm,
  3: md,
  // named scale for redesign
  xs,
  sm,
  md,
  lg,
} as const;
