/**
 * P18: Douyin (TikTok China) API - Endpoint publik tanpa login
 *
 * Douyin adalah versi China dari TikTok, dioperasikan oleh ByteDance.
 * Beberapa endpoint Douyin dapat diakses tanpa autentikasi dari server.
 *
 * ✅ WORKS dari server Replit tanpa API key, tanpa login
 * ❌ Endpoint lain (search, user profile, video feed) require login
 *
 * Base URL: https://www.douyin.com/aweme/v1/web/
 */

import * as https from "https";
import * as http from "http";

const DOUYIN_BASE = "https://www.douyin.com/aweme/v1/web";

const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Referer: "https://www.douyin.com/",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DouyinHotSearchItem {
  /** Judul trending topic */
  word: string;
  /** Nilai kepopuleran (semakin besar semakin viral) */
  hot_value: number;
  /** ID unik item trending */
  sentence_id: string;
  /** Tipe item: 1=normal, 2=breaking news, dll */
  word_type: number;
  /** Posisi ranking (1-50) */
  position: number;
  /** URL thumbnail cover */
  word_cover_url?: string;
  /** Jumlah video terkait */
  video_count?: number;
  /** Jumlah diskusi */
  discuss_video_count?: number;
}

export interface DouyinHotSearchResult {
  status: 0 | number;
  items: DouyinHotSearchItem[];
  logid: string;
}

export interface DouyinVideoDetailResult {
  status: number;
  aweme_id: string;
  desc?: string;
  author_nickname?: string;
  author_uid?: string;
  play_count?: number;
  like_count?: number;
  comment_count?: number;
  share_count?: number;
  duration?: number;
  /** URL video play (mungkin require sign) */
  play_url?: string;
  /** URL cover/thumbnail */
  cover_url?: string;
  music_title?: string;
  music_author?: string;
  raw?: Record<string, unknown>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fetchJson(url: string): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    const req = lib.get(
      url,
      { headers: DEFAULT_HEADERS as Record<string, string> },
      (res) => {
        let data = "";
        res.on("data", (chunk: Buffer) => (data += chunk.toString()));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data) as Record<string, unknown>);
          } catch {
            reject(new Error(`Non-JSON response (${res.statusCode}): ${data.slice(0, 200)}`));
          }
        });
      }
    );
    req.on("error", reject);
    req.setTimeout(12000, () => {
      req.destroy(new Error("Request timeout"));
    });
  });
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

/**
 * P18-T1: Hot Search Trending Topics
 *
 * Mengambil 50 trending topic terpopuler di Douyin (TikTok China).
 * Diurutkan berdasarkan hot_value (semakin tinggi = semakin viral).
 *
 * ✅ Gratis, tidak butuh login, tidak butuh API key
 * Data diupdate real-time oleh Douyin
 *
 * @example
 * const trending = await douyinHotSearch();
 * console.log(trending.items[0]); // { word: '...', hot_value: 12000000, ... }
 */
export async function douyinHotSearch(): Promise<DouyinHotSearchResult> {
  const url = `${DOUYIN_BASE}/hot/search/list/?aid=6383&device_platform=webapp&channel=channel_pc_web`;
  const raw = await fetchJson(url);

  const data = raw.data as Record<string, unknown> | undefined;
  const wordList = (data?.word_list as Record<string, unknown>[]) ?? [];

  const items: DouyinHotSearchItem[] = wordList.map((w) => {
    const coverUrls = (w.word_cover as Record<string, unknown>)?.url_list as string[] | undefined;
    return {
      word: w.word as string,
      hot_value: w.hot_value as number,
      sentence_id: w.sentence_id as string,
      word_type: (w.word_type as number) ?? 1,
      position: (w.position as number) ?? 0,
      word_cover_url: coverUrls?.[0],
      video_count: w.video_count as number | undefined,
      discuss_video_count: w.discuss_video_count as number | undefined,
    };
  });

  const extra = raw.extra as Record<string, unknown> | undefined;
  const logPb = raw.log_pb as Record<string, unknown> | undefined;

  return {
    status: raw.status_code as number,
    items,
    logid: (extra?.logid as string) ?? (logPb?.impr_id as string) ?? "",
  };
}

/**
 * P18-T2: Hot Search Trending (type tertentu)
 *
 * Sama seperti douyinHotSearch() tapi bisa filter by type:
 * - type=0 = semua (default)
 * - type=1 = trending biasa
 * - type=2 = breaking news / hot
 *
 * ✅ Gratis, tidak butuh login
 */
export async function douyinHotSearchByType(
  type: 0 | 1 | 2 = 0
): Promise<DouyinHotSearchResult> {
  const url = `${DOUYIN_BASE}/hot/search/list/?aid=6383&device_platform=webapp&type=${type}`;
  const raw = await fetchJson(url);

  const data = raw.data as Record<string, unknown> | undefined;
  const wordList = (data?.word_list as Record<string, unknown>[]) ?? [];

  const items: DouyinHotSearchItem[] = wordList.map((w) => ({
    word: w.word as string,
    hot_value: w.hot_value as number,
    sentence_id: w.sentence_id as string,
    word_type: (w.word_type as number) ?? 1,
    position: (w.position as number) ?? 0,
    word_cover_url: ((w.word_cover as Record<string, unknown>)?.url_list as string[])?.[0],
  }));

  return {
    status: raw.status_code as number,
    items,
    logid: ((raw.extra as Record<string, unknown>)?.logid as string) ?? "",
  };
}

/**
 * P18-T3: Video Detail by Aweme ID
 *
 * Mengambil detail video Douyin berdasarkan aweme_id.
 * Aweme ID bisa didapat dari URL Douyin: douyin.com/video/{aweme_id}
 *
 * ⚠️ Endpoint ini bisa bekerja atau tidak tergantung IP/region.
 *    Dari server Replit (US), beberapa video mungkin tidak bisa diakses.
 * ✅ Tidak butuh login jika endpoint accessible
 *
 * @param awemeId - ID video Douyin (mis: "7370217222098745607")
 */
export async function douyinVideoDetail(
  awemeId: string
): Promise<DouyinVideoDetailResult> {
  const url = `${DOUYIN_BASE}/aweme/detail/?aweme_id=${encodeURIComponent(awemeId)}&aid=6383&device_platform=webapp&channel=channel_pc_web`;
  const raw = await fetchJson(url);

  const v = raw.aweme_detail as Record<string, unknown> | undefined;

  if (!v) {
    return {
      status: (raw.status_code as number) ?? -1,
      aweme_id: awemeId,
      raw: raw as Record<string, unknown>,
    };
  }

  const stats = v.statistics as Record<string, unknown> | undefined;
  const author = v.author as Record<string, unknown> | undefined;
  const video = v.video as Record<string, unknown> | undefined;
  const playAddr = video?.play_addr as Record<string, unknown> | undefined;
  const cover = video?.cover as Record<string, unknown> | undefined;
  const music = v.music as Record<string, unknown> | undefined;

  return {
    status: (raw.status_code as number) ?? 0,
    aweme_id: awemeId,
    desc: v.desc as string | undefined,
    author_nickname: author?.nickname as string | undefined,
    author_uid: author?.uid as string | undefined,
    play_count: stats?.play_count as number | undefined,
    like_count: stats?.digg_count as number | undefined,
    comment_count: stats?.comment_count as number | undefined,
    share_count: stats?.share_count as number | undefined,
    duration: v.duration as number | undefined,
    play_url: (playAddr?.url_list as string[])?.[0],
    cover_url: (cover?.url_list as string[])?.[0],
    music_title: music?.title as string | undefined,
    music_author: music?.author as string | undefined,
    raw: raw as Record<string, unknown>,
  };
}

/**
 * P18-T4: Challenge / Hashtag Detail
 *
 * Mengambil detail hashtag Douyin berdasarkan ch_id.
 * ch_id bisa didapat dari URL: douyin.com/hashtag/{ch_id}
 *
 * ⚠️ Perlu ch_id yang valid (bukan sembarang angka)
 * ✅ Tidak butuh login
 *
 * @param chId - ID hashtag Douyin
 */
export async function douyinChallengeDetail(chId: string): Promise<{
  status: number;
  ch_id: string;
  ch_name?: string;
  view_count?: number;
  video_count?: number;
  user_count?: number;
  desc?: string;
  raw?: Record<string, unknown>;
}> {
  const url = `${DOUYIN_BASE}/challenge/detail/?ch_id=${encodeURIComponent(chId)}&aid=6383&device_platform=webapp`;
  const raw = await fetchJson(url);

  const ch = raw.ch_info as Record<string, unknown> | undefined;

  return {
    status: raw.status_code as number,
    ch_id: chId,
    ch_name: ch?.ch_name as string | undefined,
    view_count: ch?.view_count as number | undefined,
    video_count: ch?.video_count as number | undefined,
    user_count: ch?.user_count as number | undefined,
    desc: ch?.desc as string | undefined,
    raw: raw as Record<string, unknown>,
  };
}

/**
 * P18-T5: Music Detail
 *
 * Mengambil detail musik/audio Douyin berdasarkan music_id.
 *
 * ⚠️ Perlu music_id yang valid
 * ✅ Tidak butuh login
 *
 * @param musicId - ID musik Douyin
 */
export async function douyinMusicDetail(musicId: string): Promise<{
  status: number;
  music_id: string;
  title?: string;
  author?: string;
  duration?: number;
  play_url?: string;
  cover_url?: string;
  use_count?: number;
  raw?: Record<string, unknown>;
}> {
  const url = `${DOUYIN_BASE}/music/detail/?music_id=${encodeURIComponent(musicId)}&aid=6383&device_platform=webapp`;
  const raw = await fetchJson(url);

  const mi = raw.music_info as Record<string, unknown> | undefined;
  const playUrl = mi?.play_url as Record<string, unknown> | undefined;

  return {
    status: raw.status_code as number,
    music_id: musicId,
    title: mi?.title as string | undefined,
    author: mi?.author as string | undefined,
    duration: mi?.duration as number | undefined,
    play_url: playUrl?.uri as string | undefined,
    cover_url: ((mi?.cover_medium as Record<string, unknown>)?.url_list as string[] | undefined)?.[0],
    use_count: mi?.user_count as number | undefined,
    raw: raw as Record<string, unknown>,
  };
}
