import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { OutboundAction } from '@/ha/types';
import { enqueue, type QueuedAction } from '@/sync/queue';
import { persistStorage } from '@/store/storage';

interface SyncQueueState {
  items: QueuedAction[];
  /** When the queue last fully emptied into Home Assistant. */
  lastSyncedAt: number | null;
  add: (action: OutboundAction, coalesceKey?: string) => void;
  replace: (items: QueuedAction[]) => void;
  clear: () => void;
}

/** Actions waiting for Home Assistant. Saved, so they survive the app closing. */
export const useSyncQueue = create<SyncQueueState>()(
  persist(
    (set) => ({
      items: [],
      lastSyncedAt: null,
      add: (action, coalesceKey) =>
        set((s) => ({ items: enqueue(s.items, action, Date.now(), coalesceKey) })),
      replace: (items) =>
        set((s) => ({ items, lastSyncedAt: items.length === 0 ? Date.now() : s.lastSyncedAt })),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'toybox.sync-queue',
      version: 1,
      storage: persistStorage,
      partialize: (s) => ({ items: s.items, lastSyncedAt: s.lastSyncedAt }),
    },
  ),
);
