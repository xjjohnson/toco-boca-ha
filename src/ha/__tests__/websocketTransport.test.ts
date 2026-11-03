import type { HaEvent } from '@/ha/types';
import {
  commandFor,
  statesFromEntityEvent,
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
  constructor(readonly url: string, private readonly token = 'good', private readonly failService = false) {
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
    else if (msg.type === 'call_service' && this.failService) this.reply({ id: msg.id, type: 'result', success: false, error: { code: 'not_found', message: 'Service not found' } });
    else this.reply({ id: msg.id, type: 'result', success: true, result: null });
    if (msg.type === 'subscribe_entities') {
      this.reply({ id: msg.id, type: 'event', event: { a: { 'light.play_room': { s: 'off', a: {} } } } });
    }
  }
  close() {
    this.closed = true;
  }
}

function make(opts: { token?: string; failService?: boolean } = {}) {
  let socket!: FakeSocket;
  const t = new WebSocketTransport({
    url: 'https://home.example.com/',
    token: opts.token ?? 'good',
    entities: () => ['light.play_room'],
    createSocket: (url) => (socket = new FakeSocket(url, 'good', opts.failService)),
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

  it('reads states from subscribe_entities messages', () => {
    expect(statesFromEntityEvent({ a: { 'light.a': { s: 'on' } } })).toEqual({ 'light.a': 'on' });
    expect(statesFromEntityEvent({ c: { 'light.a': { '+': { s: 'off', lc: 1 } } } })).toEqual({ 'light.a': 'off' });
    expect(statesFromEntityEvent({ c: { 'light.a': { '+': { a: { brightness: 3 } } } } })).toEqual({});
  });

  it('turns actions into commands', () => {
    expect(commandFor({ kind: 'callService', domain: 'light', service: 'turn_on', data: { entity_id: 'light.a', brightness: 9 } })).toEqual({
      type: 'call_service',
      domain: 'light',
      service: 'turn_on',
      service_data: { brightness: 9 },
      target: { entity_id: 'light.a' },
    });
    expect(commandFor({ kind: 'fireEvent', eventType: 'x', data: { a: 1 } })).toEqual({ type: 'fire_event', event_type: 'x', event_data: { a: 1 } });
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
    expect(events).toEqual([{ eventType: 'state_changed', data: { entity_id: 'light.play_room', state: 'off' } }]);
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
      { eventType: 'state_changed', data: { entity_id: 'light.play_room', state: 'on' } },
    ]);
    t.disconnect();
  });

  it('sends service calls and surfaces Home Assistant errors', async () => {
    const ok = make();
    await ok.t.connect();
    await ok.t.send({ kind: 'callService', domain: 'light', service: 'turn_on', data: { entity_id: 'light.play_room' } });
    expect(ok.socket().sent.at(-1)).toMatchObject({ type: 'call_service', target: { entity_id: 'light.play_room' } });
    ok.t.disconnect();

    const bad = make({ failService: true });
    await bad.t.connect();
    await expect(bad.t.send({ kind: 'callService', domain: 'light', service: 'nope' })).rejects.toThrow('Service not found');
    bad.t.disconnect();
  });

  it('reports a bad token and stays disconnected', async () => {
    const { t, socket } = make({ token: 'wrong' });
    await t.connect();
    expect(t.getStatus()).toBe('disconnected');
    expect(t.lastError).toMatch(/refused the token/);
    expect(socket().closed).toBe(true);
  });

  it('refuses to send while disconnected, so the queue keeps the action', async () => {
    const { t } = make();
    await expect(t.send({ kind: 'fireEvent', eventType: 'x' })).rejects.toThrow();
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
