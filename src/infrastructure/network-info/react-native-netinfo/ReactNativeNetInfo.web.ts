import type { NetworkInfo } from '@/infrastructure/network-info/NetworkInfo';

// @react-native-community/netinfo on web reports isInternetReachable as null,
// which our native adapter treats as offline after retries. For web we trust
// navigator.onLine — the Strapi fetch that follows will surface real network
// problems on its own.
class ReactNativeNetInfo implements NetworkInfo {
  async isInternetReachable(): Promise<boolean> {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  }
}

export { ReactNativeNetInfo };
