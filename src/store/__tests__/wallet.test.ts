import { isOwned, NEW_WALLET, reduceWallet } from '@/store/wallet';

describe('reduceWallet', () => {
  it('only remembers the points total the first time it sees it', () => {
    expect(reduceWallet(NEW_WALLET, { kind: 'pointsTotal', total: 40 })).toEqual({ next: { lastTotal: 40 }, gained: 0 });
  });

  it('turns each increase into stars', () => {
    const w = { ...NEW_WALLET, stars: 2, lastTotal: 40 };
    expect(reduceWallet(w, { kind: 'pointsTotal', total: 45 })).toEqual({ next: { lastTotal: 45, stars: 7 }, gained: 5 });
  });

  it('takes nothing away when the total goes down or repeats', () => {
    const w = { ...NEW_WALLET, stars: 2, lastTotal: 40 };
    expect(reduceWallet(w, { kind: 'pointsTotal', total: 0 })).toEqual({ next: { lastTotal: 0 }, gained: 0 });
    expect(reduceWallet(w, { kind: 'pointsTotal', total: 40 })).toEqual({ next: { lastTotal: 40 }, gained: 0 });
  });

  it('adds points from an event', () => {
    expect(reduceWallet({ ...NEW_WALLET, stars: 1 }, { kind: 'addPoints', amount: 3 })).toEqual({ next: { stars: 4 }, gained: 3 });
  });

  it('ignores other reactions', () => {
    expect(reduceWallet(NEW_WALLET, { kind: 'celebrate' })).toEqual({ next: {}, gained: 0 });
  });
});

describe('isOwned', () => {
  it('treats free things and bought things as owned', () => {
    expect(isOwned({ owned: [] }, 'crown', 0)).toBe(true);
    expect(isOwned({ owned: [] }, 'crown', 5)).toBe(false);
    expect(isOwned({ owned: ['crown'] }, 'crown', 5)).toBe(true);
  });
});
