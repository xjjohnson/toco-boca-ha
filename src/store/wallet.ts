import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { GameReaction } from '@/ha/inbound';
import { persistStorage } from '@/store/storage';

/**
 * Stars the kids earn from a grown-up (through Home Assistant) and spend in
 * the game. Saved on the device, so spending works offline; new stars arrive
 * whenever the house is reachable. Kept apart from the play world, so
 * starting the rooms over doesn't take anyone's stars or unlocks away.
 */
export interface WalletSave {
  stars: number;
  /**
   * The points helper's value when we last saw it. Only increases after
   * this count, so a reinstall or second tablet doesn't hand out the whole
   * total again, and a grown-up resetting the helper to 0 takes nothing away.
   */
  lastTotal: number | null;
  /** Ids of outfits and toys bought with stars. */
  owned: string[];
}

export const NEW_WALLET: WalletSave = { stars: 0, lastTotal: null, owned: [] };

/** Stars that just arrived, for the "you got stars" moment. Not saved. */
export interface Gift {
  amount: number;
  /** Bumped on each gift so the screen can tell two gifts of the same size apart. */
  n: number;
}

export function reduceWallet(wallet: WalletSave, reaction: GameReaction): { next: Partial<WalletSave>; gained: number } {
  switch (reaction.kind) {
    case 'pointsTotal': {
      const { total } = reaction;
      if (wallet.lastTotal === null || total <= wallet.lastTotal) return { next: { lastTotal: total }, gained: 0 };
      const gained = Math.round(total - wallet.lastTotal);
      return { next: { lastTotal: total, stars: wallet.stars + gained }, gained };
    }
    case 'addPoints':
      return { next: { stars: wallet.stars + reaction.amount }, gained: reaction.amount };
    default:
      return { next: {}, gained: 0 };
  }
}

/** Whether something is the kids' to use: free, or already bought. */
export function isOwned(wallet: Pick<WalletSave, 'owned'>, id: string, price = 0): boolean {
  return price <= 0 || wallet.owned.includes(id);
}

interface WalletState extends WalletSave {
  gift: Gift | null;
  applyReaction: (reaction: GameReaction) => void;
  /** Spends stars on something. Returns false if there aren't enough or it's already owned. */
  buy: (id: string, price: number) => boolean;
  /** Grown-ups only. */
  setStars: (stars: number) => void;
}

export const useWallet = create<WalletState>()(
  persist(
    (set, get) => ({
      ...NEW_WALLET,
      gift: null,
      applyReaction: (reaction) => {
        const { next, gained } = reduceWallet(get(), reaction);
        set(gained > 0 ? { ...next, gift: { amount: gained, n: (get().gift?.n ?? 0) + 1 } } : next);
      },
      buy: (id, price) => {
        const w = get();
        if (w.owned.includes(id) || w.stars < price) return false;
        set({ stars: w.stars - price, owned: [...w.owned, id] });
        return true;
      },
      setStars: (stars) => set({ stars: Math.max(0, Math.round(stars)) }),
    }),
    {
      name: 'toybox.wallet',
      version: 1,
      storage: persistStorage,
      partialize: ({ stars, lastTotal, owned }) => ({ stars, lastTotal, owned }),
      migrate: (persisted) => ({ ...NEW_WALLET, ...(persisted as Partial<WalletSave>) }),
    },
  ),
);
