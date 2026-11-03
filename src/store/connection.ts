import { create } from 'zustand';

import type { HaStatus } from '@/ha/types';

/** Live connection state, not saved. The sync manager keeps it current. */
interface ConnectionState {
  /** The device has a network (and offline isn't being simulated). */
  online: boolean;
  ha: HaStatus;
  transportName: string;
}

export const useConnection = create<ConnectionState>()(() => ({
  online: true,
  ha: 'disconnected',
  transportName: '',
}));
