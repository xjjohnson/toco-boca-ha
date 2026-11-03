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
