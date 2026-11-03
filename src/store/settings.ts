import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { persistStorage } from '@/store/storage';

export interface Settings {
  /** Home Assistant address, e.g. http://homeassistant.local:8123. Used from step 3. */
  haUrl: string;
  /** Long-lived access token. Stays on this device only. Used from step 3. */
  haToken: string;
  /** The real light the toy lamp turns on and off, e.g. light.play_room. Empty = just send an event. */
  lampEntity: string;
  /** Grown-ups switch to test offline play without unplugging anything. */
  simulateOffline: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  haUrl: '',
  haToken: '',
  lampEntity: '',
  simulateOffline: false,
};

interface SettingsState extends Settings {
  update: (changes: Partial<Settings>) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      update: (changes) => set(changes),
    }),
    {
      name: 'toybox.settings',
      version: 1,
      storage: persistStorage,
      migrate: (persisted) => ({ ...DEFAULT_SETTINGS, ...(persisted as Partial<Settings>) }),
    },
  ),
);
