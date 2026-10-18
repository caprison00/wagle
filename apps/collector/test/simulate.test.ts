// 모의 시나리오 전체 흐름 검증 (src/mock/scenario.ts의 시나리오 설명 참고)

import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { SCENARIO_START, FILLER_CHANNELS } from '../src/mock/scenario.ts';
import { simulate } from '../src/mock/simulate.ts';
import { MemoryStore } from '../src/store/memory.ts';

const slot = (t: number) => new Date(SCENARIO_START.getTime() + t * 60_000);

describe('모의 시나리오 (메모리 저장소)', () => {
  const store = new MemoryStore();
  const streamsOf = (platformId: string) => {
    const ch = store.channels.find((c) => c.platformId === platformId)!;
    return store.streams.filter((s) => s.channelId === ch.id);
  };
  const snapsOf = (streamId: number) => store.snapshots.filter((s) => s.streamId === streamId);

  before(async () => {
    await simulate({ store, restartBeforeTick: 8 });
  });

  it('A: 연속 3회 안 보여 종료, 종료 시각은 마지막으로 본 슬롯, 지표 계산', () => {
    const [a] = streamsOf('mock-a');
    assert.equal(a!.endedAt?.toISOString(), slot(8).toISOString());
    // 0,1,2,4~8 슬롯 (3슬롯은 수집 실패라 빈 값)
    assert.equal(snapsOf(a!.id).length, 8);
    assert.equal(a!.peakViewers, 180);
    assert.equal(a!.avgViewers, 141); // 1130 / 8
    assert.equal(a!.viewerHours, 18.833); // 1130명·분 / 60
  });

  it('B: 2회만 안 보이면 같은 방송으로 이어지고, 빈 슬롯에는 스냅샷이 없다', () => {
    const streams = streamsOf('mock-b');
    assert.equal(streams.length, 1);
    assert.equal(streams[0]!.endedAt, null);
    const times = snapsOf(streams[0]!.id).map((s) => s.capturedAt.getTime());
    for (const t of [3, 5, 6]) assert.ok(!times.includes(slot(t).getTime()), `${t}슬롯은 빈 값이어야 함`);
    assert.equal(times.length, 13);
  });

  it('C: liveId가 바뀌면 방송 2개로 나뉜다', () => {
    const [c1, c2] = streamsOf('mock-c');
    assert.equal(c1!.platformLiveId, '3001');
    assert.equal(c1!.endedAt?.toISOString(), slot(6).toISOString());
    assert.equal(c2!.platformLiveId, '3002');
    assert.equal(c2!.endedAt, null);
    assert.ok(c2!.startedAt >= c1!.endedAt!);
  });

  it('D: 새로 나타난 채널은 방송 시작, 시작 시각은 openDate', () => {
    const [d] = streamsOf('mock-d');
    assert.equal(d!.startedAt.toISOString(), new Date(slot(10).getTime() - 30_000).toISOString());
  });

  it('API 장애 슬롯: 저장 없음, 실패 기록만 남김', () => {
    assert.equal(store.snapshots.filter((s) => s.capturedAt.getTime() === slot(3).getTime()).length, 0);
    const run = store.runs.find((r) => r.slotAt.getTime() === slot(3).getTime());
    assert.equal(run?.ok, false);
    assert.match(run!.error!, /500/);
  });

  it('페이지를 끝까지 넘겨 채움 채널까지 전부 수집', () => {
    assert.equal(store.channels.length, 4 + FILLER_CHANNELS);
    assert.equal(store.runs.find((r) => r.ok)?.pageCount, 3);
  });

  it('일 집계는 한국 날짜로 나뉜다 (23:50~23:59 / 00:00~00:05)', () => {
    const b = store.channels.find((c) => c.platformId === 'mock-b')!;
    const days = store.daily.filter((d) => d.channelId === b.id).sort((x, y) => x.day.localeCompare(y.day));
    assert.deepEqual(days.map((d) => [d.day, d.minutesLive]), [['2026-10-18', 7], ['2026-10-19', 6]]);
    assert.equal(days[0]!.viewerHours, 58.333);
  });

  it('스냅샷 줄이기: 10분 정각만 남기고 간격을 600초로', async () => {
    const s2 = new MemoryStore();
    await simulate({ store: s2 });
    await s2.downsample(new Date(SCENARIO_START.getTime() + 60 * 60_000));
    assert.ok(s2.snapshots.length > 0);
    assert.ok(s2.snapshots.every((s) => s.capturedAt.getUTCMinutes() % 10 === 0 && s.intervalSec === 600));
  });
});
