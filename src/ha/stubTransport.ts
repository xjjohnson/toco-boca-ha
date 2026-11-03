import type { EntityState, HaEvent, HaStatus, HaTransport } from '@/ha/types';

/**
 * A pretend Home Assistant that lives in memory, used until a token is
 * entered. The Grown-ups screen drives it to try every house reaction
 * without a real house. Flip `reachable` off to act like the house is
 * offline. Like the real one, it only talks to the game, never the reverse.
 */
export class StubTransport implements HaTransport {
  readonly name = 'Pretend house';
  reachable = true;

  private status: HaStatus = 'disconnected';
  private entities = new Map<string, EntityState>();
  private eventListeners = new Set<(event: HaEvent) => void>();
  private statusListeners = new Set<(status: HaStatus) => void>();

  getStatus(): HaStatus {
    return this.status;
  }

  async connect(): Promise<void> {
    if (this.status === 'connected') return;
    this.setStatus('connecting');
    this.setStatus(this.reachable ? 'connected' : 'disconnected');
    // Like subscribe_entities: a fresh connection hears every current state.
    if (this.getStatus() === 'connected') this.entities.forEach((e) => this.send(e));
  }

  disconnect(): void {
    this.setStatus('disconnected');
  }

  /** Pretends Home Assistant fired an event. */
  emit(event: HaEvent): void {
    if (this.status !== 'connected') return;
    this.eventListeners.forEach((l) => l(event));
  }

  /** Pretends an entity changed in the house. Remembered, so it's heard on reconnect too. */
  setEntity(entity_id: string, state: string, attributes: Record<string, unknown> = {}): void {
    const next = { entity_id, state, attributes };
    this.entities.set(entity_id, next);
    this.send(next);
  }

  getEntity(entity_id: string): EntityState | undefined {
    return this.entities.get(entity_id);
  }

  async listEntities(): Promise<EntityState[]> {
    return [...this.entities.values()];
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

  private send(e: EntityState): void {
    this.emit({ eventType: 'state_changed', data: { ...e } });
  }

  private setStatus(status: HaStatus): void {
    if (status === this.status) return;
    this.status = status;
    this.statusListeners.forEach((l) => l(status));
  }
}
