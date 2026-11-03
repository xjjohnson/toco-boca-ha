import { Platform } from 'react-native';

import { reactionFor, type GameReaction, type InboundContext } from '@/ha/inbound';
import { StubTransport } from '@/ha/stubTransport';
import type { HaTransport } from '@/ha/types';
import { WebSocketTransport } from '@/ha/websocketTransport';
import { ROOMS, type RoomId } from '@/play/catalog';
import { useConnection } from '@/store/connection';
import { useHouse } from '@/store/house';
import { useSettings, type Settings } from '@/store/settings';
import { useWallet } from '@/store/wallet';
import { useWorld } from '@/store/world';
import { SyncManager } from '@/sync/syncManager';

/** The pretend house, used until a token is entered in the Grown-ups screen. */
export const stubTransport = new StubTransport();

/**
 * Where Home Assistant is. An address typed in the Grown-ups screen wins;
 * otherwise, when the game is served from Home Assistant's own www folder
 * (/local/...), it's the same address the page came from. Served from the
 * Home Assistant add-on (its own port), Home Assistant is on the same host at
 * its usual port, 8123.
 */
export function haAddress(settings: Pick<Settings, 'haUrl'>): string {
  if (settings.haUrl.trim()) return settings.haUrl.trim();
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location.pathname.startsWith('/local/')) {
    return window.location.origin;
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:8123`;
  }
  return '';
}

/** Every entity the game listens to. */
export function followedEntities(settings: Settings): string[] {
  const ids = [
    settings.pointsEntity,
    settings.vacuumEntity,
    ...Object.values(settings.roomLights),
    ...settings.musicEntities,
  ];
  return [...new Set(ids.map((id) => (id ?? '').trim()).filter(Boolean))];
}

/** Stand-in entities the pretend house uses for anything not set up yet. */
export const PRETEND = {
  points: 'input_number.pretend_points',
  vacuum: 'vacuum.pretend_robot',
  music: 'media_player.pretend_speaker',
  light: (room: string) => `light.pretend_${room}`,
};

/** Which house entities mean what. The pretend house fills in any left blank. */
export function inboundContext(settings: Settings, pretend = false): InboundContext {
  const trim = (id: string | undefined) => (id ?? '').trim();
  const or = (id: string | undefined, stand: string) => trim(id) || (pretend ? stand : '');
  const music = settings.musicEntities.map(trim).filter(Boolean);
  return {
    pointsEntity: or(settings.pointsEntity, PRETEND.points),
    vacuumEntity: or(settings.vacuumEntity, PRETEND.vacuum),
    roomLights: Object.fromEntries(
      Object.keys(ROOMS).map((room) => [room, or(settings.roomLights[room as RoomId], PRETEND.light(room))]),
    ),
    musicEntities: music.length || !pretend ? music : [PRETEND.music],
  };
}

/** Sends each house reaction to the part of the game it belongs to. */
export function applyReaction(reaction: GameReaction): void {
  useWorld.getState().applyReaction(reaction);
  useWallet.getState().applyReaction(reaction);
  useHouse.getState().applyReaction(reaction);
}

function transportFor(settings: Settings): HaTransport {
  const url = haAddress(settings);
  if (!url || !settings.haToken.trim()) return stubTransport;
  return new WebSocketTransport({
    url,
    token: settings.haToken.trim(),
    entities: () => followedEntities(useSettings.getState()),
  });
}

export const syncManager: SyncManager = new SyncManager({
  transport: stubTransport,
  toReaction: (event): GameReaction | null =>
    reactionFor(event, inboundContext(useSettings.getState(), syncManager.getTransport() === stubTransport)),
  onReaction: applyReaction,
  onConnection: (state) => {
    useConnection.setState(state);
    // Out of reach: stop mirroring lights, music and the vacuum until the house is back.
    if (state.ha === 'disconnected') useHouse.getState().clear();
  },
});

/** Points the game at the house described by the current settings. Call after they load or change. */
export function applyConnectionSettings(): void {
  const transport = transportFor(useSettings.getState());
  syncManager.setTransport(transport);
  useConnection.setState({ transportName: transport.name, ha: transport.getStatus() });
}
