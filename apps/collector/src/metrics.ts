// 지표 계산 (CLAUDE.md 0절 "지표 정의")
//  - 평균 시청자: 스냅샷 시청자 수 평균
//  - 최고 시청자: 스냅샷 최댓값
//  - 시청 시간: 스냅샷 간격 × 시청자 수의 합, 단위 시청자·시간
// 수집 실패 구간은 스냅샷이 없으므로 평균·합계에서 빠진다(0으로 세지 않는다).
// supabase/migrations의 refresh_daily_channel_stats()와 계산식이 같아야 한다.

import type { SnapshotValue } from './types.ts';

export interface StreamMetrics {
  peakViewers: number | null;
  avgViewers: number | null;
  viewerHours: number | null;
}

export interface DailyStats {
  minutesLive: number;
  avgViewers: number;
  peakViewers: number;
  viewerHours: number;
}

/** 소수 셋째 자리 반올림 (DB numeric(14,3)과 맞춤) */
function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export function computeStreamMetrics(snaps: readonly SnapshotValue[]): StreamMetrics {
  if (snaps.length === 0) return { peakViewers: null, avgViewers: null, viewerHours: null };
  let peak = 0;
  let sum = 0;
  let viewerSeconds = 0;
  for (const s of snaps) {
    if (s.viewers > peak) peak = s.viewers;
    sum += s.viewers;
    viewerSeconds += s.viewers * s.intervalSec;
  }
  return {
    peakViewers: peak,
    avgViewers: Math.round(sum / snaps.length),
    viewerHours: round3(viewerSeconds / 3600),
  };
}

export function computeDailyStats(snaps: readonly SnapshotValue[]): DailyStats | null {
  const m = computeStreamMetrics(snaps);
  if (m.peakViewers === null) return null;
  const seconds = snaps.reduce((acc, s) => acc + s.intervalSec, 0);
  return {
    minutesLive: Math.floor(seconds / 60),
    avgViewers: m.avgViewers!,
    peakViewers: m.peakViewers,
    viewerHours: m.viewerHours!,
  };
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 시각이 속한 한국 날짜 'YYYY-MM-DD' */
export function kstDay(at: Date): string {
  return new Date(at.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

/** 한국 날짜 하루의 [시작, 끝) UTC 시각 */
export function kstDayRange(day: string): [Date, Date] {
  const start = new Date(`${day}T00:00:00+09:00`);
  return [start, new Date(start.getTime() + 24 * 60 * 60 * 1000)];
}

/** 하루 전 한국 날짜 */
export function previousKstDay(day: string): string {
  const [start] = kstDayRange(day);
  return kstDay(new Date(start.getTime() - 1));
}
