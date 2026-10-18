// Postgres(Supabase) 저장소

import postgres from 'postgres';
import { resolveStartedAt } from '../detector.ts';
import { computeStreamMetrics } from '../metrics.ts';
import type { OpenStream, Platform } from '../types.ts';
import type { RunRecord, Store, TickWrite } from './types.ts';

// 아래 types 옵션으로 bigint를 number로 받지만, 타입 정의는 기본형을 쓴다 (postgres.js 헬퍼 타입과 충돌 방지)
type Sql = postgres.Sql;

/** 수집기가 하나만 돌게 하는 advisory lock 번호 (임의의 고정값) */
const SINGLE_INSTANCE_LOCK = 7_240_918;
/** 한 번에 넣는 스냅샷 행 수 (Postgres 파라미터 한도 65,535 ÷ 5열 아래로) */
const SNAPSHOT_CHUNK = 5000;

export class PostgresStore implements Store {
  private readonly sql: Sql;
  /** 채널 id 캐시: 이름·이미지가 그대로면 매분 upsert하지 않는다 */
  private readonly channelCache = new Map<string, { id: number; name: string; imageUrl: string | null }>();

  constructor(databaseUrl: string) {
    this.sql = postgres(databaseUrl, {
      max: 3,
      // Supabase 연결 풀러(트랜잭션 모드)에서도 동작하도록 prepared statement를 끈다
      prepare: false,
      onnotice: () => {},
      // bigint(id)를 숫자로 받는다. 2^53까지 안전하다
      types: {
        bigint: { to: 20, from: [20], serialize: (x: number) => String(x), parse: (x: string) => Number(x) },
      },
    }) as unknown as Sql;
  }

  /** 테이블이 있는지 확인. 마이그레이션을 안 했으면 알아보기 쉬운 오류를 낸다 */
  async checkSchema(): Promise<void> {
    const [row] = await this.sql<{ ok: boolean }[]>`
      select to_regclass('public.snapshots') is not null and to_regclass('public.collector_runs') is not null as ok`;
    if (!row?.ok) {
      throw new Error('DB에 와글 테이블이 없습니다. supabase/migrations의 SQL을 먼저 실행하세요 (apps/collector/README.md 참고)');
    }
  }

  /**
   * 수집기가 동시에 두 개 돌지 않게 잠근다. 배포가 겹치는 동안 새 수집기는 이전 것이 끝날 때까지 기다린다.
   * 잠금은 전용 연결에 걸리므로 프로세스가 끝나면 자동으로 풀린다.
   */
  async acquireSingleInstanceLock(onWait: () => void, signal?: AbortSignal): Promise<void> {
    const conn = await this.sql.reserve();
    for (;;) {
      const [row] = await conn<{ locked: boolean }[]>`select pg_try_advisory_lock(${SINGLE_INSTANCE_LOCK}) as locked`;
      if (row?.locked) return;
      if (signal?.aborted) throw new Error('중단됨');
      onWait();
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  async loadOpenStreams(platform: Platform): Promise<OpenStream[]> {
    const rows = await this.sql<
      { id: number; platform_id: string; platform_live_id: string | null; title: string | null; category: string | null; last_seen: Date }[]
    >`
      select s.id, c.platform_id, s.platform_live_id, s.title, s.category,
             coalesce((select max(sn.captured_at) from snapshots sn where sn.stream_id = s.id), s.started_at) as last_seen
        from streams s
        join channels c on c.id = s.channel_id
       where s.ended_at is null and c.platform = ${platform}`;
    return rows.map((r) => ({
      streamId: r.id,
      channelId: r.platform_id,
      liveId: r.platform_live_id,
      title: r.title,
      category: r.category,
      lastSeenAt: r.last_seen,
      missed: 0,
    }));
  }

  async applyTick({ platform, slotAt, intervalSec, plan }: TickWrite): Promise<Map<string, number>> {
    const lives = [...plan.start, ...plan.continue.map((c) => c.live)];
    const cacheUpdates: [string, { id: number; name: string; imageUrl: string | null }][] = [];

    // 행 객체의 키가 곧 열 이름이다 (tx(rows) 헬퍼)
    const started = await this.sql.begin(async (tx) => {
      // 1. 종료: 스냅샷으로 방송 지표 계산 (먼저 닫아야 같은 채널의 새 방송을 열 수 있다)
      for (const { stream, endedAt } of plan.end) {
        const snaps = await tx<{ viewers: number; interval_sec: number }[]>`
          select viewers, interval_sec from snapshots where stream_id = ${stream.streamId}`;
        const m = computeStreamMetrics(snaps.map((s) => ({ viewers: s.viewers, intervalSec: s.interval_sec })));
        await tx`
          update streams
             set ended_at = ${endedAt}, peak_viewers = ${m.peakViewers}, avg_viewers = ${m.avgViewers}, viewer_hours = ${m.viewerHours}
           where id = ${stream.streamId} and ended_at is null`;
      }

      // 2. 채널: 처음 보거나 이름·이미지가 바뀐 채널만 upsert
      const channelIds = new Map<string, number>();
      const upserts = new Map<string, { platform: Platform; platform_id: string; name: string; image_url: string | null }>();
      for (const live of lives) {
        const cached = this.channelCache.get(live.channelId);
        if (cached && cached.name === live.channelName && cached.imageUrl === live.channelImageUrl) {
          channelIds.set(live.channelId, cached.id);
        } else {
          upserts.set(live.channelId, { platform, platform_id: live.channelId, name: live.channelName, image_url: live.channelImageUrl });
        }
      }
      if (upserts.size > 0) {
        const rows = await tx<{ id: number; platform_id: string; name: string; image_url: string | null }[]>`
          insert into channels ${tx([...upserts.values()])}
          on conflict (platform, platform_id) do update
             set name = excluded.name, image_url = excluded.image_url, updated_at = now()
          returning id, platform_id, name, image_url`;
        for (const r of rows) {
          channelIds.set(r.platform_id, r.id);
          cacheUpdates.push([r.platform_id, { id: r.id, name: r.name, imageUrl: r.image_url }]);
        }
      }

      // 3. 시작
      const started = new Map<string, number>();
      if (plan.start.length > 0) {
        const rows = await tx<{ id: number; channel_id: number }[]>`
          insert into streams ${tx(
            plan.start.map((live) => ({
              channel_id: channelIds.get(live.channelId)!,
              platform_live_id: live.liveId,
              started_at: resolveStartedAt(live.openedAt, slotAt),
              title: live.title,
              category: live.category,
            })),
          )}
          returning id, channel_id`;
        const byChannelRow = new Map(rows.map((r) => [r.channel_id, r.id]));
        for (const live of plan.start) started.set(live.channelId, byChannelRow.get(channelIds.get(live.channelId)!)!);
      }

      // 4. 제목·카테고리가 바뀐 방송만 갱신 (매분 전체 update를 피한다)
      for (const { stream, live } of plan.continue) {
        if (stream.title === live.title && stream.category === live.category) continue;
        await tx`update streams set title = ${live.title}, category = ${live.category} where id = ${stream.streamId}`;
      }

      // 5. 스냅샷
      const streamIds = new Map([...plan.continue.map((c) => [c.live.channelId, c.stream.streamId] as const), ...started]);
      const snapRows = lives.map((live) => ({
        stream_id: streamIds.get(live.channelId)!,
        captured_at: slotAt,
        viewers: live.viewers,
        category: live.category,
        interval_sec: intervalSec,
      }));
      for (let i = 0; i < snapRows.length; i += SNAPSHOT_CHUNK) {
        await tx`
          insert into snapshots ${tx(snapRows.slice(i, i + SNAPSHOT_CHUNK))}
          on conflict do nothing`;
      }
      return started;
    });

    // 트랜잭션이 성공한 뒤에만 캐시를 바꾼다
    for (const [key, value] of cacheUpdates) this.channelCache.set(key, value);
    return started;
  }

  async recordRun(run: RunRecord): Promise<void> {
    await this.sql`
      insert into collector_runs (platform, slot_at, started_at, finished_at, ok, source, live_count, page_count, error)
      values (${run.platform}, ${run.slotAt}, ${run.startedAt}, ${run.finishedAt}, ${run.ok}, ${run.source},
              ${run.liveCount}, ${run.pageCount}, ${run.error})
      on conflict (platform, slot_at) do update
         set started_at = excluded.started_at, finished_at = excluded.finished_at, ok = excluded.ok,
             live_count = excluded.live_count, page_count = excluded.page_count, error = excluded.error`;
  }

  async refreshDaily(day: string): Promise<number> {
    const [row] = await this.sql<{ n: number }[]>`select refresh_daily_channel_stats(${day}::date) as n`;
    return row?.n ?? 0;
  }

  async downsample(before: Date): Promise<number> {
    const [row] = await this.sql<{ n: number }[]>`select downsample_snapshots(${before}) as n`;
    return row?.n ?? 0;
  }

  async close(): Promise<void> {
    await this.sql.end({ timeout: 5 });
  }
}
