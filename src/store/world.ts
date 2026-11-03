import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { GameReaction, TimeOfDay } from '@/ha/inbound';
import {
  START_CHARACTERS,
  START_THINGS,
  type CharacterId,
  type CharacterSave,
  type PlacedThing,
  type RoomId,
  type Slot,
} from '@/play/catalog';
import { persistStorage } from '@/store/storage';

/** The saved play world. Bump `version` and extend `migrateWorld` when the shape changes, so kids never lose a save. */
export interface WorldSave {
  timeOfDay: TimeOfDay;
  /** The last visitor Home Assistant announced, shown until dismissed. */
  visitor: string | null;
  /** Bumped on each "celebrate" so the screen can play confetti once. */
  celebrations: number;
  /** The room on screen. */
  room: RoomId;
  things: Record<string, PlacedThing>;
  characters: Record<CharacterId, CharacterSave>;
}

const byId = <T extends { id: string }>(list: T[]) =>
  Object.fromEntries(list.map((item) => [item.id, { ...item }])) as Record<string, T>;

export function newWorld(): WorldSave {
  return {
    timeOfDay: 'day',
    visitor: null,
    celebrations: 0,
    room: 'bedroom',
    things: byId(START_THINGS),
    characters: byId(START_CHARACTERS) as Record<CharacterId, CharacterSave>,
  };
}

export const NEW_WORLD: WorldSave = newWorld();

export const WORLD_VERSION = 2;

/** Brings an older save up to date, keeping what the kids did. */
export function migrateWorld(persisted: unknown, version: number): WorldSave {
  const fresh = newWorld();
  const old = (persisted ?? {}) as Record<string, unknown>;
  if (version < 2) {
    // Step 1 had one test room: a lamp and a ball, placed in points.
    const lampOn = old.lampOn === true;
    const ball = old.ball as { x?: number; y?: number } | undefined;
    fresh.things.lamp.on = lampOn;
    if (ball && typeof ball.x === 'number' && typeof ball.y === 'number') {
      fresh.things.ball.x = Math.min(0.97, Math.max(0.03, ball.x / 1024));
      fresh.things.ball.y = Math.min(0.99, Math.max(0.65, (ball.y + 45) / 768));
    }
    return {
      ...fresh,
      timeOfDay: old.timeOfDay === 'night' ? 'night' : 'day',
      visitor: typeof old.visitor === 'string' ? old.visitor : null,
    };
  }
  const save = old as Partial<WorldSave>;
  return {
    ...fresh,
    ...save,
    // New toys and characters added in later updates appear in old saves too.
    things: { ...fresh.things, ...save.things },
    characters: { ...fresh.characters, ...save.characters },
  };
}

interface WorldState extends WorldSave {
  goTo: (room: RoomId) => void;
  moveThing: (id: string, x: number, y: number, room?: RoomId) => void;
  setThingOn: (id: string, on: boolean) => void;
  moveCharacter: (id: CharacterId, x: number, y: number, room?: RoomId) => void;
  wear: (id: CharacterId, slot: Slot, piece: string) => void;
  dismissVisitor: () => void;
  applyReaction: (reaction: GameReaction) => void;
  reset: () => void;
}

function withThingOn(world: WorldSave, id: string, on: boolean): Partial<WorldSave> {
  const thing = world.things[id];
  if (!thing) return {};
  return { things: { ...world.things, [id]: { ...thing, on } } };
}

export function reduceReaction(world: WorldSave, reaction: GameReaction): Partial<WorldSave> {
  switch (reaction.kind) {
    case 'setTimeOfDay':
      return { timeOfDay: reaction.value };
    case 'visitor':
      return { visitor: reaction.who };
    case 'celebrate':
      return { celebrations: world.celebrations + 1 };
    case 'setToy':
      return withThingOn(world, reaction.id, reaction.on);
    default:
      return {};
  }
}

export const useWorld = create<WorldState>()(
  persist(
    (set) => ({
      ...newWorld(),
      goTo: (room) => set({ room }),
      moveThing: (id, x, y, room) =>
        set((s) => {
          const thing = s.things[id];
          if (!thing) return {};
          return { things: { ...s.things, [id]: { ...thing, x, y, room: room ?? thing.room } } };
        }),
      setThingOn: (id, on) => set((s) => withThingOn(s, id, on)),
      moveCharacter: (id, x, y, room) =>
        set((s) => {
          const who = s.characters[id];
          return { characters: { ...s.characters, [id]: { ...who, x, y, room: room ?? who.room } } };
        }),
      wear: (id, slot, piece) =>
        set((s) => {
          const who = s.characters[id];
          return { characters: { ...s.characters, [id]: { ...who, outfit: { ...who.outfit, [slot]: piece } } } };
        }),
      dismissVisitor: () => set({ visitor: null }),
      applyReaction: (reaction) => set((s) => reduceReaction(s, reaction)),
      reset: () => set(newWorld()),
    }),
    {
      name: 'toybox.world',
      version: WORLD_VERSION,
      storage: persistStorage,
      // Celebrations are a live signal, not part of the save, so reopening the app doesn't replay one.
      partialize: ({ timeOfDay, visitor, room, things, characters }) => ({
        timeOfDay,
        visitor,
        room,
        things,
        characters,
      }),
      migrate: (persisted, version) => migrateWorld(persisted, version),
      // Same-version saves still pick up toys added since they were made.
      merge: (persisted, current) => ({ ...current, ...migrateWorld(persisted, WORLD_VERSION) }),
    },
  ),
);
