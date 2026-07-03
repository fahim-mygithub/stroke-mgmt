import {
  hasAcceptedDisclaimer,
  acceptDisclaimer,
} from '@/view/lib/disclaimerGate';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const AsyncStorage = require('@react-native-async-storage/async-storage');

describe('disclaimerGate', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('reports not accepted on a fresh install', async () => {
    expect(await hasAcceptedDisclaimer()).toBe(false);
  });

  it('reports accepted after acceptDisclaimer is called', async () => {
    await acceptDisclaimer();
    expect(await hasAcceptedDisclaimer()).toBe(true);
  });

  it('reads the latest value rather than a value cached at import time', async () => {
    // Regression guard: the previous implementation captured the "seen"
    // promise once at module load, so an acceptance during the session was
    // not observed by later checks.
    expect(await hasAcceptedDisclaimer()).toBe(false);
    await acceptDisclaimer();
    expect(await hasAcceptedDisclaimer()).toBe(true);
  });
});
