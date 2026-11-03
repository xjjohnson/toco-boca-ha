import { isMusicPlaying, QUIET_HOUSE, reduceHouse } from '@/store/house';

describe('reduceHouse', () => {
  it('tracks room lights, the vacuum, and each music player', () => {
    expect(reduceHouse(QUIET_HOUSE, { kind: 'roomLight', room: 'kitchen', on: true, color: [1, 2, 3], brightness: 9 })).toEqual({
      lights: { kitchen: { on: true, color: [1, 2, 3], brightness: 9 } },
    });
    expect(reduceHouse(QUIET_HOUSE, { kind: 'vacuum', cleaning: true })).toEqual({ vacuumCleaning: true });
    const playing = { ...QUIET_HOUSE, ...reduceHouse(QUIET_HOUSE, { kind: 'music', player: 'a', playing: true }) };
    expect(isMusicPlaying(playing)).toBe(true);
    const stopped = { ...playing, ...reduceHouse(playing, { kind: 'music', player: 'a', playing: false }) };
    expect(isMusicPlaying(stopped)).toBe(false);
  });
});
