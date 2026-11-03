import { houseLayout, roomAt, zoomInto } from '@/play/house';

const screens = [
  { w: 1280, h: 800 },
  { w: 800, h: 1280 },
  { w: 740, h: 360 },
];

describe('houseLayout', () => {
  it.each(screens)('fits the house and roof on a %p screen', (screen) => {
    const l = houseLayout(screen);
    expect(l.house.x).toBeGreaterThanOrEqual(0);
    expect(l.house.x + l.house.w).toBeLessThanOrEqual(screen.w);
    expect(l.roofTop).toBeGreaterThanOrEqual(0);
    expect(l.house.y + l.house.h).toBeCloseTo(l.groundY);
  });

  it('puts the bedroom and bathroom upstairs, kitchen and living room down', () => {
    const { cells } = houseLayout(screens[0]);
    expect(cells.bedroom.y).toBeLessThan(cells.kitchen.y);
    expect(cells.bathroom.y).toBe(cells.bedroom.y);
    expect(cells.bedroom.x).toBeLessThan(cells.bathroom.x);
    expect(cells.living.x).toBe(cells.bathroom.x);
    expect(cells.bedroom.w / cells.bedroom.h).toBeCloseTo(4 / 3);
  });
});

describe('roomAt', () => {
  it('finds the room under a point, and nothing on the walls or sky', () => {
    const l = houseLayout(screens[0]);
    const c = l.cells.living;
    expect(roomAt(l, c.x + c.w / 2, c.y + c.h / 2)).toBe('living');
    expect(roomAt(l, 2, 2)).toBeNull();
  });
});

describe('zoomInto', () => {
  it('moves the room to the middle of the screen and covers it', () => {
    const screen = screens[0];
    const l = houseLayout(screen);
    const cell = l.cells.bedroom;
    const z = zoomInto(cell, screen);
    // Scale is around the screen's middle, then the translate is added.
    const map = (x: number, y: number) => ({
      x: screen.w / 2 + z.scale * (x - screen.w / 2) + z.tx,
      y: screen.h / 2 + z.scale * (y - screen.h / 2) + z.ty,
    });
    const mid = map(cell.x + cell.w / 2, cell.y + cell.h / 2);
    expect(mid.x).toBeCloseTo(screen.w / 2);
    expect(mid.y).toBeCloseTo(screen.h / 2);
    expect(cell.w * z.scale).toBeGreaterThanOrEqual(screen.w - 0.001);
    expect(cell.h * z.scale).toBeGreaterThanOrEqual(screen.h - 0.001);
  });
});
