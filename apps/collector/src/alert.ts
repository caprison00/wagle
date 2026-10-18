// 연속 실패 알림 (디스코드 웹훅)

import type { Logger } from './log.ts';

export interface Alerter {
  send(message: string): Promise<void>;
}

export class DiscordAlerter implements Alerter {
  private readonly webhookUrl: string | undefined;
  private readonly log: Logger;
  private readonly fetchFn: typeof fetch;

  constructor(webhookUrl: string | undefined, log: Logger, fetchFn: typeof fetch = fetch) {
    this.webhookUrl = webhookUrl;
    this.log = log;
    this.fetchFn = fetchFn;
  }

  async send(message: string): Promise<void> {
    this.log.warn(`[알림] ${message}`);
    if (!this.webhookUrl) return;
    try {
      const res = await this.fetchFn(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // 디스코드 메시지 최대 2,000자
        body: JSON.stringify({ username: '와글 수집기', content: message.slice(0, 1900) }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) this.log.error(`디스코드 알림 전송 실패: HTTP ${res.status}`);
    } catch (err) {
      this.log.error(`디스코드 알림 전송 실패: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

/**
 * 실패 횟수를 세어 알림 시점을 정한다.
 *  - 연속 threshold회 실패하면 1번 알림
 *  - 이후 계속 실패하면 repeatEvery회마다 다시 알림 (알림 폭주 방지)
 *  - 알림을 보낸 뒤 성공하면 복구 알림
 */
export class FailureTracker {
  private streak = 0;
  private alerted = false;
  private readonly threshold: number;
  private readonly repeatEvery: number;

  constructor(threshold: number, repeatEvery = 60) {
    this.threshold = threshold;
    this.repeatEvery = repeatEvery;
  }

  get failures(): number {
    return this.streak;
  }

  /** 알림을 보내야 하면 종류를 돌려준다 */
  record(ok: boolean): 'failing' | 'recovered' | null {
    if (ok) {
      const recovered = this.alerted;
      this.streak = 0;
      this.alerted = false;
      return recovered ? 'recovered' : null;
    }
    this.streak++;
    if (this.streak === this.threshold || (this.streak > this.threshold && (this.streak - this.threshold) % this.repeatEvery === 0)) {
      this.alerted = true;
      return 'failing';
    }
    return null;
  }
}
