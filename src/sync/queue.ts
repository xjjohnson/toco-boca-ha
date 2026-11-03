import type { OutboundAction } from '@/ha/types';

/** One action waiting to reach Home Assistant. */
export interface QueuedAction {
  id: string;
  action: OutboundAction;
  createdAt: number;
  attempts: number;
  /** Not retried before this time (ms since epoch). */
  nextAttemptAt: number;
  /**
   * Actions with the same key replace each other, so only the newest one is
   * sent. Use it for "set the lamp to X": if the lamp was flicked ten times
   * while offline, the house only needs the last state.
   */
  coalesceKey?: string;
}

/** Plenty for a play session; the oldest are dropped past this. */
export const MAX_QUEUE = 200;
/** Actions older than this are dropped instead of sent. Yesterday's lamp tap shouldn't fire today. */
export const MAX_AGE_MS = 30 * 60 * 1000;
const MAX_BACKOFF_MS = 60 * 1000;

let counter = 0;
export function newId(now: number): string {
  counter = (counter + 1) % 1_000_000;
  return `${now.toString(36)}-${counter.toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Wait before the next try: 1s, 2s, 4s ... up to a minute. */
export function backoffMs(attempts: number): number {
  return Math.min(1000 * 2 ** Math.max(0, attempts - 1), MAX_BACKOFF_MS);
}

/** Adds an action to the end of the queue, replacing any older one with the same key. */
export function enqueue(
  queue: QueuedAction[],
  action: OutboundAction,
  now: number,
  coalesceKey?: string,
): QueuedAction[] {
  const item: QueuedAction = {
    id: newId(now),
    action,
    createdAt: now,
    attempts: 0,
    nextAttemptAt: now,
    coalesceKey,
  };
  const kept = coalesceKey ? queue.filter((q) => q.coalesceKey !== coalesceKey) : queue;
  return [...kept, item].slice(-MAX_QUEUE);
}

/** Drops actions too old to still make sense. */
export function dropStale(queue: QueuedAction[], now: number): QueuedAction[] {
  return queue.filter((q) => now - q.createdAt <= MAX_AGE_MS);
}

/** Records a failed try and schedules the next one. */
export function markFailed(queue: QueuedAction[], id: string, now: number): QueuedAction[] {
  return queue.map((q) => {
    if (q.id !== id) return q;
    const attempts = q.attempts + 1;
    return { ...q, attempts, nextAttemptAt: now + backoffMs(attempts) };
  });
}

export function removeById(queue: QueuedAction[], id: string): QueuedAction[] {
  return queue.filter((q) => q.id !== id);
}

/** How long until the first action may be retried (0 if now). */
export function msUntilNextAttempt(queue: QueuedAction[], now: number): number | null {
  if (queue.length === 0) return null;
  return Math.max(0, queue[0].nextAttemptAt - now);
}

export interface FlushResult {
  sent: number;
  dropped: number;
  /** True if it stopped early because a send failed. */
  failed: boolean;
}

export interface QueueAccess {
  read: () => QueuedAction[];
  write: (queue: QueuedAction[]) => void;
}

/**
 * Sends queued actions oldest first, one at a time, removing each once it's
 * delivered. Stops at the first failure so the house sees actions in the
 * order they happened. Reads the queue fresh after every send, so actions
 * added mid-flush are kept and sent too.
 */
export async function flush(
  access: QueueAccess,
  send: (action: OutboundAction) => Promise<void>,
  now: () => number = Date.now,
): Promise<FlushResult> {
  const before = access.read();
  const fresh = dropStale(before, now());
  const dropped = before.length - fresh.length;
  if (dropped) access.write(fresh);

  let sent = 0;
  for (;;) {
    const next = access.read()[0];
    if (!next || next.nextAttemptAt > now()) return { sent, dropped, failed: false };
    try {
      await send(next.action);
    } catch {
      access.write(markFailed(access.read(), next.id, now()));
      return { sent, dropped, failed: true };
    }
    access.write(removeById(access.read(), next.id));
    sent++;
  }
}
