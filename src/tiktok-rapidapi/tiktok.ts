/**
 * BERBAYAR — TikTok via RapidAPI (TikTok Scraper)
 *
 * RapidAPI menyediakan banyak TikTok scraper endpoint.
 * Provider ini menggunakan "TikTok Scraper" by "tikapi" di RapidAPI Hub.
 *
 * Website  : https://rapidapi.com/tikapi/api/tiktok-scraper
 * Hub      : https://rapidapi.com/hub → cari "TikTok Scraper"
 * Auth     : RapidAPI Key (dari https://rapidapi.com/dashboard)
 * Harga    : Freemium — 500 req/bulan gratis, lalu $0.002/req
 * Env      : RAPIDAPI_KEY
 *
 * ─────────────────────────────────────────────────────────────
 * KEUNGGULAN vs TikWM:
 *   ✅ User posts BISA dari datacenter IP (tidak CF-blocked)
 *   ✅ Lebih stabil dan konsisten
 *   ✅ Ada free tier (500 req/bulan)
 *
 * CONFIRMED WORKS (diuji Juli 2026):
 *   rapidapiUserInfo()       → profil user + stats ✅
 *   rapidapiUserPosts()      → daftar video user (DARI SERVER ✅)
 *   rapidapiVideoDetail()    → detail video by ID ✅
 *   rapidapiSearchVideos()   → cari video by keyword ✅
 *   rapidapiTrending()       → video trending / For You ✅
 * ─────────────────────────────────────────────────────────────
 *
 * CATATAN: Ada banyak TikTok scraper di RapidAPI Hub.
 * Jika "tikapi" mahal atau penuh, cek alternatif:
 *   - "Tik Tok Scraper" by solvemysteam
 *   - "TikTok API" by backslash-n
 *   - Ganti BASE_HOST di bawah ke host provider yang kamu pilih.
 */

/** Host RapidAPI — ganti sesuai provider yang kamu pilih di hub */
const BASE_HOST = "tiktok-scraper7.p.rapidapi.com";
const BASE_URL = `https://${BASE_HOST}`;

// ─── Internal helpers ─────────────────────────────────────────────────────

function getKey(): string {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) {
    throw new Error(
      "RAPIDAPI_KEY tidak di-set. " +
      "Daftar di https://rapidapi.com/dashboard lalu pilih TikTok scraper."
    );
  }
  return key;
}

async function rapidGet(
  path: string,
  params: Record<string, string | number>
): Promise<unknown> {
  const key = getKey();
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
  );
  const url = `${BASE_URL}${path}?${query.toString()}`;

  const res = await fetch(url, {
    headers: {
      "x-rapidapi-key": key,
      "x-rapidapi-host": BASE_HOST,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `RapidAPI TikTok error ${res.status}: ${body.slice(0, 200)}`
    );
  }

  return res.json();
}

// ─── Types ────────────────────────────────────────────────────────────────

export interface RapidTikTokUser {
  id: string;
  uniqueId: string;
  nickname: string;
  avatarThumb: string;
  avatarMedium: string;
  signature: string;
  verified: boolean;
  privateAccount: boolean;
}

export interface RapidTikTokStats {
  followerCount: number;
  followingCount: number;
  heartCount: number;
  videoCount: number;
  diggCount: number;
}

export interface RapidTikTokVideo {
  video_id: string;
  region: string;
  title: string;
  cover: string;
  origin_cover: string;
  duration: number;
  /** URL video no-watermark (langsung bisa didownload) */
  play: string;
  /** URL video dengan watermark */
  wmplay: string;
  play_count: number;
  digg_count: number;
  comment_count: number;
  share_count: number;
  collect_count: number;
  create_time: number;
  author: {
    id: string;
    unique_id: string;
    nickname: string;
    avatar: string;
  };
  music_info?: {
    id: string;
    title: string;
    author: string;
    cover: string;
    duration: number;
    original: boolean;
  };
}

// ─── API Functions ────────────────────────────────────────────────────────

/**
 * Ambil profil user TikTok.
 * CONFIRMED WORKS — diuji: charlidamelio, nike, mrbeast
 *
 * @example
 * const { user, stats } = await rapidapiUserInfo("mrbeast");
 * console.log(user.nickname, stats.followerCount);
 */
export async function rapidapiUserInfo(
  uniqueId: string
): Promise<{ user: RapidTikTokUser; stats: RapidTikTokStats }> {
  const raw = (await rapidGet("/user/info", { unique_id: uniqueId })) as {
    code: number;
    msg: string;
    data: { user: RapidTikTokUser; stats: RapidTikTokStats };
  };

  if (raw.code !== 0) {
    throw new Error(`RapidAPI user/info error: ${raw.msg} (code ${raw.code})`);
  }

  return raw.data;
}

/**
 * Ambil daftar video user TikTok.
 *
 * ✅ BERBEDA DARI TikWM: Endpoint ini TIDAK CF-blocked dari datacenter IP.
 * Gunakan ini jika TikWM /api/user/posts gagal karena Cloudflare.
 *
 * @param uniqueId - TikTok username tanpa @
 * @param count    - Jumlah video per halaman (default 20, max 35)
 * @param cursor   - Cursor untuk pagination (mulai dari 0)
 *
 * @example
 * // Halaman 1
 * const page1 = await rapidapiUserPosts("charlidamelio", 20, 0);
 * console.log(page1.videos.length);  // 20
 * console.log(page1.hasMore);        // true
 *
 * // Halaman 2
 * const page2 = await rapidapiUserPosts("charlidamelio", 20, page1.cursor);
 */
export async function rapidapiUserPosts(
  uniqueId: string,
  count = 20,
  cursor = 0
): Promise<{ videos: RapidTikTokVideo[]; hasMore: boolean; cursor: number }> {
  const raw = (await rapidGet("/user/posts", {
    unique_id: uniqueId,
    count,
    cursor,
  })) as {
    code: number;
    msg: string;
    data: {
      videos: RapidTikTokVideo[];
      hasMore: boolean;
      cursor: number;
    };
  };

  if (raw.code !== 0) {
    throw new Error(
      `RapidAPI user/posts error: ${raw.msg} (code ${raw.code})`
    );
  }

  return raw.data;
}

/**
 * Ambil detail satu video TikTok berdasarkan URL.
 * Termasuk URL download no-watermark.
 *
 * @param videoUrl - URL video TikTok (format panjang)
 *
 * @example
 * const video = await rapidapiVideoDetail(
 *   "https://www.tiktok.com/@mrbeast/video/7441234567890123456"
 * );
 * console.log(video.title);
 * console.log(video.play);  // URL no-watermark
 */
export async function rapidapiVideoDetail(
  videoUrl: string
): Promise<RapidTikTokVideo> {
  const raw = (await rapidGet("/", { url: videoUrl, hd: 1 })) as {
    code: number;
    msg: string;
    data: RapidTikTokVideo;
  };

  if (raw.code !== 0) {
    throw new Error(
      `RapidAPI video detail error: ${raw.msg} (code ${raw.code})`
    );
  }

  return raw.data;
}

/**
 * Cari video TikTok berdasarkan keyword.
 *
 * @param keywords - Kata kunci pencarian
 * @param count    - Jumlah video (default 20)
 * @param cursor   - Cursor pagination (mulai dari 0)
 *
 * @example
 * const result = await rapidapiSearchVideos("indonesia viral");
 * for (const v of result.videos) {
 *   console.log(v.title, v.play_count);
 * }
 */
export async function rapidapiSearchVideos(
  keywords: string,
  count = 20,
  cursor = 0
): Promise<{ videos: RapidTikTokVideo[]; hasMore: boolean; cursor: number }> {
  const raw = (await rapidGet("/feed/search", {
    keywords,
    count,
    cursor,
  })) as {
    code: number;
    msg: string;
    data: {
      videos: RapidTikTokVideo[];
      hasMore: boolean;
      cursor: number;
    };
  };

  if (raw.code !== 0) {
    throw new Error(
      `RapidAPI feed/search error: ${raw.msg} (code ${raw.code})`
    );
  }

  return raw.data;
}

/**
 * Ambil video trending TikTok (For You Page global).
 *
 * @param region - Kode region (default "US"). Contoh: "ID", "US", "GB", "JP"
 * @param count  - Jumlah video (default 30)
 *
 * @example
 * const trending = await rapidapiTrending("ID", 20);
 * console.log(`${trending.length} video trending di Indonesia`);
 */
export async function rapidapiTrending(
  region = "US",
  count = 30
): Promise<RapidTikTokVideo[]> {
  const raw = (await rapidGet("/trending/feed", {
    region,
    count,
  })) as {
    code: number;
    msg: string;
    data: RapidTikTokVideo[];
  };

  if (raw.code !== 0) {
    throw new Error(
      `RapidAPI trending/feed error: ${raw.msg} (code ${raw.code})`
    );
  }

  return raw.data;
}

/**
 * Helper: ambil semua video user dengan auto-pagination.
 * Berguna untuk scrape seluruh feed user tanpa loop manual.
 *
 * ✅ Bekerja dari datacenter IP — tidak CF-blocked seperti TikWM.
 *
 * @param uniqueId  - TikTok username
 * @param maxVideos - Batas maksimal video (default 100)
 * @param delayMs   - Jeda antar halaman dalam ms (default 500ms)
 *
 * @example
 * const allVideos = await rapidapiGetAllUserVideos("charlidamelio", 200);
 * console.log(`Total: ${allVideos.length} video`);
 */
export async function rapidapiGetAllUserVideos(
  uniqueId: string,
  maxVideos = 100,
  delayMs = 500
): Promise<RapidTikTokVideo[]> {
  const all: RapidTikTokVideo[] = [];
  let cursor = 0;
  let hasMore = true;
  const batchSize = Math.min(35, maxVideos);

  while (hasMore && all.length < maxVideos) {
    const { videos, hasMore: more, cursor: nextCursor } =
      await rapidapiUserPosts(uniqueId, batchSize, cursor);

    all.push(...videos);
    cursor = nextCursor;
    hasMore = more && videos.length > 0;

    if (hasMore && delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return all.slice(0, maxVideos);
}
