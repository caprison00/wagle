// 모의 시나리오를 실제 수집 흐름(ChzzkAdapter → Collector → Store)으로 끝까지 돌린다.
// 기다리지 않고 슬롯을 연달아 실행한다. pnpm mock과 테스트가 함께 쓴다.

import { ChzzkAdapter } from '../adapters/chzzk.ts';
import { Collector, type TickResult } from '../collector.ts';
import { kstDay } from '../metrics.ts';
import type { Store } from '../store/types.ts';
import { SCENARIO_START, buildScenario, mockChzzkFetch } from './scenario.ts';

export interface SimulateOptions {
  store: Store;
  /** 이 슬롯 직전에 수집기를 새로 만들어 "재시작"을 흉내 낸다 (DB에서 방송 중 상태 복원 확인) */
  restartBeforeTick?: number;
}

export interface SimulateResult {
  results: { slotAt: Date; result: TickResult }[];
  days: string[];
}

export async function simulate({ store, restartBeforeTick }: SimulateOptions): Promise<SimulateResult> {
  const scenario = buildScenario();
  let tick = 0;
  const adapter = new ChzzkAdapter({
    clientId: 'mock-client-id',
    clientSecret: 'mock-client-secret',
    intervalSec: 60,
    pageDelayMs: 0,
    fetch: mockChzzkFetch(() => scenario[tick]!),
    // 재시도 대기 없이 바로 (백오프 로직 자체는 그대로 실행된다)
    sleep: async () => {},
  });

  let collector = new Collector({ adapter, store });
  await collector.init();
  const results: SimulateResult['results'] = [];
  for (tick = 0; tick < scenario.length; tick++) {
    if (tick === restartBeforeTick) {
      collector = new Collector({ adapter, store });
      await collector.init();
    }
    const slotAt = new Date(SCENARIO_START.getTime() + tick * 60_000);
    results.push({ slotAt, result: await collector.tick(slotAt) });
  }

  const days = [...new Set(results.map((r) => kstDay(r.slotAt)))];
  for (const day of days) await store.refreshDaily(day);
  return { results, days };
}
