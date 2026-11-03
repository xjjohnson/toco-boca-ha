import { NEW_WORLD, reduceReaction } from '@/store/world';

describe('reduceReaction', () => {
  it('applies each reaction to the save', () => {
    expect(reduceReaction(NEW_WORLD, { kind: 'setTimeOfDay', value: 'night' })).toEqual({ timeOfDay: 'night' });
    expect(reduceReaction(NEW_WORLD, { kind: 'visitor', who: 'Sam' })).toEqual({ visitor: 'Sam' });
    expect(reduceReaction({ ...NEW_WORLD, celebrations: 2 }, { kind: 'celebrate' })).toEqual({ celebrations: 3 });
  });
});
