// 공식 API 호출용 재시도 (CLAUDE.md 6절: 실패 시 지수 백오프)

export class HttpError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export interface RetryOptions {
  /** 첫 시도 뒤 최대 재시도 횟수 */
  retries: number;
  /** 첫 대기 시간. 이후 2배씩 늘어난다 (1s → 2s → 4s → 8s) */
  baseDelayMs: number;
  maxDelayMs: number;
  /** 이 시각을 넘기는 재시도는 하지 않는다 (다음 수집 슬롯을 침범하지 않기 위해) */
  deadline?: number;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
  random?: () => number;
}

export const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** 429(호출 한도 초과), 5xx, 네트워크 오류만 재시도한다. 401·403 같은 오류는 다시 해도 같다 */
export function isRetryable(err: unknown): boolean {
  if (err instanceof HttpError) return err.status === 429 || err.status >= 500;
  return true;
}

export function backoffDelay(attempt: number, opts: Pick<RetryOptions, 'baseDelayMs' | 'maxDelayMs'>, random = Math.random): number {
  const exp = Math.min(opts.maxDelayMs, opts.baseDelayMs * 2 ** attempt);
  // 0.5~1.0배 무작위(jitter): 여러 요청이 같은 순간에 몰리지 않게 한다
  return Math.round(exp * (0.5 + random() * 0.5));
}

export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions): Promise<T> {
  const sleep = opts.sleep ?? defaultSleep;
  const now = opts.now ?? Date.now;
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= opts.retries || !isRetryable(err)) throw err;
      const delay = backoffDelay(attempt, opts, opts.random);
      if (opts.deadline !== undefined && now() + delay > opts.deadline) throw err;
      await sleep(delay);
    }
  }
}
