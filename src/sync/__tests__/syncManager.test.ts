import { GAME_EVENT, type GameReaction } from '@/ha/inbound';
import { StubTransport } from '@/ha/stubTransport';
import { backoffMs, SyncManager } from '@/sync/syncManager';

function setup() {
  let now = 1000;
  const timers: { fn: () => void; at: number }[] = [];
  const reactions: GameReaction[] = [];
  const connection: Record<string, unknown> = {};
  const transport = new StubTransport();
  const manager = new SyncManager({
    transport,
    onReaction: (r) => reactions.push(r),
    toReaction: (e) =>
      e.eventType === GAME_EVENT
        ? { kind: 'setTimeOfDay', value: 'night' }
        : e.data.entity_id === 'input_number.points'
          ? { kind: 'pointsTotal', total: Number(e.data.state) }
          : null,
    onConnection: (s) => Object.assign(connection, s),
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
    timers,
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
  it('connects once the network is up', async () => {
    const t = setup();
    t.start();
    await t.settle();
    expect(t.connection).toMatchObject({ online: true, ha: 'connected' });
  });

  it('turns house events into game reactions and ignores the rest', async () => {
    const t = setup();
    t.start();
    await t.settle();
    t.transport.emit({ eventType: GAME_EVENT, data: { reaction: 'night' } });
    t.transport.emit({ eventType: 'state_changed', data: {} });
    expect(t.reactions).toEqual([{ kind: 'setTimeOfDay', value: 'night' }]);
  });

  it('hears what changed while it was away when it reconnects', async () => {
    const t = setup();
    t.start();
    await t.settle();
    t.manager.setOnline(false);
    t.transport.setEntity('input_number.points', '7');
    expect(t.reactions).toEqual([]);
    t.manager.setOnline(true);
    await t.settle();
    expect(t.reactions).toEqual([{ kind: 'pointsTotal', total: 7 }]);
  });

  it('keeps retrying while the house is unreachable, waiting longer each time', async () => {
    const t = setup();
    t.transport.setReachable(false);
    t.start();
    await t.settle();
    expect(t.connection.ha).toBe('disconnected');
    expect(t.timers).toHaveLength(1);
    await t.advance(1000);
    await t.advance(2000);
    expect(t.connection.ha).toBe('disconnected');

    t.transport.reachable = true;
    await t.advance(60_000);
    expect(t.connection.ha).toBe('connected');
  });

  it('stays quiet until the network has reported online', async () => {
    const t = setup();
    t.manager.start();
    await t.settle();
    expect(t.transport.getStatus()).toBe('disconnected');
    expect(t.connection.online).toBe(false);
  });

  it('stops cleanly', async () => {
    const t = setup();
    const stop = t.start();
    await t.settle();
    stop();
    expect(t.transport.getStatus()).toBe('disconnected');
  });

  it('moves to a new connection', async () => {
    const t = setup();
    t.start();
    await t.settle();
    const next = new StubTransport();
    t.manager.setTransport(next);
    await t.settle();
    expect(t.transport.getStatus()).toBe('disconnected');
    expect(next.getStatus()).toBe('connected');
  });
});

describe('backoffMs', () => {
  it('doubles up to a minute', () => {
    expect([1, 2, 3, 10].map(backoffMs)).toEqual([1000, 2000, 4000, 60_000]);
  });
});
