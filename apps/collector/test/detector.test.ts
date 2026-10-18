import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { dedupeLives, planTick, resolveStartedAt } from '../src/detector.ts';
import type { LiveItem, OpenStream } from '../src/types.ts';

const T0 = new Date('2026-10-18T12:00:00Z');

function live(channelId: string, viewers = 10, liveId: string | null = `${channelId}-1`): LiveItem {
  return { channelId, liveId, channelName: channelId, channelImageUrl: null, title: 't', category: 'c', viewers, openedAt: null };
}

function open(channelId: string, missed = 0, liveId: string | null = `${channelId}-1`): OpenStream {
  return { streamId: 1, channelId, liveId, title: 't', category: 'c', lastSeenAt: T0, missed };
}

const mapOf = (...streams: OpenStream[]) => new Map(streams.map((s) => [s.channelId, s]));

describe('planTick', () => {
  it('직전에 없던 채널은 방송 시작', () => {
    const plan = planTick(new Map(), [live('a')]);
    assert.deepEqual(plan.start.map((l) => l.channelId), ['a']);
    assert.equal(plan.end.length, 0);
  });

  it('계속 보이는 채널은 이어짐', () => {
    const plan = planTick(mapOf(open('a')), [live('a')]);
    assert.equal(plan.continue.length, 1);
    assert.equal(plan.start.length + plan.end.length + plan.missed.length, 0);
  });

  it('1·2회 안 보이면 종료하지 않고 missed만 올린다', () => {
    const p1 = planTick(mapOf(open('a', 0)), []);
    assert.equal(p1.missed[0]?.missed, 1);
    const p2 = planTick(mapOf(open('a', 1)), []);
    assert.equal(p2.missed[0]?.missed, 2);
    assert.equal(p1.end.length + p2.end.length, 0);
  });

  it('연속 3회 안 보이면 종료, 종료 시각은 마지막으로 본 시각', () => {
    const plan = planTick(mapOf(open('a', 2)), []);
    assert.equal(plan.end.length, 1);
    assert.equal(plan.end[0]?.endedAt, T0);
    assert.equal(plan.end[0]?.reason, 'missed');
    assert.equal(plan.missed.length, 0);
  });

  it('2회 안 보였다가 다시 나타나면 같은 방송으로 이어짐', () => {
    const plan = planTick(mapOf(open('a', 2)), [live('a')]);
    assert.equal(plan.continue.length, 1);
    assert.equal(plan.end.length, 0);
  });

  it('liveId가 바뀌면 이전 방송 종료 + 새 방송 시작', () => {
    const plan = planTick(mapOf(open('a')), [live('a', 10, 'a-2')]);
    assert.equal(plan.end[0]?.reason, 'new-live-id');
    assert.equal(plan.start[0]?.liveId, 'a-2');
  });

  it('liveId를 모르면(null) 바뀐 것으로 보지 않는다', () => {
    const plan = planTick(mapOf(open('a', 0, null)), [live('a', 10, 'a-2')]);
    assert.equal(plan.continue.length, 1);
  });

  it('페이지 사이 순위 변동으로 중복된 채널은 한 번만 센다', () => {
    const plan = planTick(new Map(), [live('a', 30), live('b'), live('a', 29)]);
    assert.equal(plan.start.length, 2);
    assert.equal(plan.start[0]?.viewers, 30);
    assert.equal(dedupeLives([live('x'), live('x')]).length, 1);
  });
});

describe('resolveStartedAt', () => {
  const slot = new Date('2026-10-18T12:05:00Z');
  it('플랫폼 시작 시각이 슬롯보다 이르면 그 값을 쓴다', () => {
    const opened = new Date('2026-10-18T11:00:00Z');
    assert.equal(resolveStartedAt(opened, slot), opened);
  });
  it('모르거나 슬롯보다 늦으면 슬롯 시각', () => {
    assert.equal(resolveStartedAt(null, slot), slot);
    assert.equal(resolveStartedAt(new Date('2026-10-18T12:05:30Z'), slot), slot);
    assert.equal(resolveStartedAt(new Date('invalid'), slot), slot);
  });
});
