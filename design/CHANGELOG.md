# 디자인 변경 내역

디자인 Claude가 `design/` 파일을 갱신할 때마다 새 버전을 맨 위에 추가한다.
Claude Code는 "design v<버전> 반영해줘" 요청을 받으면 해당 버전 항목만 보고 구현한다.

## v2 · 2026-10-18 · 신뢰감 있는 리포트형으로 전환 + 반응형

v1을 대체한다. v1을 아직 구현하지 않았다면 v1은 건너뛰고 v2만 구현한다.

- 콘셉트 변경: 팬덤형(핑크·옐로, 둥근 카드) → 리포트형(회색 단계 + 남색 단일 강조색, 테두리 중심, 표 위주).
- `tokens.json` 교체: `brand*`·옐로 계열 삭제, `accent`(남색 #2440a0 / 다크 #93a8ff)·`accent-soft`·`on-accent` 신설. `fall`은 빨강으로 변경(▼ 기호 필수). 그림자 토큰 삭제. 모서리 4/6/8px.
- 글꼴: Bagel Fat One 삭제, IBM Plex Sans KR 단일. 텍스트 스타일 재정의(heading-xl, heading-lg, title, body, body-strong, label, caption, stat-xl, stat, table-num).
- 컴포넌트 9종: Button, PlatformBadge, LiveBadge, Segmented(신규), Panel(신규), SourceNote(신규), RankTable(신규, RankRow 대체), Delta, StatTile. FilterChips·Tabs·RankRow 삭제.
- 반응형 웹: PC 1280 기준 최대 폭 1200px, 760px 이하 모바일. 모바일 메뉴는 하단 탭 대신 햄버거 메뉴(오른쪽 서랍).
- 구현 요청 범위: `apps/web`에 Tailwind 설정과 토큰 CSS 변수(라이트 기본, `data-theme="dark"` 전환), 글꼴 로딩, 공통 레이아웃(상단바·햄버거 메뉴·푸터)까지. 화면별 명세는 v3에서 `design/screens/`로 전달한다.

## v1 · 2026-10-18 · 디자인 시스템 (v2로 대체됨)

- 팬덤형 첫 디자인 시스템. 구현하지 않는다.

## v0 · 2026-10-18

- 저장소 초기화. 디자인 파일 없음.
