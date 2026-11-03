import { create } from 'zustand';

import type { GameReaction, Rgb } from '@/ha/inbound';
import type { RoomId } from '@/play/catalog';

export interface RoomLight {
  on: boolean;
  color: Rgb | null;
  /** 0-255. */
  brightness: number;
}

/**
 * What's going on in the real house right now: the linked lights, the robot
 * vacuum, and music. Live only, not saved, and cleared when the house is out
 * of reach, so the game never shows a stale light or dances forever.
 */
export interface HouseState {
  lights: Partial<Record<RoomId, RoomLight>>;
  vacuumCleaning: boolean;
  /** Which music players are playing, by entity id. */
  music: Record<string, boolean>;
}

export const QUIET_HOUSE: HouseState = { lights: {}, vacuumCleaning: false, music: {} };

export function reduceHouse(house: HouseState, reaction: GameReaction): Partial<HouseState> {
  switch (reaction.kind) {
    case 'roomLight': {
      const { room, on, color, brightness } = reaction;
      return { lights: { ...house.lights, [room]: { on, color, brightness } } };
    }
    case 'vacuum':
      return { vacuumCleaning: reaction.cleaning };
    case 'music':
      return { music: { ...house.music, [reaction.player]: reaction.playing } };
    default:
      return {};
  }
}

export const isMusicPlaying = (house: Pick<HouseState, 'music'>) => Object.values(house.music).some(Boolean);

interface HouseStore extends HouseState {
  applyReaction: (reaction: GameReaction) => void;
  clear: () => void;
}

export const useHouse = create<HouseStore>()((set) => ({
  ...QUIET_HOUSE,
  applyReaction: (reaction) => set((s) => reduceHouse(s, reaction)),
  clear: () => set(QUIET_HOUSE),
}));
