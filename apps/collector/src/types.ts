export type Platform = 'chzzk' | 'soop' | 'youtube' | 'twitch';

/** 플랫폼 응답을 와글 공통 형태로 바꾼 라이브 1건 */
export interface LiveItem {
  /** 플랫폼 고유 채널 ID (channels.platform_id) */
  channelId: string;
  /** 플랫폼의 라이브(방송) 식별자. 없으면 null */
  liveId: string | null;
  channelName: string;
  channelImageUrl: string | null;
  title: string | null;
  /** 카테고리 이름 */
  category: string | null;
  viewers: number;
  /** 플랫폼이 알려준 방송 시작 시각. 모르면 null */
  openedAt: Date | null;
}

export interface FetchResult {
  lives: LiveItem[];
  pageCount: number;
}

/**
 * 플랫폼 어댑터. 유튜브·SOOP은 이 인터페이스만 구현하면 수집 흐름에 붙는다.
 * fetchLives는 목록을 끝까지 받지 못하면 반드시 throw 해야 한다.
 * 일부만 받은 목록을 넘기면, 빠진 채널이 "방송 종료"로 잘못 셀 수 있기 때문이다.
 */
export interface PlatformAdapter {
  readonly platform: Platform;
  /** 수집 주기(초). snapshots.interval_sec에 그대로 기록된다 */
  readonly intervalSec: number;
  /** collector_runs.source에 남길 공식 API 주소 (출처 증명용) */
  readonly source: string;
  fetchLives(): Promise<FetchResult>;
}

/** 수집기가 기억하는 "방송 중" 상태 */
export interface OpenStream {
  streamId: number;
  channelId: string;
  liveId: string | null;
  title: string | null;
  category: string | null;
  /** 마지막으로 목록에서 본 슬롯 시각. 종료 시 ended_at이 된다 */
  lastSeenAt: Date;
  /** 연속으로 안 보인 횟수 */
  missed: number;
}

export interface SnapshotValue {
  viewers: number;
  intervalSec: number;
}
