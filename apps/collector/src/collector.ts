// 한 슬롯 수집: 공식 API로 라이브 목록 받기 → 시작·종료 감지 → 저장

import { END_AFTER_MISSES, planTick } from './detector.ts';
import type { Store } from './store/types.ts';
import type { OpenStream, PlatformAdapter } from './types.ts';

export interface TickResult {
  ok: boolean;
  liveCount: number;
  started: number;
  ended: number;
  error?: string;
}

export interface CollectorOptions {
  adapter: PlatformAdapter;
  store: Store;
  /** 이 시청자 수 미만 방송은 수집하지 않는다 (0 = 전부) */
  minViewers?: number;
}

export class Collector {
  readonly adapter: PlatformAdapter;
  private readonly store: Store;
  private readonly minViewers: number;
  /** 방송 중 상태. key = 플랫폼 채널 ID */
  readonly open = new Map<string, OpenStream>();

  constructor(opts: CollectorOptions) {
    this.adapter = opts.adapter;
    this.store = opts.store;
    this.minViewers = opts.minViewers ?? 0;
  }

  async init(): Promise<void> {
    this.open.clear();
    for (const s of await this.store.loadOpenStreams(this.adapter.platform)) this.open.set(s.channelId, s);
  }

  /**
   * 실패하면 상태를 바꾸지 않는다. 실패 슬롯은 스냅샷이 없는 "빈 값"으로 남고,
   * "안 보임" 횟수도 올리지 않는다 (수집 실패를 방송 종료로 착각하지 않기 위해).
   */
  async tick(slotAt: Date): Promise<TickResult> {
    const startedAt = new Date();
    const { platform, intervalSec, source } = this.adapter;
    let pageCount: number | null = null;
    let liveCount: number | null = null;
    try {
      const fetched = await this.adapter.fetchLives();
      pageCount = fetched.pageCount;
      liveCount = fetched.lives.length;
      const lives = this.minViewers > 0 ? fetched.lives.filter((l) => l.viewers >= this.minViewers) : fetched.lives;

      const plan = planTick(this.open, lives, END_AFTER_MISSES);
      const startedIds = await this.store.applyTick({ platform, slotAt, intervalSec, plan });

      // 저장에 성공한 뒤에만 메모리 상태를 바꾼다
      for (const { stream } of plan.end) this.open.delete(stream.channelId);
      for (const s of plan.missed) this.open.set(s.channelId, s);
      for (const { stream, live } of plan.continue) {
        this.open.set(live.channelId, { ...stream, title: live.title, category: live.category, lastSeenAt: slotAt, missed: 0 });
      }
      for (const live of plan.start) {
        this.open.set(live.channelId, {
          streamId: startedIds.get(live.channelId)!,
          channelId: live.channelId,
          liveId: live.liveId,
          title: live.title,
          category: live.category,
          lastSeenAt: slotAt,
          missed: 0,
        });
      }

      await this.safeRecord({ platform, slotAt, startedAt, finishedAt: new Date(), ok: true, source, liveCount, pageCount, error: null });
      return { ok: true, liveCount: lives.length, started: plan.start.length, ended: plan.end.length };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      await this.safeRecord({ platform, slotAt, startedAt, finishedAt: new Date(), ok: false, source, liveCount, pageCount, error });
      return { ok: false, liveCount: 0, started: 0, ended: 0, error };
    }
  }

  /** 실행 기록 저장이 실패해도 수집 자체를 멈추지 않는다 (DB 장애면 다음 슬롯도 실패로 잡힌다) */
  private async safeRecord(run: Parameters<Store['recordRun']>[0]): Promise<void> {
    try {
      await this.store.recordRun(run);
    } catch {
      // 무시
    }
  }
}
