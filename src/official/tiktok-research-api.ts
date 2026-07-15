/**
 * PILIHAN 7 — TikTok Research API (Official)
 *
 * Ini adalah API RESMI TikTok untuk keperluan riset/akademik.
 * Gratis, tapi harus apply dan disetujui tim TikTok.
 *
 * Apply  : https://developers.tiktok.com/products/research-api/
 * Docs   : https://developers.tiktok.com/doc/research-api-get-users-info/
 *
 * REQUIREMENTS:
 * - Mendaftar sebagai researcher (akademik / lembaga penelitian)
 * - Approval dari TikTok (bisa memakan waktu beberapa minggu)
 * - Hanya untuk akun publik
 * - Rate limit: 1000 requests/day
 *
 * Cara dapat token:
 * 1. Apply di: https://developers.tiktok.com/products/research-api/
 * 2. Setelah approved, buat app di developer console
 * 3. Generate client credentials
 * 4. Gunakan client_key + client_secret untuk dapat access_token
 *
 * Env wajib : TIKTOK_CLIENT_KEY     (dari developer console)
 *             TIKTOK_CLIENT_SECRET  (dari developer console)
 */

import { ProviderUpstreamError } from "../ensembledata/types";

const TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const BASE_URL = "https://open.tiktokapis.com/v2/research";

// ─── Auth ────────────────────────────────────────────────────────────────

let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Ambil access token via Client Credentials flow.
 * Token di-cache otomatis sampai expired.
 */
export async function getResearchToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

  if (!clientKey || !clientSecret) {
    throw new ProviderUpstreamError(
      "TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET tidak di-set. " +
      "Apply di: https://developers.tiktok.com/products/research-api/"
    );
  }

  const body = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ProviderUpstreamError(`TikTok token error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
    token_type: string;
  };

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

async function researchPost(
  endpoint: string,
  body: Record<string, unknown>,
  fields: string
): Promise<unknown> {
  const token = await getResearchToken();
  const url = `${BASE_URL}${endpoint}?fields=${encodeURIComponent(fields)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ProviderUpstreamError(`TikTok Research API error ${res.status}: ${text.slice(0, 300)}`);
  }

  return res.json();
}

// ─── Public API ──────────────────────────────────────────────────────────

/**
 * Ambil informasi user TikTok.
 *
 * Fields yang tersedia:
 * display_name, bio_description, avatar_url, is_verified,
 * follower_count, following_count, likes_count, video_count
 *
 * @example
 * const user = await researchGetUserInfo("charlidamelio");
 * console.log(user.data.user);
 */
export async function researchGetUserInfo(
  username: string,
  fields = "display_name,bio_description,avatar_url,is_verified,follower_count,following_count,likes_count,video_count"
): Promise<{
  data: {
    user: {
      display_name: string;
      bio_description: string;
      avatar_url: string;
      is_verified: boolean;
      follower_count: number;
      following_count: number;
      likes_count: number;
      video_count: number;
    };
  };
  error: { code: string; message: string };
}> {
  const raw = await researchPost(
    "/user/info/",
    { username },
    fields
  );
  return raw as ReturnType<typeof researchGetUserInfo>;
}

/**
 * Cari video TikTok berdasarkan query dan filter.
 *
 * @param query       - Query object untuk filter (lihat docs)
 * @param fields      - Fields yang ingin diambil
 * @param startCursor - Cursor untuk pagination
 * @param maxCount    - Jumlah video per request (max 100)
 *
 * @example
 * // Cari video dari akun tertentu
 * const results = await researchQueryVideos({
 *   and: [{ field: "username", operation: "EQ", field_values: ["charlidamelio"] }]
 * });
 *
 * // Cari video dengan hashtag
 * const hashtagResults = await researchQueryVideos({
 *   and: [{ field: "hashtag_name", operation: "IN", field_values: ["fyp", "viral"] }]
 * });
 */
export async function researchQueryVideos(
  query: {
    and?: Array<{ field: string; operation: string; field_values: string[] }>;
    or?: Array<{ field: string; operation: string; field_values: string[] }>;
    not?: Array<{ field: string; operation: string; field_values: string[] }>;
  },
  fields = "id,video_description,create_time,username,region_code,like_count,comment_count,share_count,view_count,hashtag_names,music_id,duration",
  startCursor = 0,
  maxCount = 20,
  startDate = "20240101",
  endDate = new Date().toISOString().slice(0, 10).replace(/-/g, "")
): Promise<{
  data: {
    videos: unknown[];
    cursor: number;
    has_more: boolean;
    search_id: string;
  };
  error: { code: string; message: string };
}> {
  const raw = await researchPost(
    "/video/query/",
    {
      query,
      start_date: startDate,
      end_date: endDate,
      max_count: maxCount,
      cursor: startCursor,
    },
    fields
  );
  return raw as ReturnType<typeof researchQueryVideos>;
}

/**
 * Ambil komentar sebuah video.
 *
 * @example
 * const comments = await researchGetVideoComments("7123456789012345678");
 */
export async function researchGetVideoComments(
  videoId: string,
  fields = "id,text,like_count,reply_count,parent_comment_id,create_time",
  cursor = 0,
  maxCount = 20
): Promise<{
  data: {
    comments: unknown[];
    cursor: number;
    has_more: boolean;
  };
  error: { code: string; message: string };
}> {
  const raw = await researchPost(
    "/video/comment/list/",
    { video_id: videoId, cursor, max_count: maxCount },
    fields
  );
  return raw as ReturnType<typeof researchGetVideoComments>;
}

/**
 * Ambil follower / following list user.
 *
 * @example
 * const followers = await researchGetUserFollowers("charlidamelio");
 */
export async function researchGetUserFollowers(
  username: string,
  fields = "display_name,bio_description,follower_count,following_count,likes_count,video_count",
  cursor = 0,
  maxCount = 100
): Promise<{
  data: {
    user_followers: unknown[];
    cursor: number;
    has_more: boolean;
  };
  error: { code: string; message: string };
}> {
  const raw = await researchPost(
    "/user/followers/",
    { username, cursor, max_count: maxCount },
    fields
  );
  return raw as ReturnType<typeof researchGetUserFollowers>;
}

export async function researchGetUserFollowing(
  username: string,
  fields = "display_name,follower_count,following_count,likes_count,video_count",
  cursor = 0,
  maxCount = 100
): Promise<{
  data: {
    user_following: unknown[];
    cursor: number;
    has_more: boolean;
  };
  error: { code: string; message: string };
}> {
  const raw = await researchPost(
    "/user/following/",
    { username, cursor, max_count: maxCount },
    fields
  );
  return raw as ReturnType<typeof researchGetUserFollowing>;
}

/**
 * Ambil video yang di-pin atau di-like user (public likes only).
 *
 * @example
 * const pinnedVideos = await researchGetUserPinnedVideos("charlidamelio");
 */
export async function researchGetUserPinnedVideos(
  username: string,
  fields = "id,video_description,like_count,comment_count,share_count,view_count"
): Promise<{
  data: { pinned_video_list: unknown[] };
  error: { code: string; message: string };
}> {
  const raw = await researchPost("/user/pinned_videos/", { username }, fields);
  return raw as ReturnType<typeof researchGetUserPinnedVideos>;
}
