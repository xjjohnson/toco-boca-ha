import { GAME_EVENT, type GameReaction } from '@/ha/inbound';
import { StubTransport } from '@/ha/stubTransport';
import type { OutboundAction } from '@/ha/types';
import { enqueue, type QueuedAction } from '@/sync/queue';
import { SyncManager } from '@/sync/syncManager';

const action = (n: number): OutboundAction => ({ kind: 'fireEvent', eventType: 'test', data: { n } });

function setup() {
  let items: QueuedAction[] = [];
  let now = 1000;
  const timers: { fn: () => void; at: number }[] = [];
  const reactions: GameReaction[] = [];
  const connection: Record<string, unknown> = {};
  const transport = new StubTransport();
  const manager = new SyncManager({
    transport,
    queue: { read: () => items, write: (q) => (items = q) },
    onReaction: (r) => reactions.push(r),
    onConnection: (s) => Object.assign(connection, s),
    now: () => now,
    setTimer: (fn, ms) => {
      const t = { fn, at: now + ms };
      timers.push(t);
      return t;
    },
    clearTimer: (t) => timers.splice(timers.indexOf(t as (typeof timers)[0]), 1),
  });
  const start = () => {
    const stop = manager.start();
    manager.setOnline(true);
    return stop;
  };
  return {
    start,
    transport,
    manager,
    reactions,
    connection,
    queue: () => items,
    add: (a: OutboundAction) => {
      items = enqueue(items, a, now);
      manager.notifyQueued();
    },
    /** Moves the clock forward and runs any timers that came due. */
    advance: async (ms: number) => {
      now += ms;
      for (const t of timers.filter((t) => t.at <= now)) {
        timers.splice(timers.indexOf(t), 1);
        t.fn();
      }
      await new Promise((r) => setTimeout(r, 0));
    },
    settle: () => new Promise((r) => setTimeout(r, 0)),
  };
}

describe('SyncManager', () => {
  it('connects on start and sends queued actions right away', async () => {
    const t = setup();
    t.start();
    await t.settle();
    expect(t.connection).toMatchObject({ online: true, ha: 'connected' });
    t.add(action(1));
    await t.settle();
    expect(t.transport.received).toEqual([action(1)]);
    expect(t.queue()).toEqual([]);
  });

  it('holds actions while offline and sends them in order when back online', async () => {
    const t = setup();
    t.start();
    await t.settle();
    t.manager.setOnline(false);
    t.add(action(1));
    t.add(action(2));
    await t.settle();
    expect(t.transport.received).toEqual([]);
    expect(t.queue()).toHaveLength(2);
    expect(t.connection.online).toBe(false);

    t.manager.setOnline(true);
    await t.settle();
    expect(t.transport.received).toEqual([action(1), action(2)]);
    expect(t.queue()).toEqual([]);
  });

  it('keeps retrying while the house is unreachable, then catches up', async () => {
    const t = setup();
    t.transport.setReachable(false);
    t.start();
    await t.settle();
    t.add(action(1));
    await t.settle();
    expect(t.connection.ha).toBe('disconnected');
    await t.advance(1000);
    await t.advance(2000);
    expect(t.transport.received).toEqual([]);

    t.transport.reachable = true;
    await t.advance(60_000);
    expect(t.connection.ha).toBe('connected');
    expect(t.transport.received).toEqual([action(1)]);
  });

  it('turns house events into game reactions and ignores the rest', async () => {
    const t = setup();
    t.start();
    await t.settle();
    t.transport.emit({ eventType: GAME_EVENT, data: { reaction: 'night' } });
    t.transport.emit({ eventType: 'state_changed', data: {} });
    expect(t.reactions).toEqual([{ kind: 'setTimeOfDay', value: 'night' }]);
  });

  it('sends nothing until the network has reported online', async () => {
    const t = setup();
    t.manager.start();
    t.add(action(1));
    await t.settle();
    expect(t.transport.received).toEqual([]);
    expect(t.connection.online).toBe(false);
    t.manager.setOnline(true);
    await t.settle();
    expect(t.transport.received).toEqual([action(1)]);
  });

  it('stops cleanly', async () => {
    const t = setup();
    const stop = t.start();
    await t.settle();
    stop();
    expect(t.transport.getStatus()).toBe('disconnected');
  });
});

describe('SyncManager.setTransport', () => {
  it('moves the queue over to the new connection', async () => {
    const t = setup();
    t.start();
    await t.settle();
    t.manager.setOnline(false);
    t.add(action(1));
    const next = new StubTransport();
    t.manager.setTransport(next);
    expect(t.transport.getStatus()).toBe('disconnected');
    t.manager.setOnline(true);
    await t.settle();
    expect(next.received).toEqual([action(1)]);
    expect(t.transport.received).toEqual([]);
  });
});
