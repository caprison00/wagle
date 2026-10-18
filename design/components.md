# 와글 컴포넌트 규칙 (design v2)

디자인 시스템 원본: claude.ai의 '와글' 디자인 시스템. 토큰 값은 `design/tokens.json`이 기준이며, 아래 CSS의 `var(--토큰명)`은 tokens.json의 토큰 이름과 1:1로 대응한다(`--font-sans`는 `type.families.sans`).

---

# 브랜드 가이드

와글은 치지직·SOOP·유튜브 라이브 방송의 시청자 통계를 무료로 공개하는 서비스다. 디자인의 목표는 하나, **"이 숫자를 믿어도 된다"는 확신**이다. 리포트처럼 정돈되고, 출처와 기준이 늘 보이고, 장식은 없다. PC·모바일 반응형, 라이트 기본에 다크를 지원한다.

## 원칙

1. **숫자가 주인공.** 표와 차트가 화면의 대부분을 차지한다. 일러스트, 그라데이션, 장식용 색면을 쓰지 않는다.
2. **출처와 기준을 숨기지 않는다.** 숫자가 있는 곳에는 SourceNote로 기준 시각, 출처, 비교 기준을 적는다. 수집이 끊긴 구간은 감추지 않고 표시한다.
3. **강조색은 하나.** `accent`(와글 남색)는 주 버튼, 링크, 활성 상태, 단일 시리즈 차트에만. 나머지는 회색 단계로 위계를 만든다.
4. **누구나 같은 정보.** 로그인·유료 구분이 없으므로 잠금, 흐림, "프리미엄" 표기를 쓰지 않는다.
5. **색만으로 말하지 않는다.** 플랫폼은 점 + 이름, 증감은 색 + ▲▼.

## 말투와 표기

- 해요체, 짧고 건조하게. 감탄사와 느낌표를 쓰지 않는다. "지금 41,820명이 보고 있어요"보다 표 안의 "41,820"이 기본이다.
- 버튼은 동사로 끝낸다: "비교에 추가", "CSV 내려받기".
- 숫자: 표와 핵심 지표는 정확한 값과 천 단위 콤마(41,820). 요약 문장이나 좁은 칸에서만 "4.2만", "1.2억".
- 시각은 "2026-10-18 22:20 기준", 기간은 "최근 30일", 비교는 "10분 전 대비"처럼 늘 명시한다.
- 빈 상태: "아직 수집된 기록이 없어요. 방송이 시작되면 1분 안에 표시돼요."
- 이모지를 UI에 쓰지 않는다.

## 색

- 페이지 `bg`(차가운 회색), 패널·표 `surface`, 표 머리·검색창·세그먼트 `surface-sunken`.
- 경계는 그림자 대신 `line` 1px. 컨트롤 테두리는 `line-strong`.
- 글자는 `ink`, 보조 글자·표 머리·출처는 `ink-muted`.
- `accent`는 주 버튼 바탕, 링크, 활성 메뉴, 단일 스트리머 차트 선. `accent-soft`는 선택 행·활성 메뉴 바탕과 차트 영역 채움.
- `live`는 LIVE 점 전용. 면을 칠하지 않는다.
- 증감은 `rise`(초록 ▲)와 `fall`(빨강 ▼). 기호를 빼지 않는다.
- 플랫폼은 `platform-chzzk`, `platform-soop`, `platform-youtube`. 점과 플랫폼 비교 차트에만 쓰고, 이름을 함께 둔다. `accent`를 플랫폼 색으로 쓰지 않는다.
- 포커스는 `focus-ring` 2px 실선.

## 글꼴

- IBM Plex Sans KR 한 가족만 쓴다. 굵기로 위계를 만든다.
- 페이지 제목 `heading-xl`(모바일 22px), 패널 제목 `heading-lg`, 작은 제목 `title`, 본문·표 `body`, 채널명 `body-strong`, 버튼·라벨 `label`, 기준 시각·출처 `caption`.
- 숫자는 `stat-xl`, `stat`, `table-num`. 반드시 `font-variant-numeric: tabular-nums`, 표에서는 오른쪽 정렬.
- Google Fonts에서 불러온다.

## 간격과 모양

- 4px 단위 `space-1`~`space-8`. 패널 안쪽 PC `space-6`, 모바일 `space-4`. 페이지 좌우 여백 PC `space-8`, 모바일 `space-4`.
- 모서리는 작게: 태그 `radius-sm`(4), 버튼·입력 `radius-md`(6), 패널 `radius-lg`(8). 동그라미는 식별 점과 아바타만.
- 그림자를 쓰지 않는다.

## 레이아웃

- PC: 가운데 최대 1200px. 상단바(로고 · 메뉴 · 검색), 페이지 제목 줄(제목 + SourceNote), 핵심 지표 띠, 본문 2열(넓은 표 + 320px 사이드 패널).
- 모바일(760px 이하): 한 열. 상단바는 로고 · 검색 · 햄버거 메뉴. 표는 플랫폼·카테고리 열을 숨기고 채널 셀에 합친다.
- 푸터에 지표 정의, 개인정보처리방침, 스트리머 정보 삭제 요청 링크를 둔다.

## 차트

- 선 차트, 선 2px, 격자 `chart-grid`, 축 글자 `caption`. 단일 스트리머는 `accent`, 플랫폼 비교는 플랫폼 토큰.
- 수집이 끊긴 구간은 선을 끊고 회색 띠로 표시하며 0으로 내리지 않는다.
- 최고점에는 점과 값을 표시한다. 범례 대신 선 끝에 이름을 붙인다.

## 이미지와 아이콘

- 와글 로고 파일은 아직 없다. 워드마크는 "와글"을 IBM Plex Sans KR 700으로 쓴다.
- 스트리머 프로필은 플랫폼이 준 원본 URL을 그대로 표시한다. 없으면 이니셜 아바타.
- 플랫폼 로고 이미지는 쓰지 않는다.
- 아이콘은 Lucide(1.75px 선)를 임시로 쓴다.

## 컴포넌트

| 컴포넌트 | 쓰는 곳 |
| --- | --- |
| Button | 주·보조 행동 |
| PlatformBadge | 플랫폼 식별 |
| LiveBadge | LIVE 점, 급상승·신기록·분류 태그 |
| Segmented | 플랫폼 필터, 기간 전환 |
| Panel | 내용 묶음 |
| SourceNote | 기준 시각·출처·비교 기준 |
| RankTable | 랭킹·목록 표 |
| Delta | 증감 |
| StatTile | 핵심 지표 띠 |

스타일은 `components/bundle.css`의 `wg-` 클래스에 있다.

---

## Button

행동을 일으키는 사각 버튼. `wg-btn`에 종류 클래스 하나를 붙인다. 모서리 `radius-md`(6px).

- `wg-btn--primary`: 화면의 주 행동 하나(비교에 추가). `accent` 바탕, `on-accent` 글자. 한 화면에 하나만.
- `wg-btn--secondary`: 보조 행동(CSV 내려받기, 공유). `surface` 바탕, `line-strong` 테두리.
- `wg-btn--ghost`: "전체 보기" 같은 이동. `accent` 글자만.
- `wg-btn--sm`: 패널 머리·표 위 작은 버튼(32px).

라벨은 동사로 끝낸다. 기본 높이 40px, 모바일 주요 버튼은 44px로 키운다.

### 마크업 예시

```html
<div class="wg" style="padding:24px;background:var(--bg);display:flex;flex-wrap:wrap;gap:8px;align-items:center">
  <button class="wg-btn wg-btn--primary">비교에 추가</button>
  <button class="wg-btn wg-btn--secondary">CSV 내려받기</button>
  <button class="wg-btn wg-btn--ghost">전체 보기</button>
  <button class="wg-btn wg-btn--secondary wg-btn--sm">공유</button>
  <button class="wg-btn wg-btn--secondary" disabled>준비 중</button>
</div>
```

---

## PlatformBadge

방송 플랫폼을 알려주는 색 점과 이름. `wg-platform wg-platform--chzzk|soop|youtube`.

- 색만으로 구분하지 않는다. 점 옆에 항상 플랫폼 이름을 둔다.
- 플랫폼 로고 이미지는 쓰지 않는다. 상표는 설명 용도의 이름으로만 표시한다.
- 차트에서 플랫폼별 시리즈도 같은 토큰을 쓴다. `accent`(남색)는 플랫폼 색으로 쓰지 않는다.

### 마크업 예시

```html
<div class="wg" style="padding:24px;background:var(--surface);display:flex;gap:20px;align-items:center">
  <span class="wg-platform wg-platform--chzzk">치지직</span>
  <span class="wg-platform wg-platform--soop">SOOP</span>
  <span class="wg-platform wg-platform--youtube">유튜브</span>
</div>
```

---

## LiveBadge

방송 중 표시 `wg-live`와 작은 글자 태그 `wg-tag`.

- `wg-live`: 빨간 점 + "LIVE" 글자. 면을 칠하지 않는다. 방송 중인 채널에만.
- `wg-tag--accent`: "급상승"(1시간 전 대비 50% 이상 증가), "신기록"(채널 최고 동시 시청자 경신)처럼 정해진 조건에만. 한 행에 하나까지.
- `wg-tag`: 카테고리처럼 의미가 중립적인 분류.

### 마크업 예시

```html
<div class="wg" style="padding:24px;background:var(--surface);display:flex;gap:16px;align-items:center">
  <span class="wg-live">LIVE</span>
  <span class="wg-tag wg-tag--accent">급상승</span>
  <span class="wg-tag wg-tag--accent">신기록</span>
  <span class="wg-tag">게임</span>
</div>
```

---

## Segmented

같은 데이터를 거르거나 범위를 바꾸는 세그먼트 컨트롤. 플랫폼 필터와 기간(일·주·월·전체) 전환에 쓴다. `wg-seg` 안에 `button` + `aria-pressed`(필터) 또는 `role="tab"` + `aria-selected`(기간).

- 2~5개까지. 그보다 많으면 드롭다운을 쓴다.
- 선택된 항목은 `surface` 바탕, 굵은 `ink`. 나머지는 `ink-muted`.
- 데이터가 없는 기간은 숨기지 않고 비활성으로 둔다.

### 마크업 예시

```html
<div class="wg" style="padding:24px;background:var(--bg);display:flex;flex-direction:column;gap:12px;align-items:flex-start">
  <div class="wg-seg" role="toolbar" aria-label="플랫폼">
    <button aria-pressed="true">전체</button><button aria-pressed="false">치지직</button><button aria-pressed="false">SOOP</button><button aria-pressed="false">유튜브</button>
  </div>
  <div class="wg-seg" role="tablist" aria-label="기간">
    <button role="tab" aria-selected="false">일</button><button role="tab" aria-selected="true">주</button><button role="tab" aria-selected="false">월</button><button role="tab" aria-selected="false">전체</button>
  </div>
</div>
```

---

## Panel

내용을 묶는 흰 판. `wg-panel` 안에 `wg-panel__head`(제목 + 기준·출처·버튼)와 `wg-panel__body`.

- 그림자 없이 `line` 테두리와 `radius-lg`(8px)로만 구분한다.
- 표를 담을 때는 `wg-panel__body` 없이 표를 바로 넣어 가장자리까지 채운다.
- 머리 오른쪽에는 SourceNote(기준 시각·출처)나 작은 버튼을 둔다.

### 마크업 예시

```html
<div class="wg" style="padding:24px;background:var(--bg)">
  <section class="wg-panel" style="max-width:520px">
    <div class="wg-panel__head">
      <h2 class="wg-panel__title">지금 뜨는 카테고리</h2>
      <span class="wg-source">1시간 전 대비</span>
    </div>
    <div class="wg-panel__body" style="display:flex;flex-direction:column;gap:10px;font-size:14px">
      <div style="display:flex;justify-content:space-between"><span>스포츠</span><span class="wg-delta wg-delta--rise">▲ 64%</span></div>
      <div style="display:flex;justify-content:space-between"><span>음악</span><span class="wg-delta wg-delta--rise">▲ 31%</span></div>
    </div>
  </section>
</div>
```

---

## SourceNote

숫자의 기준 시각, 출처, 비교 기준을 밝히는 한 줄. `wg-source`. 와글의 신뢰를 만드는 가장 중요한 요소다.

- 숫자가 나오는 모든 패널 머리 또는 페이지 제목 옆에 둔다.
- 형식: "`<b>YYYY-MM-DD HH:mm</b>` 기준", "출처: <플랫폼> 공식 API", "증감은 10분 전 대비".
- 수집이 끊긴 구간이 있으면 "수집 공백 n구간"을 함께 적는다.
- "지표 정의" 링크로 계산 방법 페이지에 연결한다.

### 마크업 예시

```html
<div class="wg" style="padding:24px;background:var(--surface);display:flex;flex-direction:column;gap:8px">
  <span class="wg-source"><b>2026-10-18 22:20</b> 기준 · 1분마다 갱신</span>
  <span class="wg-source">출처: 치지직·SOOP·YouTube 공식 API · <a href="#" style="color:var(--accent)">지표 정의</a></span>
</div>
```

---

## RankTable

랭킹과 목록은 표로 보여준다. `wg-table` 안에 순위(`rank`), 채널(`wg-channel`), 플랫폼, 카테고리, 숫자(`num`), 증감 열.

- 숫자 열은 오른쪽 정렬, 탭룰러 숫자, 천 단위 콤마. 표 안에서는 "4.2만" 대신 정확한 값을 쓴다.
- 채널 셀은 아바타(32px) + 이름 + 방송 제목 한 줄(말줄임).
- 즐겨찾기한 채널 행은 `mine`(`accent-soft` 바탕).
- 모바일(760px 이하)에서는 플랫폼·카테고리 열을 숨기고 채널 셀 둘째 줄에 합친다.
- 아바타는 플랫폼이 준 원본 URL을 그대로 표시한다. 저장·가공하지 않는다.

### 마크업 예시

```html
<div class="wg" style="padding:24px;background:var(--bg)">
  <div class="wg-panel" style="overflow:hidden">
    <table class="wg-table">
      <thead><tr><th class="rank">#</th><th>채널</th><th>플랫폼</th><th>카테고리</th><th style="text-align:right">시청자</th><th style="text-align:right">10분 증감</th></tr></thead>
      <tbody>
        <tr><td class="rank">1</td><td><div class="wg-channel"><span class="wg-avatar">모</span><div style="min-width:0"><div class="wg-channel__name">모카라떼 <span class="wg-tag wg-tag--accent">급상승</span></div><div class="wg-channel__sub">새벽 랭크 올리기 끝까지 간다</div></div></div></td><td><span class="wg-platform wg-platform--chzzk">치지직</span></td><td>게임</td><td class="num">41,820</td><td class="num"><span class="wg-delta wg-delta--rise">▲ 10,960</span></td></tr>
        <tr><td class="rank">2</td><td><div class="wg-channel"><span class="wg-avatar">새</span><div style="min-width:0"><div class="wg-channel__name">새벽두시</div><div class="wg-channel__sub">구독자 이벤트 같이 봐요</div></div></div></td><td><span class="wg-platform wg-platform--soop">SOOP</span></td><td>저스트채팅</td><td class="num">28,140</td><td class="num"><span class="wg-delta wg-delta--fall">▼ 2,140</span></td></tr>
        <tr class="mine"><td class="rank">3</td><td><div class="wg-channel"><span class="wg-avatar">볶</span><div style="min-width:0"><div class="wg-channel__name">볶음밥장인</div><div class="wg-channel__sub">오늘은 야식 먹방</div></div></div></td><td><span class="wg-platform wg-platform--youtube">유튜브</span></td><td>먹방</td><td class="num">19,050</td><td class="num"><span class="wg-delta wg-delta--flat">– 0</span></td></tr>
      </tbody>
    </table>
  </div>
</div>
```

---

## Delta

이전 기간 대비 변화량. `wg-delta` + `--rise | --fall | --flat`.

- 증가는 `rise`(초록) + ▲, 감소는 `fall`(빨강) + ▼, 변화 없음은 `ink-muted` + –. 기호를 빼지 않는다. 색만으로 방향을 전달하지 않기 위해서다.
- 비교 기준(10분 전, 전주)은 표 머리나 SourceNote에 밝힌다.

### 마크업 예시

```html
<div class="wg" style="padding:24px;background:var(--surface);display:flex;gap:20px;align-items:center">
  <span class="wg-delta wg-delta--rise">▲ 12.4%</span>
  <span class="wg-delta wg-delta--fall">▼ 3,210</span>
  <span class="wg-delta wg-delta--flat">– 0</span>
</div>
```

---

## StatTile

핵심 지표를 한 줄 띠로 보여준다. `wg-stats`(테두리 하나로 묶은 띠) 안에 `wg-stat`. 칸 사이는 세로 구분선.

- 가장 중요한 지표 하나만 `wg-stat--key`(32px 숫자). 색을 칠하지 않는다.
- 라벨에 기간을 적는다("최근 30일"). 단위는 숫자 뒤 `<small>`.
- 모바일에서는 2열로 접는다.

### 마크업 예시

```html
<div class="wg" style="padding:24px;background:var(--bg)">
  <div class="wg-stats">
    <div class="wg-stat wg-stat--key"><div class="wg-stat__label">지금 전체 시청자</div><div class="wg-stat__value">613,240</div><div class="wg-delta wg-delta--rise">▲ 4.1% 1시간 전 대비</div></div>
    <div class="wg-stat"><span class="wg-platform wg-platform--chzzk">치지직</span><div class="wg-stat__value">356,120</div><div class="wg-stat__label">방송 1,204개</div></div>
    <div class="wg-stat"><span class="wg-platform wg-platform--soop">SOOP</span><div class="wg-stat__value">190,040</div><div class="wg-stat__label">방송 702개</div></div>
    <div class="wg-stat"><span class="wg-platform wg-platform--youtube">유튜브</span><div class="wg-stat__value">67,080</div><div class="wg-stat__label">방송 278개</div></div>
  </div>
</div>
```

---

## 참조 스타일: 컴포넌트 (bundle.css)

```css
@import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;600;700&display=swap");

/* 와글 v2 컴포넌트 스타일. 값은 모두 tokens.css 변수에서 온다. */
.wg { font-family: var(--font-sans); color: var(--ink); -webkit-font-smoothing: antialiased; }
.wg *, .wg *::before, .wg *::after { box-sizing: border-box; }
.wg-num { font-variant-numeric: tabular-nums; }
.wg :focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }

/* Button */
.wg-btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2);
  height: 40px; padding: 0 var(--space-4); border-radius: var(--radius-md); border: 1px solid transparent; cursor: pointer;
  font: 600 14px/1 var(--font-sans); white-space: nowrap; }
.wg-btn--primary { background: var(--accent); color: var(--on-accent); }
.wg-btn--secondary { background: var(--surface); color: var(--ink); border-color: var(--line-strong); }
.wg-btn--ghost { background: transparent; color: var(--accent); padding: 0 var(--space-2); }
.wg-btn--sm { height: 32px; padding: 0 var(--space-3); font-size: 13px; }
.wg-btn[disabled] { opacity: .4; cursor: not-allowed; }

/* PlatformBadge */
.wg-platform { display: inline-flex; align-items: center; gap: 6px; font: 400 13px/18px var(--font-sans); color: var(--ink); white-space: nowrap; }
.wg-platform::before { content: ""; flex: none; width: 8px; height: 8px; border-radius: var(--radius-pill); background: var(--line-strong); }
.wg-platform--chzzk::before { background: var(--platform-chzzk); }
.wg-platform--soop::before { background: var(--platform-soop); }
.wg-platform--youtube::before { background: var(--platform-youtube); }

/* LiveDot · Tag */
.wg-live { display: inline-flex; align-items: center; gap: 5px; font: 600 12px/16px var(--font-sans); color: var(--live); letter-spacing: .3px; }
.wg-live::before { content: ""; width: 7px; height: 7px; border-radius: var(--radius-pill); background: var(--live); }
.wg-tag { display: inline-flex; align-items: center; height: 20px; padding: 0 6px; border-radius: var(--radius-sm);
  border: 1px solid var(--line); background: var(--surface-sunken); color: var(--ink-muted); font: 500 11px/1 var(--font-sans); white-space: nowrap; }
.wg-tag--accent { border-color: transparent; background: var(--accent-soft); color: var(--accent); }

/* Segmented (필터·기간) */
.wg-seg { display: inline-flex; padding: 3px; gap: 2px; border-radius: var(--radius-md); background: var(--surface-sunken); border: 1px solid var(--line); }
.wg-seg button { height: 30px; padding: 0 12px; border: 0; border-radius: 4px; background: transparent; color: var(--ink-muted);
  font: 500 13px/1 var(--font-sans); cursor: pointer; white-space: nowrap; }
.wg-seg button[aria-pressed="true"], .wg-seg button[aria-selected="true"] { background: var(--surface); color: var(--ink); font-weight: 700; box-shadow: 0 0 0 1px var(--line); }

/* Panel */
.wg-panel { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg); }
.wg-panel__head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); flex-wrap: wrap; padding: var(--space-4) var(--space-6); border-bottom: 1px solid var(--line); }
.wg-panel__body { padding: var(--space-4) var(--space-6); }
.wg-panel__title { margin: 0; font: 700 18px/26px var(--font-sans); }

/* SourceNote: 기준 시각과 출처 */
.wg-source { display: inline-flex; align-items: center; gap: 6px; font: 400 12px/16px var(--font-sans); color: var(--ink-muted); }
.wg-source b { font-weight: 600; color: var(--ink-muted); }

/* Table */
.wg-table { width: 100%; border-collapse: collapse; font: 400 14px/20px var(--font-sans); }
.wg-table th { padding: 10px var(--space-4); background: var(--surface-sunken); border-bottom: 1px solid var(--line);
  font: 500 12px/16px var(--font-sans); color: var(--ink-muted); text-align: left; white-space: nowrap; }
.wg-table td { padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--line); vertical-align: middle; }
.wg-table tr:last-child td { border-bottom: 0; }
.wg-table tbody tr:hover td { background: var(--surface-sunken); }
.wg-table .num { text-align: right; font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; }
.wg-table .rank { width: 48px; text-align: right; font-weight: 600; color: var(--ink-muted); font-variant-numeric: tabular-nums; }
.wg-table .mine td { background: var(--accent-soft); }

/* Channel cell */
.wg-channel { display: flex; align-items: center; gap: var(--space-3); min-width: 0; }
.wg-avatar { flex: none; display: grid; place-items: center; width: 32px; height: 32px; border-radius: var(--radius-pill);
  background: var(--surface-sunken); border: 1px solid var(--line); color: var(--ink-muted); font: 600 13px/1 var(--font-sans); overflow: hidden; }
.wg-avatar img { width: 100%; height: 100%; object-fit: cover; }
.wg-channel__name { display: flex; align-items: center; gap: var(--space-2); font-weight: 600; white-space: nowrap; }
.wg-channel__sub { font-size: 12px; line-height: 16px; color: var(--ink-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Delta */
.wg-delta { font: 500 12px/16px var(--font-sans); font-variant-numeric: tabular-nums; white-space: nowrap; }
.wg-delta--rise { color: var(--rise); }
.wg-delta--fall { color: var(--fall); }
.wg-delta--flat { color: var(--ink-muted); }

/* StatTile */
.wg-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border: 1px solid var(--line); border-radius: var(--radius-lg); background: var(--surface); overflow: hidden; }
.wg-stat { padding: var(--space-4) var(--space-6); border-left: 1px solid var(--line); display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.wg-stat:first-child { border-left: 0; }
.wg-stat__label { font: 500 13px/18px var(--font-sans); color: var(--ink-muted); }
.wg-stat__value { font: 700 20px/28px var(--font-sans); font-variant-numeric: tabular-nums; }
.wg-stat__value small { font-size: 13px; font-weight: 500; color: var(--ink-muted); margin-left: 2px; }
.wg-stat--key .wg-stat__value { font-size: 32px; line-height: 38px; letter-spacing: -0.5px; }

/* Share bar */
.wg-bar { height: 6px; border-radius: var(--radius-sm); background: var(--surface-sunken); overflow: hidden; }
.wg-bar > span { display: block; height: 100%; background: var(--accent); border-radius: var(--radius-sm); }
```

## 참조 스타일: 반응형 레이아웃 (layout.css)

화면 시안에 쓴 레이아웃 규칙이다. 모바일 전환 기준은 페이지 폭 760px(컨테이너 쿼리). 실제 구현에서는 미디어 쿼리 `(max-width: 760px)`로 바꿔도 된다. 햄버거 메뉴는 시안에서 absolute로 그렸지만 실제로는 `position: fixed` 전체 화면 덮개로 구현한다.

```css
/* 와글 v2 반응형 레이아웃. 기준: 페이지 폭 760px 이하 = 모바일 (컨테이너 쿼리) */
.wg-page { container-type: inline-size; position: relative; min-height: 100%; background: var(--bg); color: var(--ink); font-family: var(--font-sans); font-size: 14px; line-height: 22px; }
.wg-page a { color: inherit; text-decoration: none; }
.wg-page a.wg-link { color: var(--accent); }
.wg-shell { max-width: 1200px; margin: 0 auto; padding: 0 32px; box-sizing: border-box; }

/* 상단바 */
.wg-topbar { background: var(--surface); border-bottom: 1px solid var(--line); }
.wg-topbar__in { display: flex; align-items: stretch; gap: 32px; height: 60px; }
.wg-logo { display: flex; align-items: center; font: 700 22px/1 var(--font-sans); letter-spacing: -0.6px; color: var(--ink); }
.wg-nav { display: flex; gap: 24px; }
.wg-navlink { display: flex; align-items: center; font-size: 14px; font-weight: 500; color: var(--ink-muted); border-bottom: 2px solid transparent; margin-bottom: -1px; }
.wg-navlink[aria-current="page"] { color: var(--ink); font-weight: 700; border-bottom-color: var(--accent); }
.wg-search { margin-left: auto; align-self: center; display: flex; align-items: center; gap: 8px; width: 260px; height: 36px; padding: 0 12px; box-sizing: border-box; border-radius: var(--radius-md); border: 1px solid var(--line); background: var(--surface-sunken); color: var(--ink-muted); }
.wg-search input { flex: 1; min-width: 0; border: 0; background: transparent; font: 400 14px/20px var(--font-sans); color: var(--ink); outline: none; }
.wg-search input::placeholder { color: var(--ink-muted); }
.wg-iconbtn { display: none; place-items: center; width: 44px; height: 44px; border: 0; border-radius: var(--radius-md); background: transparent; color: var(--ink); cursor: pointer; }
.wg-topbar__actions { display: none; margin-left: auto; align-items: center; gap: 0; }

/* 페이지 제목 */
.wg-pagehead { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px 16px; flex-wrap: wrap; padding: 28px 0 16px; }
.wg-h1 { margin: 0; font-size: 28px; line-height: 36px; font-weight: 700; letter-spacing: -0.4px; }
.wg-caption { font-size: 12px; line-height: 16px; color: var(--ink-muted); }

/* 레이아웃 */
.wg-cols { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 16px; align-items: start; }
.wg-stack { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.wg-only-mob { display: none; }
.wg-panel { overflow: hidden; }

/* 푸터 */
.wg-footer { margin-top: 40px; border-top: 1px solid var(--line); padding: 20px 0 40px; display: flex; flex-wrap: wrap; gap: 8px 24px; justify-content: space-between; }
.wg-footer nav { display: flex; gap: 16px; flex-wrap: wrap; }

/* 모바일 메뉴 (햄버거) */
.wg-backdrop { position: absolute; inset: 0; background: rgba(13, 17, 23, 0.5); z-index: 10; }
.wg-drawer { position: absolute; top: 0; right: 0; width: min(300px, 84%); height: 844px; max-height: 100%; box-sizing: border-box; background: var(--surface); border-left: 1px solid var(--line); z-index: 11; display: flex; flex-direction: column; padding: 0 16px 24px; }
.wg-drawer__head { display: flex; align-items: center; justify-content: space-between; height: 60px; border-bottom: 1px solid var(--line); margin: 0 -16px; padding: 0 4px 0 16px; }
.wg-drawer__nav { display: flex; flex-direction: column; padding: 8px 0; }
.wg-drawer__nav a { display: flex; align-items: center; justify-content: space-between; height: 48px; padding: 0 4px; border-bottom: 1px solid var(--line); font-size: 15px; font-weight: 600; }
.wg-drawer__nav a[aria-current="page"] { color: var(--accent); }
.wg-drawer__foot { margin-top: auto; display: flex; flex-direction: column; gap: 8px; }

/* 차트 */
.wg-chart text { font-family: var(--font-sans); }

@container (max-width: 760px) {
  .wg-shell { padding: 0 16px; }
  .wg-topbar__in { height: 56px; gap: 8px; }
  .wg-nav, .wg-search { display: none; }
  .wg-topbar__actions { display: flex; }
  .wg-iconbtn { display: grid; }
  .wg-pagehead { padding: 20px 0 12px; }
  .wg-h1 { font-size: 22px; line-height: 30px; }
  .wg-cols { grid-template-columns: minmax(0, 1fr); gap: 12px; }
  .wg-stack { gap: 12px; }
  .wg-panel__head, .wg-panel__body { padding-left: 16px; padding-right: 16px; }
  .wg-table th, .wg-table td { padding-left: 12px; padding-right: 12px; }
  .wg-table .rank { width: 32px; padding-right: 0; }
  .wg-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .wg-stat { padding: 12px 16px; border-left: 0; border-top: 1px solid var(--line); }
  .wg-stat:nth-child(2n) { border-left: 1px solid var(--line); }
  .wg-stat:nth-child(-n+2) { border-top: 0; }
  .wg-stat--key .wg-stat__value { font-size: 24px; line-height: 30px; }
  .wg-only-desk { display: none !important; }
  .wg-only-mob { display: block; }
  .wg-footer { margin-top: 32px; flex-direction: column; }
}
```
