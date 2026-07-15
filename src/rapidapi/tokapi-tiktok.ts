/**
 * PILIHAN 2c — TikTok via RapidAPI (tokapi-mobile-version)
 *
 * Provider  : tokapi
 * Subscribe : https://rapidapi.com/Carloss8824/api/tokapi-mobile-version
 * Free tier : Ada (basic plan)
 * Base URL  : https://tokapi-mobile-version.p.rapidapi.com
 *
 * Kelebihan: Menggunakan TikTok Mobile API — lebih stabil, lebih banyak endpoint
 * (followers list, following list, liked videos, comments, dll)
 *
 * Env wajib : RAPIDAPI_KEY
 */

import { ProviderUpstreamError } from "../ensembledata/types";

const BASE_URL = "https://tokapi-mobile-version.p.rapidapi.com";
const HOST = "tokapi-mobile-version.p.rapidapi.com";

function getKey(): string {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) throw new ProviderUpstreamError("RAPIDAPI_KEY tidak di-set");
  return key;
}

async function tokapiGet(path: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "x-rapidapi-key": getKey(),
      "x-rapidapi-host": HOST,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ProviderUpstreamError(`tokapi error ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

// ─── Endpoint table ───────────────────────────────────────────────────────
// GET /v1/post/user/timeline?count=10&offset=0                    → video feed user
// GET /v1/post/user/{user_id}/liked?count=10&offset=0             → liked videos
// GET /v1/user?uniqueId=charlidamelio                             → user info
// GET /v1/user/{user_id}/fans?count=20&offset=0                   → followers
// GET /v1/user/{user_id}/followings?count=20&offset=0             → following
// GET /v1/comment/{aweme_id}?count=20&offset=0                    → comments
// GET /v1/post/search?keyword=keyword&offset=0&count=10           → search video
// GET /v1/hashtag/posts?id={challenge_id}&count=10&offset=0       → hashtag posts
// GET /v1/music/posts?music_id={id}&count=10&offset=0             → posts by sound

/**
 * Ambil informasi profil TikTok.
 *
 * @example
 * const user = await tokapiUserInfo("charlidamelio");
 */
export async function tokapiUserInfo(uniqueId: string): Promise<{
  userId: string;
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
  const raw = (await tokapiGet(`/v1/user?uniqueId=${encodeURIComponent(uniqueId)}`)) as {
    userInfo?: {
      user?: Record<string, unknown>;
      stats?: Record<string, unknown>;
    };
  };

  const user = raw.userInfo?.user ?? {};
  const stats = raw.userInfo?.stats ?? {};

  return {
    userId: String(user.id ?? ""),
    uniqueId: String(user.uniqueId ?? uniqueId),
    nickname: String(user.nickname ?? uniqueId),
    avatarUrl: String(user.avatarLarger ?? user.avatarMedium ?? ""),
    bio: String(user.signature ?? ""),
    verified: Boolean(user.verified),
    followerCount: Number(stats.followerCount ?? 0),
    followingCount: Number(stats.followingCount ?? 0),
    heartCount: Number(stats.heartCount ?? stats.diggCount ?? 0),
    videoCount: Number(stats.videoCount ?? 0),
  };
}

/**
 * Ambil video timeline user (feed terbaru).
 * Butuh user_id numerik — ambil dari tokapiUserInfo() dulu.
 *
 * @example
 * const user = await tokapiUserInfo("charlidamelio");
 * const page1 = await tokapiUserTimeline(user.userId, 20, 0);
 * const page2 = await tokapiUserTimeline(user.userId, 20, 20);
 */
export async function tokapiUserTimeline(
  userId: string,
  count = 20,
  offset = 0
): Promise<{ videos: unknown[]; hasMore: boolean; total: number }> {
  const raw = (await tokapiGet(
    `/v1/post/user/timeline?user_id=${userId}&count=${count}&offset=${offset}`
  )) as { aweme_list?: unknown[]; has_more?: number | boolean; total?: number };

  return {
    videos: raw.aweme_list ?? [],
    hasMore: Boolean(raw.has_more),
    total: Number(raw.total ?? 0),
  };
}

/**
 * Ambil semua video user dengan auto-pagination.
 *
 * @example
 * const user = await tokapiUserInfo("charlidamelio");
 * const allVideos = await tokapiGetAllVideos(user.userId, 100);
 */
export async function tokapiGetAllVideos(
  userId: string,
  maxVideos = 100
): Promise<unknown[]> {
  const all: unknown[] = [];
  let offset = 0;
  const batchSize = 20;

  while (all.length < maxVideos) {
    const { videos, hasMore } = await tokapiUserTimeline(userId, batchSize, offset);
    all.push(...videos);
    offset += batchSize;
    if (!hasMore || videos.length === 0) break;
    await new Promise(r => setTimeout(r, 400));
  }

  return all.slice(0, maxVideos);
}

/**
 * Ambil video yang di-like user.
 * Beberapa akun menyembunyikan liked videos — akan kosong jika privat.
 *
 * @example
 * const user = await tokapiUserInfo("charlidamelio");
 * const likedPage = await tokapiLikedVideos(user.userId, 20, 0);
 */
export async function tokapiLikedVideos(
  userId: string,
  count = 20,
  offset = 0
): Promise<{ videos: unknown[]; hasMore: boolean }> {
  const raw = (await tokapiGet(
    `/v1/post/user/${userId}/liked?count=${count}&offset=${offset}`
  )) as { aweme_list?: unknown[]; has_more?: number | boolean };

  return {
    videos: raw.aweme_list ?? [],
    hasMore: Boolean(raw.has_more),
  };
}

/**
 * Ambil daftar followers user.
 * Catatan: Perlu user_id numerik, bukan username.
 *
 * @example
 * const followers = await tokapiUserFollowers("12345678", 20, 0);
 */
export async function tokapiUserFollowers(
  userId: string,
  count = 20,
  offset = 0
): Promise<{ users: unknown[]; hasMore: boolean; total: number }> {
  const raw = (await tokapiGet(
    `/v1/user/${userId}/fans?count=${count}&offset=${offset}`
  )) as { user_list?: unknown[]; has_more?: number | boolean; total?: number };

  return {
    users: raw.user_list ?? [],
    hasMore: Boolean(raw.has_more),
    total: Number(raw.total ?? 0),
  };
}

/**
 * Ambil daftar following user.
 *
 * @example
 * const following = await tokapiUserFollowing("12345678", 20, 0);
 */
export async function tokapiUserFollowing(
  userId: string,
  count = 20,
  offset = 0
): Promise<{ users: unknown[]; hasMore: boolean; total: number }> {
  const raw = (await tokapiGet(
    `/v1/user/${userId}/followings?count=${count}&offset=${offset}`
  )) as { user_list?: unknown[]; has_more?: number | boolean; total?: number };

  return {
    users: raw.user_list ?? [],
    hasMore: Boolean(raw.has_more),
    total: Number(raw.total ?? 0),
  };
}

/**
 * Ambil komentar video.
 *
 * @example
 * const comments = await tokapiVideoComments("7123456789012345678", 20, 0);
 */
export async function tokapiVideoComments(
  awemeId: string,
  count = 20,
  offset = 0
): Promise<{ comments: unknown[]; hasMore: boolean; total: number }> {
  const raw = (await tokapiGet(
    `/v1/comment/${awemeId}?count=${count}&offset=${offset}`
  )) as { comments?: unknown[]; has_more?: number | boolean; total?: number };

  return {
    comments: raw.comments ?? [],
    hasMore: Boolean(raw.has_more),
    total: Number(raw.total ?? 0),
  };
}

/**
 * Cari video berdasarkan keyword.
 *
 * @example
 * const results = await tokapiSearchVideos("indonesia viral", 10, 0);
 */
export async function tokapiSearchVideos(
  keyword: string,
  count = 10,
  offset = 0
): Promise<{ videos: unknown[]; hasMore: boolean }> {
  const raw = (await tokapiGet(
    `/v1/post/search?keyword=${encodeURIComponent(keyword)}&count=${count}&offset=${offset}`
  )) as { aweme_list?: unknown[]; has_more?: number | boolean };

  return {
    videos: raw.aweme_list ?? [],
    hasMore: Boolean(raw.has_more),
  };
}

/**
 * Ambil video berdasarkan sound/musik.
 *
 * @example
 * const videos = await tokapiMusicPosts("12345", 20, 0);
 */
export async function tokapiMusicPosts(
  musicId: string,
  count = 20,
  offset = 0
): Promise<{ videos: unknown[]; hasMore: boolean }> {
  const raw = (await tokapiGet(
    `/v1/music/posts?music_id=${musicId}&count=${count}&offset=${offset}`
  )) as { aweme_list?: unknown[]; has_more?: number | boolean };

  return {
    videos: raw.aweme_list ?? [],
    hasMore: Boolean(raw.has_more),
  };
}
