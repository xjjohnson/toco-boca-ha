import { GAME_EVENT, lightColor, reactionFor } from '@/ha/inbound';

const ev = (data: Record<string, unknown>, eventType = GAME_EVENT) => ({ eventType, data });

describe('reactionFor', () => {
  it('maps the game event to reactions', () => {
    expect(reactionFor(ev({ reaction: 'night' }))).toEqual({ kind: 'setTimeOfDay', value: 'night' });
    expect(reactionFor(ev({ reaction: 'day' }))).toEqual({ kind: 'setTimeOfDay', value: 'day' });
    expect(reactionFor(ev({ reaction: 'visitor', who: 'Grandma' }))).toEqual({ kind: 'visitor', who: 'Grandma' });
    expect(reactionFor(ev({ reaction: 'visitor' }))).toEqual({ kind: 'visitor', who: 'someone' });
    expect(reactionFor(ev({ reaction: 'celebrate' }))).toEqual({ kind: 'celebrate' });
  });

  it('ignores other events and unknown reactions', () => {
    expect(reactionFor(ev({ reaction: 'night' }, 'state_changed'))).toBeNull();
    expect(reactionFor(ev({ reaction: 'explode' }))).toBeNull();
    expect(reactionFor(ev({}))).toBeNull();
  });
});

describe('reactionFor with house entities', () => {
  const ctx = {
    pointsEntity: 'input_number.points',
    roomLights: { kitchen: 'light.kitchen' },
    vacuumEntity: 'vacuum.dreame',
    musicEntities: ['media_player.kids'],
  };
  const state = (entity_id: string, s: string, attributes: Record<string, unknown> = {}) => ({
    eventType: 'state_changed',
    data: { entity_id, state: s, attributes },
  });

  it('reads the points total', () => {
    expect(reactionFor(state('input_number.points', '12.0'), ctx)).toEqual({ kind: 'pointsTotal', total: 12 });
    expect(reactionFor(state('input_number.points', 'unavailable'), ctx)).toBeNull();
  });

  it('mirrors a room light and its color', () => {
    expect(reactionFor(state('light.kitchen', 'on', { rgb_color: [255, 0, 0], brightness: 128 }), ctx)).toEqual({
      kind: 'roomLight',
      room: 'kitchen',
      on: true,
      color: [255, 0, 0],
      brightness: 128,
    });
    expect(reactionFor(state('light.kitchen', 'off'), ctx)).toMatchObject({ kind: 'roomLight', on: false, color: null });
    expect(reactionFor(state('light.kitchen', 'unavailable'), ctx)).toBeNull();
  });

  it('follows the vacuum and music', () => {
    expect(reactionFor(state('vacuum.dreame', 'cleaning'), ctx)).toEqual({ kind: 'vacuum', cleaning: true });
    expect(reactionFor(state('vacuum.dreame', 'docked'), ctx)).toEqual({ kind: 'vacuum', cleaning: false });
    expect(reactionFor(state('vacuum.dreame', 'unavailable'), ctx)).toBeNull();
    expect(reactionFor(state('media_player.kids', 'playing'), ctx)).toEqual({ kind: 'music', player: 'media_player.kids', playing: true });
    expect(reactionFor(state('media_player.kids', 'paused'), ctx)).toEqual({ kind: 'music', player: 'media_player.kids', playing: false });
  });

  it('ignores entities it was not told about', () => {
    expect(reactionFor(state('light.garage', 'on'), ctx)).toBeNull();
    expect(reactionFor(state('light.kitchen', 'on'))).toBeNull();
  });
});

describe('lightColor', () => {
  it('reads rgb, hue/saturation and white lights', () => {
    expect(lightColor({ rgb_color: [1, 2, 3] })).toEqual([1, 2, 3]);
    expect(lightColor({ hs_color: [0, 100] })).toEqual([255, 0, 0]);
    expect(lightColor({ hs_color: [240, 100] })).toEqual([0, 0, 255]);
    expect(lightColor({ color_temp_kelvin: 2700 })).toEqual([255, 214, 150]);
    expect(lightColor({})).toBeNull();
  });
});

describe('reactionFor points events', () => {
  it('adds points an automation hands out', () => {
    expect(reactionFor(ev({ reaction: 'points', add: 5 }))).toEqual({ kind: 'addPoints', amount: 5 });
    expect(reactionFor(ev({ reaction: 'points', add: '2' }))).toEqual({ kind: 'addPoints', amount: 2 });
    expect(reactionFor(ev({ reaction: 'points', add: -3 }))).toBeNull();
    expect(reactionFor(ev({ reaction: 'points' }))).toBeNull();
  });
});

describe('reactionFor toys', () => {
  it('switches a toy the house names', () => {
    expect(reactionFor(ev({ reaction: 'toy', toy: 'radio', on: true }))).toEqual({ kind: 'setToy', id: 'radio', on: true });
    expect(reactionFor(ev({ reaction: 'toy', toy: 'fridge', on: 'on' }))).toEqual({ kind: 'setToy', id: 'fridge', on: true });
    expect(reactionFor(ev({ reaction: 'toy', toy: 'fridge' }))).toEqual({ kind: 'setToy', id: 'fridge', on: false });
  });

  it('ignores a toy event with no toy', () => {
    expect(reactionFor(ev({ reaction: 'toy', on: true }))).toBeNull();
  });
});
