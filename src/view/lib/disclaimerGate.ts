import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@hasSeenDisclaimer-v1';
const ACCEPTED = 'true';

/**
 * Whether the user has accepted the medical disclaimer. Read fresh from storage
 * on every call (no module-level caching) so an acceptance made earlier in the
 * same session is always observed.
 */
async function hasAcceptedDisclaimer(): Promise<boolean> {
  const value = await AsyncStorage.getItem(STORAGE_KEY);
  return value === ACCEPTED;
}

/** Persist the user's one-time acceptance of the medical disclaimer. */
async function acceptDisclaimer(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, ACCEPTED);
}

export { hasAcceptedDisclaimer, acceptDisclaimer };
