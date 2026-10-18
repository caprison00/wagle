# 와글 컴포넌트 규칙 (design v1)

디자인 시스템 원본: claude.ai의 '와글' 디자인 시스템. 이 파일은 그 내용을 Claude Code가 읽을 수 있게 옮긴 것이다.
토큰 값은 `design/tokens.json`이 기준이며, 아래 CSS의 `var(--토큰명)`은 tokens.json의 토큰 이름과 1:1로 대응한다.
(`--font-display`, `--font-sans`는 `type.families`의 키.)

---

# 브랜드 가이드

와글은 "지금 가장 와글와글한 방송"을 보여주는 시청자 통계 서비스다. 숫자는 정확하고 차분하게, 분위기는 팬덤처럼 밝고 신나게 만든다. 모바일 우선, 라이트 기본에 다크를 지원한다.

## 원칙

1. **숫자가 주인공.** 한 화면에서 가장 큰 글자는 시청자 수다. 장식은 숫자를 돋보이게 할 때만 쓴다.
2. **밝지만 시끄럽지 않게.** 핑크(`brand`)와 옐로(`accent`)는 화면당 한두 곳에만 칠한다. 나머지는 `surface`와 `ink`로 차분하게.
3. **누구나 같은 정보.** 로그인·유료 구분이 없으므로 잠금 아이콘, 흐림 처리, "프리미엄" 표기를 쓰지 않는다.
4. **색만으로 말하지 않는다.** 플랫폼은 점 + 이름, 증감은 색 + ▲▼ 기호.

## 말투와 표기

- 해요체, 짧게. "지금 4.2만 명이 보고 있어요", "데이터를 모으는 중이에요".
- 버튼은 동사로 끝낸다: "비교에 추가", "CSV 내려받기", "공유".
- 숫자: 1만 미만은 콤마(3,210), 1만 이상은 "4.2만", 1억 이상은 "1.2억". 시간은 "3시간 12분".
- 기간과 기준을 항상 밝힌다: "최근 30일", "10분 전 대비".
- 빈 상태와 오류도 해요체로, 다음 행동을 알려준다: "아직 쌓인 기록이 없어요. 방송이 시작되면 여기에 보여요."
- 이모지를 UI에 쓰지 않는다. 스트리머가 방송 제목에 쓴 이모지는 그대로 보여준다.

## 색

- 페이지는 `bg`, 카드·리스트는 `surface`, 들어간 면(검색창, 탭 바탕, 차트 영역)은 `surface-sunken`.
- 글자는 `ink`, 보조 글자는 `ink-muted`. 이 둘은 세 면 모두에서 4.5:1 이상이다.
- `brand`(와글 핑크)는 면과 선에만 쓴다: 활성 표시, 1위 강조, 차트의 선택 시리즈. 핑크 글자가 필요하면 `brand-strong`.
- 주 버튼은 `brand-strong` 바탕에 `on-brand` 글자. 다크에서는 밝은 핑크 바탕에 어두운 글자로 바뀐다.
- `accent`(와글 옐로)는 급상승·신기록 배지와 하이라이트 카드(`accent-soft`)에만.
- `live`는 방송 중 표시 전용. 경고나 감소에 쓰지 않는다.
- 증감은 `rise`(초록, ▲)와 `fall`(파랑, ▼). 빨강-초록 대비에 기대지 않는다.
- 플랫폼은 `platform-chzzk`, `platform-soop`, `platform-youtube`. 점과 차트 시리즈에만 쓰고, 플랫폼 이름 글자를 함께 둔다.
- 포커스는 `focus-ring` 2px 실선, 2px 띄움. 모든 면 위에서 3:1 이상이다.

## 글꼴

- 디스플레이는 Bagel Fat One(`display-xl`, `display-lg`): 워드마크와 화면 제목에만, 화면당 한 번.
- 나머지는 IBM Plex Sans KR. 본문 `body`, 이름 `body-strong`, 라벨 `label`, 보조 `caption`, 섹션 제목 `title`.
- 숫자는 `stat-xl`, `stat`, `rank`이며 반드시 `font-variant-numeric: tabular-nums`로 자릿수를 맞춘다.
- 두 글꼴 모두 Google Fonts에서 불러온다. 파일을 저장소에 넣지 않는다.

## 간격과 모양

- 4px 단위: `space-1`(4) ~ `space-8`(32). 모바일 좌우 여백은 `space-4`, 데스크톱은 `space-8`.
- 모서리는 둥글게: 배지 `radius-sm`, 행·타일 `radius-md`, 카드 `radius-lg`, 칩·버튼·아바타 `radius-pill`.
- 그림자는 `shadow-card` 하나뿐이며 라이트에서만 보인다. 다크에서는 `surface`와 `bg`의 단차로 구분한다.
- 터치 대상은 높이 44px 이상(작은 버튼 32px은 카드 안에서만).

## 레이아웃

- 375px 한 열을 기본으로 설계하고, 1280px에서는 가운데 최대 1120px, 랭킹과 차트를 2열로 놓는다.
- 상단: 워드마크 + 검색. 하단 탭(모바일): 라이브 · 카테고리 · 기록 · 검색.
- "지금 라이브"는 FilterChips → RankRow 리스트 순서. 1분마다 조용히 갱신하고, 순위가 바뀐 행만 살짝 강조한다.

## 차트

- 시청자 추이는 선 차트, 격자 `chart-grid`, 선 2px. 한 스트리머는 `brand`, 플랫폼 비교는 플랫폼 토큰.
- 수집이 끊긴 구간은 선을 끊어 그리고 0으로 내리지 않는다.
- 비교 차트는 최대 4개 시리즈. 범례 대신 선 끝에 이름을 직접 붙인다.

## 이미지와 아이콘

- 와글 로고 파일은 아직 없다. 워드마크는 "와글"을 `display-xl`로 쓴다.
- 스트리머 프로필·방송 썸네일은 플랫폼이 준 원본 URL을 그대로 표시하고 저장·가공하지 않는다. 없으면 이니셜 아바타.
- 플랫폼 로고 이미지는 쓰지 않는다. PlatformBadge의 점과 이름으로 표시한다.
- 아이콘 세트는 정해지지 않았다. 구현 시 Lucide(오픈소스, 1.75px 선)를 임시로 쓰고, 확정되면 이 문서를 고친다.

## 컴포넌트

| 컴포넌트 | 쓰는 곳 |
| --- | --- |
| Button | 주·보조 행동 |
| PlatformBadge | 플랫폼 식별 |
| LiveBadge | 방송 중, 급상승, 신기록 |
| FilterChips | 플랫폼·카테고리 필터 |
| Tabs | 기간 전환 |
| RankRow | 지금 라이브 랭킹 |
| Delta | 증감 표시 |
| StatTile | 스트리머 상세 핵심 지표 |

스타일은 `components/bundle.css`의 `wg-` 클래스에 있다. 코드로 옮길 때는 같은 토큰 값을 Tailwind 설정으로 옮기고 클래스 구조를 따른다.

---

## Button

화면에서 행동을 일으키는 알약 모양 버튼. 클래스 `wg-btn`에 종류 클래스 하나를 붙인다.

- `wg-btn--primary`: 화면의 주 행동 하나(비교에 추가, 공유). `brand-strong` 바탕에 `on-brand` 글자. 한 화면에 하나만.
- `wg-btn--secondary`: 보조 행동(CSV 내려받기, 기간 변경). `surface` 바탕, `line-strong` 테두리.
- `wg-btn--ghost`: 리스트 끝 "전체 보기" 같은 이동 링크.
- `wg-btn--sm`: 카드 안 작은 버튼. 높이 32px.

사용하는 쪽이 정할 것: 라벨(동사로 끝나는 2~6자), 클릭 동작, 비활성 여부. 높이 44px은 모바일 터치 최소 크기라 줄이지 않는다.

### 마크업 예시

```html
<div class="wg" style="padding:24px;background:var(--bg);display:flex;flex-wrap:wrap;gap:12px;align-items:center">
  <button class="wg-btn wg-btn--primary">비교에 추가</button>
  <button class="wg-btn wg-btn--secondary">CSV 내려받기</button>
  <button class="wg-btn wg-btn--ghost">전체 보기</button>
  <button class="wg-btn wg-btn--primary wg-btn--sm">공유</button>
  <button class="wg-btn wg-btn--secondary" disabled>준비 중</button>
</div>
```

---

## PlatformBadge

방송이 어느 플랫폼인지 알려주는 색 점과 플랫폼 이름. `wg-platform wg-platform--chzzk|soop|youtube`.

- 색만으로 구분하지 않는다. 점 옆에 항상 플랫폼 이름 글자를 둔다.
- 플랫폼 로고 이미지는 쓰지 않는다. 상표는 설명 용도의 이름 글자로만 표시한다.
- 차트에서 플랫폼별 시리즈 색도 같은 토큰(`platform-chzzk`, `platform-soop`, `platform-youtube`)을 쓴다.

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

방송 중임을 알리는 `wg-live`와, 주목할 변화를 알리는 `wg-hot` 배지.

- `wg-live`: `live` 바탕, 흰 점 + "LIVE". 방송 중인 채널에만. 끝난 방송에는 배지 대신 "3시간 전 종료" 같은 캡션을 쓴다.
- `wg-hot`: `accent` 바탕. "급상승"(1시간 전 대비 시청자 50% 이상 증가), "신기록"(채널 최고 동시 시청자 경신)처럼 정해진 조건에만 붙인다. 한 행에 하나까지.

### 마크업 예시

```html
<div class="wg" style="padding:24px;background:var(--surface);display:flex;gap:12px;align-items:center">
  <span class="wg-live">LIVE</span>
  <span class="wg-hot">급상승</span>
  <span class="wg-hot">신기록</span>
</div>
```

---

## FilterChips

목록을 거르는 가로 스크롤 칩 묶음. 바깥 `wg-chips`, 각 칩 `wg-chip` + `aria-pressed`.

- 선택된 칩은 `ink` 바탕에 `bg` 글자로 뒤집는다.
- 맨 앞은 항상 "전체". 플랫폼 칩에는 PlatformBadge 점을 넣는다.
- 모바일에서는 줄바꿈 없이 가로로 스크롤한다. 좌우 여백 `space-4`.
- 사용하는 쪽이 정할 것: 칩 목록, 단일 선택인지 다중 선택인지, 선택 상태.

### 마크업 예시

```html
<div class="wg" style="padding:24px 16px;background:var(--bg)">
  <div class="wg-chips" role="toolbar" aria-label="플랫폼 필터">
    <button class="wg-chip" aria-pressed="true">전체</button>
    <button class="wg-chip" aria-pressed="false"><span class="wg-platform wg-platform--chzzk" style="color:inherit">치지직</span></button>
    <button class="wg-chip" aria-pressed="false"><span class="wg-platform wg-platform--soop" style="color:inherit">SOOP</span></button>
    <button class="wg-chip" aria-pressed="false"><span class="wg-platform wg-platform--youtube" style="color:inherit">유튜브</span></button>
    <button class="wg-chip" aria-pressed="false">게임</button>
    <button class="wg-chip" aria-pressed="false">저스트채팅</button>
  </div>
</div>
```

---

## Tabs

같은 데이터를 다른 범위로 보는 세그먼트 탭. 기간(일·주·월·전체) 전환에 쓴다. `wg-tabs` 안에 `wg-tab` + `aria-selected`.

- 2~4개까지. 그보다 많으면 FilterChips를 쓴다.
- 선택된 탭은 `surface` 바탕에 굵은 `ink` 글자, 나머지는 `ink-muted`.
- 데이터가 없는 기간 탭은 숨기지 않고 비활성으로 두는 것을 기본으로 한다.

### 마크업 예시

```html
<div class="wg" style="padding:24px 16px;background:var(--bg);max-width:360px">
  <div class="wg-tabs" role="tablist">
    <button class="wg-tab" role="tab" aria-selected="false">일</button>
    <button class="wg-tab" role="tab" aria-selected="true">주</button>
    <button class="wg-tab" role="tab" aria-selected="false">월</button>
    <button class="wg-tab" role="tab" aria-selected="false">전체</button>
  </div>
</div>
```

---

## RankRow

"지금 라이브" 랭킹의 한 줄: 순위, 아바타, 스트리머 이름과 방송 제목, 플랫폼·카테고리, 동시 시청자와 변화량. `wg-rank-list` 안에 `wg-rank` 행을 둔다.

- 1~3위는 `wg-rank--top`으로 순위 숫자를 `brand-strong`으로 칠한다.
- 사용자가 즐겨찾기한 스트리머 행은 `wg-rank--mine`(`brand-soft` 바탕).
- 방송 제목은 한 줄 말줄임. 시청자 수는 오른쪽 정렬, 탭룰러 숫자.
- 아바타는 플랫폼이 준 프로필 이미지 원본 URL을 `<img>`로 넣는다. 저장·가공하지 않는다. 이미지가 없으면 이름 첫 글자.
- 변화량은 Delta 컴포넌트, 비교 기준은 10분 전 스냅샷.
- 사용하는 쪽이 정할 것: 순위, 채널 정보, 시청자 수, 변화량, 행 클릭 시 스트리머 상세로 이동.

### 마크업 예시

```html
<div class="wg" style="padding:16px;background:var(--bg);max-width:420px">
  <ol class="wg-rank-list">
    <li class="wg-rank wg-rank--top">
      <span class="wg-rank__no">1</span>
      <span class="wg-avatar wg-avatar--live">모</span>
      <div class="wg-rank__body">
        <div class="wg-rank__name">모카라떼 <span class="wg-hot">급상승</span></div>
        <div class="wg-rank__title">새벽 랭크 올리기 끝까지 간다</div>
        <div class="wg-rank__meta"><span class="wg-platform wg-platform--chzzk">치지직</span><span class="wg-platform">게임</span></div>
      </div>
      <div class="wg-rank__viewers"><div class="wg-rank__count">4.2만</div><div class="wg-delta wg-delta--rise">▲ 1.1만</div></div>
    </li>
    <li class="wg-rank">
      <span class="wg-rank__no">2</span>
      <span class="wg-avatar wg-avatar--live">새</span>
      <div class="wg-rank__body">
        <div class="wg-rank__name">새벽두시</div>
        <div class="wg-rank__title">구독자 이벤트 같이 봐요</div>
        <div class="wg-rank__meta"><span class="wg-platform wg-platform--soop">SOOP</span><span class="wg-platform">저스트채팅</span></div>
      </div>
      <div class="wg-rank__viewers"><div class="wg-rank__count">2.8만</div><div class="wg-delta wg-delta--fall">▼ 2,140</div></div>
    </li>
    <li class="wg-rank wg-rank--mine">
      <span class="wg-rank__no">3</span>
      <span class="wg-avatar wg-avatar--live">볶</span>
      <div class="wg-rank__body">
        <div class="wg-rank__name">볶음밥장인</div>
        <div class="wg-rank__title">오늘은 야식 먹방</div>
        <div class="wg-rank__meta"><span class="wg-platform wg-platform--youtube">유튜브</span><span class="wg-platform">먹방</span></div>
      </div>
      <div class="wg-rank__viewers"><div class="wg-rank__count">1.9만</div><div class="wg-delta wg-delta--flat">– 0</div></div>
    </li>
  </ol>
</div>
```

---

## Delta

이전 기간 대비 변화량. `wg-delta` + `--rise | --fall | --flat`.

- 증가는 `rise`(초록) + ▲, 감소는 `fall`(파랑) + ▼, 변화 없음은 `ink-muted` + –. 기호를 빼지 않는다. 색만으로 방향을 전달하지 않기 위해서다.
- 빨강은 LIVE와 브랜드에 쓰므로 감소에 쓰지 않는다.
- 비교 기준(10분 전, 전주 등)은 화면 어딘가에 캡션으로 밝힌다.

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

지표 하나를 라벨과 큰 숫자로 보여주는 타일. `wg-stats` 2열 격자 안에 `wg-stat`.

- 화면에서 가장 중요한 지표 하나만 `wg-stat--hero`(가로 전체, `accent-soft` 바탕, `stat-xl`).
- 라벨에는 기간을 함께 적는다("최근 30일"). 단위는 숫자 뒤 `<small>`.
- 숫자 표기: 1만 미만은 콤마(3,210), 1만 이상은 "3.1만", 1억 이상은 "1.2억". 히어로 숫자만 정확한 값 그대로.
- 사용하는 쪽이 정할 것: 라벨, 값, 단위, 변화량(선택).

### 마크업 예시

```html
<div class="wg" style="padding:16px;background:var(--bg);max-width:420px">
  <div class="wg-stats">
    <div class="wg-stat wg-stat--hero">
      <div class="wg-stat__label">최고 동시 시청자 · 최근 30일</div>
      <div class="wg-stat__value">128,430</div>
      <div class="wg-delta wg-delta--rise">▲ 18.2% 전월 대비</div>
    </div>
    <div class="wg-stat"><div class="wg-stat__label">평균 시청자</div><div class="wg-stat__value">3.1만</div></div>
    <div class="wg-stat"><div class="wg-stat__label">방송 시간</div><div class="wg-stat__value">142<small>시간</small></div></div>
    <div class="wg-stat"><div class="wg-stat__label">시청 시간</div><div class="wg-stat__value">440만<small>시간</small></div></div>
    <div class="wg-stat"><div class="wg-stat__label">주 카테고리</div><div class="wg-stat__value" style="font-size:17px">게임 72%</div></div>
  </div>
</div>
```

---

## 참조 스타일 (bundle.css)

아래는 디자인 시스템 미리보기에 쓰인 스타일이다. 구현할 때는 tokens.json → Tailwind 설정으로 옮기고, 이 클래스 구조와 수치를 따른다.

```css
@import url("https://fonts.googleapis.com/css2?family=Bagel+Fat+One&family=IBM+Plex+Sans+KR:wght@400;500;600;700&display=swap");

/* 와글 컴포넌트 스타일. 값은 모두 tokens.css 변수에서 온다. */
.wg { font-family: var(--font-sans); color: var(--ink); -webkit-font-smoothing: antialiased; }
.wg *, .wg *::before, .wg *::after { box-sizing: border-box; }
.wg-num { font-variant-numeric: tabular-nums; }

/* Button */
.wg-btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--space-1);
  height: 44px; padding: 0 var(--space-4); border-radius: var(--radius-pill); border: 0; cursor: pointer;
  font: 600 15px/1 var(--font-sans); }
.wg-btn--primary { background: var(--brand-strong); color: var(--on-brand); }
.wg-btn--secondary { background: var(--surface); color: var(--ink); box-shadow: inset 0 0 0 1px var(--line-strong); }
.wg-btn--ghost { background: transparent; color: var(--brand-strong); }
.wg-btn--sm { height: 32px; padding: 0 var(--space-3); font-size: 13px; }
.wg-btn:focus-visible, .wg-chip:focus-visible, .wg-tab:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
.wg-btn[disabled] { opacity: .4; cursor: not-allowed; }

/* PlatformBadge */
.wg-platform { display: inline-flex; align-items: center; gap: 6px; font: 500 12px/16px var(--font-sans); color: var(--ink-muted); }
.wg-platform::before { content: ""; width: 8px; height: 8px; border-radius: var(--radius-pill); background: currentColor; }
.wg-platform--chzzk::before { background: var(--platform-chzzk); }
.wg-platform--soop::before { background: var(--platform-soop); }
.wg-platform--youtube::before { background: var(--platform-youtube); }

/* LiveBadge */
.wg-live { display: inline-flex; align-items: center; gap: 4px; height: 20px; padding: 0 6px; border-radius: var(--radius-sm);
  background: var(--live); color: var(--on-live); font: 700 11px/1 var(--font-sans); letter-spacing: .4px; }
.wg-live::before { content: ""; width: 6px; height: 6px; border-radius: var(--radius-pill); background: var(--on-live); }
.wg-hot { display: inline-flex; align-items: center; height: 20px; padding: 0 6px; border-radius: var(--radius-sm);
  background: var(--accent); color: var(--on-accent); font: 700 11px/1 var(--font-sans); }

/* FilterChips */
.wg-chips { display: flex; gap: var(--space-2); overflow-x: auto; scrollbar-width: none; }
.wg-chip { flex: none; display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 14px;
  border-radius: var(--radius-pill); border: 1px solid var(--line-strong); background: var(--surface);
  color: var(--ink); font: 500 13px/1 var(--font-sans); cursor: pointer; }
.wg-chip[aria-pressed="true"] { background: var(--ink); border-color: var(--ink); color: var(--bg); }

/* Tabs */
.wg-tabs { display: flex; gap: var(--space-1); padding: var(--space-1); border-radius: var(--radius-pill); background: var(--surface-sunken); }
.wg-tab { flex: 1; height: 32px; border: 0; border-radius: var(--radius-pill); background: transparent; color: var(--ink-muted);
  font: 500 13px/1 var(--font-sans); cursor: pointer; }
.wg-tab[aria-selected="true"] { background: var(--surface); color: var(--ink); font-weight: 700; box-shadow: var(--shadow-card); }

/* Avatar (이니셜. 실제 프로필 이미지는 원본 URL로만) */
.wg-avatar { flex: none; display: grid; place-items: center; width: 44px; height: 44px; border-radius: var(--radius-pill);
  background: var(--brand-soft); color: var(--ink); font: 700 15px/1 var(--font-sans); overflow: hidden; }
.wg-avatar img { width: 100%; height: 100%; object-fit: cover; }
.wg-avatar--live { box-shadow: 0 0 0 2px var(--surface), 0 0 0 4px var(--live); }

/* RankRow */
.wg-rank-list { list-style: none; margin: 0; padding: 0; background: var(--surface); border-radius: var(--radius-lg); overflow: hidden; }
.wg-rank { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4); border-top: 1px solid var(--line); }
.wg-rank:first-child { border-top: 0; }
.wg-rank__no { width: 24px; text-align: center; font: 700 17px/22px var(--font-sans); font-variant-numeric: tabular-nums; }
.wg-rank--top .wg-rank__no { color: var(--brand-strong); }
.wg-rank--mine { background: var(--brand-soft); }
.wg-rank__body { flex: 1; min-width: 0; }
.wg-rank__name { display: flex; align-items: center; gap: 6px; font: 600 15px/22px var(--font-sans); }
.wg-rank__title { font: 400 13px/18px var(--font-sans); color: var(--ink-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wg-rank__meta { display: flex; gap: var(--space-2); margin-top: 2px; }
.wg-rank__viewers { text-align: right; }
.wg-rank__count { font: 700 17px/22px var(--font-sans); font-variant-numeric: tabular-nums; }

/* Delta */
.wg-delta { font: 600 12px/16px var(--font-sans); font-variant-numeric: tabular-nums; white-space: nowrap; }
.wg-delta--rise { color: var(--rise); }
.wg-delta--fall { color: var(--fall); }
.wg-delta--flat { color: var(--ink-muted); }

/* StatTile */
.wg-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-2); }
.wg-stat { padding: var(--space-4); border-radius: var(--radius-md); background: var(--surface); box-shadow: var(--shadow-card); }
.wg-stat__label { font: 500 13px/18px var(--font-sans); color: var(--ink-muted); }
.wg-stat__value { margin-top: var(--space-1); font: 700 20px/26px var(--font-sans); font-variant-numeric: tabular-nums; }
.wg-stat__value small { font-size: 13px; font-weight: 500; color: var(--ink-muted); margin-left: 2px; }
.wg-stat--hero { grid-column: 1 / -1; background: var(--accent-soft); box-shadow: none; }
.wg-stat--hero .wg-stat__value { font-size: 36px; line-height: 40px; letter-spacing: -0.5px; }
```
