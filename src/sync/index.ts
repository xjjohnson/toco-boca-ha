import { Platform } from 'react-native';

import { reactionFor } from '@/ha/inbound';
import { StubTransport } from '@/ha/stubTransport';
import type { HaTransport, OutboundAction } from '@/ha/types';
import { WebSocketTransport } from '@/ha/websocketTransport';
import { useConnection } from '@/store/connection';
import { useSettings, type Settings } from '@/store/settings';
import { useSyncQueue } from '@/store/syncQueue';
import { useWorld } from '@/store/world';
import { SyncManager } from '@/sync/syncManager';

/** The pretend house, used until a token is entered in the Grown-ups screen. */
export const stubTransport = new StubTransport();

/**
 * Where Home Assistant is. An address typed in the Grown-ups screen wins;
 * otherwise, when the game is served from Home Assistant's own www folder
 * (/local/...), it's the same address the page came from.
 */
export function haAddress(settings: Pick<Settings, 'haUrl'>): string {
  if (settings.haUrl.trim()) return settings.haUrl.trim();
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location.pathname.startsWith('/local/')) {
    return window.location.origin;
  }
  return '';
}

function transportFor(settings: Settings): HaTransport {
  const url = haAddress(settings);
  if (!url || !settings.haToken.trim()) return stubTransport;
  return new WebSocketTransport({
    url,
    token: settings.haToken.trim(),
    entities: () => [useSettings.getState().lampEntity.trim()],
  });
}

export const syncManager = new SyncManager({
  transport: stubTransport,
  queue: {
    read: () => useSyncQueue.getState().items,
    write: (items) => useSyncQueue.getState().replace(items),
  },
  toReaction: (event) => reactionFor(event, { lampEntity: useSettings.getState().lampEntity.trim() }),
  onReaction: (reaction) => useWorld.getState().applyReaction(reaction),
  onConnection: (state) => useConnection.setState(state),
});

/** Points the game at the house described by the current settings. Call after they load or change. */
export function applyConnectionSettings(): void {
  const transport = transportFor(useSettings.getState());
  syncManager.setTransport(transport);
  useConnection.setState({ transportName: transport.name, ha: transport.getStatus() });
}

/**
 * Tells the house about something that happened in the game. Works offline:
 * it's saved and sent when the connection comes back. Pass a coalesceKey
 * when only the latest of a kind matters (like a lamp's on/off state).
 */
export function tellHome(action: OutboundAction, coalesceKey?: string): void {
  useSyncQueue.getState().add(action, coalesceKey);
  syncManager.notifyQueued();
}

/** The toy lamp was switched: drive the real light if one is set, else just announce it. */
export function tellLamp(on: boolean): void {
  const entity = useSettings.getState().lampEntity.trim();
  // Only the newest lamp state matters, so repeated taps while offline collapse into one.
  if (entity) {
    const domain = entity.split('.')[0] || 'homeassistant';
    tellHome(
      { kind: 'callService', domain, service: on ? 'turn_on' : 'turn_off', data: { entity_id: entity } },
      'lamp',
    );
  } else {
    tellHome({ kind: 'fireEvent', eventType: 'toybox_town_action', data: { toy: 'lamp', on } }, 'lamp');
  }
}
