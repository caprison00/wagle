// 메모리 저장소: 모의 모드와 테스트용. Postgres 저장소와 같은 규칙으로 동작한다.

import { resolveStartedAt } from '../detector.ts';
import { computeDailyStats, computeStreamMetrics, kstDayRange } from '../metrics.ts';
import type { OpenStream, Platform } from '../types.ts';
import type { RunRecord, Store, TickWrite } from './types.ts';

export interface MemChannel {
  id: number;
  platform: Platform;
  platformId: string;
  name: string;
  imageUrl: string | null;
}

export interface MemStream {
  id: number;
  channelId: number;
  platformLiveId: string | null;
  startedAt: Date;
  endedAt: Date | null;
  title: string | null;
  category: string | null;
  peakViewers: number | null;
  avgViewers: number | null;
  viewerHours: number | null;
}

export interface MemSnapshot {
  streamId: number;
  capturedAt: Date;
  viewers: number;
  category: string | null;
  intervalSec: number;
}

export interface MemDaily {
  channelId: number;
  day: string;
  minutesLive: number;
  avgViewers: number;
  peakViewers: number;
  viewerHours: number;
}

export class MemoryStore implements Store {
  channels: MemChannel[] = [];
  streams: MemStream[] = [];
  snapshots: MemSnapshot[] = [];
  daily: MemDaily[] = [];
  runs: RunRecord[] = [];

  async loadOpenStreams(platform: Platform): Promise<OpenStream[]> {
    return this.streams
      .filter((s) => s.endedAt === null && this.channel(s.channelId).platform === platform)
      .map((s) => {
        const last = this.snapshots
          .filter((sn) => sn.streamId === s.id)
          .reduce((max, sn) => (sn.capturedAt > max ? sn.capturedAt : max), s.startedAt);
        return {
          streamId: s.id,
          channelId: this.channel(s.channelId).platformId,
          liveId: s.platformLiveId,
          title: s.title,
          category: s.category,
          lastSeenAt: last,
          missed: 0,
        };
      });
  }

  async applyTick({ platform, slotAt, intervalSec, plan }: TickWrite): Promise<Map<string, number>> {
    for (const { stream, endedAt } of plan.end) {
      const s = this.streams.find((x) => x.id === stream.streamId);
      if (!s || s.endedAt) continue;
      const m = computeStreamMetrics(this.snapshots.filter((sn) => sn.streamId === s.id));
      Object.assign(s, { endedAt, ...m });
    }

    const lives = [...plan.start, ...plan.continue.map((c) => c.live)];
    const channelIds = new Map<string, number>();
    for (const live of lives) {
      let ch = this.channels.find((c) => c.platform === platform && c.platformId === live.channelId);
      if (!ch) {
        ch = { id: this.channels.length + 1, platform, platformId: live.channelId, name: live.channelName, imageUrl: live.channelImageUrl };
        this.channels.push(ch);
      } else {
        ch.name = live.channelName;
        ch.imageUrl = live.channelImageUrl;
      }
      channelIds.set(live.channelId, ch.id);
    }

    const started = new Map<string, number>();
    for (const live of plan.start) {
      const channelId = channelIds.get(live.channelId)!;
      if (this.streams.some((s) => s.channelId === channelId && s.endedAt === null)) {
        throw new Error(`채널 ${live.channelId}에 이미 방송 중인 행이 있습니다`); // DB의 부분 unique 인덱스와 같은 규칙
      }
      const id = this.streams.length + 1;
      this.streams.push({
        id,
        channelId,
        platformLiveId: live.liveId,
        startedAt: resolveStartedAt(live.openedAt, slotAt),
        endedAt: null,
        title: live.title,
        category: live.category,
        peakViewers: null,
        avgViewers: null,
        viewerHours: null,
      });
      started.set(live.channelId, id);
    }

    for (const { stream, live } of plan.continue) {
      const s = this.streams.find((x) => x.id === stream.streamId)!;
      s.title = live.title;
      s.category = live.category;
    }

    const streamIds = new Map([...plan.continue.map((c) => [c.live.channelId, c.stream.streamId] as const), ...started]);
    for (const live of lives) {
      const streamId = streamIds.get(live.channelId)!;
      if (this.snapshots.some((sn) => sn.streamId === streamId && sn.capturedAt.getTime() === slotAt.getTime())) continue;
      this.snapshots.push({ streamId, capturedAt: slotAt, viewers: live.viewers, category: live.category, intervalSec });
    }
    return started;
  }

  async recordRun(run: RunRecord): Promise<void> {
    this.runs = this.runs.filter((r) => !(r.platform === run.platform && r.slotAt.getTime() === run.slotAt.getTime()));
    this.runs.push(run);
  }

  async refreshDaily(day: string): Promise<number> {
    const [from, to] = kstDayRange(day);
    const byChannel = new Map<number, MemSnapshot[]>();
    for (const sn of this.snapshots) {
      if (sn.capturedAt < from || sn.capturedAt >= to) continue;
      const channelId = this.streams.find((s) => s.id === sn.streamId)!.channelId;
      byChannel.set(channelId, [...(byChannel.get(channelId) ?? []), sn]);
    }
    for (const [channelId, snaps] of byChannel) {
      const stats = computeDailyStats(snaps)!;
      this.daily = this.daily.filter((d) => !(d.channelId === channelId && d.day === day));
      this.daily.push({ channelId, day, ...stats });
    }
    return byChannel.size;
  }

  async downsample(before: Date): Promise<number> {
    let changed = 0;
    this.snapshots = this.snapshots.filter((sn) => {
      if (sn.capturedAt >= before || sn.intervalSec >= 600) return true;
      changed++;
      if (sn.capturedAt.getUTCMinutes() % 10 !== 0) return false;
      sn.intervalSec = 600;
      return true;
    });
    return changed;
  }

  async close(): Promise<void> {}

  private channel(id: number): MemChannel {
    return this.channels.find((c) => c.id === id)!;
  }
}
