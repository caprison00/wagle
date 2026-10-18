// 모의(mock) 모드: API 키 없이 수집 흐름 전체를 검증하기 위한 가짜 치지직 응답.
// 응답 모양은 치지직 공식 문서의 라이브 목록 조회(GET /open/v1/lives) 형식을 그대로 따른다.
// 실제 ChzzkAdapter가 이 응답을 받아 페이지 넘기기·해석·재시도를 그대로 수행한다.

import type { ChzzkLive, ChzzkLivesContent, ChzzkResponse } from '../adapters/chzzk.ts';

export interface ScenarioTick {
  /** true면 이 슬롯은 API가 500을 돌려준다 (재시도해도 실패) */
  fail?: boolean;
  lives: ChzzkLive[];
}

/** 시나리오 시작 슬롯: 한국 시간 2026-10-18 23:50 (자정을 넘겨 일 집계가 이틀로 나뉘는지 확인) */
export const SCENARIO_START = new Date('2026-10-18T14:50:00Z');
export const SCENARIO_TICKS = 16;
export const FILLER_CHANNELS = 40;

/** 슬롯 t의 시각을 치지직 openDate처럼 'YYYY-MM-DD HH:mm:ss'(한국 시간)로. 형식은 가정이다 (adapters/chzzk.ts의 TODO 참고) */
function kstString(t: number, offsetSec = 0): string {
  const d = new Date(SCENARIO_START.getTime() + t * 60_000 + offsetSec * 1000 + 9 * 3600_000);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function live(channel: string, name: string, liveId: number, viewers: number, openedTick: number, category = '모의 게임'): ChzzkLive {
  return {
    liveId,
    liveTitle: `${name} 방송`,
    liveThumbnailImageUrl: `https://example.com/mock/${channel}.jpg`,
    concurrentUserCount: viewers,
    openDate: kstString(openedTick, -30),
    adult: false,
    tags: ['모의'],
    categoryType: 'GAME',
    liveCategory: 'Mock_Game',
    liveCategoryValue: category,
    channelId: channel,
    channelName: name,
    channelImageUrl: `https://example.com/mock/${channel}.png`,
  };
}

/**
 * 16슬롯 시나리오
 *  - A: 0~8 슬롯 방송(시청자 100, 110, …), 9슬롯부터 사라짐 → 9·10·11에 연속 3회 안 보여 11슬롯에 종료, 종료 시각 = 8슬롯
 *  - B: 계속 방송하지만 5·6슬롯에만 안 보임 → 2회라 종료되지 않고 같은 방송으로 이어짐 (5·6은 빈 값)
 *  - C: 계속 보이지만 7슬롯부터 liveId가 바뀜 → 방송 2개로 나뉨
 *  - D: 10슬롯부터 새로 등장
 *  - 3슬롯: API 장애 → 아무것도 저장하지 않고, "안 보임" 횟수도 올리지 않음
 *  - 채움 채널 40개: 페이지(20개씩)를 끝까지 넘기는지 확인
 */
export function buildScenario(): ScenarioTick[] {
  const ticks: ScenarioTick[] = [];
  for (let t = 0; t < SCENARIO_TICKS; t++) {
    if (t === 3) {
      ticks.push({ fail: true, lives: [] });
      continue;
    }
    const lives: ChzzkLive[] = [];
    if (t <= 8) lives.push(live('mock-a', '모의채널A', 1001, 100 + 10 * t, 0));
    if (t !== 5 && t !== 6) lives.push(live('mock-b', '모의채널B', 2001, 500, 0, '저스트 채팅'));
    lives.push(live('mock-c', '모의채널C', t < 7 ? 3001 : 3002, 300, t < 7 ? 0 : 7));
    if (t >= 10) lives.push(live('mock-d', '모의채널D', 4001, 50, 10));
    for (let i = 1; i <= FILLER_CHANNELS; i++) {
      lives.push(live(`mock-filler-${String(i).padStart(2, '0')}`, `채움채널${i}`, 9000 + i, i, 0));
    }
    // 공식 API처럼 시청자 수 높은 순 정렬
    lives.sort((a, b) => b.concurrentUserCount - a.concurrentUserCount);
    ticks.push({ lives });
  }
  return ticks;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/** 가짜 fetch: 현재 슬롯의 라이브 목록을 공식 응답 형식으로 페이지를 나눠 돌려준다 */
export function mockChzzkFetch(currentTick: () => ScenarioTick): typeof fetch {
  return (async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : input);
    const headers = new Headers(init?.headers);
    if (url.pathname !== '/open/v1/lives') return json(404, { code: 404, message: 'NOT_FOUND' });
    if (!headers.get('Client-Id') || !headers.get('Client-Secret')) return json(401, { code: 401, message: 'UNAUTHORIZED' });

    const tick = currentTick();
    if (tick.fail) return json(500, { code: 500, message: 'INTERNAL_SERVER_ERROR' });

    const size = Number(url.searchParams.get('size') ?? 20);
    const offset = Number(url.searchParams.get('next') ?? 0);
    const data = tick.lives.slice(offset, offset + size);
    const hasMore = offset + size < tick.lives.length;
    const body: ChzzkResponse<ChzzkLivesContent> = {
      code: 200,
      message: null,
      content: { data, page: { next: hasMore ? String(offset + size) : null } },
    };
    return json(200, body);
  }) as typeof fetch;
}
