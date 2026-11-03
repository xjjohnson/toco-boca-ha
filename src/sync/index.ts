import { StubTransport } from '@/ha/stubTransport';
import type { OutboundAction } from '@/ha/types';
import { useConnection } from '@/store/connection';
import { useSyncQueue } from '@/store/syncQueue';
import { useWorld } from '@/store/world';
import { SyncManager } from '@/sync/syncManager';

/**
 * The app's one Home Assistant connection. It's the stub until step 3 swaps
 * in the real WebSocket transport here.
 */
export const transport = new StubTransport();

export const syncManager = new SyncManager({
  transport,
  queue: {
    read: () => useSyncQueue.getState().items,
    write: (items) => useSyncQueue.getState().replace(items),
  },
  onReaction: (reaction) => useWorld.getState().applyReaction(reaction),
  onConnection: (state) => useConnection.setState(state),
});
useConnection.setState({ transportName: transport.name });

/**
 * Tells the house about something that happened in the game. Works offline:
 * it's saved and sent when the connection comes back. Pass a coalesceKey
 * when only the latest of a kind matters (like a lamp's on/off state).
 */
export function tellHome(action: OutboundAction, coalesceKey?: string): void {
  useSyncQueue.getState().add(action, coalesceKey);
  syncManager.notifyQueued();
}
