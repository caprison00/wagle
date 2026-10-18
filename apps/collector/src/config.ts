// 환경변수 읽기. 설명은 apps/collector/.env.example 참고

export interface Config {
  databaseUrl: string;
  chzzkClientId: string;
  chzzkClientSecret: string;
  discordWebhookUrl: string | undefined;
  pollIntervalSec: number;
  chzzkPageDelayMs: number;
  minViewers: number;
  alertAfterFailures: number;
  downsampleAfterDays: number;
}

function int(env: NodeJS.ProcessEnv, key: string, fallback: number, min: number): number {
  const raw = env[key]?.trim();
  if (!raw) return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min) throw new Error(`${key} 값이 잘못됐습니다: "${raw}" (${min} 이상의 정수)`);
  return n;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const missing = ['DATABASE_URL', 'CHZZK_CLIENT_ID', 'CHZZK_CLIENT_SECRET'].filter((k) => !env[k]?.trim());
  if (missing.length > 0) {
    throw new Error(`필수 환경변수가 없습니다: ${missing.join(', ')} (apps/collector/.env.example 참고)`);
  }
  return {
    databaseUrl: env.DATABASE_URL!.trim(),
    chzzkClientId: env.CHZZK_CLIENT_ID!.trim(),
    chzzkClientSecret: env.CHZZK_CLIENT_SECRET!.trim(),
    discordWebhookUrl: env.DISCORD_WEBHOOK_URL?.trim() || undefined,
    pollIntervalSec: int(env, 'POLL_INTERVAL_SEC', 60, 30),
    chzzkPageDelayMs: int(env, 'CHZZK_PAGE_DELAY_MS', 50, 0),
    minViewers: int(env, 'MIN_VIEWERS', 0, 0),
    alertAfterFailures: int(env, 'ALERT_AFTER_FAILURES', 3, 1),
    downsampleAfterDays: int(env, 'SNAPSHOT_DOWNSAMPLE_AFTER_DAYS', 30, 1),
  };
}
