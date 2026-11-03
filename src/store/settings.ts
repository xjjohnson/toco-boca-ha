import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { RoomId } from '@/play/catalog';
import { persistStorage } from '@/store/storage';

export interface Settings {
  /** Home Assistant address, e.g. http://homeassistant.local:8123. */
  haUrl: string;
  /** Long-lived access token. Stays on this device only. The game only reads with it. */
  haToken: string;
  /** An input_number or counter a grown-up raises to give the kids stars, e.g. input_number.toybox_points. */
  pointsEntity: string;
  /** The real light (or light group) each game room mirrors. */
  roomLights: Partial<Record<RoomId, string>>;
  /** The robot vacuum that cleans in the game when it cleans for real. */
  vacuumEntity: string;
  /** Music players that make the characters dance. */
  musicEntities: string[];
  /** Grown-ups switch to test offline play without unplugging anything. */
  simulateOffline: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  haUrl: '',
  haToken: '',
  pointsEntity: '',
  roomLights: {},
  vacuumEntity: '',
  musicEntities: [],
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
      version: 2,
      storage: persistStorage,
      migrate: (persisted) => {
        // Version 1 had a lampEntity the game switched; the game no longer controls anything.
        const { lampEntity: _dropped, ...rest } = (persisted ?? {}) as Partial<Settings> & { lampEntity?: string };
        return { ...DEFAULT_SETTINGS, ...rest };
      },
    },
  ),
);
