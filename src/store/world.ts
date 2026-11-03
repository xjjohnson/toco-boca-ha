import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { GameReaction, TimeOfDay } from '@/ha/inbound';
import { persistStorage } from '@/store/storage';

/**
 * The saved play world. Step 2 grows this into rooms, characters, outfits
 * and placed items; bump `version` and extend `migrate` when the shape
 * changes so kids never lose a save.
 */
export interface WorldSave {
  timeOfDay: TimeOfDay;
  lampOn: boolean;
  /** The last visitor Home Assistant announced, shown until dismissed. */
  visitor: string | null;
  /** Bumped on each "celebrate" so the screen can play confetti once. */
  celebrations: number;
  /** Where the ball toy was left, in points from the room's top-left. */
  ball: { x: number; y: number };
}

export const NEW_WORLD: WorldSave = {
  timeOfDay: 'day',
  lampOn: false,
  visitor: null,
  celebrations: 0,
  ball: { x: 360, y: 260 },
};

interface WorldState extends WorldSave {
  setLamp: (on: boolean) => void;
  moveBall: (x: number, y: number) => void;
  dismissVisitor: () => void;
  applyReaction: (reaction: GameReaction) => void;
  reset: () => void;
}

export function reduceReaction(world: WorldSave, reaction: GameReaction): Partial<WorldSave> {
  switch (reaction.kind) {
    case 'setTimeOfDay':
      return { timeOfDay: reaction.value };
    case 'visitor':
      return { visitor: reaction.who };
    case 'celebrate':
      return { celebrations: world.celebrations + 1 };
    case 'setLamp':
      return { lampOn: reaction.on };
  }
}

export const useWorld = create<WorldState>()(
  persist(
    (set) => ({
      ...NEW_WORLD,
      setLamp: (lampOn) => set({ lampOn }),
      moveBall: (x, y) => set({ ball: { x, y } }),
      dismissVisitor: () => set({ visitor: null }),
      applyReaction: (reaction) => set((s) => reduceReaction(s, reaction)),
      reset: () => set(NEW_WORLD),
    }),
    {
      name: 'toybox.world',
      version: 1,
      storage: persistStorage,
      // Celebrations are a live signal, not part of the save, so reopening the app doesn't replay one.
      partialize: ({ timeOfDay, lampOn, visitor, ball }) => ({ timeOfDay, lampOn, visitor, ball }),
      migrate: (persisted) => ({ ...NEW_WORLD, ...(persisted as Partial<WorldSave>) }),
    },
  ),
);
