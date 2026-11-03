import { createStore, del, get, set } from 'idb-keyval';
import { createJSONStorage, type StateStorage } from 'zustand/middleware';

/**
 * Saves live in IndexedDB on the web. It holds far more than localStorage's
 * ~5 MB and survives the app being installed to the home screen. If
 * IndexedDB isn't available (some private windows), the game still runs,
 * it just doesn't remember anything between visits.
 */
const db = typeof indexedDB === 'undefined' ? null : createStore('toybox-town', 'saves');

export const kv: StateStorage = {
  getItem: async (key) => (db ? ((await get<string>(key, db)) ?? null) : null),
  setItem: async (key, value) => {
    if (db) await set(key, value, db);
  },
  removeItem: async (key) => {
    if (db) await del(key, db);
  },
};

/** Offline storage shared by every persisted store. */
export const persistStorage = createJSONStorage(() => kv);
