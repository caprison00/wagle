import type { TickPlan } from '../detector.ts';
import type { OpenStream, Platform } from '../types.ts';

export interface TickWrite {
  platform: Platform;
  slotAt: Date;
  intervalSec: number;
  plan: TickPlan;
}

export interface RunRecord {
  platform: Platform;
  slotAt: Date;
  startedAt: Date;
  finishedAt: Date;
  ok: boolean;
  source: string;
  liveCount: number | null;
  pageCount: number | null;
  error: string | null;
}

/**
 * 저장소. Postgres(운영)와 메모리(모의 모드·테스트) 두 가지가 같은 규칙으로 동작한다.
 */
export interface Store {
  /** 수집기 재시작 시 "방송 중" 상태 복원 */
  loadOpenStreams(platform: Platform): Promise<OpenStream[]>;
  /**
   * 한 슬롯의 결과를 한 번에(트랜잭션으로) 쓴다: 종료 → 채널 upsert → 시작 → 스냅샷.
   * 새로 연 방송의 stream id를 채널 ID별로 돌려준다.
   */
  applyTick(write: TickWrite): Promise<Map<string, number>>;
  recordRun(run: RunRecord): Promise<void>;
  /** 한국 날짜 하루치 daily_channel_stats 재계산. 갱신한 채널 수를 돌려준다 */
  refreshDaily(day: string): Promise<number>;
  /** before 이전 스냅샷을 10분 간격으로 줄인다 */
  downsample(before: Date): Promise<number>;
  close(): Promise<void>;
}
