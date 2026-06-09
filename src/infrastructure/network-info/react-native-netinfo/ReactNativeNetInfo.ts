import NetInfo from '@react-native-community/netinfo';
import type { NetworkInfo } from '@/infrastructure/network-info/NetworkInfo';
import { ReactNativeNetInfoInternetReachabilityUnknownError } from '@/infrastructure/network-info/react-native-netinfo/ReactNativeNetInfoInternetReachabilityUnknownError';

const wait = (ms: number) =>
  new Promise((s) => {
    setTimeout(s, ms);
  });

async function retry<T>(
  call: () => Promise<T>,
  intervalMs: number,
  maxTries: number
): Promise<T> {
  try {
    return await call();
  } catch (e) {
    // maxTries previously went unchecked, recursing forever while netinfo
    // reported isInternetReachable: null — every caller hung on the promise.
    if (maxTries <= 1) throw e;
    await wait(intervalMs);
    return retry(call, intervalMs, maxTries - 1);
  }
}

async function check(): Promise<boolean> {
  const info = await NetInfo.fetch();
  if (info.isInternetReachable === null)
    throw new ReactNativeNetInfoInternetReachabilityUnknownError();
  return info.isInternetReachable;
}

class ReactNativeNetInfo implements NetworkInfo {
  async isInternetReachable(): Promise<boolean> {
    try {
      return await retry(check, 100, 5);
    } catch (e) {
      if (!(e instanceof ReactNativeNetInfoInternetReachabilityUnknownError))
        throw e;
    }
    // Reachability still unknown after retrying: assume the connection state
    // tells the truth rather than silently treating "unknown" as offline.
    const { isConnected } = await NetInfo.fetch();
    return isConnected ?? false;
  }
}

export { ReactNativeNetInfo };
