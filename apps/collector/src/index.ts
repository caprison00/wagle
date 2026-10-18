// 수집기 진입점: pnpm --filter @wagle/collector start

import { ChzzkAdapter } from './adapters/chzzk.ts';
import { DiscordAlerter } from './alert.ts';
import { Collector } from './collector.ts';
import { loadConfig } from './config.ts';
import { consoleLogger as log } from './log.ts';
import { Runner } from './runner.ts';
import { PostgresStore } from './store/postgres.ts';

async function main(): Promise<void> {
  const config = loadConfig();
  const controller = new AbortController();
  // Railway 재배포·중지 시 SIGTERM: 진행 중인 수집을 마치고 끝낸다
  for (const sig of ['SIGTERM', 'SIGINT'] as const) {
    process.once(sig, () => {
      log.info(`${sig} 받음, 현재 수집을 마치고 종료합니다`);
      controller.abort();
    });
  }

  const store = new PostgresStore(config.databaseUrl);
  const alerter = new DiscordAlerter(config.discordWebhookUrl, log);
  try {
    await store.checkSchema();
    await store.acquireSingleInstanceLock(() => log.warn('다른 수집기가 실행 중이라 끝나기를 기다립니다 (배포 교체 중이면 정상)'), controller.signal);

    const adapter = new ChzzkAdapter({
      clientId: config.chzzkClientId,
      clientSecret: config.chzzkClientSecret,
      intervalSec: config.pollIntervalSec,
      pageDelayMs: config.chzzkPageDelayMs,
    });
    const collector = new Collector({ adapter, store, minViewers: config.minViewers });
    await collector.init();

    await new Runner({
      collector,
      store,
      alerter,
      log,
      alertAfterFailures: config.alertAfterFailures,
      downsampleAfterDays: config.downsampleAfterDays,
    }).run(controller.signal);
  } catch (err) {
    if (!controller.signal.aborted) {
      await alerter.send(`🛑 수집기가 시작하지 못했거나 멈췄습니다: ${err instanceof Error ? err.message : String(err)}`);
    }
    process.exitCode = 1;
  } finally {
    await store.close();
  }
}

main().catch((err) => {
  log.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
