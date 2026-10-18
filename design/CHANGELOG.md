# 디자인 변경 내역

디자인 Claude가 `design/` 파일을 갱신할 때마다 새 버전을 맨 위에 추가한다.
Claude Code는 "design v<버전> 반영해줘" 요청을 받으면 해당 버전 항목만 보고 구현한다.

## v1 · 2026-10-18 · 디자인 시스템

- `tokens.json` 추가: 색 23개(라이트·다크), 글꼴 2종(Bagel Fat One, IBM Plex Sans KR), 텍스트 스타일 10개, 간격 6단계, 모서리 4단계, 그림자 1개.
- `components.md` 추가: 브랜드 가이드(말투, 숫자 표기, 색·글꼴·간격 사용 규칙, 차트 규칙)와 컴포넌트 8종(Button, PlatformBadge, LiveBadge, FilterChips, Tabs, RankRow, Delta, StatTile)의 규칙·마크업·참조 CSS.
- 구현 요청 범위: `apps/web`에 Tailwind 설정과 토큰 CSS 변수(라이트 기본, `data-theme="dark"` 전환), 글꼴 로딩까지. 화면은 아직 만들지 않는다(화면 명세는 v2에서).
- 아이콘 세트 미정: 임시로 Lucide 사용.

## v0 · 2026-10-18

- 저장소 초기화. 디자인 파일 없음.
