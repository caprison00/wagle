-- 와글 초기 스키마
-- 기준: docs/spec.md "기술 스택과 DB 스키마". spec의 컬럼은 그대로 두고,
-- 보완한 부분(제약조건·인덱스·컬럼)은 각 위치에 [보완] 주석으로 이유를 남긴다.
--
-- 시간대 규칙: 모든 시각은 timestamptz(UTC 저장). "하루"는 한국 시간(Asia/Seoul) 기준.

-- ───────────────────────────────────────────────
-- 채널 마스터: 플랫폼별 채널 1행
-- ───────────────────────────────────────────────
create table channels (
  id            bigserial primary key,
  -- [보완] 허용 플랫폼을 check로 제한: 오타('chzik' 등)가 들어가면 같은 채널이 둘로 갈라진다.
  platform      text not null check (platform in ('chzzk', 'soop', 'youtube', 'twitch')),
  platform_id   text not null,          -- 플랫폼 고유 채널 ID
  name          text not null,
  image_url     text,                   -- 플랫폼 원본 URL만 저장 (CLAUDE.md 6절: 이미지 저장·가공 금지)
  -- [보완] not null: null/false가 섞이면 "연동 안 함" 조건이 두 갈래가 된다.
  opted_in      boolean not null default false,  -- 스트리머 OAuth 연동 여부
  -- [보완] 생성·갱신 시각: 채널을 처음 발견한 날, 이름·이미지가 바뀐 시점 추적용.
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (platform, platform_id)        -- 수집기 upsert 기준. 이 unique가 인덱스 역할도 한다.
);

-- ───────────────────────────────────────────────
-- 방송 세션: 방송 1회 = 1행
-- ───────────────────────────────────────────────
create table streams (
  id                bigserial primary key,
  -- [보완] not null + cascade: 채널 없는 방송은 의미가 없고, 채널 삭제 요청(개인정보) 시 함께 지운다.
  channel_id        bigint not null references channels(id) on delete cascade,
  -- [보완] 플랫폼의 라이브 식별자(치지직 liveId). 채널이 계속 보이는데 liveId가 바뀌면
  --        방송을 끄고 바로 다시 켠 것이므로 새 방송으로 나눈다.
  platform_live_id  text,
  started_at        timestamptz not null,
  ended_at          timestamptz,          -- null = 방송 중
  title             text,                 -- 최신 제목
  category          text,                 -- 최신 카테고리 이름
  -- 종료 시 수집기가 snapshots로 계산해 채운다. 방송 중에는 null.
  peak_viewers      int,
  avg_viewers       int,
  -- [보완] numeric(14,3): 소수 셋째 자리(시청자·시간)까지면 충분하고 크기를 예측할 수 있다.
  viewer_hours      numeric(14, 3),
  created_at        timestamptz not null default now(),
  -- [보완] 종료 시각은 시작 이후여야 한다. 시각 계산 버그를 DB에서 막는다.
  check (ended_at is null or ended_at >= started_at),
  check (peak_viewers is null or peak_viewers >= 0),
  check (avg_viewers is null or avg_viewers >= 0)
);

-- [보완] 채널당 "방송 중" 행은 하나만 허용(부분 unique 인덱스).
--  - 수집기가 재시작하거나 두 개가 겹쳐 돌아도 같은 방송이 두 번 열리지 않는다.
--  - 수집기 시작 시 "열린 방송 목록"(where ended_at is null) 조회에도 이 인덱스를 쓴다.
create unique index streams_one_open_per_channel on streams (channel_id) where ended_at is null;

-- [보완] 스트리머 상세 화면: 채널의 방송 이력을 최신순으로 읽는다.
--        channel_id로 시작하므로 FK(채널 삭제 시 cascade) 조회도 이 인덱스로 처리된다.
create index streams_channel_started on streams (channel_id, started_at desc);

-- ───────────────────────────────────────────────
-- 스냅샷: 수집 주기마다 방송 중인 채널 1행 (가장 큰 테이블)
-- 수집 실패 구간에는 행을 만들지 않는다. "0명"이 아니라 "값 없음"으로 남기기 위해서다.
-- ───────────────────────────────────────────────
create table snapshots (
  -- [보완] cascade: 방송이 지워지면 스냅샷도 지운다.
  stream_id     bigint not null references streams(id) on delete cascade,
  captured_at   timestamptz not null,   -- 수집 슬롯 시각(분 단위로 정렬된 시각)
  -- [보완] 음수 시청자 방지.
  viewers       int not null check (viewers >= 0),
  category      text,
  -- [보완] 이 스냅샷이 대표하는 시간(초). 지표 정의의 "스냅샷 간격"을 행마다 기록한다.
  --  - 치지직 60초, 유튜브 300~600초처럼 플랫폼마다 주기가 달라도 같은 식으로 시청 시간을 계산한다.
  --  - 30일 지난 스냅샷을 10분 간격으로 줄이면 남은 행을 600으로 바꿔 시청 시간이 유지된다.
  --  - smallint(2바이트)는 viewers(int) 뒤 정렬 여백에 들어가 행 크기가 거의 늘지 않는다.
  interval_sec  smallint not null check (interval_sec > 0),
  primary key (stream_id, captured_at)  -- 방송별 시계열 조회(스트리머 상세 차트)는 이 PK로 처리된다.
);

-- [보완] BRIN 인덱스: 스냅샷은 시간순으로만 쌓이므로, 아주 작은 BRIN으로 시간 범위 조회가 빨라진다.
--        일 집계(하루치 범위), 30일 지난 행 줄이기에 쓴다. B-tree보다 수백 배 작다.
create index snapshots_captured_brin on snapshots using brin (captured_at);

-- ───────────────────────────────────────────────
-- 일 단위 집계: 화면 대부분은 이 테이블만 읽는다
-- ───────────────────────────────────────────────
create table daily_channel_stats (
  -- [보완] not null은 PK가 보장. cascade는 channels와 같은 이유.
  channel_id    bigint references channels(id) on delete cascade,
  day           date not null,          -- 한국 시간 기준 날짜
  minutes_live  int,
  avg_viewers   int,
  peak_viewers  int,
  viewer_hours  numeric(14, 3),
  -- [보완] 마지막 집계 시각: 재집계 여부 확인용.
  updated_at    timestamptz not null default now(),
  primary key (channel_id, day)
);

-- [보완] PK는 channel_id가 앞이라 "특정 날짜의 전체 채널 순위" 조회에 못 쓴다. 날짜 기준 인덱스를 따로 둔다.
create index daily_channel_stats_day on daily_channel_stats (day);

-- ───────────────────────────────────────────────
-- [보완] 수집 실행 기록: spec에 없는 테이블
--  1. 공백 구분: 어느 슬롯이 수집 실패였는지 기록해, 차트에서 "0명"이 아니라 "수집 공백"으로 끊어 표시할 수 있다.
--  2. 출처 증명: spec 법적 체크리스트 "수집 로그로 출처를 증명할 수 있게 보관"에 대응한다.
-- 하루 1,440행 정도라 영구 보관해도 작다.
-- ───────────────────────────────────────────────
create table collector_runs (
  platform      text not null,
  slot_at       timestamptz not null,   -- 수집 슬롯 시각 (snapshots.captured_at과 같은 값)
  started_at    timestamptz not null,
  finished_at   timestamptz not null,
  ok            boolean not null,
  source        text not null,          -- 호출한 공식 API (예: openapi.chzzk.naver.com/open/v1/lives)
  live_count    int,                    -- 받은 라이브 수
  page_count    int,                    -- 호출한 페이지 수
  error         text,                   -- 실패 사유
  primary key (platform, slot_at)
);

-- ───────────────────────────────────────────────
-- 일 집계 함수: 하루(한국 시간)치 스냅샷으로 daily_channel_stats를 다시 계산한다.
-- 같은 날을 여러 번 돌려도 결과가 같다(멱등). 수집기가 매일 0시 10분(KST)과 시작 시 호출한다.
-- 계산식은 apps/collector/src/metrics.ts의 computeDailyStats와 같다.
-- ───────────────────────────────────────────────
create or replace function refresh_daily_channel_stats(p_day date)
returns integer
language sql
as $$
  with agg as (
    select s.channel_id,
           (sum(sn.interval_sec) / 60)::int                           as minutes_live,
           round(avg(sn.viewers))::int                                as avg_viewers,
           max(sn.viewers)                                            as peak_viewers,
           round(sum(sn.viewers::bigint * sn.interval_sec) / 3600.0, 3) as viewer_hours
      from snapshots sn
      join streams s on s.id = sn.stream_id
     where sn.captured_at >= (p_day::timestamp at time zone 'Asia/Seoul')
       and sn.captured_at <  ((p_day + 1)::timestamp at time zone 'Asia/Seoul')
     group by s.channel_id
  ), upserted as (
    insert into daily_channel_stats as d
           (channel_id, day, minutes_live, avg_viewers, peak_viewers, viewer_hours, updated_at)
    select channel_id, p_day, minutes_live, avg_viewers, peak_viewers, viewer_hours, now()
      from agg
    on conflict (channel_id, day) do update
       set minutes_live = excluded.minutes_live,
           avg_viewers  = excluded.avg_viewers,
           peak_viewers = excluded.peak_viewers,
           viewer_hours = excluded.viewer_hours,
           updated_at   = now()
    returning 1
  )
  select count(*)::int from upserted;
$$;

-- ───────────────────────────────────────────────
-- 스냅샷 줄이기 (spec: 30일이 지나면 10분 간격으로 줄여 보관)
-- p_before 이전 스냅샷 중 10분 정각(00, 10, 20…분)이 아닌 행을 지우고,
-- 남은 행의 interval_sec을 600으로 바꿔 시청 시간 합계가 유지되게 한다.
-- 수집 슬롯이 분 단위로 정렬돼 있어서 정각 판정이 가능하다.
-- 방송 단위 지표(streams)와 일 집계는 줄이기 전에 이미 계산돼 있으므로 영향이 없다.
-- ───────────────────────────────────────────────
create or replace function downsample_snapshots(p_before timestamptz)
returns integer
language sql
as $$
  with deleted as (
    delete from snapshots
     where captured_at < p_before
       and interval_sec < 600
       and extract(minute from captured_at)::int % 10 <> 0
    returning 1
  ), updated as (
    update snapshots
       set interval_sec = 600
     where captured_at < p_before
       and interval_sec < 600
       and extract(minute from captured_at)::int % 10 = 0
    returning 1
  )
  select ((select count(*) from deleted) + (select count(*) from updated))::int;
$$;

-- ───────────────────────────────────────────────
-- [보완] 접근 권한 (Supabase)
-- Supabase는 public 스키마 테이블을 anon 키로 읽고 쓸 수 있는 REST API로 자동 공개한다.
--  - 전부 무료·로그인 없이 공개하는 서비스이므로 통계 테이블은 누구나 "읽기"만 허용한다.
--  - 쓰기 정책은 만들지 않는다. 수집기는 DB 직접 연결(postgres 역할)로 쓰므로 RLS 영향을 받지 않는다.
--  - collector_runs는 운영 기록이라 공개하지 않는다(정책 없음 = anon 접근 불가).
--  - 집계 함수는 REST로 호출되지 않게 실행 권한을 회수한다(무거운 쿼리 남용 방지).
-- ───────────────────────────────────────────────
alter table channels            enable row level security;
alter table streams             enable row level security;
alter table snapshots           enable row level security;
alter table daily_channel_stats enable row level security;
alter table collector_runs      enable row level security;

create policy "public read" on channels            for select to anon, authenticated using (true);
create policy "public read" on streams             for select to anon, authenticated using (true);
create policy "public read" on snapshots           for select to anon, authenticated using (true);
create policy "public read" on daily_channel_stats for select to anon, authenticated using (true);

revoke execute on function refresh_daily_channel_stats(date)   from public, anon, authenticated;
revoke execute on function downsample_snapshots(timestamptz)   from public, anon, authenticated;
