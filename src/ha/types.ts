/** Something the game asks Home Assistant to do. */
export type OutboundAction =
  | {
      kind: 'callService';
      domain: string;
      service: string;
      data?: Record<string, unknown>;
    }
  | {
      kind: 'fireEvent';
      eventType: string;
      data?: Record<string, unknown>;
    };

/** Something that happened in Home Assistant that the game may react to. */
export interface HaEvent {
  eventType: string;
  data: Record<string, unknown>;
}

export type HaStatus = 'disconnected' | 'connecting' | 'connected';

/**
 * The game's only door to Home Assistant. Step 1 ships a stub; step 3 adds a
 * WebSocket transport behind the same interface, so nothing else changes.
 */
export interface HaTransport {
  readonly name: string;
  getStatus(): HaStatus;
  /** Tries to connect. Resolves either way; check getStatus() after. */
  connect(): Promise<void>;
  disconnect(): void;
  /** Sends one action. Rejects if it couldn't be delivered, so the queue keeps it. */
  send(action: OutboundAction): Promise<void>;
  onEvent(listener: (event: HaEvent) => void): () => void;
  onStatus(listener: (status: HaStatus) => void): () => void;
}
