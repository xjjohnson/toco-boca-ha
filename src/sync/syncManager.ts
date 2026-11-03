import { reactionFor, type GameReaction } from '@/ha/inbound';
import type { HaEvent } from '@/ha/types';
import type { HaStatus, HaTransport } from '@/ha/types';
import { backoffMs, flush, msUntilNextAttempt, type QueueAccess } from '@/sync/queue';

export interface SyncDeps {
  transport: HaTransport;
  queue: QueueAccess;
  onReaction: (reaction: GameReaction) => void;
  /** Maps house events to game reactions. Defaults to reactionFor with no context. */
  toReaction?: (event: HaEvent) => GameReaction | null;
  onConnection: (state: { online?: boolean; ha?: HaStatus }) => void;
  now?: () => number;
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (handle: unknown) => void;
}

/**
 * Keeps the game and Home Assistant in step. While offline, game actions
 * pile up in the saved queue; as soon as the network and the house are both
 * back, it reconnects and sends them in order. Events from the house are
 * turned into game reactions.
 */
export class SyncManager {
  /** Starts offline until the network watcher reports in, so nothing is sent before we know. */
  private online = false;
  private reconnectAttempts = 0;
  private timer: unknown = null;
  private flushing: Promise<void> | null = null;
  private unsubscribers: (() => void)[] = [];
  private started = false;
  private readonly now: () => number;
  private readonly setTimer: (fn: () => void, ms: number) => unknown;
  private readonly clearTimer: (handle: unknown) => void;

  private transport: HaTransport;

  constructor(private readonly deps: SyncDeps) {
    this.transport = deps.transport;
    this.now = deps.now ?? Date.now;
    this.setTimer = deps.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
    this.clearTimer = deps.clearTimer ?? ((h) => clearTimeout(h as ReturnType<typeof setTimeout>));
  }

  getTransport(): HaTransport {
    return this.transport;
  }

  /** Swaps the connection (e.g. stub -> real Home Assistant) without losing the queue. */
  setTransport(next: HaTransport): void {
    if (next === this.transport) return;
    const wasStarted = this.started;
    if (wasStarted) this.stop();
    this.transport = next;
    if (wasStarted) this.start();
  }

  start(): () => void {
    const transport = this.transport;
    this.started = true;
    this.unsubscribers.push(
      transport.onStatus((status) => {
        this.deps.onConnection({ ha: status });
        if (status === 'connected') {
          this.reconnectAttempts = 0;
          void this.flushNow();
        } else if (status === 'disconnected') {
          this.scheduleRetry();
        }
      }),
      transport.onEvent((event) => {
        const reaction = (this.deps.toReaction ?? reactionFor)(event);
        if (reaction) this.deps.onReaction(reaction);
      }),
    );
    this.deps.onConnection({ online: this.online, ha: transport.getStatus() });
    void this.connect();
    return () => this.stop();
  }

  stop(): void {
    this.started = false;
    this.unsubscribers.forEach((u) => u());
    this.unsubscribers = [];
    this.cancelTimer();
    this.transport.disconnect();
  }

  setOnline(online: boolean): void {
    if (online === this.online) return;
    this.online = online;
    this.deps.onConnection({ online });
    if (online) {
      this.reconnectAttempts = 0;
      void this.connect();
    } else {
      this.cancelTimer();
      this.transport.disconnect();
    }
  }

  /** Call after queueing an action so it goes out right away when possible. */
  notifyQueued(): void {
    if (this.transport.getStatus() === 'connected') void this.flushNow();
    else void this.connect();
  }

  async connect(): Promise<void> {
    if (!this.online || !this.started) return;
    const transport = this.transport;
    if (transport.getStatus() === 'connected') return this.flushNow();
    if (transport.getStatus() === 'connecting') return;
    await transport.connect();
    if (transport.getStatus() !== 'connected') this.scheduleRetry();
  }

  /** Sends whatever is queued. Concurrent calls share one run. */
  flushNow(): Promise<void> {
    if (this.flushing) return this.flushing;
    const transport = this.transport;
    const { queue } = this.deps;
    if (!this.online || transport.getStatus() !== 'connected') return Promise.resolve();
    this.flushing = flush(queue, (a) => transport.send(a), this.now)
      .then(() => {
        // Anything left is waiting out a backoff; come back for it.
        const wait = msUntilNextAttempt(queue.read(), this.now());
        if (wait !== null) this.schedule(() => void this.connect(), Math.max(wait, 250));
      })
      .finally(() => {
        this.flushing = null;
      });
    return this.flushing;
  }

  private scheduleRetry(): void {
    if (!this.online) return;
    this.reconnectAttempts++;
    this.schedule(() => void this.connect(), backoffMs(this.reconnectAttempts));
  }

  private schedule(fn: () => void, ms: number): void {
    this.cancelTimer();
    this.timer = this.setTimer(() => {
      this.timer = null;
      fn();
    }, ms);
  }

  private cancelTimer(): void {
    if (this.timer !== null) this.clearTimer(this.timer);
    this.timer = null;
  }
}
