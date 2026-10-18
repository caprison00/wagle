// 치지직 공식 Open API 어댑터
// 근거 문서 (치지직 개발자센터, 2026-10-18 확인):
//  - 도메인·인증·공통 응답·오류 코드: https://chzzk.gitbook.io/chzzk/chzzk-api/tips
//  - 라이브 목록 조회 GET /open/v1/lives: https://chzzk.gitbook.io/chzzk/chzzk-api/live
// 웹 내부 API(api.chzzk.naver.com/service)는 쓰지 않는다 (CLAUDE.md 6절).

import { HttpError, defaultSleep, withRetry, type RetryOptions } from '../http.ts';
import type { FetchResult, LiveItem, PlatformAdapter } from '../types.ts';

export const CHZZK_BASE_URL = 'https://openapi.chzzk.naver.com';
const LIVES_PATH = '/open/v1/lives';
/** 문서: size 최소 1 ~ 최대 20 */
const PAGE_SIZE = 20;

/** 문서의 라이브 목록 응답 data[] 항목 */
export interface ChzzkLive {
  liveId: number;
  liveTitle: string;
  liveThumbnailImageUrl: string | null;
  concurrentUserCount: number;
  openDate: string;
  adult: boolean;
  tags: string[];
  categoryType: string | null;
  liveCategory: string | null;
  liveCategoryValue: string | null;
  channelId: string;
  channelName: string;
  channelImageUrl: string | null;
}

/** 문서의 공통 응답 구조: 성공 { code: 200, message: null, content }, 실패 { code, message } */
export interface ChzzkResponse<T> {
  code: number;
  message: string | null;
  content?: T;
}

export interface ChzzkLivesContent {
  data: ChzzkLive[];
  page: { next: string | null } | null;
}

export interface ChzzkAdapterOptions {
  clientId: string;
  clientSecret: string;
  intervalSec: number;
  /** 페이지 사이 대기(ms). 호출 한도를 넘지 않게 속도를 늦춘다 */
  pageDelayMs: number;
  /** 무한 루프 방지용 최대 페이지 수. 넘으면 실패로 본다 */
  maxPages?: number;
  fetch?: typeof fetch;
  baseUrl?: string;
  retry?: Partial<RetryOptions>;
  sleep?: (ms: number) => Promise<void>;
}

/**
 * openDate 해석.
 * TODO(치지직 문서 미확인): 문서에는 타입이 String이라고만 있고 형식·시간대 설명이 없다.
 *  - 시간대가 붙은 ISO 8601이면 그대로 해석한다.
 *  - 'YYYY-MM-DD HH:mm:ss'처럼 시간대가 없으면 한국 시간(+09:00)으로 가정한다.
 *  - 해석할 수 없으면 null을 돌려주고, 수집기는 첫 수집 슬롯 시각을 시작 시각으로 쓴다.
 *  실제 응답을 받으면 형식을 확인하고 이 가정을 확정하거나 고친다.
 */
export function parseOpenDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const v = value.trim();
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(v);
  const m = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)$/.exec(v);
  const d = hasZone ? new Date(v) : m ? new Date(`${m[1]}T${m[2]}+09:00`) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
}

export function toLiveItem(live: ChzzkLive): LiveItem {
  return {
    channelId: live.channelId,
    liveId: live.liveId === null || live.liveId === undefined ? null : String(live.liveId),
    channelName: live.channelName,
    channelImageUrl: live.channelImageUrl || null,
    title: live.liveTitle || null,
    category: live.liveCategoryValue || null,
    viewers: Math.max(0, Math.trunc(Number(live.concurrentUserCount) || 0)),
    openedAt: parseOpenDate(live.openDate),
  };
}

export class ChzzkAdapter implements PlatformAdapter {
  readonly platform = 'chzzk' as const;
  readonly intervalSec: number;
  readonly source: string;
  private readonly opts: ChzzkAdapterOptions;
  private readonly fetchFn: typeof fetch;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(opts: ChzzkAdapterOptions) {
    this.opts = opts;
    this.intervalSec = opts.intervalSec;
    this.source = `${new URL(opts.baseUrl ?? CHZZK_BASE_URL).host}${LIVES_PATH}`;
    this.fetchFn = opts.fetch ?? fetch;
    this.sleep = opts.sleep ?? defaultSleep;
  }

  /** 라이브 목록을 page.next가 없을 때까지 끝까지 받는다. 한 페이지라도 실패하면 전체를 실패로 본다 */
  async fetchLives(): Promise<FetchResult> {
    const baseUrl = this.opts.baseUrl ?? CHZZK_BASE_URL;
    const maxPages = this.opts.maxPages ?? 1000;
    // 한 번의 수집은 다음 슬롯 전에 끝나야 한다. 재시도도 이 안에서만 한다
    const deadline = Date.now() + this.intervalSec * 1000 * 0.9;
    const lives: LiveItem[] = [];
    let next: string | null = null;
    let pageCount = 0;

    do {
      if (pageCount >= maxPages) throw new Error(`치지직 라이브 목록이 ${maxPages}페이지를 넘었습니다 (중단)`);
      if (pageCount > 0 && this.opts.pageDelayMs > 0) await this.sleep(this.opts.pageDelayMs);
      const url = new URL(LIVES_PATH, baseUrl);
      url.searchParams.set('size', String(PAGE_SIZE));
      if (next) url.searchParams.set('next', next);

      const content = await withRetry(() => this.requestPage(url), {
        retries: 4,
        baseDelayMs: 1000,
        maxDelayMs: 16000,
        deadline,
        sleep: this.sleep,
        ...this.opts.retry,
      });
      pageCount++;
      for (const live of content.data ?? []) lives.push(toLiveItem(live));
      next = content.page?.next || null;
      if ((content.data ?? []).length === 0) next = null;
    } while (next);

    return { lives, pageCount };
  }

  private async requestPage(url: URL): Promise<ChzzkLivesContent> {
    const res = await this.fetchFn(url, {
      headers: {
        'Client-Id': this.opts.clientId,
        'Client-Secret': this.opts.clientSecret,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10_000),
    });
    let body: ChzzkResponse<ChzzkLivesContent> | null = null;
    try {
      body = (await res.json()) as ChzzkResponse<ChzzkLivesContent>;
    } catch {
      // 본문이 JSON이 아니면 아래에서 HTTP 상태로 판단한다
    }
    if (!res.ok) throw new HttpError(res.status, `치지직 API ${res.status}: ${body?.message ?? res.statusText}`);
    if (!body || body.code !== 200 || !body.content) {
      throw new HttpError(Number(body?.code) || 500, `치지직 API 응답 오류: ${body?.message ?? '본문 없음'}`);
    }
    return body.content;
  }
}
