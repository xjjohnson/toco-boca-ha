import { migrateWorld, newWorld, NEW_WORLD, reduceReaction } from '@/store/world';

describe('reduceReaction', () => {
  it('applies each reaction to the save', () => {
    expect(reduceReaction(NEW_WORLD, { kind: 'setTimeOfDay', value: 'night' })).toEqual({ timeOfDay: 'night' });
    expect(reduceReaction(NEW_WORLD, { kind: 'visitor', who: 'Sam' })).toEqual({ visitor: 'Sam' });
    expect(reduceReaction({ ...NEW_WORLD, celebrations: 2 }, { kind: 'celebrate' })).toEqual({ celebrations: 3 });
  });

  it('switches the toy lamp and other toys', () => {
    expect(reduceReaction(NEW_WORLD, { kind: 'setLamp', on: true }).things?.lamp.on).toBe(true);
    expect(reduceReaction(NEW_WORLD, { kind: 'setToy', id: 'radio', on: true }).things?.radio.on).toBe(true);
  });

  it('ignores toys that do not exist', () => {
    expect(reduceReaction(NEW_WORLD, { kind: 'setToy', id: 'rocket', on: true })).toEqual({});
  });
});

describe('newWorld', () => {
  it('starts with a room, characters and toys', () => {
    const w = newWorld();
    expect(w.room).toBe('bedroom');
    expect(Object.keys(w.characters).sort()).toEqual(['bo', 'lulu', 'mo']);
    expect(w.things.lamp.kind).toBe('lamp');
  });

  it('gives each world its own copies', () => {
    const a = newWorld();
    a.things.lamp.on = true;
    expect(newWorld().things.lamp.on).toBe(false);
  });
});

describe('migrateWorld', () => {
  it('keeps the step 1 lamp, ball, time of day and visitor', () => {
    const w = migrateWorld({ timeOfDay: 'night', lampOn: true, visitor: 'Grandma', ball: { x: 512, y: 600 } }, 1);
    expect(w.timeOfDay).toBe('night');
    expect(w.visitor).toBe('Grandma');
    expect(w.things.lamp.on).toBe(true);
    expect(w.things.ball.x).toBeCloseTo(0.5);
    expect(w.things.ball.y).toBeGreaterThan(0.6);
    expect(w.characters.lulu).toBeDefined();
  });

  it('starts fresh from an empty save', () => {
    expect(migrateWorld(undefined, 0).room).toBe('bedroom');
  });

  it('adds new toys to a current save without moving the old ones', () => {
    const save = newWorld();
    save.things.teddy.x = 0.9;
    delete (save.things as Record<string, unknown>).cake;
    const w = migrateWorld(save, 2);
    expect(w.things.teddy.x).toBe(0.9);
    expect(w.things.cake).toBeDefined();
  });
});
