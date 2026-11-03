/** Something that happened in Home Assistant that the game may react to. */
export interface HaEvent {
  eventType: string;
  data: Record<string, unknown>;
}

/** One entity's state and attributes, as the game sees it. */
export interface EntityState {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
}

export type HaStatus = 'disconnected' | 'connecting' | 'connected';

/**
 * The game's only door to Home Assistant, and it only listens. There is no
 * way to send a command through it: the game never switches, plays, or
 * changes anything in the house.
 *
 * Entity changes arrive as events with eventType 'state_changed' and data
 * {entity_id, state, attributes}.
 */
export interface HaTransport {
  readonly name: string;
  getStatus(): HaStatus;
  /** Tries to connect. Resolves either way; check getStatus() after. */
  connect(): Promise<void>;
  disconnect(): void;
  onEvent(listener: (event: HaEvent) => void): () => void;
  onStatus(listener: (status: HaStatus) => void): () => void;
  /** Everything Home Assistant can show this token, for the Grown-ups pickers. Read only. */
  listEntities(): Promise<EntityState[]>;
}
