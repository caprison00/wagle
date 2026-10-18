import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { ChzzkAdapter, parseOpenDate, toLiveItem, type ChzzkLivesContent, type ChzzkResponse } from '../src/adapters/chzzk.ts';
import { HttpError } from '../src/http.ts';

const fixture = JSON.parse(
  readFileSync(new URL('../fixtures/chzzk-lives-page.json', import.meta.url), 'utf8'),
) as ChzzkResponse<ChzzkLivesContent>;

function adapterWith(responses: (() => Response)[], calls: string[] = []) {
  let i = 0;
  const fetchFn = (async (input: string | URL | Request) => {
    calls.push(String(input));
    const r = responses[Math.min(i++, responses.length - 1)]!;
    return r();
  }) as typeof fetch;
  return new ChzzkAdapter({ clientId: 'id', clientSecret: 'secret', intervalSec: 60, pageDelayMs: 0, fetch: fetchFn, sleep: async () => {} });
}

const ok = (content: ChzzkLivesContent) => () => new Response(JSON.stringify({ code: 200, message: null, content }), { status: 200 });
const err = (status: number) => () => new Response(JSON.stringify({ code: status, message: 'ERR' }), { status });

describe('치지직 응답 해석', () => {
  it('공식 문서 형식의 샘플 응답을 공통 형태로 바꾼다', () => {
    const items = fixture.content!.data.map(toLiveItem);
    assert.deepEqual(items[0], {
      channelId: 'mock-channel-a',
      liveId: '1001',
      channelName: '모의채널A',
      channelImageUrl: 'https://example.com/mock/channel-a.png',
      title: '모의 방송 A',
      category: '모의 게임',
      viewers: 1234,
      openedAt: new Date('2026-10-18T12:03:11Z'),
    });
    assert.equal(items[1]?.channelImageUrl, null);
  });

  it('openDate: 시간대가 없으면 한국 시간으로 가정, 해석 불가면 null', () => {
    assert.equal(parseOpenDate('2026-10-18 21:03:11')?.toISOString(), '2026-10-18T12:03:11.000Z');
    assert.equal(parseOpenDate('2026-10-18T21:03:11+09:00')?.toISOString(), '2026-10-18T12:03:11.000Z');
    assert.equal(parseOpenDate('2026-10-18T12:03:11Z')?.toISOString(), '2026-10-18T12:03:11.000Z');
    assert.equal(parseOpenDate('어제'), null);
    assert.equal(parseOpenDate(''), null);
  });
});

describe('ChzzkAdapter.fetchLives', () => {
  const page = (ids: string[], next: string | null): ChzzkLivesContent => ({
    data: ids.map((id) => ({ ...fixture.content!.data[0]!, channelId: id })),
    page: { next },
  });

  it('page.next가 없을 때까지 끝까지 넘긴다', async () => {
    const calls: string[] = [];
    const a = adapterWith([ok(page(['a', 'b'], 'n1')), ok(page(['c'], 'n2')), ok(page(['d'], null))], calls);
    const r = await a.fetchLives();
    assert.deepEqual(r.lives.map((l) => l.channelId), ['a', 'b', 'c', 'd']);
    assert.equal(r.pageCount, 3);
    assert.equal(a.source, 'openapi.chzzk.naver.com/open/v1/lives');
    assert.match(calls[0]!, /^https:\/\/openapi\.chzzk\.naver\.com\/open\/v1\/lives\?size=20$/);
    assert.match(calls[1]!, /next=n1/);
  });

  it('빈 페이지가 오면 next가 있어도 멈춘다', async () => {
    const r = await adapterWith([ok(page(['a'], 'n1')), ok(page([], 'n2'))]).fetchLives();
    assert.equal(r.lives.length, 1);
  });

  it('429·5xx는 지수 백오프로 재시도해서 성공하면 이어간다', async () => {
    const calls: string[] = [];
    const r = await adapterWith([err(429), err(503), ok(page(['a'], null))], calls).fetchLives();
    assert.equal(r.lives.length, 1);
    assert.equal(calls.length, 3);
  });

  it('재시도를 다 써도 실패하면 throw (일부 목록을 넘기지 않는다)', async () => {
    const calls: string[] = [];
    const a = adapterWith([ok(page(['a'], 'n1')), err(500)], calls);
    await assert.rejects(a.fetchLives(), (e: unknown) => e instanceof HttpError && e.status === 500);
    assert.equal(calls.length, 1 + 5); // 첫 페이지 + (첫 시도 + 재시도 4회)
  });

  it('401(인증 오류)은 재시도하지 않는다', async () => {
    const calls: string[] = [];
    await assert.rejects(adapterWith([err(401)], calls).fetchLives(), (e: unknown) => e instanceof HttpError && e.status === 401);
    assert.equal(calls.length, 1);
  });

  it('HTTP 200이어도 본문 code가 200이 아니면 실패', async () => {
    const bad = () => new Response(JSON.stringify({ code: 403, message: 'FORBIDDEN' }), { status: 200 });
    await assert.rejects(adapterWith([bad]).fetchLives(), /FORBIDDEN/);
  });
});
