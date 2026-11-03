import { addNetworkStateListener, getNetworkStateAsync } from 'expo-network';

/** Calls back with whether the device has a network, now and on every change. */
export function watchNetwork(listener: (online: boolean) => void): () => void {
  getNetworkStateAsync()
    .then((s) => listener(s.isConnected !== false))
    .catch(() => listener(true));
  const sub = addNetworkStateListener((s) => listener(s.isConnected !== false));
  return () => sub.remove();
}
