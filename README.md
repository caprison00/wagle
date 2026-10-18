# 와글 (WAGLE)

**지금 가장 와글와글한 방송.**

치지직·SOOP·유튜브 라이브 방송의 시청자 통계를 한곳에 모아, 모든 지표를 무료로 보여주는 웹 서비스입니다.
데이터는 각 플랫폼의 공식 API에서 직접 수집합니다.

## 문서

| 문서 | 내용 |
| --- | --- |
| [CLAUDE.md](CLAUDE.md) | 서비스 개요, 역할 분담, 협업 규칙 (Claude Code 작업 기준) |
| [docs/spec.md](docs/spec.md) | 서비스 설계서: 데이터 소스, 아키텍처, 화면, DB 스키마, 법적 체크리스트 |
| [design/](design/) | 디자인 토큰, 컴포넌트 규칙, 화면 명세 |
| [design/QUESTIONS.md](design/QUESTIONS.md) | 구현 중 생긴 디자인 질문 |

## 진행 상태

- [ ] 1단계: 수집기 + DB 스키마 (`apps/collector`, `supabase/`)
- [ ] 2단계: 웹 MVP — 지금 라이브, 스트리머 상세, 카테고리 통계 (`apps/web`)
- [ ] 3단계: 유튜브 추가, 비교 도구, 기록실, CSV
- [ ] 4단계: SOOP(제휴 승인 후), 스트리머 대시보드
