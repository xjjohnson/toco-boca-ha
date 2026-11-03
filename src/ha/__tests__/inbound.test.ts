import { GAME_EVENT, reactionFor } from '@/ha/inbound';

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

describe('reactionFor with a lamp light', () => {
  const ctx = { lampEntity: 'light.play_room' };
  const state = (entity_id: string, s: string) => ({ eventType: 'state_changed', data: { entity_id, state: s } });

  it('mirrors the chosen light onto the toy lamp', () => {
    expect(reactionFor(state('light.play_room', 'on'), ctx)).toEqual({ kind: 'setLamp', on: true });
    expect(reactionFor(state('light.play_room', 'off'), ctx)).toEqual({ kind: 'setLamp', on: false });
  });

  it('ignores other lights, unavailable states, and no lamp set', () => {
    expect(reactionFor(state('light.kitchen', 'on'), ctx)).toBeNull();
    expect(reactionFor(state('light.play_room', 'unavailable'), ctx)).toBeNull();
    expect(reactionFor(state('light.play_room', 'on'))).toBeNull();
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
