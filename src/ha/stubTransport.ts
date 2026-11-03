import type { HaEvent, HaStatus, HaTransport, OutboundAction } from '@/ha/types';

/**
 * A pretend Home Assistant that lives in memory. It lets the game, the save
 * queue and the grown-ups screen be built and tested before the real
 * connection exists. Flip `reachable` off to act like the house is offline.
 */
export class StubTransport implements HaTransport {
  readonly name = 'Pretend house (stub)';
  reachable = true;
  /** Everything "Home Assistant" received, newest last. */
  readonly received: OutboundAction[] = [];

  private status: HaStatus = 'disconnected';
  private eventListeners = new Set<(event: HaEvent) => void>();
  private statusListeners = new Set<(status: HaStatus) => void>();

  getStatus(): HaStatus {
    return this.status;
  }

  async connect(): Promise<void> {
    if (this.status === 'connected') return;
    this.setStatus('connecting');
    this.setStatus(this.reachable ? 'connected' : 'disconnected');
  }

  disconnect(): void {
    this.setStatus('disconnected');
  }

  async send(action: OutboundAction): Promise<void> {
    if (this.status !== 'connected' || !this.reachable) {
      if (this.status === 'connected') this.setStatus('disconnected');
      throw new Error('Home Assistant is not reachable');
    }
    this.received.push(action);
  }

  /** Pretends Home Assistant fired an event. */
  emit(event: HaEvent): void {
    if (this.status !== 'connected') return;
    this.eventListeners.forEach((l) => l(event));
  }

  /** Pretends the house went offline or came back. */
  setReachable(reachable: boolean): void {
    this.reachable = reachable;
    if (!reachable) this.setStatus('disconnected');
  }

  onEvent(listener: (event: HaEvent) => void): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  onStatus(listener: (status: HaStatus) => void): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  private setStatus(status: HaStatus): void {
    if (status === this.status) return;
    this.status = status;
    this.statusListeners.forEach((l) => l(status));
  }
}
