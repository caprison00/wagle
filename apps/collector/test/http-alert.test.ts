import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { FailureTracker } from '../src/alert.ts';
import { HttpError, backoffDelay, withRetry } from '../src/http.ts';
import { nextSlot } from '../src/runner.ts';

describe('지수 백오프', () => {
  it('1s → 2s → 4s → 8s, 최대값에서 멈춤 (jitter 최대일 때)', () => {
    const opts = { baseDelayMs: 1000, maxDelayMs: 16000 };
    assert.deepEqual([0, 1, 2, 3, 4, 5].map((a) => backoffDelay(a, opts, () => 0.999999)), [1000, 2000, 4000, 8000, 16000, 16000]);
    assert.equal(backoffDelay(0, opts, () => 0), 500); // jitter 최소 0.5배
  });

  it('마감 시각을 넘기는 재시도는 하지 않는다', async () => {
    let calls = 0;
    const fail = async () => {
      calls++;
      throw new HttpError(500, 'x');
    };
    await assert.rejects(withRetry(fail, { retries: 4, baseDelayMs: 1000, maxDelayMs: 16000, deadline: 1500, now: () => 0, random: () => 1, sleep: async () => {} }));
    assert.equal(calls, 2); // 1s 대기 후 1번 더, 그다음 2s 대기는 마감을 넘김
  });
});

describe('연속 실패 알림', () => {
  it('3회째에 알림, 복구 시 복구 알림, 그 전엔 조용히', () => {
    const t = new FailureTracker(3, 60);
    assert.deepEqual([t.record(false), t.record(false), t.record(false), t.record(false)], [null, null, 'failing', null]);
    assert.equal(t.record(true), 'recovered');
    assert.equal(t.record(true), null);
  });
  it('알림 전 성공하면 복구 알림 없음', () => {
    const t = new FailureTracker(3);
    t.record(false);
    assert.equal(t.record(true), null);
  });
  it('계속 실패하면 repeatEvery회마다 다시 알림', () => {
    const t = new FailureTracker(3, 60);
    const kinds = Array.from({ length: 123 }, () => t.record(false));
    assert.deepEqual(kinds.map((k, i) => (k ? i + 1 : 0)).filter(Boolean), [3, 63, 123]);
  });
});

describe('수집 슬롯', () => {
  it('다음 분 정각', () => {
    assert.equal(nextSlot(Date.parse('2026-10-18T12:00:30Z'), 60).toISOString(), '2026-10-18T12:01:00.000Z');
    assert.equal(nextSlot(Date.parse('2026-10-18T12:01:00Z'), 60).toISOString(), '2026-10-18T12:02:00.000Z');
  });
});
