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

/** The game-to-house event every toy and character action is sent as. */
export const ACTION_EVENT = 'toybox_town_action';

/**
 * A toy was switched on or off. The lamp drives the real light chosen in the
 * Grown-ups screen when there is one; everything else (and the lamp with no
 * light set) fires `toybox_town_action` with { toy, id, room, on } for
 * automations to pick up. Only the newest state of each toy matters, so taps
 * while offline collapse into one.
 */
export function tellToy(toy: { id: string; kind: string; room: string }, on: boolean): void {
  const entity = toy.id === 'lamp' ? useSettings.getState().lampEntity.trim() : '';
  if (entity) {
    const domain = entity.split('.')[0] || 'homeassistant';
    tellHome(
      { kind: 'callService', domain, service: on ? 'turn_on' : 'turn_off', data: { entity_id: entity } },
      `toy:${toy.id}`,
    );
    return;
  }
  tellHome(
    { kind: 'fireEvent', eventType: ACTION_EVENT, data: { toy: toy.kind, id: toy.id, room: toy.room, on } },
    `toy:${toy.id}`,
  );
}

/** A character walked into another room, e.g. so the house can turn on that room's light. */
export function tellCharacterMoved(character: string, room: string): void {
  tellHome({ kind: 'fireEvent', eventType: ACTION_EVENT, data: { character, room } }, `room:${character}`);
}

/** A character got changed into something new. */
export function tellDressed(character: string, outfit: Record<string, string>): void {
  tellHome({ kind: 'fireEvent', eventType: ACTION_EVENT, data: { character, outfit } }, `outfit:${character}`);
}
