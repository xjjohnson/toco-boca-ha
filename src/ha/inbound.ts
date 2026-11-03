import type { HaEvent } from '@/ha/types';

/** The custom Home Assistant event an automation fires to poke the game. */
export const GAME_EVENT = 'toybox_town';

export type TimeOfDay = 'day' | 'night';

/** Ways the game can react to the house. Step 3 adds more. */
export type GameReaction =
  | { kind: 'setTimeOfDay'; value: TimeOfDay }
  | { kind: 'visitor'; who: string }
  | { kind: 'celebrate' }
  /** A real light the toy lamp mirrors was switched in the house. */
  | { kind: 'setLamp'; on: boolean }
  /** Switch a toy in the game on or off, e.g. the radio or the fridge. */
  | { kind: 'setToy'; id: string; on: boolean };

export interface InboundContext {
  /** The light entity the toy lamp mirrors, e.g. light.play_room. */
  lampEntity?: string;
}

/**
 * Turns a Home Assistant event into a game reaction, or null if the game
 * doesn't care about it. Unknown or malformed events are ignored, never thrown.
 *
 * An automation sends, for example:
 *   event: toybox_town
 *   event_data: { reaction: night }
 * or, to switch a toy:
 *   event_data: { reaction: toy, toy: radio, on: true }
 */
export function reactionFor(event: HaEvent, context: InboundContext = {}): GameReaction | null {
  if (event.eventType === 'state_changed') {
    const { entity_id, state } = event.data;
    if (!context.lampEntity || entity_id !== context.lampEntity) return null;
    if (state === 'on' || state === 'off') return { kind: 'setLamp', on: state === 'on' };
    return null;
  }
  if (event.eventType !== GAME_EVENT) return null;
  const { reaction, who, toy, on } = event.data;
  switch (reaction) {
    case 'day':
    case 'night':
      return { kind: 'setTimeOfDay', value: reaction };
    case 'visitor':
      return { kind: 'visitor', who: typeof who === 'string' && who ? who : 'someone' };
    case 'celebrate':
      return { kind: 'celebrate' };
    case 'toy':
      if (typeof toy !== 'string' || !toy) return null;
      return { kind: 'setToy', id: toy, on: on === true || on === 'on' || on === 'true' };
    default:
      return null;
  }
}
