/**
 * BERBAYAR — TikTok via TikHub API
 *
 * TikHub adalah API service paling komprehensif untuk TikTok + Instagram.
 * 165 TikTok endpoints + 94 Instagram endpoints + Douyin/YouTube/dll.
 * Diuji strukturnya Juli 2026 — butuh API key untuk data nyata.
 *
 * Website  : https://tikhub.io
 * Docs     : https://api.tikhub.io/docs
 * Auth     : API Key (header Authorization: Bearer <token>)
 * Harga    : Pay-per-use, ada free trial credit
 * Signup   : https://tikhub.io (daftar → dashboard → copy API key)
 * Env      : TIKHUB_API_KEY
 *
 * ─────────────────────────────────────────────────────────────
 * KEUNGGULAN vs provider lain:
 *   - user/post/repost/like/collect/playlist → semua via 1 API
 *   - followers list & following list (✅ tanpa login)
 *   - comment list + replies
 *   - trending hashtag posts
 *   - search user/video/live/photo
 *   - home feed (FYP simulation)
 *   - live stream detail
 * ─────────────────────────────────────────────────────────────
 */

const BASE_URL = "https://api.tikhub.io";

function getHeaders(): Record<string, string> {
  const key = process.env.TIKHUB_API_KEY;
  if (!key) throw new Error("TIKHUB_API_KEY tidak ditemukan di environment");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

async function tikhubGet(path: string, params: Record<string, string | number> = {}): Promise<unknown> {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));

  const res = await fetch(url.toString(), { headers: getHeaders() });
  const json = await res.json() as { code?: number; data?: unknown; message?: string };

  if (!res.ok || (json.code && json.code !== 200)) {
    throw new Error(`TikHub error ${res.status}: ${json.message ?? JSON.stringify(json)}`);
  }
  return json.data ?? json;
}

// ── Profil user ──────────────────────────────────────────────────────────────

/** Profil lengkap user TikTok by username */
export async function tikhubTTUserProfile(uniqueId: string) {
  return tikhubGet("/api/v1/tiktok/web/fetch_user_profile", { uniqueId });
}

// ── Posts / Video list ────────────────────────────────────────────────────────

/**
 * Daftar video user (paginated)
 * @param secUid  sec_user_id dari profil user (bukan username)
 * @param cursor  0 = halaman pertama, gunakan nilai dari response untuk next page
 * @param count   jumlah video per halaman (max 35)
 */
export async function tikhubTTUserPosts(secUid: string, cursor = 0, count = 20) {
  return tikhubGet("/api/v1/tiktok/web/fetch_user_post", { secUid, cursor, count });
}

/** Daftar repost user */
export async function tikhubTTUserReposts(secUid: string, cursor = 0, count = 20) {
  return tikhubGet("/api/v1/tiktok/web/fetch_user_repost", { secUid, cursor, count });
}

/** Daftar video yang di-like user */
export async function tikhubTTUserLikes(secUid: string, cursor = 0, count = 20) {
  return tikhubGet("/api/v1/tiktok/web/fetch_user_like", { secUid, cursor, count });
}

// ── Detail video ──────────────────────────────────────────────────────────────

/** Detail 1 video by aweme_id */
export async function tikhubTTPostDetail(awemeId: string) {
  return tikhubGet("/api/v1/tiktok/web/fetch_post_detail", { aweme_id: awemeId });
}

// ── Followers / Following ─────────────────────────────────────────────────────

/**
 * Daftar FANS (followers) user — endpoint eksklusif, tidak ada di provider lain
 * @param secUid  sec_user_id dari profil
 * @param minCursor  0 = awal
 * @param count   per page (max 200)
 */
export async function tikhubTTUserFans(secUid: string, minCursor = 0, count = 20) {
  return tikhubGet("/api/v1/tiktok/web/fetch_user_fans", { secUid, minCursor, count });
}

/** Daftar following user */
export async function tikhubTTUserFollowing(secUid: string, minCursor = 0, count = 20) {
  return tikhubGet("/api/v1/tiktok/web/fetch_user_follow", { secUid, minCursor, count });
}

// ── Komentar ──────────────────────────────────────────────────────────────────

/** Komentar video */
export async function tikhubTTComments(awemeId: string, cursor = 0, count = 20) {
  return tikhubGet("/api/v1/tiktok/web/fetch_post_comment", { aweme_id: awemeId, cursor, count });
}

// ── Hashtag ───────────────────────────────────────────────────────────────────

/** Detail + video by hashtag */
export async function tikhubTTHashtagDetail(hashtagName: string) {
  return tikhubGet("/api/v1/tiktok/web/fetch_tag_detail", { tag_name: hashtagName });
}

export async function tikhubTTHashtagPosts(hashtagId: string, cursor = 0, count = 20) {
  return tikhubGet("/api/v1/tiktok/web/fetch_tag_post", { tag_id: hashtagId, cursor, count });
}

// ── Search ────────────────────────────────────────────────────────────────────

/** Cari user by keyword */
export async function tikhubTTSearchUsers(keyword: string, cursor = 0) {
  return tikhubGet("/api/v1/tiktok/web/fetch_search_user", { keyword, cursor });
}

/** Cari video by keyword */
export async function tikhubTTSearchVideos(keyword: string, cursor = 0) {
  return tikhubGet("/api/v1/tiktok/web/fetch_search_video", { keyword, cursor });
}

// ── Home feed ─────────────────────────────────────────────────────────────────

/** Trending home feed (FYP simulation) */
export async function tikhubTTHomeFeed(count = 20) {
  return tikhubGet("/api/v1/tiktok/web/fetch_home_feed", { count });
}
