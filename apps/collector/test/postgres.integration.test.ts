// Postgres 통합 테스트: 마이그레이션 SQL과 PostgresStore가 메모리 저장소와 같은 결과를 내는지 확인한다.
// TEST_DATABASE_URL이 있을 때만 돈다. 그 DB의 public 스키마를 지우고 새로 만드므로 반드시 빈 테스트용 DB를 쓴다.
//   예) TEST_DATABASE_URL=postgres://postgres@localhost:5432/wagle_test pnpm test

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, before, describe, it } from 'node:test';
import postgres from 'postgres';
import { SCENARIO_START } from '../src/mock/scenario.ts';
import { simulate } from '../src/mock/simulate.ts';
import { MemoryStore } from '../src/store/memory.ts';
import { PostgresStore } from '../src/store/postgres.ts';

const url = process.env.TEST_DATABASE_URL;
const migration = readFileSync(new URL('../../../supabase/migrations/20261018000000_init.sql', import.meta.url), 'utf8');

describe('Postgres 저장소 + 마이그레이션', { skip: !url && 'TEST_DATABASE_URL 없음' }, () => {
  const sql = postgres(url ?? '', { onnotice: () => {} });
  const mem = new MemoryStore();
  let store: PostgresStore;

  before(async () => {
    await sql.unsafe(`
      drop schema if exists public cascade;
      create schema public;
      do $$ begin
        if not exists (select from pg_roles where rolname = 'anon') then create role anon nologin; end if;
        if not exists (select from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
      end $$;`);
    await sql.unsafe(migration);
    store = new PostgresStore(url!);
    await store.checkSchema();
    await simulate({ store, restartBeforeTick: 8 });
    await simulate({ store: mem, restartBeforeTick: 8 });
  });

  after(async () => {
    await store?.close();
    await sql.end();
  });

  it('방송(streams)과 지표가 메모리 저장소와 같다', async () => {
    const rows = await sql<{ platform_id: string; platform_live_id: string; started_at: Date; ended_at: Date | null; peak_viewers: number | null; avg_viewers: number | null; viewer_hours: string | null; snaps: string }[]>`
      select c.platform_id, s.platform_live_id, s.started_at, s.ended_at, s.peak_viewers, s.avg_viewers, s.viewer_hours,
             (select count(*) from snapshots sn where sn.stream_id = s.id) as snaps
        from streams s join channels c on c.id = s.channel_id
       order by c.platform_id, s.started_at`;
    const expected = mem.streams
      .map((s) => ({
        platform_id: mem.channels.find((c) => c.id === s.channelId)!.platformId,
        platform_live_id: s.platformLiveId,
        started_at: s.startedAt.toISOString(),
        ended_at: s.endedAt?.toISOString() ?? null,
        peak_viewers: s.peakViewers,
        avg_viewers: s.avgViewers,
        viewer_hours: s.viewerHours,
        snaps: mem.snapshots.filter((sn) => sn.streamId === s.id).length,
      }))
      .sort((a, b) => a.platform_id.localeCompare(b.platform_id) || a.started_at.localeCompare(b.started_at));
    const actual = rows.map((r) => ({
      platform_id: r.platform_id,
      platform_live_id: r.platform_live_id,
      started_at: r.started_at.toISOString(),
      ended_at: r.ended_at?.toISOString() ?? null,
      peak_viewers: r.peak_viewers,
      avg_viewers: r.avg_viewers,
      viewer_hours: r.viewer_hours === null ? null : Number(r.viewer_hours),
      snaps: Number(r.snaps),
    }));
    assert.deepEqual(actual, expected);
  });

  it('일 집계 SQL 함수가 TypeScript 계산과 같다', async () => {
    const rows = await sql<{ platform_id: string; day: string; minutes_live: number; avg_viewers: number; peak_viewers: number; viewer_hours: string }[]>`
      select c.platform_id, d.day::text as day, d.minutes_live, d.avg_viewers, d.peak_viewers, d.viewer_hours
        from daily_channel_stats d join channels c on c.id = d.channel_id
       order by c.platform_id, d.day`;
    const expected = mem.daily
      .map((d) => ({
        platform_id: mem.channels.find((c) => c.id === d.channelId)!.platformId,
        day: d.day,
        minutes_live: d.minutesLive,
        avg_viewers: d.avgViewers,
        peak_viewers: d.peakViewers,
        viewer_hours: d.viewerHours,
      }))
      .sort((a, b) => a.platform_id.localeCompare(b.platform_id) || a.day.localeCompare(b.day));
    assert.deepEqual(rows.map((r) => ({ ...r, viewer_hours: Number(r.viewer_hours) })), expected);
  });

  it('실패 슬롯은 collector_runs에 기록되고 스냅샷이 없다', async () => {
    const failed = await sql`select slot_at, error, source from collector_runs where not ok`;
    assert.equal(failed.length, 1);
    assert.match(failed[0]!.error, /500/);
    const snaps = await sql`select count(*)::int as n from snapshots where captured_at = ${failed[0]!.slot_at}`;
    assert.equal(snaps[0]!.n, 0);
  });

  it('재시작하면 방송 중 상태를 DB에서 복원한다', async () => {
    const open = await store.loadOpenStreams('chzzk');
    assert.deepEqual(open.map((s) => s.channelId).filter((id) => !id.startsWith('mock-filler')).sort(), ['mock-b', 'mock-c', 'mock-d']);
    assert.equal(open.find((s) => s.channelId === 'mock-c')?.liveId, '3002');
  });

  it('채널당 방송 중 행은 하나만 (부분 unique 인덱스)', async () => {
    const ch = await sql`select id from channels where platform_id = 'mock-b'`;
    await assert.rejects(sql`insert into streams (channel_id, started_at) values (${ch[0]!.id}, now())`, /streams_one_open_per_channel/);
  });

  it('스냅샷 줄이기 함수: 10분 정각만 남기고 interval_sec = 600', async () => {
    await sql`select downsample_snapshots(${new Date(SCENARIO_START.getTime() + 3600_000)})`;
    const rows = await sql`select distinct extract(minute from captured_at)::int % 10 as m, interval_sec from snapshots`;
    assert.deepEqual(rows.map((r) => [r.m, r.interval_sec]), [[0, 600]]);
  });

  it('anon(공개 REST)은 통계를 읽을 수만 있고 쓸 수 없다', async () => {
    // 이 트랜잭션에서만 Supabase가 기본으로 주는 테이블 권한을 흉내 내고, RLS 정책만 검사한다 (끝나면 롤백)
    const checks: number[] = [];
    await assert.rejects(
      sql.begin(async (tx) => {
        await tx`grant usage on schema public to anon`;
        await tx`grant select, insert on channels, collector_runs to anon`;
        await tx`grant usage on all sequences in schema public to anon`;
        await tx`set local role anon`;
        checks.push((await tx`select count(*)::int as n from channels`)[0]!.n);
        checks.push((await tx`select count(*)::int as n from collector_runs`)[0]!.n);
        await tx`insert into channels (platform, platform_id, name) values ('chzzk', 'x', 'x')`;
      }),
      /row-level security/,
    );
    assert.ok(checks[0]! > 0, '통계 테이블은 읽힌다');
    assert.equal(checks[1], 0, 'collector_runs는 정책이 없어 보이지 않는다');
  });
});
