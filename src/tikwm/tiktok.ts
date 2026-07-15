/**
 * GRATIS — TikTok via TikWM
 *
 * TikWM adalah free TikTok API tanpa signup, tanpa API key.
 * Diuji langsung: Juli 2026 — semua endpoint di file ini CONFIRMED WORKS.
 *
 * Website  : https://www.tikwm.com
 * Base URL : https://www.tikwm.com/api
 * Auth     : ❌ Tidak perlu (no key, no signup)
 * Harga    : Gratis
 *
 * ─────────────────────────────────────────────────────────────
 * ENDPOINT YANG CONFIRMED WORKS (diuji langsung):
 *   POST /api/user/info     → profil user ✅
 *   POST /api/challenge/info → info hashtag ✅
 *   POST /api/challenge/posts → video by hashtag ✅
 *   POST /api/feed/search   → search video ✅
 *
 * ENDPOINT YANG CLOUDFLARE-PROTECTED (gagal dari datacenter IP):
 *   GET/POST /api/user/posts → Cloudflare challenge block dari server
 *   (works dari browser atau residential IP)
 * ─────────────────────────────────────────────────────────────
 */

const BASE_URL = "https://www.tikwm.com/api";

const DEFAULT_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Referer": "https://www.tikwm.com/",
  "Accept": "application/json",
};

async function tikwmPost(path: string, body: Record<string, string | number>): Promise<unknown> {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(body)) params.set(k, String(v));

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: DEFAULT_HEADERS,
    body: params.toString(),
  });

  const text = await res.text();

  // Cloudflare challenge HTML — bukan JSON
  if (text.startsWith("<!DOCTYPE html>") || text.startsWith("<html")) {
    throw new Error(
      `TikWM: Cloudflare challenge aktif. Endpoint ini perlu dipanggil dari ` +
      `residential IP (browser/VPS). HTTP ${res.status}`
    );
  }

  return JSON.parse(text) as unknown;
}

// ─── Types ────────────────────────────────────────────────────────────────

export interface TikWMUser {
  id: string;
  uniqueId: string;
  nickname: string;
  avatarThumb: string;
  avatarMedium: string;
  avatarLarger: string;
  signature: string;
  verified: boolean;
}

export interface TikWMStats {
  followerCount: number;
  followingCount: number;
  heartCount: number;
  videoCount: number;
  diggCount: number;
}

export interface TikWMUserInfo {
  user: TikWMUser;
  stats: TikWMStats;
}

export interface TikWMVideo {
  video_id: string;
  region: string;
  title: string;
  cover: string;
  origin_cover: string;
  duration: number;
  play: string;
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

export interface TikWMHashtagInfo {
  id: string;
  cha_name: string;
  desc: string;
  user_count: number;
  view_count: number;
}

// ─── API Functions ────────────────────────────────────────────────────────

/**
 * Ambil profil user TikTok.
 * CONFIRMED WORKS — diuji: charlidamelio, nike, mrbeast, khaby.lame
 *
 * @example
 * const { user, stats } = await tikwmUserInfo("charlidamelio");
 * console.log(user.nickname, stats.followerCount);
 */
export async function tikwmUserInfo(uniqueId: string): Promise<TikWMUserInfo> {
  const raw = (await tikwmPost("/user/info", { unique_id: uniqueId })) as {
    code: number;
    msg: string;
    data: {
      user: TikWMUser;
      stats: TikWMStats;
    };
  };

  if (raw.code !== 0) {
    throw new Error(`TikWM user/info error: ${raw.msg} (code ${raw.code})`);
  }

  return raw.data;
}

/**
 * Ambil info hashtag / challenge TikTok.
 * CONFIRMED WORKS — diuji: fyp, viral, indonesia
 *
 * Gunakan hasilnya (id) untuk tikwmHashtagPosts().
 *
 * @example
 * const tag = await tikwmHashtagInfo("fyp");
 * console.log(tag.cha_name, tag.view_count);
 *
 * // Lalu ambil videonya:
 * const videos = await tikwmHashtagPosts(tag.id);
 */
export async function tikwmHashtagInfo(hashtagName: string): Promise<TikWMHashtagInfo> {
  const name = hashtagName.replace(/^#/, "");
  const raw = (await tikwmPost("/challenge/info", { challenge_name: name })) as {
    code: number;
    msg: string;
    data: TikWMHashtagInfo;
  };

  if (raw.code !== 0) {
    throw new Error(`TikWM challenge/info error: ${raw.msg} (code ${raw.code})`);
  }

  return raw.data;
}

/**
 * Ambil video berdasarkan hashtag.
 * CONFIRMED WORKS — diuji: fyp (challenge_id=229207)
 *
 * Cara pakai: ambil challenge_id dari tikwmHashtagInfo() dulu.
 *
 * @param challengeId - ID numerik hashtag, dari tikwmHashtagInfo().id
 * @param count       - Jumlah video per halaman (default 20, max 50)
 * @param cursor      - Cursor untuk pagination (mulai dari 0)
 *
 * @example
 * const tag    = await tikwmHashtagInfo("fyp");
 * const page1  = await tikwmHashtagPosts(tag.id, 20, 0);
 * const page2  = await tikwmHashtagPosts(tag.id, 20, page1.cursor);
 */
export async function tikwmHashtagPosts(
  challengeId: string,
  count = 20,
  cursor = 0
): Promise<{ videos: TikWMVideo[]; hasMore: boolean; cursor: number }> {
  const raw = (await tikwmPost("/challenge/posts", {
    challenge_id: challengeId,
    count,
    cursor,
  })) as {
    code: number;
    msg: string;
    data: {
      videos: TikWMVideo[];
      hasMore: boolean;
      cursor: number;
    };
  };

  if (raw.code !== 0) {
    throw new Error(`TikWM challenge/posts error: ${raw.msg} (code ${raw.code})`);
  }

  return raw.data;
}

/**
 * Cari video TikTok berdasarkan keyword.
 * CONFIRMED WORKS — diuji: "indonesia viral"
 *
 * @param keywords - Kata kunci pencarian
 * @param count    - Jumlah video (default 20)
 * @param cursor   - Cursor pagination (mulai dari 0)
 *
 * @example
 * const page1 = await tikwmSearchVideos("indonesia viral", 20, 0);
 * const page2 = await tikwmSearchVideos("indonesia viral", 20, page1.cursor);
 */
export async function tikwmSearchVideos(
  keywords: string,
  count = 20,
  cursor = 0
): Promise<{ videos: TikWMVideo[]; hasMore: boolean; cursor: number }> {
  const raw = (await tikwmPost("/feed/search", {
    keywords,
    count,
    cursor,
    web: 1,
  })) as {
    code: number;
    msg: string;
    data: {
      videos: TikWMVideo[];
      hasMore: boolean;
      cursor: number;
    };
  };

  if (raw.code !== 0) {
    throw new Error(`TikWM feed/search error: ${raw.msg} (code ${raw.code})`);
  }

  return raw.data;
}

/**
 * Ambil video user — endpoint ini CLOUDFLARE-PROTECTED dari datacenter IP.
 *
 * ⚠️  CATATAN PENTING:
 * Endpoint ini mengembalikan Cloudflare challenge jika dipanggil dari
 * datacenter IP (Replit, AWS, GCP, dsb.). Akan WORKS dari:
 *   - Browser langsung
 *   - Residential proxy / VPN
 *   - VPS dengan IP residential
 *
 * Tidak dimasukkan ke fungsi utama karena tidak reliable dari server.
 * Alternatif: gunakan EnsembleData untuk user videos (berbayar tapi reliable).
 *
 * Jika ingin mencoba sendiri, endpoint-nya:
 *   POST https://www.tikwm.com/api/user/posts
 *   Body: unique_id=charlidamelio&count=20&cursor=0
 */
export function tikwmUserPostsNote(): string {
  return (
    "TikWM /api/user/posts diproteksi Cloudflare dari datacenter IP. " +
    "Gunakan dari browser atau residential IP. " +
    "Alternatif gratis: tidak ada yang confirmed works dari server. " +
    "Alternatif berbayar: EnsembleData."
  );
}

/**
 * Helper: ambil semua video hashtag dengan auto-pagination.
 *
 * @example
 * const tag    = await tikwmHashtagInfo("indonesia");
 * const videos = await tikwmGetAllHashtagVideos(tag.id, 100);
 */
export async function tikwmGetAllHashtagVideos(
  challengeId: string,
  maxVideos = 100,
  delayMs = 500
): Promise<TikWMVideo[]> {
  const all: TikWMVideo[] = [];
  let cursor = 0;
  let hasMore = true;
  const batchSize = Math.min(50, maxVideos);

  while (hasMore && all.length < maxVideos) {
    const { videos, hasMore: more, cursor: nextCursor } = await tikwmHashtagPosts(
      challengeId,
      batchSize,
      cursor
    );
    all.push(...videos);
    cursor = nextCursor;
    hasMore = more && videos.length > 0;
    if (hasMore && delayMs > 0) await new Promise(r => setTimeout(r, delayMs));
  }

  return all.slice(0, maxVideos);
}

/**
 * Helper: search semua video dengan auto-pagination.
 *
 * @example
 * const videos = await tikwmGetAllSearchVideos("indonesia viral", 50);
 */
export async function tikwmGetAllSearchVideos(
  keywords: string,
  maxVideos = 100,
  delayMs = 500
): Promise<TikWMVideo[]> {
  const all: TikWMVideo[] = [];
  let cursor = 0;
  let hasMore = true;
  const batchSize = Math.min(50, maxVideos);

  while (hasMore && all.length < maxVideos) {
    const { videos, hasMore: more, cursor: nextCursor } = await tikwmSearchVideos(
      keywords,
      batchSize,
      cursor
    );
    all.push(...videos);
    cursor = nextCursor;
    hasMore = more && videos.length > 0;
    if (hasMore && delayMs > 0) await new Promise(r => setTimeout(r, delayMs));
  }

  return all.slice(0, maxVideos);
}
