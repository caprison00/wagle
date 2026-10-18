import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { computeDailyStats, computeStreamMetrics, kstDay, kstDayRange, previousKstDay } from '../src/metrics.ts';

describe('computeStreamMetrics', () => {
  it('최고·평균·시청 시간(시청자 × 간격 합, 시청자·시간)', () => {
    const m = computeStreamMetrics([
      { viewers: 100, intervalSec: 60 },
      { viewers: 200, intervalSec: 60 },
      { viewers: 300, intervalSec: 60 },
    ]);
    assert.deepEqual(m, { peakViewers: 300, avgViewers: 200, viewerHours: 10 }); // 600명·분 = 10시간
  });

  it('간격이 다른 스냅샷(1분·10분)도 같은 식으로 계산', () => {
    const m = computeStreamMetrics([
      { viewers: 60, intervalSec: 60 },
      { viewers: 60, intervalSec: 600 },
    ]);
    assert.equal(m.viewerHours, 11); // 60×1분 + 60×10분 = 660명·분
  });

  it('평균은 반올림, 시청 시간은 소수 셋째 자리', () => {
    const m = computeStreamMetrics([
      { viewers: 1, intervalSec: 60 },
      { viewers: 2, intervalSec: 60 },
    ]);
    assert.equal(m.avgViewers, 2); // 1.5 → 2
    assert.equal(m.viewerHours, 0.05);
  });

  it('스냅샷이 없으면 빈 값(null)이지 0이 아니다', () => {
    assert.deepEqual(computeStreamMetrics([]), { peakViewers: null, avgViewers: null, viewerHours: null });
  });
});

describe('computeDailyStats', () => {
  it('방송 분은 간격 합', () => {
    const d = computeDailyStats([
      { viewers: 10, intervalSec: 60 },
      { viewers: 20, intervalSec: 60 },
      { viewers: 30, intervalSec: 90 },
    ]);
    assert.deepEqual(d, { minutesLive: 3, avgViewers: 20, peakViewers: 30, viewerHours: 1.25 }); // (10×60 + 20×60 + 30×90)초 ÷ 3600
  });
  it('스냅샷이 없으면 null', () => {
    assert.equal(computeDailyStats([]), null);
  });
});

describe('한국 날짜', () => {
  it('UTC 15시는 한국 다음 날 0시', () => {
    assert.equal(kstDay(new Date('2026-10-18T14:59:59Z')), '2026-10-18');
    assert.equal(kstDay(new Date('2026-10-18T15:00:00Z')), '2026-10-19');
  });
  it('하루 범위와 전날', () => {
    const [from, to] = kstDayRange('2026-10-19');
    assert.equal(from.toISOString(), '2026-10-18T15:00:00.000Z');
    assert.equal(to.toISOString(), '2026-10-19T15:00:00.000Z');
    assert.equal(previousKstDay('2026-11-01'), '2026-10-31');
  });
});
