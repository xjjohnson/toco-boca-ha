import type { HaEvent } from '@/ha/types';
import type { EntityState } from '@/ha/types';
import {
  applyEntityEvent,
  WebSocketTransport,
  websocketUrl,
  type SocketLike,
} from '@/ha/websocketTransport';

/** A fake Home Assistant on the other end of the socket. */
class FakeSocket implements SocketLike {
  readyState = 1;
  sent: Record<string, unknown>[] = [];
  closed = false;
  onopen: SocketLike['onopen'] = null;
  onmessage: SocketLike['onmessage'] = null;
  onclose: SocketLike['onclose'] = null;
  onerror: SocketLike['onerror'] = null;
  constructor(readonly url: string, private readonly token = 'good') {
    setTimeout(() => this.reply({ type: 'auth_required' }), 0);
  }
  reply(msg: Record<string, unknown>) {
    this.onmessage?.({ data: JSON.stringify(msg) });
  }
  send(data: string) {
    const msg = JSON.parse(data);
    this.sent.push(msg);
    if (msg.type === 'auth') this.reply(msg.access_token === this.token ? { type: 'auth_ok' } : { type: 'auth_invalid', message: 'Invalid access token' });
    else if (msg.type === 'ping') this.reply({ id: msg.id, type: 'pong' });
    else if (msg.type === 'get_states') {
      this.reply({ id: msg.id, type: 'result', success: true, result: [{ entity_id: 'light.kids', state: 'on', attributes: { friendly_name: 'Kids' } }] });
    } else this.reply({ id: msg.id, type: 'result', success: true, result: null });
    if (msg.type === 'subscribe_entities') {
      this.reply({ id: msg.id, type: 'event', event: { a: { 'light.play_room': { s: 'off', a: {} } } } });
    }
  }
  close() {
    this.closed = true;
  }
}

function make(opts: { token?: string } = {}) {
  let socket!: FakeSocket;
  const t = new WebSocketTransport({
    url: 'https://home.example.com/',
    token: opts.token ?? 'good',
    entities: () => ['light.play_room'],
    createSocket: (url) => (socket = new FakeSocket(url, 'good')),
  });
  const events: HaEvent[] = [];
  t.onEvent((e) => events.push(e));
  return { t, events, socket: () => socket };
}

describe('websocket helpers', () => {
  it('builds the websocket address', () => {
    expect(websocketUrl('https://home.example.com/')).toBe('wss://home.example.com/api/websocket');
    expect(websocketUrl('http://192.168.1.5:8123')).toBe('ws://192.168.1.5:8123/api/websocket');
    expect(websocketUrl('homeassistant.local:8123')).toBe('ws://homeassistant.local:8123/api/websocket');
  });

  it('keeps full state and attributes from subscribe_entities messages', () => {
    const known = new Map<string, EntityState>();
    expect(applyEntityEvent(known, { a: { 'light.a': { s: 'on', a: { rgb_color: [255, 0, 0], brightness: 9 } } } })).toEqual([
      { entity_id: 'light.a', state: 'on', attributes: { rgb_color: [255, 0, 0], brightness: 9 } },
    ]);
    // A change carries only what changed; the rest is remembered.
    expect(applyEntityEvent(known, { c: { 'light.a': { '+': { a: { rgb_color: [0, 0, 255] } } } } })).toEqual([
      { entity_id: 'light.a', state: 'on', attributes: { rgb_color: [0, 0, 255], brightness: 9 } },
    ]);
    expect(applyEntityEvent(known, { c: { 'light.a': { '+': { s: 'off' }, '-': { a: ['rgb_color', 'brightness'] } } } })).toEqual([
      { entity_id: 'light.a', state: 'off', attributes: {} },
    ]);
    applyEntityEvent(known, { r: ['light.a'] });
    expect(known.size).toBe(0);
  });
});

describe('WebSocketTransport', () => {
  it('authenticates, subscribes, and reports the current light state', async () => {
    const { t, events, socket } = make();
    await t.connect();
    expect(t.getStatus()).toBe('connected');
    expect(socket().url).toBe('wss://home.example.com/api/websocket');
    const types = socket().sent.map((m) => m.type);
    expect(types).toEqual(['auth', 'subscribe_events', 'subscribe_entities']);
    expect(events).toEqual([{ eventType: 'state_changed', data: { entity_id: 'light.play_room', state: 'off', attributes: {} } }]);
    t.disconnect();
  });

  it('passes house events and entity changes through', async () => {
    const { t, events, socket } = make();
    await t.connect();
    const sub = socket().sent.find((m) => m.type === 'subscribe_events')!;
    const ent = socket().sent.find((m) => m.type === 'subscribe_entities')!;
    socket().reply({ id: sub.id, type: 'event', event: { event_type: 'toybox_town', data: { reaction: 'night' } } });
    socket().reply({ id: ent.id, type: 'event', event: { c: { 'light.play_room': { '+': { s: 'on' } } } } });
    expect(events.slice(1)).toEqual([
      { eventType: 'toybox_town', data: { reaction: 'night' } },
      { eventType: 'state_changed', data: { entity_id: 'light.play_room', state: 'on', attributes: {} } },
    ]);
    t.disconnect();
  });

  it('lists entities for the Grown-ups pickers', async () => {
    const { t } = make();
    await t.connect();
    expect(await t.listEntities()).toEqual([{ entity_id: 'light.kids', state: 'on', attributes: { friendly_name: 'Kids' } }]);
    t.disconnect();
  });

  it('only ever sends read-only commands', async () => {
    const { t, socket } = make();
    await t.connect();
    await t.listEntities();
    const allowed = new Set(['auth', 'subscribe_events', 'subscribe_entities', 'get_states', 'ping']);
    expect(socket().sent.map((m) => m.type).filter((type) => !allowed.has(type as string))).toEqual([]);
    expect('send' in t).toBe(false);
    t.disconnect();
  });

  it('reports a bad token and stays disconnected', async () => {
    const { t, socket } = make({ token: 'wrong' });
    await t.connect();
    expect(t.getStatus()).toBe('disconnected');
    expect(t.lastError).toMatch(/refused the token/);
    expect(socket().closed).toBe(true);
  });

  it('goes disconnected when the socket closes', async () => {
    const { t, socket } = make();
    const statuses: string[] = [];
    t.onStatus((s) => statuses.push(s));
    await t.connect();
    socket().onclose?.({});
    expect(t.getStatus()).toBe('disconnected');
    expect(statuses).toEqual(['connecting', 'connected', 'disconnected']);
  });
});
