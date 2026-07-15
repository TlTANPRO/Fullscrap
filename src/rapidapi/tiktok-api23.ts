/**
 * PILIHAN 2d — TikTok via RapidAPI (tiktok-api23)
 *
 * Provider  : tiktok-api23
 * Subscribe : https://rapidapi.com/Lundehund/api/tiktok-api23
 * Free tier : Ada
 * Base URL  : https://tiktok-api23.p.rapidapi.com
 *
 * Kelebihan: Endpoint bersih, response konsisten, cocok untuk analytics
 *
 * Env wajib : RAPIDAPI_KEY
 */

import { ProviderUpstreamError } from "../ensembledata/types";

const BASE_URL = "https://tiktok-api23.p.rapidapi.com";
const HOST = "tiktok-api23.p.rapidapi.com";

function getKey(): string {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) throw new ProviderUpstreamError("RAPIDAPI_KEY tidak di-set");
  return key;
}

async function apiGet(path: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "x-rapidapi-key": getKey(),
      "x-rapidapi-host": HOST,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ProviderUpstreamError(`tiktok-api23 error ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

// ─── Endpoint table ───────────────────────────────────────────────────────
// GET /api/user/info?uniqueId=charlidamelio                 → profil user
// GET /api/user/posts?uniqueId=charlidamelio&cursor=0&count=10 → video list
// GET /api/post/detail?videoId=VIDEO_ID                     → detail video
// GET /api/user/search?keyword=keyword&cursor=0&count=10    → search user
// GET /api/hashtag/info?name=fyp                            → info hashtag
// GET /api/hashtag/posts?challengeId=ID&cursor=0&count=10   → video di hashtag
// GET /api/suggest/words?keyword=hello                      → keyword suggest
// GET /api/music/posts?musicId=ID&cursor=0&count=10         → video pakai musik

/**
 * Ambil profil TikTok.
 *
 * @example
 * const profile = await api23UserInfo("charlidamelio");
 */
export async function api23UserInfo(uniqueId: string): Promise<{
  uniqueId: string;
  nickname: string;
  avatarUrl: string;
  bio: string;
  verified: boolean;
  followerCount: number;
  followingCount: number;
  heartCount: number;
  videoCount: number;
}> {
  const raw = (await apiGet(`/api/user/info?uniqueId=${encodeURIComponent(uniqueId)}`)) as {
    userInfo?: {
      user?: Record<string, unknown>;
      stats?: Record<string, unknown>;
    };
    data?: {
      user?: Record<string, unknown>;
      stats?: Record<string, unknown>;
    };
  };

  const info = raw.userInfo ?? raw.data ?? {};
  const user = (info.user ?? {}) as Record<string, unknown>;
  const stats = (info.stats ?? {}) as Record<string, unknown>;

  return {
    uniqueId: String(user.uniqueId ?? uniqueId),
    nickname: String(user.nickname ?? uniqueId),
    avatarUrl: String(user.avatarLarger ?? user.avatarMedium ?? ""),
    bio: String(user.signature ?? ""),
    verified: Boolean(user.verified),
    followerCount: Number(stats.followerCount ?? 0),
    followingCount: Number(stats.followingCount ?? 0),
    heartCount: Number(stats.heartCount ?? 0),
    videoCount: Number(stats.videoCount ?? 0),
  };
}

/**
 * Ambil daftar video user (cursor-based pagination).
 *
 * @example
 * const page1 = await api23UserPosts("charlidamelio", "0", 10);
 * const page2 = await api23UserPosts("charlidamelio", page1.nextCursor, 10);
 */
export async function api23UserPosts(
  uniqueId: string,
  cursor = "0",
  count = 10
): Promise<{ videos: unknown[]; nextCursor: string; hasMore: boolean }> {
  const raw = (await apiGet(
    `/api/user/posts?uniqueId=${encodeURIComponent(uniqueId)}&cursor=${cursor}&count=${count}`
  )) as {
    itemList?: unknown[];
    cursor?: string;
    hasMore?: boolean;
    data?: { itemList?: unknown[]; cursor?: string; hasMore?: boolean };
  };

  const data = raw.data ?? raw;
  return {
    videos: (data as Record<string, unknown>).itemList as unknown[] ?? [],
    nextCursor: String((data as Record<string, unknown>).cursor ?? "0"),
    hasMore: Boolean((data as Record<string, unknown>).hasMore),
  };
}

/**
 * Ambil detail satu video.
 *
 * @example
 * const detail = await api23PostDetail("7123456789012345678");
 */
export async function api23PostDetail(videoId: string): Promise<unknown> {
  return apiGet(`/api/post/detail?videoId=${videoId}`);
}

/**
 * Cari user berdasarkan keyword.
 *
 * @example
 * const users = await api23SearchUser("charli", "0", 10);
 */
export async function api23SearchUser(
  keyword: string,
  cursor = "0",
  count = 10
): Promise<{ users: unknown[]; nextCursor: string; hasMore: boolean }> {
  const raw = (await apiGet(
    `/api/user/search?keyword=${encodeURIComponent(keyword)}&cursor=${cursor}&count=${count}`
  )) as { userList?: unknown[]; cursor?: string; hasMore?: boolean };

  return {
    users: raw.userList ?? [],
    nextCursor: String(raw.cursor ?? "0"),
    hasMore: Boolean(raw.hasMore),
  };
}

/**
 * Ambil info hashtag.
 *
 * @example
 * const tag = await api23HashtagInfo("fyp");
 * console.log(tag); // { id, title, viewCount, videoCount, ... }
 */
export async function api23HashtagInfo(name: string): Promise<unknown> {
  return apiGet(`/api/hashtag/info?name=${encodeURIComponent(name.replace(/^#/, ""))}`);
}

/**
 * Ambil video berdasarkan hashtag challenge ID.
 * Dapatkan challenge ID dari api23HashtagInfo() terlebih dahulu.
 *
 * @example
 * const tagInfo = await api23HashtagInfo("fyp");
 * const videos = await api23HashtagPosts(tagInfo.challengeId, "0", 10);
 */
export async function api23HashtagPosts(
  challengeId: string,
  cursor = "0",
  count = 10
): Promise<{ videos: unknown[]; nextCursor: string; hasMore: boolean }> {
  const raw = (await apiGet(
    `/api/hashtag/posts?challengeId=${challengeId}&cursor=${cursor}&count=${count}`
  )) as { itemList?: unknown[]; cursor?: string; hasMore?: boolean };

  return {
    videos: raw.itemList ?? [],
    nextCursor: String(raw.cursor ?? "0"),
    hasMore: Boolean(raw.hasMore),
  };
}

/**
 * Ambil video berdasarkan musik/sound.
 *
 * @example
 * const videos = await api23MusicPosts("12345", "0", 10);
 */
export async function api23MusicPosts(
  musicId: string,
  cursor = "0",
  count = 10
): Promise<{ videos: unknown[]; nextCursor: string; hasMore: boolean }> {
  const raw = (await apiGet(
    `/api/music/posts?musicId=${musicId}&cursor=${cursor}&count=${count}`
  )) as { itemList?: unknown[]; cursor?: string; hasMore?: boolean };

  return {
    videos: raw.itemList ?? [],
    nextCursor: String(raw.cursor ?? "0"),
    hasMore: Boolean(raw.hasMore),
  };
}
