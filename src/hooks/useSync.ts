import { useEffect } from 'react';

import { useSettings } from '@/store/settings';
import { useSyncQueue } from '@/store/syncQueue';
import { applyConnectionSettings, syncManager } from '@/sync';
import { watchNetwork } from '@/sync/network';

/** Starts syncing once saves and settings have loaded, and follows the network. Mount once, at the root. */
export function useSync(): void {
  const simulateOffline = useSettings((s) => s.simulateOffline);

  useEffect(() => {
    let stop: (() => void) | null = null;
    let cancelled = false;
    const begin = () => {
      if (cancelled || stop) return;
      if (!useSyncQueue.persist.hasHydrated() || !useSettings.persist.hasHydrated()) return;
      // Wait for both so nothing queued last time is lost and the right house is used.
      applyConnectionSettings();
      stop = syncManager.start();
    };
    begin();
    const unsubs = [useSyncQueue.persist.onFinishHydration(begin), useSettings.persist.onFinishHydration(begin)];
    return () => {
      cancelled = true;
      unsubs.forEach((u) => u());
      stop?.();
    };
  }, []);

  useEffect(
    () => watchNetwork((online) => syncManager.setOnline(online && !simulateOffline)),
    [simulateOffline],
  );
}
