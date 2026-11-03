import {
  CHARACTER_SIZE,
  ROOMS,
  THINGS,
  type PlacedThing,
  type Rect,
  type RoomId,
  type Surface,
} from '@/play/catalog';

/** The room every design size is drawn for. Real rooms scale to fit. */
export const DESIGN = { w: 1024, h: 768 };

export interface RoomSize {
  w: number;
  h: number;
}

/** Points per design point, so the whole scene fits whatever screen it's on. */
export function scaleFor(size: RoomSize): number {
  return Math.min(size.w / DESIGN.w, size.h / DESIGN.h);
}

/** A sprite's size as fractions of the room. */
export function spriteFraction(design: { w: number; h: number }, size: RoomSize) {
  const s = scaleFor(size);
  return { w: (design.w * s) / size.w, h: (design.h * s) / size.h };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Keeps a spot inside the room. */
export function clampSpot(x: number, y: number) {
  return { x: clamp(x, 0.03, 0.97), y: clamp(y, 0.12, 0.99) };
}

function inRect(r: Rect, x: number, y: number, pad = 0.02): boolean {
  return x >= r.x - pad && x <= r.x + r.w + pad && y >= r.y - pad && y <= r.y + r.h + pad;
}

interface FurnitureTop extends Surface {
  /** The furniture's own bottom, so things on it draw in front of it. */
  base: number;
}

/** Every top in the room something could rest on: built-in ones and furniture. */
export function surfacesIn(room: RoomId, things: PlacedThing[], size: RoomSize): FurnitureTop[] {
  const tops: FurnitureTop[] = ROOMS[room].surfaces.map((s) => ({ ...s, base: s.base ?? s.y }));
  for (const t of things) {
    const def = THINGS[t.kind];
    if (t.room !== room || def.surfaceAt === undefined) continue;
    const f = spriteFraction(def, size);
    tops.push({ x1: t.x - f.w / 2, x2: t.x + f.w / 2, y: t.y - f.h * def.surfaceAt, base: t.y });
  }
  return tops;
}

/**
 * Where something dropped at (x, y) comes to rest. Things let go of up on the
 * wall fall to the nearest top below them (a shelf, the bed) or the floor;
 * things dropped onto furniture sit on top of it.
 */
export function restingSpot(
  room: RoomId,
  things: PlacedThing[],
  size: RoomSize,
  x: number,
  y: number,
): { x: number; y: number } {
  const spot = clampSpot(x, y);
  const tops = surfacesIn(room, things, size).filter((s) => spot.x >= s.x1 && spot.x <= s.x2);

  // Dropped onto a piece of furniture's front: hop up onto its top.
  const onto = tops.find((s) => spot.y > s.y && spot.y < s.base);
  if (onto) return { x: spot.x, y: onto.y };

  const floorY = ROOMS[room].floorY;
  if (spot.y >= floorY) return spot;

  // Up on the wall: fall to the first top below, or the floor.
  const below = tops.filter((s) => s.y >= spot.y - 0.03).sort((a, b) => a.y - b.y)[0];
  return { x: spot.x, y: below ? below.y : floorY + 0.04 };
}

/** The room a drop sends something to, if it was let go over a door. */
export function doorAt(room: RoomId, x: number, y: number): RoomId | null {
  const door = ROOMS[room].door;
  return inRect(door, x, y) ? door.to : null;
}

/** Where something arriving through a door appears in the next room. */
export function arrivalSpot(to: RoomId): { x: number; y: number } {
  const door = ROOMS[to].door;
  const doorMid = door.x + door.w / 2;
  const inward = doorMid < 0.5 ? 0.14 : -0.14;
  return { x: doorMid + inward, y: ROOMS[to].floorY + 0.2 };
}

/**
 * Draw order: further back (higher up) first. Things sitting on furniture
 * draw just in front of it.
 */
export function depthOf(y: number, x: number, tops: FurnitureTop[]): number {
  const on = tops.find((s) => Math.abs(s.y - y) < 0.01 && x >= s.x1 && x <= s.x2 && s.base > s.y);
  return on ? on.base + 0.0001 : y;
}

/** The character's own size as room fractions, for drop checks. */
export function characterFraction(size: RoomSize) {
  return spriteFraction(CHARACTER_SIZE, size);
}
