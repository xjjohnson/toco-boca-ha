import { HOUSE_LAYOUT, type Rect, type RoomId } from '@/play/catalog';
import type { RoomSize } from '@/play/scene';

/** Rooms are drawn 4:3 inside the house, like the design room. */
const ROOM_ASPECT = 3 / 4;
/** Wall thickness and roof height, relative to a room's width. */
const WALL = 0.05;
const ROOF = 0.42;

export interface HouseLayout {
  /** The whole house outline (walls), in screen points. */
  house: Rect;
  roofTop: number;
  /** The grass line the house stands on. */
  groundY: number;
  cells: Record<RoomId, Rect>;
  wall: number;
}

/**
 * Lays out the cutaway house to fit the screen: two floors of two rooms
 * under a roof, standing on the grass, leaving room for the top bar.
 */
export function houseLayout(screen: RoomSize, topBar = 72): HouseLayout {
  const margin = Math.min(screen.w, screen.h) * 0.04;
  const groundH = screen.h * 0.1;
  const availW = screen.w - margin * 2;
  const availH = screen.h - topBar - groundH - margin;
  // Width: two rooms and three walls. Height: roof, two rooms, three walls.
  const cw = Math.max(40, Math.min(availW / (2 + 3 * WALL), availH / (ROOF + 2 * ROOM_ASPECT + 3 * WALL)));
  const ch = cw * ROOM_ASPECT;
  const t = cw * WALL;
  const w = 2 * cw + 3 * t;
  const h = 2 * ch + 3 * t;
  const groundY = screen.h - groundH;
  const x = (screen.w - w) / 2;
  const y = groundY - h;
  const cells = {} as Record<RoomId, Rect>;
  for (const [room, spot] of Object.entries(HOUSE_LAYOUT) as [RoomId, (typeof HOUSE_LAYOUT)[RoomId]][]) {
    cells[room] = { x: x + t + spot.col * (cw + t), y: y + t + spot.floor * (ch + t), w: cw, h: ch };
  }
  return { house: { x, y, w, h }, roofTop: y - cw * ROOF, groundY, cells, wall: t };
}

/** The room under a point on the house view, if any. */
export function roomAt(layout: HouseLayout, px: number, py: number): RoomId | null {
  for (const [room, r] of Object.entries(layout.cells) as [RoomId, Rect][]) {
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return room;
  }
  return null;
}

/**
 * The transform that zooms the house view so one room fills the screen.
 * Use as [{translateX: tx}, {translateY: ty}, {scale}] on a full-screen
 * view (scale is around the screen's center). Mixing it toward the
 * identity by a 0..1 progress moves smoothly between house and room.
 */
export function zoomInto(cell: Rect, screen: RoomSize): { scale: number; tx: number; ty: number } {
  const scale = Math.max(screen.w / cell.w, screen.h / cell.h);
  const cx = cell.x + cell.w / 2;
  const cy = cell.y + cell.h / 2;
  return { scale, tx: -scale * (cx - screen.w / 2), ty: -scale * (cy - screen.h / 2) };
}
