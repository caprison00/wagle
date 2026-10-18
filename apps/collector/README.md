# 와글 수집기 (apps/collector)

치지직 공식 Open API에서 1분마다 라이브 목록을 끝까지 받아 Supabase DB에 쌓는 프로그램입니다.
웹 화면과 따로 돌기 때문에, 웹이 멈춰도 데이터는 계속 쌓입니다.

## 하는 일

| 시점 | 하는 일 |
| --- | --- |
| 매분 정각 | 치지직 라이브 목록 전체(20개씩 페이지를 끝까지)를 받아 `snapshots`에 저장 |
| 처음 보이는 채널 | `channels`에 등록하고 `streams`에 방송 시작 기록 |
| 연속 3번 안 보이는 채널 | 방송 종료 처리, 최고·평균 시청자와 시청 시간 계산 |
| 수집 실패 | 지수 백오프(1→2→4→8초)로 다시 시도. 그래도 실패하면 그 분은 **빈 값**(0명 아님)으로 남김 |
| 연속 3번 실패 | 디스코드로 알림. 복구되면 복구 알림 |
| 매일 0시 10분(한국 시간) | 전날 `daily_channel_stats` 집계, 30일 지난 스냅샷을 10분 간격으로 줄임 |

모든 수집 시도는 `collector_runs`에 기록됩니다(성공 여부, 호출한 공식 API 주소, 실패 사유).

## Railway에 배포하기 (처음 한 번)

준비물: GitHub 계정(이 저장소 접근 권한), 아래 1~3단계에서 받는 값들.

### 1단계. Supabase에 테이블 만들기

1. https://supabase.com 에 로그인 → **New project**.
   - Region은 **Northeast Asia (Seoul)** 를 고릅니다.
   - Database Password는 꼭 따로 적어 둡니다.
2. 프로젝트가 만들어지면 왼쪽 메뉴 **SQL Editor** → **New query**.
3. 이 저장소의 `supabase/migrations/20261018000000_init.sql` 파일 내용을 전부 복사해 붙여 넣고 **Run**.
   - 아래에 `Success. No rows returned`가 나오면 성공입니다.
   - 왼쪽 **Table Editor**에 `channels`, `streams`, `snapshots`, `daily_channel_stats`, `collector_runs`가 보이면 됩니다.
4. 화면 위쪽 **Connect** 버튼 → **Session pooler** 항목의 URI를 복사합니다.
   - `[YOUR-PASSWORD]` 부분을 1번에서 적어 둔 비밀번호로 바꿉니다. 이것이 `DATABASE_URL`입니다.
   - "Direct connection"이 아니라 **Session pooler**를 쓰세요. Railway에서 Direct connection은 연결이 안 될 수 있습니다.

### 2단계. 치지직 API 키 받기

1. https://developers.chzzk.naver.com 에 네이버 계정으로 로그인합니다.
2. **애플리케이션 등록**을 합니다.
   - 애플리케이션 ID·이름에 'chzzk', '치지직', 'naver', '네이버'는 넣을 수 없습니다(치지직 규정). 예: `wagle-stats`
   - API Scope에서 **라이브 조회**(라이브 목록 조회) 항목을 선택합니다.
3. 등록 후 애플리케이션 정보에서 **Client ID**와 **Client Secret**을 복사합니다.

> 치지직 규정: 90일 동안 API를 한 번도 쓰지 않은 애플리케이션은 삭제됩니다. 수집기가 돌고 있으면 문제없습니다.

### 3단계. 디스코드 알림 주소 받기 (선택)

1. 알림을 받을 디스코드 채널 옆 톱니바퀴(채널 편집) → **연동** → **웹후크** → **새 웹후크**.
2. **웹후크 URL 복사**. 이것이 `DISCORD_WEBHOOK_URL`입니다.

### 4단계. Railway에 올리기

1. https://railway.com 에 GitHub 계정으로 로그인합니다.
2. **New Project** → **Deploy from GitHub repo** → `wagle` 저장소를 고릅니다.
   - 저장소가 안 보이면 **Configure GitHub App**에서 이 저장소 접근을 허용합니다.
3. 만들어진 서비스를 눌러 **Settings** 탭:
   - **Source → Branch**: `main` (확인 전 테스트라면 `feat/collector`)
   - **Root Directory**는 비워 둡니다(저장소 맨 위). 빌드·실행 방법은 저장소의 `railway.json`이 알려 줍니다.
4. **Variables** 탭 → **New Variable**로 아래 값을 넣습니다(또는 **Raw Editor**에 `.env.example` 형식 그대로 붙여 넣기).

   | 이름 | 값 |
   | --- | --- |
   | `DATABASE_URL` | 1단계에서 만든 주소 |
   | `CHZZK_CLIENT_ID` | 2단계 Client ID |
   | `CHZZK_CLIENT_SECRET` | 2단계 Client Secret |
   | `DISCORD_WEBHOOK_URL` | 3단계 주소 (선택) |

   나머지 설정은 `.env.example`의 기본값을 쓰므로 넣지 않아도 됩니다.
5. **Deploy** 버튼(또는 변수 저장 후 뜨는 배포 안내)을 누릅니다.
6. **Deployments** 탭 → 최신 배포 → **View Logs**에서 아래처럼 나오면 성공입니다.

   ```
   INFO  수집 시작: chzzk, 60초 주기, 방송 중 0개 복원, 첫 슬롯 ...
   INFO  2026-10-19T03:01:00.000Z 라이브 1234개, 시작 1234, 종료 0, 방송 중 1234
   ```

7. Supabase **Table Editor → snapshots**에 행이 쌓이는지 확인합니다.

### 주의

- **인스턴스는 1개만** 쓰세요(Settings → Replicas 1). 여러 개를 띄워도 DB 잠금으로 하나만 수집하지만 비용만 듭니다.
- 새 버전을 배포하면 잠깐 두 개가 겹치는데, 새 수집기는 이전 것이 끝날 때까지 기다렸다가 이어받습니다. 로그에 `다른 수집기가 실행 중이라 끝나기를 기다립니다`가 잠깐 보이는 것은 정상입니다.
- API 키나 DB 비밀번호를 코드나 GitHub에 올리지 마세요. Railway Variables와 로컬 `.env.local`에만 둡니다.

## 문제가 생기면 (로그 메시지별)

| 로그 | 원인과 해결 |
| --- | --- |
| `필수 환경변수가 없습니다: ...` | Railway Variables에 이름이 빠졌거나 오타. 이름을 그대로 복사해 넣습니다 |
| `DB에 와글 테이블이 없습니다` | 1단계 3번(SQL 실행)을 안 했거나 다른 프로젝트 주소를 넣었습니다 |
| `치지직 API 401: INVALID_CLIENT` | Client ID/Secret이 틀렸습니다. 앞뒤 공백 없이 다시 복사합니다 |
| `치지직 API 403` | 애플리케이션에 라이브 조회 Scope가 없습니다. 개발자센터에서 Scope를 추가합니다 |
| `치지직 API 429` | 호출 한도 초과. `CHZZK_PAGE_DELAY_MS`를 200 정도로, 계속되면 `POLL_INTERVAL_SEC`를 늘립니다 |
| `수집이 주기를 넘겨 슬롯 N개를 건너뜁니다` | 라이브 목록을 다 받는 데 1분 넘게 걸렸습니다. `CHZZK_PAGE_DELAY_MS`를 줄이거나 `POLL_INTERVAL_SEC`를 늘립니다 |

## DB 용량

스냅샷은 "방송 중인 채널 수 × 하루 1,440번"만큼 쌓입니다.
방송 1,000개가 동시에 켜져 있으면 하루 약 144만 행, 인덱스까지 **하루 약 160MB**입니다(로컬 Postgres 실측, 행당 약 119바이트).
30일이 지나면 10분 간격으로 줄어 1/10이 되지만, 최근 30일치만으로도 약 5GB입니다.
Supabase 무료 플랜(500MB)은 3일 안팎에 찹니다. 실제 크기는 첫날 Supabase **Database → Usage**로 확인하고,
유료 플랜 전환이나 `MIN_VIEWERS`(소규모 방송 제외) 중에서 정해야 합니다.

## 개발자용

Node.js 22.18 이상과 pnpm이 필요합니다. 저장소 맨 위에서:

```bash
pnpm install
pnpm mock                       # API 키·DB 없이 모의 시나리오 실행 (메모리에만 저장)
pnpm test                       # 단위 테스트
pnpm typecheck
TEST_DATABASE_URL=postgres://... pnpm test   # 빈 테스트용 Postgres로 마이그레이션·DB 저장 통합 테스트 (public 스키마를 지우고 다시 만듦)
```

실제 수집을 로컬에서 돌리려면 `apps/collector/.env.example`을 `apps/collector/.env.local`로 복사해 채우고 `pnpm start:collector`.

### 구조

```
src/
  index.ts            진입점 (환경변수 → DB 잠금 → 수집 반복)
  runner.ts           매 슬롯 실행, 연속 실패 알림, 매일 집계
  collector.ts        한 슬롯 수집: 어댑터 → 감지 → 저장
  detector.ts         방송 시작·종료 감지 (순수 함수)
  metrics.ts          지표 계산 (순수 함수, DB 집계 함수와 같은 식)
  adapters/chzzk.ts   치지직 공식 API 어댑터
  store/postgres.ts   Supabase(Postgres) 저장
  store/memory.ts     모의 모드·테스트용 메모리 저장
  mock/               모의 응답 시나리오와 실행기
```

**새 플랫폼(유튜브·SOOP) 붙이기**: `src/types.ts`의 `PlatformAdapter`(platform, intervalSec, source, fetchLives)를 구현한 어댑터를 `src/adapters/`에 만들고,
`index.ts`에서 플랫폼마다 `Collector`와 `Runner`를 하나씩 만들면 됩니다. 감지·지표·저장 코드는 그대로 씁니다.
`fetchLives`는 목록을 끝까지 못 받으면 반드시 오류를 던져야 합니다(일부만 넘기면 빠진 채널이 종료로 잘못 처리됨).
