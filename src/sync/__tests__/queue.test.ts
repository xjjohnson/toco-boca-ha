import type { OutboundAction } from '@/ha/types';
import {
  backoffMs,
  dropStale,
  enqueue,
  flush,
  MAX_AGE_MS,
  MAX_QUEUE,
  markFailed,
  msUntilNextAttempt,
  type QueuedAction,
} from '@/sync/queue';

const lamp = (on: boolean): OutboundAction => ({
  kind: 'fireEvent',
  eventType: 'toybox_town_action',
  data: { toy: 'lamp', on },
});
const door: OutboundAction = { kind: 'callService', domain: 'chime', service: 'ring' };

function memory(initial: QueuedAction[] = []) {
  let q = initial;
  return { read: () => q, write: (next: QueuedAction[]) => (q = next) };
}

describe('enqueue', () => {
  it('adds to the end with fresh retry state', () => {
    const q = enqueue(enqueue([], door, 1), lamp(true), 2);
    expect(q.map((i) => i.action)).toEqual([door, lamp(true)]);
    expect(q[1]).toMatchObject({ attempts: 0, createdAt: 2, nextAttemptAt: 2 });
    expect(q[0].id).not.toBe(q[1].id);
  });

  it('keeps only the newest action for a coalesce key, moved to the end', () => {
    let q = enqueue([], lamp(true), 1, 'lamp');
    q = enqueue(q, door, 2);
    q = enqueue(q, lamp(false), 3, 'lamp');
    expect(q.map((i) => i.action)).toEqual([door, lamp(false)]);
  });

  it('drops the oldest past the cap', () => {
    let q: QueuedAction[] = [];
    for (let i = 0; i < MAX_QUEUE + 5; i++) q = enqueue(q, door, i);
    expect(q).toHaveLength(MAX_QUEUE);
    expect(q[0].createdAt).toBe(5);
  });
});

describe('retry timing', () => {
  it('backs off exponentially up to a minute', () => {
    expect([1, 2, 3, 4].map(backoffMs)).toEqual([1000, 2000, 4000, 8000]);
    expect(backoffMs(30)).toBe(60_000);
  });

  it('markFailed counts the try and schedules the next', () => {
    const q = markFailed(enqueue([], door, 0), enqueue([], door, 0)[0].id, 100);
    expect(q[0].attempts).toBe(0); // different id, untouched
    const one = enqueue([], door, 0);
    const failed = markFailed(one, one[0].id, 100);
    expect(failed[0]).toMatchObject({ attempts: 1, nextAttemptAt: 1100 });
    expect(msUntilNextAttempt(failed, 600)).toBe(500);
    expect(msUntilNextAttempt([], 600)).toBeNull();
  });

  it('dropStale removes actions older than the max age', () => {
    const q = enqueue(enqueue([], door, 0), lamp(true), MAX_AGE_MS);
    expect(dropStale(q, MAX_AGE_MS + 1).map((i) => i.action)).toEqual([lamp(true)]);
  });
});

describe('flush', () => {
  it('sends everything in order and empties the queue', async () => {
    const store = memory(enqueue(enqueue([], door, 1), lamp(true), 2));
    const sent: OutboundAction[] = [];
    const result = await flush(store, async (a) => void sent.push(a), () => 10);
    expect(sent).toEqual([door, lamp(true)]);
    expect(store.read()).toEqual([]);
    expect(result).toEqual({ sent: 2, dropped: 0, failed: false });
  });

  it('stops at the first failure, keeping it and everything after', async () => {
    const store = memory(enqueue(enqueue(enqueue([], door, 1), lamp(true), 2), lamp(false), 3));
    let calls = 0;
    const result = await flush(
      store,
      async () => {
        if (++calls === 2) throw new Error('offline');
      },
      () => 10,
    );
    expect(result).toEqual({ sent: 1, dropped: 0, failed: true });
    expect(store.read().map((i) => i.action)).toEqual([lamp(true), lamp(false)]);
    expect(store.read()[0]).toMatchObject({ attempts: 1, nextAttemptAt: 1010 });
  });

  it('waits out the backoff before retrying', async () => {
    const one = enqueue([], door, 0);
    const store = memory(markFailed(one, one[0].id, 0));
    const send = jest.fn(async () => {});
    await flush(store, send, () => 500);
    expect(send).not.toHaveBeenCalled();
    await flush(store, send, () => 1000);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('also sends actions queued while it is flushing', async () => {
    const store = memory(enqueue([], door, 1));
    const sent: OutboundAction[] = [];
    await flush(
      store,
      async (a) => {
        sent.push(a);
        if (a === door) store.write(enqueue(store.read(), lamp(true), 2));
      },
      () => 10,
    );
    expect(sent).toEqual([door, lamp(true)]);
    expect(store.read()).toEqual([]);
  });

  it('drops stale actions instead of sending them', async () => {
    const store = memory(enqueue([], door, 0));
    const send = jest.fn(async () => {});
    const result = await flush(store, send, () => MAX_AGE_MS + 1);
    expect(send).not.toHaveBeenCalled();
    expect(result.dropped).toBe(1);
  });
});
