// pnpm mock: API 키·DB 없이 수집 흐름을 돌려 결과를 표로 보여준다.
// 메모리에만 저장하므로 실제 DB에는 아무것도 쓰지 않는다.

import { MemoryStore } from '../store/memory.ts';
import { simulate } from './simulate.ts';

const store = new MemoryStore();
const { results } = await simulate({ store, restartBeforeTick: 8 });

const kst = (d: Date | null) => (d ? new Date(d.getTime() + 9 * 3600_000).toISOString().slice(5, 16).replace('T', ' ') : '방송 중');
const nameOf = (channelId: number) => store.channels.find((c) => c.id === channelId)!.name;
const isMain = (channelId: number) => !store.channels.find((c) => c.id === channelId)!.platformId.startsWith('mock-filler');

console.log('\n■ 슬롯별 수집 결과 (한국 시간)');
console.table(
  results.map(({ slotAt, result }) => ({
    슬롯: kst(slotAt),
    결과: result.ok ? '성공' : `실패: ${result.error}`,
    라이브: result.liveCount,
    시작: result.started,
    종료: result.ended,
  })),
);
console.log('  * 8슬롯 직전에 수집기를 재시작했습니다 (방송 중 상태를 저장소에서 복원).');

console.log('\n■ 방송(streams) — 채움 채널 제외');
console.table(
  store.streams
    .filter((s) => isMain(s.channelId))
    .map((s) => ({
      채널: nameOf(s.channelId),
      liveId: s.platformLiveId,
      시작: kst(s.startedAt),
      종료: kst(s.endedAt),
      스냅샷: store.snapshots.filter((sn) => sn.streamId === s.id).length,
      최고: s.peakViewers,
      평균: s.avgViewers,
      '시청 시간': s.viewerHours,
    })),
);

console.log('\n■ 일 집계(daily_channel_stats, 한국 날짜) — 채움 채널 제외');
console.table(
  store.daily
    .filter((d) => isMain(d.channelId))
    .sort((a, b) => a.day.localeCompare(b.day) || a.channelId - b.channelId)
    .map((d) => ({ 날짜: d.day, 채널: nameOf(d.channelId), 방송분: d.minutesLive, 평균: d.avgViewers, 최고: d.peakViewers, '시청 시간': d.viewerHours })),
);

const failed = store.runs.filter((r) => !r.ok).map((r) => kst(r.slotAt));
console.log(`\n■ 수집 기록(collector_runs): ${store.runs.length}건, 실패 슬롯 ${failed.join(', ') || '없음'} — 이 슬롯은 스냅샷 없이 빈 값으로 남습니다.\n`);
