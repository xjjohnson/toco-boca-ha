import type { HaEvent } from '@/ha/types';
import type { RoomId } from '@/play/catalog';

/** The custom Home Assistant event an automation fires to poke the game. */
export const GAME_EVENT = 'toybox_town';

export type TimeOfDay = 'day' | 'night';

/** An RGB color, 0-255 each. */
export type Rgb = [number, number, number];

/** Ways the game reacts to the house. The game never acts on the house. */
export type GameReaction =
  | { kind: 'setTimeOfDay'; value: TimeOfDay }
  | { kind: 'visitor'; who: string }
  | { kind: 'celebrate' }
  /** Switch a toy in the game on or off, e.g. the radio or the fridge. */
  | { kind: 'setToy'; id: string; on: boolean }
  /** The points helper in Home Assistant now reads this. The wallet works out what's new. */
  | { kind: 'pointsTotal'; total: number }
  /** An automation handed out points directly. */
  | { kind: 'addPoints'; amount: number }
  /** A real light linked to a game room changed: mirror it. */
  | { kind: 'roomLight'; room: RoomId; on: boolean; color: Rgb | null; brightness: number }
  /** The robot vacuum started or stopped cleaning. */
  | { kind: 'vacuum'; cleaning: boolean }
  /** A music player started or stopped. */
  | { kind: 'music'; player: string; playing: boolean };

/** Which house entities mean what in the game. All optional. */
export interface InboundContext {
  /** An input_number or counter holding the points a grown-up has given. */
  pointsEntity?: string;
  /** The real light (or light group) for each game room. */
  roomLights?: Partial<Record<RoomId, string>>;
  vacuumEntity?: string;
  musicEntities?: string[];
}

const WARM_WHITE: Rgb = [255, 214, 150];

/** Reads a light's color from its attributes, whichever color mode it reports. */
export function lightColor(attributes: Record<string, unknown>): Rgb | null {
  const rgb = attributes.rgb_color;
  if (Array.isArray(rgb) && rgb.length >= 3 && rgb.every((n) => typeof n === 'number')) {
    return [rgb[0], rgb[1], rgb[2]] as Rgb;
  }
  const hs = attributes.hs_color;
  if (Array.isArray(hs) && hs.length >= 2 && typeof hs[0] === 'number' && typeof hs[1] === 'number') {
    return hsToRgb(hs[0], hs[1]);
  }
  if (typeof attributes.color_temp_kelvin === 'number' || typeof attributes.color_temp === 'number') {
    return WARM_WHITE;
  }
  return null;
}

/** Hue 0-360, saturation 0-100, at full brightness. */
export function hsToRgb(h: number, s: number): Rgb {
  const sat = Math.max(0, Math.min(100, s)) / 100;
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return Math.round(255 * (1 - sat * Math.max(0, Math.min(k, 4 - k, 1))));
  };
  return [f(5), f(3), f(1)];
}

const MUSIC_PLAYING = new Set(['playing']);
const VACUUM_CLEANING = new Set(['cleaning', 'on']);

function stateChange(data: Record<string, unknown>, context: InboundContext): GameReaction | null {
  const entity = typeof data.entity_id === 'string' ? data.entity_id : '';
  const state = typeof data.state === 'string' ? data.state : '';
  const attributes = (data.attributes ?? {}) as Record<string, unknown>;
  if (!entity) return null;

  if (context.pointsEntity && entity === context.pointsEntity) {
    const total = Number(state);
    return Number.isFinite(total) ? { kind: 'pointsTotal', total } : null;
  }

  for (const [room, light] of Object.entries(context.roomLights ?? {})) {
    if (!light || light !== entity) continue;
    if (state !== 'on' && state !== 'off') return null;
    const brightness = typeof attributes.brightness === 'number' ? attributes.brightness : 255;
    return {
      kind: 'roomLight',
      room: room as RoomId,
      on: state === 'on',
      color: state === 'on' ? lightColor(attributes) ?? WARM_WHITE : null,
      brightness,
    };
  }

  if (context.vacuumEntity && entity === context.vacuumEntity) {
    if (state === 'unavailable' || state === 'unknown') return null;
    return { kind: 'vacuum', cleaning: VACUUM_CLEANING.has(state) };
  }

  if (context.musicEntities?.includes(entity)) {
    return { kind: 'music', player: entity, playing: MUSIC_PLAYING.has(state) };
  }
  return null;
}

/**
 * Turns a Home Assistant event into a game reaction, or null if the game
 * doesn't care about it. Unknown or malformed events are ignored, never thrown.
 *
 * Entity changes come from the entities set in the Grown-ups screen. An
 * automation can also send, for example:
 *   event: toybox_town
 *   event_data: { reaction: night }
 *   event_data: { reaction: points, add: 5 }
 *   event_data: { reaction: toy, toy: radio, on: true }
 */
export function reactionFor(event: HaEvent, context: InboundContext = {}): GameReaction | null {
  if (event.eventType === 'state_changed') return stateChange(event.data, context);
  if (event.eventType !== GAME_EVENT) return null;
  const { reaction, who, toy, on, add } = event.data;
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
    case 'points': {
      const amount = Math.round(Number(add));
      return Number.isFinite(amount) && amount > 0 ? { kind: 'addPoints', amount } : null;
    }
    default:
      return null;
  }
}
