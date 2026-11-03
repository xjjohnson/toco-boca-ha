import { useEffect } from 'react';

import { useSettings } from '@/store/settings';
import { useWallet } from '@/store/wallet';
import { useWorld } from '@/store/world';
import { applyConnectionSettings, syncManager } from '@/sync';
import { watchNetwork } from '@/sync/network';

const stores = [useSettings, useWallet, useWorld];

/** Starts listening once saves and settings have loaded, and follows the network. Mount once, at the root. */
export function useSync(): void {
  const simulateOffline = useSettings((s) => s.simulateOffline);

  useEffect(() => {
    let stop: (() => void) | null = null;
    let cancelled = false;
    const begin = () => {
      if (cancelled || stop) return;
      if (!stores.every((store) => store.persist.hasHydrated())) return;
      // Wait for the saves, so new stars are counted against the saved total and the right house is used.
      applyConnectionSettings();
      stop = syncManager.start();
    };
    begin();
    const unsubs = stores.map((store) => store.persist.onFinishHydration(begin));
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
