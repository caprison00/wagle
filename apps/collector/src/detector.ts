// 방송 시작·종료 감지 (CLAUDE.md 0절)
//  - 직전 수집에 없던 채널이 나타나면 시작
//  - 연속 3회 사라지면 종료. 종료 시각은 마지막으로 본 슬롯 시각
//  - 채널이 계속 보여도 liveId가 바뀌면 이전 방송을 끝내고 새 방송을 연다
// 이 함수는 성공한 수집에만 호출한다. 수집 실패는 "안 보임"이 아니므로 missed를 올리지 않는다.
// DB·네트워크를 모르는 순수 함수라 단위 테스트로 검증한다.

import type { LiveItem, OpenStream } from './types.ts';

export const END_AFTER_MISSES = 3;

export interface TickPlan {
  /** 새로 시작한 방송 */
  start: LiveItem[];
  /** 계속 방송 중 */
  continue: { stream: OpenStream; live: LiveItem }[];
  /** 이번 슬롯에 종료 처리할 방송 */
  end: { stream: OpenStream; endedAt: Date; reason: 'missed' | 'new-live-id' }[];
  /** 이번에 안 보였지만 아직 종료 전인 방송 (missed는 갱신된 값) */
  missed: OpenStream[];
}

/** 같은 채널이 여러 번 나오면 첫 항목만 남긴다 (페이지를 넘기는 사이 순위가 바뀌면 중복될 수 있다) */
export function dedupeLives(lives: readonly LiveItem[]): LiveItem[] {
  const seen = new Set<string>();
  const out: LiveItem[] = [];
  for (const live of lives) {
    if (seen.has(live.channelId)) continue;
    seen.add(live.channelId);
    out.push(live);
  }
  return out;
}

export function planTick(
  open: ReadonlyMap<string, OpenStream>,
  lives: readonly LiveItem[],
  endAfterMisses = END_AFTER_MISSES,
): TickPlan {
  const plan: TickPlan = { start: [], continue: [], end: [], missed: [] };
  const present = new Set<string>();

  for (const live of dedupeLives(lives)) {
    present.add(live.channelId);
    const stream = open.get(live.channelId);
    if (!stream) {
      plan.start.push(live);
    } else if (stream.liveId !== null && live.liveId !== null && stream.liveId !== live.liveId) {
      plan.end.push({ stream, endedAt: stream.lastSeenAt, reason: 'new-live-id' });
      plan.start.push(live);
    } else {
      plan.continue.push({ stream, live });
    }
  }

  for (const stream of open.values()) {
    if (present.has(stream.channelId)) continue;
    const missed = stream.missed + 1;
    if (missed >= endAfterMisses) {
      plan.end.push({ stream, endedAt: stream.lastSeenAt, reason: 'missed' });
    } else {
      plan.missed.push({ ...stream, missed });
    }
  }

  return plan;
}

/**
 * 방송 시작 시각: 플랫폼이 준 시작 시각과 첫 수집 슬롯 중 이른 쪽.
 * 시작 시각을 모르거나 미래 값이면 슬롯 시각을 쓴다.
 * 슬롯보다 늦은 값을 쓰면 첫 스냅샷이 방송 시작 전으로 찍히는 모순이 생긴다.
 */
export function resolveStartedAt(openedAt: Date | null, slotAt: Date): Date {
  if (!openedAt || Number.isNaN(openedAt.getTime()) || openedAt > slotAt) return slotAt;
  return openedAt;
}
