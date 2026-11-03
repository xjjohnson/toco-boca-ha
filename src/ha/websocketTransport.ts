import type { HaEvent, HaStatus, HaTransport, OutboundAction } from '@/ha/types';

/** The custom event an automation fires to poke the game. Kept here to avoid an import cycle. */
const GAME_EVENT = 'toybox_town';
const COMMAND_TIMEOUT_MS = 10_000;
const PING_MS = 30_000;

type Json = Record<string, unknown>;

/** Minimal WebSocket surface we use, so tests can pass a fake. */
export interface SocketLike {
  readyState: number;
  send(data: string): void;
  close(): void;
  onopen: ((ev: unknown) => void) | null;
  onmessage: ((ev: { data: unknown }) => void) | null;
  onclose: ((ev: unknown) => void) | null;
  onerror: ((ev: unknown) => void) | null;
}

export interface WebSocketOptions {
  /** Home Assistant address, like https://example.ui.nabu.casa or http://192.168.1.5:8123. */
  url: string;
  token: string;
  /** Entities whose on/off state the game follows, read on every connect. */
  entities: () => string[];
  createSocket?: (url: string) => SocketLike;
  pingMs?: number;
}

/** http://host:8123/ -> ws://host:8123/api/websocket (https -> wss). */
export function websocketUrl(base: string): string {
  const trimmed = base.trim().replace(/\/+$/, '');
  const withScheme = /^[a-z]+:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  return `${withScheme.replace(/^http/i, 'ws')}/api/websocket`;
}

/** Pulls entity states out of a subscribe_entities message: {entity_id: state}. */
export function statesFromEntityEvent(event: Json): Record<string, string> {
  const out: Record<string, string> = {};
  const added = (event.a ?? {}) as Record<string, { s?: unknown }>;
  for (const [id, v] of Object.entries(added)) if (typeof v?.s === 'string') out[id] = v.s;
  const changed = (event.c ?? {}) as Record<string, { '+'?: { s?: unknown } }>;
  for (const [id, v] of Object.entries(changed)) {
    const s = v?.['+']?.s;
    if (typeof s === 'string') out[id] = s;
  }
  return out;
}

/** Turns a game action into a Home Assistant WebSocket command. */
export function commandFor(action: OutboundAction): Json {
  if (action.kind === 'fireEvent') {
    return { type: 'fire_event', event_type: action.eventType, event_data: action.data ?? {} };
  }
  const { entity_id, ...serviceData } = action.data ?? {};
  return {
    type: 'call_service',
    domain: action.domain,
    service: action.service,
    service_data: serviceData,
    ...(entity_id ? { target: { entity_id } } : {}),
  };
}

/**
 * The real connection, over Home Assistant's WebSocket API
 * (https://developers.home-assistant.io/docs/api/websocket). It
 * authenticates with a long-lived token, follows the configured entities
 * with subscribe_entities, listens for the `toybox_town` event, and sends
 * game actions as service calls or events.
 *
 * Entity changes reach the game as HaEvents with eventType 'state_changed'
 * and data {entity_id, state}.
 */
export class WebSocketTransport implements HaTransport {
  readonly name = 'Home Assistant';
  /** Why the last connect failed, for the Grown-ups screen. */
  lastError: string | null = null;

  private socket: SocketLike | null = null;
  private status: HaStatus = 'disconnected';
  private nextId = 1;
  private pending = new Map<number, { resolve: (r: Json) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> }>();
  private eventSubs = new Map<number, (event: Json) => void>();
  private eventListeners = new Set<(event: HaEvent) => void>();
  private statusListeners = new Set<(status: HaStatus) => void>();
  private pingTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly opts: WebSocketOptions) {}

  getStatus(): HaStatus {
    return this.status;
  }

  connect(): Promise<void> {
    if (this.status !== 'disconnected') return Promise.resolve();
    this.setStatus('connecting');
    return new Promise((resolve) => {
      let socket: SocketLike;
      try {
        const create = this.opts.createSocket ?? ((u: string) => new WebSocket(u) as unknown as SocketLike);
        socket = create(websocketUrl(this.opts.url));
      } catch (e) {
        this.lastError = `Couldn't open a connection: ${String(e)}`;
        this.setStatus('disconnected');
        resolve();
        return;
      }
      this.socket = socket;
      let settled = false;
      const done = () => {
        if (!settled) {
          settled = true;
          resolve();
        }
      };

      socket.onmessage = (ev) => {
        let msg: Json;
        try {
          msg = JSON.parse(String(ev.data));
        } catch {
          return;
        }
        switch (msg.type) {
          case 'auth_required':
            socket.send(JSON.stringify({ type: 'auth', access_token: this.opts.token }));
            break;
          case 'auth_ok':
            this.lastError = null;
            this.subscribe()
              .then(() => {
                this.startPing();
                this.setStatus('connected');
              })
              .catch((e) => {
                this.lastError = `Connected, but subscribing failed: ${(e as Error).message}`;
                this.drop();
              })
              .finally(done);
            break;
          case 'auth_invalid':
            this.lastError = `Home Assistant refused the token: ${String(msg.message ?? 'invalid')}`;
            this.drop();
            done();
            break;
          case 'result':
          case 'pong':
            this.settle(msg);
            break;
          case 'event': {
            const handler = this.eventSubs.get(msg.id as number);
            if (handler) handler((msg.event ?? {}) as Json);
            break;
          }
        }
      };
      socket.onclose = () => {
        if (!this.lastError && this.status === 'connecting') {
          this.lastError = "Couldn't reach Home Assistant at that address";
        }
        this.drop();
        done();
      };
      socket.onerror = () => {
        // onclose follows and does the cleanup.
      };
    });
  }

  disconnect(): void {
    this.drop();
  }

  async send(action: OutboundAction): Promise<void> {
    if (this.status !== 'connected') throw new Error('Home Assistant is not connected');
    await this.command(commandFor(action));
  }

  onEvent(listener: (event: HaEvent) => void): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  onStatus(listener: (status: HaStatus) => void): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  private async subscribe(): Promise<void> {
    await this.subscription({ type: 'subscribe_events', event_type: GAME_EVENT }, (event) =>
      this.emit({ eventType: String(event.event_type ?? GAME_EVENT), data: (event.data ?? {}) as Json }),
    );
    const entityIds = this.opts.entities().filter(Boolean);
    if (entityIds.length) {
      await this.subscription({ type: 'subscribe_entities', entity_ids: entityIds }, (event) => {
        for (const [entity_id, state] of Object.entries(statesFromEntityEvent(event))) {
          this.emit({ eventType: 'state_changed', data: { entity_id, state } });
        }
      });
    }
  }

  private async subscription(cmd: Json, handler: (event: Json) => void): Promise<void> {
    const id = this.nextId++;
    // Register first: subscribe_entities sends its first event right after the result.
    this.eventSubs.set(id, handler);
    try {
      await this.command(cmd, id);
    } catch (e) {
      this.eventSubs.delete(id);
      throw e;
    }
  }

  private command(cmd: Json, id = this.nextId++): Promise<Json> {
    const socket = this.socket;
    if (!socket) return Promise.reject(new Error('Not connected'));
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error('Home Assistant did not answer'));
        // A command that never answers means the connection is dead.
        this.drop();
      }, COMMAND_TIMEOUT_MS);
      this.pending.set(id, { resolve, reject, timer });
      try {
        socket.send(JSON.stringify({ id, ...cmd }));
      } catch (e) {
        clearTimeout(timer);
        this.pending.delete(id);
        reject(e as Error);
      }
    });
  }

  private settle(msg: Json): void {
    const p = this.pending.get(msg.id as number);
    if (!p) return;
    clearTimeout(p.timer);
    this.pending.delete(msg.id as number);
    if (msg.type === 'pong' || msg.success) p.resolve(msg);
    else {
      const err = (msg.error ?? {}) as Json;
      p.reject(new Error(String(err.message ?? err.code ?? 'Home Assistant said no')));
    }
  }

  private startPing(): void {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      this.command({ type: 'ping' }).catch(() => {});
    }, this.opts.pingMs ?? PING_MS);
  }

  private stopPing(): void {
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.pingTimer = null;
  }

  private drop(): void {
    this.stopPing();
    const socket = this.socket;
    this.socket = null;
    if (socket) {
      socket.onmessage = socket.onclose = socket.onerror = socket.onopen = null;
      try {
        socket.close();
      } catch {
        // already closed
      }
    }
    for (const p of this.pending.values()) {
      clearTimeout(p.timer);
      p.reject(new Error('Connection closed'));
    }
    this.pending.clear();
    this.eventSubs.clear();
    this.setStatus('disconnected');
  }

  private emit(event: HaEvent): void {
    this.eventListeners.forEach((l) => l(event));
  }

  private setStatus(status: HaStatus): void {
    if (status === this.status) return;
    this.status = status;
    this.statusListeners.forEach((l) => l(status));
  }
}
