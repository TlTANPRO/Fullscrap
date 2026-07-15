/**
 * PILIHAN 5 — Instagram via HikerAPI
 *
 * HikerAPI adalah Instagram data provider khusus dengan 147+ endpoint.
 * Tidak perlu OAuth, tidak perlu akun Instagram.
 *
 * Situs      : https://hikerapi.com
 * Daftar     : https://hikerapi.com/sign-up
 * Docs       : https://hikerapi.com/docs
 * Harga      : $0.0006/request | 100 request GRATIS saat daftar
 * Free tier  : 100 request gratis (tidak perlu kartu kredit)
 *
 * Kelebihan vs provider lain:
 * - 147 endpoint lengkap (profil, posts, reels, stories, highlights,
 *   followers, following, comments, hashtags, locations, search, GraphQL)
 * - Tidak ada blocks / rotasi proxy otomatis
 * - Response super cepat (cached)
 * - No blocks — SLA uptime tinggi
 *
 * Env wajib : HIKERAPI_KEY
 */

import { ProviderUpstreamError } from "../ensembledata/types";

const BASE_URL = "https://hikerapi.com/api/v1";

function getKey(): string {
  const key = process.env.HIKERAPI_KEY;
  if (!key) throw new ProviderUpstreamError("HIKERAPI_KEY tidak di-set. Daftar di https://hikerapi.com/sign-up (100 request gratis)");
  return key;
}

async function hikerGet(path: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "x-access-key": getKey(),
      "Accept": "application/json",
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ProviderUpstreamError(`HikerAPI error ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

// ─── Endpoint categories ──────────────────────────────────────────────────
//
// User Profiles:
//   GET /user/by/username?username=nike          → profil by username
//   GET /user/by/id?pk=USER_ID                   → profil by user ID
//   GET /user/info?username=nike                 → info lengkap user
//
// Posts & Reels:
//   GET /user/medias?pk=USER_ID&max_id=          → semua media user (posts+reels)
//   GET /user/clips?pk=USER_ID&max_id=           → reels saja
//   GET /media/by/shortcode?shortcode=ABCXYZ     → detail post dari shortcode
//   GET /media/likers?media_id=MEDIA_ID          → siapa yang like
//   GET /media/comments?media_id=MEDIA_ID&min_id= → komentar post
//
// Stories & Highlights:
//   GET /user/stories?user_id=USER_ID            → stories user (aktif)
//   GET /user/highlights?user_id=USER_ID         → list highlight
//   GET /highlight/{highlight_id}                → isi highlight tertentu
//
// Followers & Following:
//   GET /user/followers?pk=USER_ID&max_id=       → followers user
//   GET /user/following?pk=USER_ID&max_id=       → following user
//
// Hashtags:
//   GET /hashtag/by/name?name=sneakers           → info hashtag
//   GET /hashtag/medias/top?name=sneakers        → top posts hashtag
//   GET /hashtag/medias/recent?name=sneakers&max_id= → recent posts hashtag
//
// Search:
//   GET /search/users?query=nike                 → cari user
//   GET /search/hashtags?query=sneakers          → cari hashtag
//   GET /search/places?query=jakarta             → cari lokasi
//
// Locations:
//   GET /location/by/id?location_id=ID           → info lokasi
//   GET /location/medias/recent?location_id=ID&max_id= → post di lokasi
//
// GraphQL (advanced):
//   POST /gql/query                              → custom GraphQL query

/**
 * Ambil profil user berdasarkan username.
 *
 * @example
 * const profile = await hikerUserByUsername("nike");
 * console.log(profile.pk, profile.follower_count);
 */
export async function hikerUserByUsername(username: string): Promise<{
  pk: string;
  username: string;
  full_name: string;
  biography: string;
  profile_pic_url: string;
  is_verified: boolean;
  follower_count: number;
  following_count: number;
  media_count: number;
  external_url: string;
  [key: string]: unknown;
}> {
  const raw = await hikerGet(`/user/by/username?username=${encodeURIComponent(username)}`);
  return raw as ReturnType<typeof hikerUserByUsername>;
}

/**
 * Ambil profil user berdasarkan user ID numerik.
 *
 * @example
 * const profile = await hikerUserById("167224140");
 */
export async function hikerUserById(userId: string): Promise<unknown> {
  return hikerGet(`/user/by/id?pk=${userId}`);
}

/**
 * Ambil semua media (posts + reels) milik user.
 * Gunakan max_id sebagai cursor pagination.
 *
 * @example
 * const page1 = await hikerUserMedias("167224140");
 * const page2 = await hikerUserMedias("167224140", page1.next_max_id);
 */
export async function hikerUserMedias(
  userId: string,
  maxId = ""
): Promise<{ items: unknown[]; next_max_id: string; more_available: boolean }> {
  let path = `/user/medias?pk=${userId}`;
  if (maxId) path += `&max_id=${encodeURIComponent(maxId)}`;

  const raw = (await hikerGet(path)) as {
    items?: unknown[];
    next_max_id?: string;
    more_available?: boolean;
  };

  return {
    items: raw.items ?? [],
    next_max_id: String(raw.next_max_id ?? ""),
    more_available: Boolean(raw.more_available),
  };
}

/**
 * Ambil semua media dengan auto-pagination.
 *
 * @example
 * const profile = await hikerUserByUsername("nike");
 * const allMedia = await hikerGetAllMedias(profile.pk, 100);
 */
export async function hikerGetAllMedias(
  userId: string,
  maxItems = 100
): Promise<unknown[]> {
  const all: unknown[] = [];
  let maxId = "";
  let moreAvailable = true;

  while (moreAvailable && all.length < maxItems) {
    const { items, next_max_id, more_available } = await hikerUserMedias(userId, maxId);
    all.push(...items);
    maxId = next_max_id;
    moreAvailable = more_available && !!next_max_id;
    if (items.length === 0) break;
    await new Promise(r => setTimeout(r, 300));
  }

  return all.slice(0, maxItems);
}

/**
 * Ambil reels saja milik user.
 *
 * @example
 * const profile = await hikerUserByUsername("nike");
 * const reels = await hikerUserClips(profile.pk);
 */
export async function hikerUserClips(
  userId: string,
  maxId = ""
): Promise<{ items: unknown[]; next_max_id: string; more_available: boolean }> {
  let path = `/user/clips?pk=${userId}`;
  if (maxId) path += `&max_id=${encodeURIComponent(maxId)}`;

  const raw = (await hikerGet(path)) as {
    items?: unknown[];
    next_max_id?: string;
    more_available?: boolean;
  };

  return {
    items: raw.items ?? [],
    next_max_id: String(raw.next_max_id ?? ""),
    more_available: Boolean(raw.more_available),
  };
}

/**
 * Ambil detail post dari shortcode URL.
 * Shortcode = bagian setelah /p/ di URL: instagram.com/p/SHORTCODE/
 *
 * @example
 * const post = await hikerMediaByShortcode("CxYZ123abc");
 */
export async function hikerMediaByShortcode(shortcode: string): Promise<unknown> {
  return hikerGet(`/media/by/shortcode?shortcode=${shortcode}`);
}

/**
 * Ambil daftar user yang menyukai sebuah post.
 *
 * @example
 * const likers = await hikerMediaLikers("3012345678901234567");
 */
export async function hikerMediaLikers(
  mediaId: string,
  maxId = ""
): Promise<{ users: unknown[]; next_max_id: string }> {
  let path = `/media/likers?media_id=${mediaId}`;
  if (maxId) path += `&max_id=${encodeURIComponent(maxId)}`;

  const raw = (await hikerGet(path)) as {
    users?: unknown[];
    next_max_id?: string;
  };

  return {
    users: raw.users ?? [],
    next_max_id: String(raw.next_max_id ?? ""),
  };
}

/**
 * Ambil komentar sebuah post.
 *
 * @example
 * const page1 = await hikerMediaComments("3012345678901234567");
 * const page2 = await hikerMediaComments("3012345678901234567", page1.next_min_id);
 */
export async function hikerMediaComments(
  mediaId: string,
  minId = ""
): Promise<{ comments: unknown[]; next_min_id: string; has_more: boolean }> {
  let path = `/media/comments?media_id=${mediaId}`;
  if (minId) path += `&min_id=${encodeURIComponent(minId)}`;

  const raw = (await hikerGet(path)) as {
    comments?: unknown[];
    next_min_id?: string;
    has_more?: boolean;
  };

  return {
    comments: raw.comments ?? [],
    next_min_id: String(raw.next_min_id ?? ""),
    has_more: Boolean(raw.has_more),
  };
}

/**
 * Ambil stories aktif user.
 *
 * @example
 * const profile = await hikerUserByUsername("nike");
 * const stories = await hikerUserStories(profile.pk);
 */
export async function hikerUserStories(userId: string): Promise<unknown[]> {
  const raw = (await hikerGet(`/user/stories?user_id=${userId}`)) as unknown[];
  return Array.isArray(raw) ? raw : [];
}

/**
 * Ambil list highlight user.
 *
 * @example
 * const profile = await hikerUserByUsername("nike");
 * const highlights = await hikerUserHighlights(profile.pk);
 */
export async function hikerUserHighlights(userId: string): Promise<unknown[]> {
  const raw = (await hikerGet(`/user/highlights?user_id=${userId}`)) as unknown[];
  return Array.isArray(raw) ? raw : [];
}

/**
 * Ambil followers user.
 *
 * @example
 * const profile = await hikerUserByUsername("nike");
 * const page1 = await hikerUserFollowers(profile.pk);
 * const page2 = await hikerUserFollowers(profile.pk, page1.next_max_id);
 */
export async function hikerUserFollowers(
  userId: string,
  maxId = ""
): Promise<{ users: unknown[]; next_max_id: string; big_list: boolean }> {
  let path = `/user/followers?pk=${userId}`;
  if (maxId) path += `&max_id=${encodeURIComponent(maxId)}`;

  const raw = (await hikerGet(path)) as {
    users?: unknown[];
    next_max_id?: string;
    big_list?: boolean;
  };

  return {
    users: raw.users ?? [],
    next_max_id: String(raw.next_max_id ?? ""),
    big_list: Boolean(raw.big_list),
  };
}

/**
 * Ambil following user.
 *
 * @example
 * const page1 = await hikerUserFollowing(profile.pk);
 */
export async function hikerUserFollowing(
  userId: string,
  maxId = ""
): Promise<{ users: unknown[]; next_max_id: string }> {
  let path = `/user/following?pk=${userId}`;
  if (maxId) path += `&max_id=${encodeURIComponent(maxId)}`;

  const raw = (await hikerGet(path)) as {
    users?: unknown[];
    next_max_id?: string;
  };

  return {
    users: raw.users ?? [],
    next_max_id: String(raw.next_max_id ?? ""),
  };
}

/**
 * Cari posts berdasarkan hashtag (top posts).
 *
 * @example
 * const posts = await hikerHashtagTopPosts("sneakers");
 */
export async function hikerHashtagTopPosts(hashtag: string): Promise<unknown[]> {
  const raw = (await hikerGet(
    `/hashtag/medias/top?name=${encodeURIComponent(hashtag.replace(/^#/, ""))}`
  )) as { items?: unknown[] };
  return raw.items ?? [];
}

/**
 * Ambil recent posts berdasarkan hashtag (dengan pagination).
 *
 * @example
 * const page1 = await hikerHashtagRecentPosts("sneakers");
 * const page2 = await hikerHashtagRecentPosts("sneakers", page1.next_max_id);
 */
export async function hikerHashtagRecentPosts(
  hashtag: string,
  maxId = ""
): Promise<{ items: unknown[]; next_max_id: string; more_available: boolean }> {
  let path = `/hashtag/medias/recent?name=${encodeURIComponent(hashtag.replace(/^#/, ""))}`;
  if (maxId) path += `&max_id=${encodeURIComponent(maxId)}`;

  const raw = (await hikerGet(path)) as {
    items?: unknown[];
    next_max_id?: string;
    more_available?: boolean;
  };

  return {
    items: raw.items ?? [],
    next_max_id: String(raw.next_max_id ?? ""),
    more_available: Boolean(raw.more_available),
  };
}

/**
 * Cari user, hashtag, atau tempat berdasarkan query.
 *
 * @example
 * const results = await hikerSearchUsers("nike");
 */
export async function hikerSearchUsers(query: string): Promise<unknown[]> {
  const raw = (await hikerGet(
    `/search/users?query=${encodeURIComponent(query)}`
  )) as { users?: unknown[] };
  return raw.users ?? [];
}

/**
 * Ambil posts di lokasi tertentu.
 *
 * @example
 * const posts = await hikerLocationPosts("213385402"); // Jakarta
 */
export async function hikerLocationPosts(
  locationId: string,
  maxId = ""
): Promise<{ items: unknown[]; next_max_id: string }> {
  let path = `/location/medias/recent?location_id=${locationId}`;
  if (maxId) path += `&max_id=${encodeURIComponent(maxId)}`;

  const raw = (await hikerGet(path)) as {
    items?: unknown[];
    next_max_id?: string;
  };

  return {
    items: raw.items ?? [],
    next_max_id: String(raw.next_max_id ?? ""),
  };
}
