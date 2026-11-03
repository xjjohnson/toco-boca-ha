import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, type StateStorage } from 'zustand/middleware';

/**
 * Raw key/value storage for the native app. The web build swaps in
 * storage.web.ts, which keeps saves in IndexedDB instead.
 */
export const kv: StateStorage = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
};

/** Offline storage shared by every persisted store. */
export const persistStorage = createJSONStorage(() => kv);
