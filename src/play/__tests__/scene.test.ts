import { START_THINGS } from '@/play/catalog';
import { arrivalSpot, depthOf, doorAt, restingSpot, scaleFor, surfacesIn } from '@/play/scene';

const size = { w: 1024, h: 768 };
const bed = START_THINGS.find((t) => t.id === 'bed')!;

describe('scaleFor', () => {
  it('fits the design room inside the screen', () => {
    expect(scaleFor(size)).toBe(1);
    expect(scaleFor({ w: 2048, h: 768 })).toBe(1);
    expect(scaleFor({ w: 512, h: 768 })).toBe(0.5);
  });
});

describe('restingSpot', () => {
  it('leaves things dropped on the floor where they are', () => {
    expect(restingSpot('bedroom', [], size, 0.6, 0.8)).toEqual({ x: 0.6, y: 0.8 });
  });

  it('drops things let go on the wall to the floor', () => {
    const spot = restingSpot('bedroom', [], size, 0.6, 0.2);
    expect(spot.x).toBe(0.6);
    expect(spot.y).toBeGreaterThanOrEqual(0.6);
  });

  it('lands on a shelf below the drop', () => {
    expect(restingSpot('bedroom', [], size, 0.15, 0.2).y).toBeCloseTo(0.32);
  });

  it('hops up onto the bed when dropped on its front', () => {
    const top = surfacesIn('bedroom', [bed], size).find((s) => s.base === bed.y)!;
    const spot = restingSpot('bedroom', [bed], size, bed.x, bed.y - 0.02);
    expect(spot.y).toBeCloseTo(top.y);
    expect(spot.y).toBeLessThan(bed.y);
  });

  it('keeps things inside the room', () => {
    const spot = restingSpot('bedroom', [], size, -1, 3);
    expect(spot.x).toBeGreaterThan(0);
    expect(spot.y).toBeLessThan(1);
  });

  it('lands on the kitchen counter', () => {
    expect(restingSpot('kitchen', [], size, 0.7, 0.62).y).toBeCloseTo(0.5);
  });
});

describe('doors', () => {
  it('finds the door a drop was let go over', () => {
    expect(doorAt('bedroom', 0.92, 0.4)).toBe('bathroom');
    expect(doorAt('bathroom', 0.08, 0.4)).toBe('bedroom');
    expect(doorAt('kitchen', 0.92, 0.4)).toBe('living');
    expect(doorAt('living', 0.08, 0.4)).toBe('kitchen');
    expect(doorAt('bedroom', 0.5, 0.4)).toBeNull();
  });

  it('brings arrivals in through the other door, on the floor', () => {
    for (const room of ['bedroom', 'bathroom', 'kitchen', 'living'] as const) {
      const spot = arrivalSpot(room);
      expect(spot.x).toBeGreaterThan(0.14);
      expect(spot.x).toBeLessThan(0.86);
      expect(spot.y).toBeGreaterThan(0.6);
      expect(doorAt(room, spot.x, spot.y)).toBeNull();
    }
  });
});

describe('depthOf', () => {
  it('draws things sitting on the bed in front of it', () => {
    const tops = surfacesIn('bedroom', [bed], size);
    const onBed = restingSpot('bedroom', [bed], size, bed.x, bed.y - 0.02);
    expect(depthOf(onBed.y, onBed.x, tops)).toBeGreaterThan(bed.y);
    expect(depthOf(0.7, 0.9, tops)).toBe(0.7);
  });
});
