import { useEffect } from 'react';

import { useSettings } from '@/store/settings';
import { useSyncQueue } from '@/store/syncQueue';
import { syncManager } from '@/sync';
import { watchNetwork } from '@/sync/network';

/** Starts syncing once saves have loaded, and follows the network. Mount once, at the root. */
export function useSync(): void {
  const simulateOffline = useSettings((s) => s.simulateOffline);

  useEffect(() => {
    let stop: (() => void) | null = null;
    let cancelled = false;
    const begin = () => {
      if (!cancelled && !stop) stop = syncManager.start();
    };
    // Wait for the saved queue to load so nothing queued last time is lost.
    if (useSyncQueue.persist.hasHydrated()) begin();
    const unsubHydrate = useSyncQueue.persist.onFinishHydration(begin);
    return () => {
      cancelled = true;
      unsubHydrate();
      stop?.();
    };
  }, []);

  useEffect(
    () => watchNetwork((online) => syncManager.setOnline(online && !simulateOffline)),
    [simulateOffline],
  );
}
