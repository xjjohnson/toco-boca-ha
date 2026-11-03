import { reactionFor, type GameReaction } from '@/ha/inbound';
import type { HaEvent, HaStatus, HaTransport } from '@/ha/types';

const MAX_BACKOFF_MS = 60 * 1000;

/** 1s, 2s, 4s… up to a minute between reconnect tries. */
export function backoffMs(attempts: number): number {
  return Math.min(1000 * 2 ** Math.max(0, attempts - 1), MAX_BACKOFF_MS);
}

export interface SyncDeps {
  transport: HaTransport;
  onReaction: (reaction: GameReaction) => void;
  /** Maps house events to game reactions. Defaults to reactionFor with no context. */
  toReaction?: (event: HaEvent) => GameReaction | null;
  onConnection: (state: { online?: boolean; ha?: HaStatus }) => void;
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (handle: unknown) => void;
}

/**
 * Keeps the game listening to Home Assistant. It connects when the network
 * is up, reconnects with a growing wait when the house drops away, and turns
 * house events into game reactions. It never sends anything to the house.
 * The game plays the same with or without it; reconnecting reads the
 * current states again, so nothing that changed while offline is missed.
 */
export class SyncManager {
  /** Starts offline until the network watcher reports in. */
  private online = false;
  private reconnectAttempts = 0;
  private timer: unknown = null;
  private unsubscribers: (() => void)[] = [];
  private started = false;
  private readonly setTimer: (fn: () => void, ms: number) => unknown;
  private readonly clearTimer: (handle: unknown) => void;

  private transport: HaTransport;

  constructor(private readonly deps: SyncDeps) {
    this.transport = deps.transport;
    this.setTimer = deps.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
    this.clearTimer = deps.clearTimer ?? ((h) => clearTimeout(h as ReturnType<typeof setTimeout>));
  }

  getTransport(): HaTransport {
    return this.transport;
  }

  /** Swaps the connection (e.g. pretend house -> real Home Assistant). */
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
        if (status === 'connected') this.reconnectAttempts = 0;
        else if (status === 'disconnected') this.scheduleRetry();
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

  async connect(): Promise<void> {
    if (!this.online || !this.started) return;
    const transport = this.transport;
    if (transport.getStatus() !== 'disconnected') return;
    await transport.connect();
    if (transport.getStatus() !== 'connected') this.scheduleRetry();
  }

  private scheduleRetry(): void {
    if (!this.online || !this.started || this.timer !== null) return;
    this.reconnectAttempts++;
    this.timer = this.setTimer(() => {
      this.timer = null;
      void this.connect();
    }, backoffMs(this.reconnectAttempts));
  }

  private cancelTimer(): void {
    if (this.timer !== null) this.clearTimer(this.timer);
    this.timer = null;
  }
}
