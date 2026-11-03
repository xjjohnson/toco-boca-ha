import type { HaEvent } from '@/ha/types';

/** The custom Home Assistant event an automation fires to poke the game. */
export const GAME_EVENT = 'toybox_town';

export type TimeOfDay = 'day' | 'night';

/** Ways the game can react to the house. Step 3 adds more. */
export type GameReaction =
  | { kind: 'setTimeOfDay'; value: TimeOfDay }
  | { kind: 'visitor'; who: string }
  | { kind: 'celebrate' };

/**
 * Turns a Home Assistant event into a game reaction, or null if the game
 * doesn't care about it. Unknown or malformed events are ignored, never thrown.
 *
 * An automation sends, for example:
 *   event: toybox_town
 *   event_data: { reaction: night }
 */
export function reactionFor(event: HaEvent): GameReaction | null {
  if (event.eventType !== GAME_EVENT) return null;
  const { reaction, who } = event.data;
  switch (reaction) {
    case 'day':
    case 'night':
      return { kind: 'setTimeOfDay', value: reaction };
    case 'visitor':
      return { kind: 'visitor', who: typeof who === 'string' && who ? who : 'someone' };
    case 'celebrate':
      return { kind: 'celebrate' };
    default:
      return null;
  }
}
