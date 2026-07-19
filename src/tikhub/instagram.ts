/**
 * BERBAYAR — Instagram via TikHub API
 *
 * TikHub menyediakan 94 Instagram endpoints dalam 3 versi (v1/v2/v3).
 * Diuji strukturnya Juli 2026 — butuh API key untuk data nyata.
 *
 * Website  : https://tikhub.io
 * Docs     : https://api.tikhub.io/docs
 * Auth     : API Key (header Authorization: Bearer <token>)
 * Harga    : Pay-per-use, ada free trial credit
 * Signup   : https://tikhub.io → dashboard → API Key
 * Env      : TIKHUB_API_KEY
 *
 * ─────────────────────────────────────────────────────────────
 * KEUNGGULAN vs provider IG lain (gratis):
 *   - Followers & following list (❌ semua provider gratis tidak bisa ini)
 *   - Stories user (❌ provider gratis lain tidak bisa tanpa login)
 *   - Highlights + highlight stories
 *   - Post likes list
 *   - Former usernames user
 *   - Search by coordinates (geolocation)
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

/** Profil lengkap user Instagram by username (v3 — terbaru) */
export async function tikhubIGUserProfile(username: string) {
  return tikhubGet("/api/v1/instagram/v3/get_user_profile", { username });
}

/** Info singkat user (follower count, post count) */
export async function tikhubIGUserBrief(username: string) {
  return tikhubGet("/api/v1/instagram/v3/get_user_brief", { username });
}

/** Info lengkap tentang user (bio, link, category, dll) */
export async function tikhubIGUserAbout(username: string) {
  return tikhubGet("/api/v1/instagram/v3/get_user_about", { username });
}

/** Username-username sebelumnya (former usernames) */
export async function tikhubIGUserFormerUsernames(username: string) {
  return tikhubGet("/api/v1/instagram/v3/get_user_former_usernames", { username });
}

/** Konversi username → user_id numerik */
export async function tikhubIGGetUserId(username: string) {
  return tikhubGet("/api/v1/instagram/v3/get_user_id_by_username", { username });
}

// ── Posts / Media ─────────────────────────────────────────────────────────────

/**
 * Daftar post user (paginated)
 * @param userId  user_id numerik (bukan username, gunakan tikhubIGGetUserId dulu)
 * @param end_cursor  "" = halaman pertama, gunakan dari response untuk next
 */
export async function tikhubIGUserPosts(userId: string, end_cursor = "") {
  const params: Record<string, string> = { user_id: userId };
  if (end_cursor) params.end_cursor = end_cursor;
  return tikhubGet("/api/v1/instagram/v3/get_user_posts", params);
}

/** Daftar reels user */
export async function tikhubIGUserReels(userId: string, end_cursor = "") {
  const params: Record<string, string> = { user_id: userId };
  if (end_cursor) params.end_cursor = end_cursor;
  return tikhubGet("/api/v1/instagram/v3/get_user_reels", params);
}

/** Posts yang mentag user ini */
export async function tikhubIGUserTaggedPosts(userId: string, end_cursor = "") {
  const params: Record<string, string> = { user_id: userId };
  if (end_cursor) params.end_cursor = end_cursor;
  return tikhubGet("/api/v1/instagram/v3/get_user_tagged_posts", params);
}

// ── Followers / Following ─────────────────────────────────────────────────────

/**
 * Daftar FOLLOWERS user — EKSKLUSIF, tidak ada di provider gratis manapun
 * @param userId  user_id numerik
 * @param end_cursor  "" = halaman pertama
 */
export async function tikhubIGUserFollowers(userId: string, end_cursor = "") {
  const params: Record<string, string> = { user_id: userId };
  if (end_cursor) params.end_cursor = end_cursor;
  return tikhubGet("/api/v1/instagram/v3/get_user_followers", params);
}

/** Daftar FOLLOWING user — EKSKLUSIF */
export async function tikhubIGUserFollowing(userId: string, end_cursor = "") {
  const params: Record<string, string> = { user_id: userId };
  if (end_cursor) params.end_cursor = end_cursor;
  return tikhubGet("/api/v1/instagram/v3/get_user_following", params);
}

// ── Stories ───────────────────────────────────────────────────────────────────

/**
 * Stories aktif user — EKSKLUSIF, provider gratis tidak ada yang bisa ini
 * @param username  username Instagram
 */
export async function tikhubIGUserStories(username: string) {
  return tikhubGet("/api/v1/instagram/v3/get_user_stories", { username });
}

// ── Highlights ────────────────────────────────────────────────────────────────

/** Daftar highlights (story archive) user */
export async function tikhubIGUserHighlights(userId: string) {
  return tikhubGet("/api/v1/instagram/v3/get_user_highlights", { user_id: userId });
}

/** Isi stories dari 1 highlight */
export async function tikhubIGHighlightStories(highlightId: string) {
  return tikhubGet("/api/v1/instagram/v3/get_highlight_stories", { highlight_id: highlightId });
}

// ── Post detail ───────────────────────────────────────────────────────────────

/** Detail 1 post by shortcode (dari URL: instagram.com/p/<shortcode>/) */
export async function tikhubIGPostByCode(shortcode: string) {
  return tikhubGet("/api/v1/instagram/v3/get_post_info_by_code", { shortcode });
}

/** Komentar post */
export async function tikhubIGPostComments(shortcode: string, end_cursor = "") {
  const params: Record<string, string> = { shortcode };
  if (end_cursor) params.end_cursor = end_cursor;
  return tikhubGet("/api/v1/instagram/v3/get_post_comments", params);
}

/** Daftar user yang like post */
export async function tikhubIGPostLikes(shortcode: string, end_cursor = "") {
  const params: Record<string, string> = { shortcode };
  if (end_cursor) params.end_cursor = end_cursor;
  return tikhubGet("/api/v1/instagram/v3/get_post_likes", params);
}

// ── Search ────────────────────────────────────────────────────────────────────

/** Cari user */
export async function tikhubIGSearchUsers(keyword: string) {
  return tikhubGet("/api/v1/instagram/v3/search_users", { keyword });
}

/** Cari hashtag */
export async function tikhubIGSearchHashtags(keyword: string) {
  return tikhubGet("/api/v1/instagram/v3/search_hashtags", { keyword });
}

/** Post by hashtag */
export async function tikhubIGHashtagPosts(name: string, end_cursor = "") {
  const params: Record<string, string> = { name };
  if (end_cursor) params.end_cursor = end_cursor;
  return tikhubGet("/api/v1/instagram/v3/get_hashtag_posts", params);
}
