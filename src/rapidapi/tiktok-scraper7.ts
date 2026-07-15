/**
 * PILIHAN 2a — TikTok via RapidAPI (tiktok-scraper7)
 *
 * Provider  : tikwm (tiktok-scraper7)
 * Subscribe : https://rapidapi.com/tikwm-tikwm-default/api/tiktok-scraper7
 * Free tier : Ada (basic plan, rate limited)
 * Base URL  : https://tiktok-scraper7.p.rapidapi.com
 *
 * Env wajib : RAPIDAPI_KEY
 */

import { TikTokProfile, TikTokVideo, ProviderUpstreamError } from "../ensembledata/types";

const BASE_URL = "https://tiktok-scraper7.p.rapidapi.com";
const HOST = "tiktok-scraper7.p.rapidapi.com";

function getKey(): string {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) throw new ProviderUpstreamError("RAPIDAPI_KEY tidak di-set di environment variables");
  return key;
}

async function rapidGet(path: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "x-rapidapi-key": getKey(),
      "x-rapidapi-host": HOST,
    },
  });

  if (!res.ok) {
    let errBody = "";
    try { errBody = await res.text(); } catch { /* noop */ }
    throw new ProviderUpstreamError(
      `RapidAPI tiktok-scraper7 error ${res.status}: ${errBody.slice(0, 200)}`
    );
  }

  return res.json();
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Ambil profil TikTok.
 *
 * @example
 * const profile = await getTikTokUserInfo("charlidamelio");
 */
export async function getTikTokUserInfo(uniqueId: string): Promise<TikTokProfile> {
  const raw = (await rapidGet(`/user/info?unique_id=${encodeURIComponent(uniqueId)}`)) as {
    data?: {
      user?: Record<string, unknown>;
      stats?: Record<string, number>;
    };
  };

  const user = raw.data?.user ?? {};
  const stats = raw.data?.stats ?? {};

  return {
    uniqueId: String(user.uniqueId ?? uniqueId),
    nickname: String(user.nickname ?? uniqueId),
    avatarUrl: String(user.avatarLarger ?? user.avatarMedium ?? user.avatarThumb ?? ""),
    bio: String(user.signature ?? ""),
    verified: Boolean(user.verified),
    followerCount: Number(stats.followerCount ?? 0),
    followingCount: Number(stats.followingCount ?? 0),
    heartCount: Number(stats.heartCount ?? 0),
    videoCount: Number(stats.videoCount ?? 0),
    friendCount: Number(stats.friendCount ?? 0),
  };
}

/**
 * Ambil daftar video TikTok milik user (dengan pagination).
 *
 * @param uniqueId - Username TikTok
 * @param count    - Jumlah video per request (max 35)
 * @param cursor   - Pagination cursor (mulai dari "0")
 *
 * @example
 * // Ambil batch pertama
 * const page1 = await getTikTokUserPosts("charlidamelio", 20, "0");
 * // Ambil batch berikutnya
 * const page2 = await getTikTokUserPosts("charlidamelio", 20, page1.nextCursor);
 */
export async function getTikTokUserPosts(
  uniqueId: string,
  count = 20,
  cursor = "0"
): Promise<{ videos: TikTokVideo[]; nextCursor: string; hasMore: boolean }> {
  const raw = (await rapidGet(
    `/user/posts?uniqueId=${encodeURIComponent(uniqueId)}&count=${count}&cursor=${cursor}`
  )) as {
    data?: {
      videos?: Array<Record<string, unknown>>;
      cursor?: string;
      hasMore?: boolean;
    };
  };

  const rawVideos = raw.data?.videos ?? [];

  const videos: TikTokVideo[] = rawVideos.map((item) => {
    const stats = item.stats as Record<string, unknown> | undefined;
    const video = item.video as Record<string, unknown> | undefined;

    return {
      id: String(item.video_id ?? item.aweme_id ?? item.id ?? ""),
      description: String(item.title ?? item.desc ?? ""),
      createTime: Number(item.create_time ?? 0),
      coverUrl: String(item.cover ?? ""),
      videoUrl: String(item.play ?? ""),
      playCount: Number(stats?.play_count ?? stats?.playCount ?? item.play_count ?? 0),
      diggCount: Number(stats?.digg_count ?? stats?.diggCount ?? item.digg_count ?? 0),
      commentCount: Number(stats?.comment_count ?? stats?.commentCount ?? item.comment_count ?? 0),
      shareCount: Number(stats?.share_count ?? stats?.shareCount ?? item.share_count ?? 0),
      collectCount: Number(stats?.collect_count ?? stats?.collectCount ?? item.collect_count ?? 0),
      durationSeconds: Number(item.duration ?? video?.duration ?? 0),
    };
  });

  return {
    videos,
    nextCursor: String(raw.data?.cursor ?? "0"),
    hasMore: Boolean(raw.data?.hasMore),
  };
}

/**
 * Ambil semua video dengan auto-pagination hingga batas maxVideos.
 *
 * @param uniqueId  - Username TikTok
 * @param maxVideos - Batas maksimal video yang diambil (default 100)
 *
 * @example
 * const allVideos = await getAllTikTokVideos("charlidamelio", 100);
 */
export async function getAllTikTokVideos(
  uniqueId: string,
  maxVideos = 100
): Promise<TikTokVideo[]> {
  const allVideos: TikTokVideo[] = [];
  let cursor = "0";
  let hasMore = true;

  while (hasMore && allVideos.length < maxVideos) {
    const remaining = maxVideos - allVideos.length;
    const count = Math.min(remaining, 35);

    const { videos, nextCursor, hasMore: more } = await getTikTokUserPosts(uniqueId, count, cursor);
    allVideos.push(...videos);
    cursor = nextCursor;
    hasMore = more;

    if (videos.length === 0) break;

    // Rate limit protection
    await new Promise(r => setTimeout(r, 500));
  }

  return allVideos;
}

/**
 * Ambil detail satu video berdasarkan URL TikTok lengkap.
 *
 * @example
 * const detail = await getTikTokVideoDetail("https://www.tiktok.com/@user/video/12345");
 */
export async function getTikTokVideoDetail(videoUrl: string): Promise<unknown> {
  return rapidGet(`/video/info?url=${encodeURIComponent(videoUrl)}`);
}

/**
 * Cari video berdasarkan hashtag.
 *
 * @example
 * const results = await searchTikTokHashtag("football", 30);
 */
export async function searchTikTokHashtag(
  hashtag: string,
  count = 30
): Promise<unknown> {
  return rapidGet(`/hashtag/search?name=${encodeURIComponent(hashtag.replace(/^#/, ""))}&count=${count}`);
}

/**
 * Ambil komentar video.
 *
 * @example
 * const comments = await getTikTokComments("7123456789012345678", 20);
 */
export async function getTikTokComments(
  awemeId: string,
  count = 20,
  cursor = "0"
): Promise<unknown> {
  return rapidGet(`/comment/list?aweme_id=${awemeId}&count=${count}&cursor=${cursor}`);
}

/**
 * Ambil daftar followers user.
 * Membutuhkan user_id numerik (berbeda dari uniqueId/username).
 */
export async function getTikTokFollowers(
  userId: string,
  count = 20,
  cursor = "0"
): Promise<unknown> {
  return rapidGet(`/user/followers?user_id=${userId}&count=${count}&cursor=${cursor}`);
}
