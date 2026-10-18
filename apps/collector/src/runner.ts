// 수집 반복 실행: 매 슬롯(기본 1분 정각) 수집, 연속 실패 알림, 매일 일 집계

import { FailureTracker, type Alerter } from './alert.ts';
import type { Collector } from './collector.ts';
import type { Logger } from './log.ts';
import { kstDay, previousKstDay } from './metrics.ts';
import type { Store } from './store/types.ts';

/** 일 집계는 한국 시간 0시 10분 이후에 전날 것을 돌린다 (0시 직전 슬롯이 다 저장될 여유) */
const DAILY_AFTER_MINUTES = 10;

/** now 이후 첫 슬롯 시각. 주기가 60초면 매분 0초 */
export function nextSlot(now: number, intervalSec: number): Date {
  const ms = intervalSec * 1000;
  return new Date(Math.floor(now / ms) * ms + ms);
}

export interface RunnerOptions {
  collector: Collector;
  store: Store;
  alerter: Alerter;
  log: Logger;
  alertAfterFailures: number;
  downsampleAfterDays: number;
}

export class Runner {
  private readonly opts: RunnerOptions;
  private readonly tracker: FailureTracker;
  private lastDailyFor: string | null = null;

  constructor(opts: RunnerOptions) {
    this.opts = opts;
    this.tracker = new FailureTracker(opts.alertAfterFailures);
  }

  async run(signal: AbortSignal): Promise<void> {
    const { collector, log } = this.opts;
    const intervalSec = collector.adapter.intervalSec;
    let slot = nextSlot(Date.now(), intervalSec);
    log.info(`수집 시작: ${collector.adapter.platform}, ${intervalSec}초 주기, 방송 중 ${collector.open.size}개 복원, 첫 슬롯 ${slot.toISOString()}`);

    while (!signal.aborted) {
      await sleepUntil(slot.getTime(), signal);
      if (signal.aborted) break;

      const result = await collector.tick(slot);
      if (result.ok) {
        log.info(`${slot.toISOString()} 라이브 ${result.liveCount}개, 시작 ${result.started}, 종료 ${result.ended}, 방송 중 ${collector.open.size}`);
      } else {
        log.error(`${slot.toISOString()} 수집 실패 (연속 ${this.tracker.failures + 1}회): ${result.error}`);
      }
      await this.alertIfNeeded(result.ok, result.error);
      await this.maintenance(new Date());

      // 수집이 주기보다 오래 걸리면 지난 슬롯은 건너뛴다 (그 슬롯은 빈 값으로 남는다)
      let next = new Date(slot.getTime() + intervalSec * 1000);
      if (Date.now() >= next.getTime()) {
        const resumed = nextSlot(Date.now(), intervalSec);
        const skipped = Math.round((resumed.getTime() - next.getTime()) / (intervalSec * 1000));
        log.warn(`수집이 주기를 넘겨 슬롯 ${skipped}개를 건너뜁니다`);
        next = resumed;
      }
      slot = next;
    }
    log.info('수집 종료');
  }

  private async alertIfNeeded(ok: boolean, error?: string): Promise<void> {
    const { alerter, collector } = this.opts;
    const kind = this.tracker.record(ok);
    if (kind === 'failing') {
      await alerter.send(`⚠️ ${collector.adapter.platform} 수집이 연속 ${this.tracker.failures}회 실패했습니다. 이 구간은 빈 값으로 남습니다.\n마지막 오류: ${error ?? '알 수 없음'}`);
    } else if (kind === 'recovered') {
      await alerter.send(`✅ ${collector.adapter.platform} 수집이 복구됐습니다.`);
    }
  }

  /** 하루 한 번: 전날 일 집계 + 오래된 스냅샷 줄이기. 실패하면 다음 슬롯에 다시 시도한다 */
  async maintenance(now: Date): Promise<void> {
    const { store, log, downsampleAfterDays } = this.opts;
    const today = kstDay(now);
    if (this.lastDailyFor === today) return;
    const kstMinutes = Math.floor(((now.getTime() + 9 * 3600_000) % 86_400_000) / 60_000);
    if (kstMinutes < DAILY_AFTER_MINUTES) return;
    try {
      const day = previousKstDay(today);
      const channels = await store.refreshDaily(day);
      const before = new Date(now.getTime() - downsampleAfterDays * 86_400_000);
      const reduced = await store.downsample(before);
      log.info(`일 집계 ${day}: 채널 ${channels}개, 스냅샷 줄이기 ${reduced}행 (${before.toISOString()} 이전)`);
      this.lastDailyFor = today;
    } catch (err) {
      log.error(`일 집계 실패, 다음 슬롯에 다시 시도: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

function sleepUntil(at: number, signal: AbortSignal): Promise<void> {
  const ms = Math.max(0, at - Date.now());
  return new Promise((resolve) => {
    const timer = setTimeout(done, ms);
    signal.addEventListener('abort', done, { once: true });
    function done() {
      clearTimeout(timer);
      signal.removeEventListener('abort', done);
      resolve();
    }
  });
}
