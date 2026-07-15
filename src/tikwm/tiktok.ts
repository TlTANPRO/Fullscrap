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
 * ENDPOINT YANG CONFIRMED WORKS (diuji langsung Juli 2026):
 *   POST /api/user/info      → profil user ✅
 *   POST /api/challenge/info → info hashtag ✅
 *   POST /api/challenge/posts → video by hashtag ✅
 *   POST /api/feed/search    → search video ✅
 *   POST /api/             → detail video by URL + download link ✅ BARU
 *   POST /api/user/search    → cari user by keyword ⚠️ BARU (intermittent CF)
 *
 * ENDPOINT YANG CLOUDFLARE-PROTECTED (gagal dari datacenter IP):
 *   GET/POST /api/user/posts → Cloudflare block dari server
 *   POST /api/user/search    → kadang Cloudflare block dari server
 *   POST /api/related/item_list, /api/video/comment/list → Cloudflare block
 *   (semua di atas works dari browser atau residential IP)
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

  // Gunakan URLSearchParams object (bukan .toString()) agar fetch auto-set
  // Content-Type: application/x-www-form-urlencoded — wajib agar body ter-parse
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: DEFAULT_HEADERS,
    body: params,
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

// ─── Endpoint Baru (Ditambahkan Juli 2026) ───────────────────────────────────

export interface TikWMVideoDetail {
  /** Video ID (sama dengan aweme_id) */
  id: string;
  /** Judul / deskripsi video */
  title: string;
  region: string;
  /** Cover image URL */
  cover: string;
  /** Cover animated (AI generated) */
  ai_dynamic_cover: string;
  /** Cover original (tanpa watermark branding) */
  origin_cover: string;
  /** Durasi video dalam detik */
  duration: number;
  /** URL play video tanpa watermark — bisa langsung diakses */
  play: string;
  /** URL play dengan watermark */
  wmplay: string;
  /** URL HD tanpa watermark (kualitas terbaik) */
  hdplay: string;
  /** Ukuran file play dalam bytes */
  size: number;
  /** Ukuran file HD dalam bytes */
  hd_size: number;
  /** URL audio/musik terpisah */
  music: string;
  music_info: {
    id: string;
    title: string;
    play: string;
    cover: string;
    author: string;
    /** true jika musik asli si kreator (original sound) */
    original: boolean;
    duration: number;
  };
  play_count: number;
  digg_count: number;    // likes
  comment_count: number;
  share_count: number;
  download_count: number;
  collect_count: number; // saves/bookmarks
  /** Unix timestamp waktu upload */
  create_time: number;
  is_ad: boolean;
  author: {
    id: string;
    unique_id: string;
    nickname: string;
    avatar: string;
  };
}

export interface TikWMSearchUserResult {
  user: {
    id: string;
    uniqueId: string;
    nickname: string;
    avatarThumb: string;
    avatarMedium: string;
    avatarLarger: string;
    signature: string;
    verified: boolean;
    secUid: string;
    privateAccount: boolean;
  };
  stats: {
    followerCount: number;
    followingCount: number;
    heartCount: number;
    videoCount: number;
    diggCount: number;
  };
}

/**
 * Ambil detail lengkap satu video TikTok berdasarkan URL.
 * CONFIRMED WORKS — diuji: Juli 2026 ✅
 *
 * Endpoint ini mengembalikan metadata video PLUS URL download tanpa watermark.
 * Endpoint yang dipakai: POST https://www.tikwm.com/api/
 *
 * @param tiktokUrl - URL video TikTok lengkap
 *                    Contoh: "https://www.tiktok.com/@mrbeast/video/7370428688920396075"
 *
 * @example
 * const detail = await tikwmVideoByUrl("https://www.tiktok.com/@mrbeast/video/7370428688920396075");
 * console.log(detail.title, detail.play_count);
 * console.log(detail.play);    // URL download no-watermark
 * console.log(detail.hdplay);  // URL download HD no-watermark
 */
export async function tikwmVideoByUrl(tiktokUrl: string): Promise<TikWMVideoDetail> {
  // Path "/" → BASE_URL + "/" = "https://www.tikwm.com/api/"
  // Jangan pakai "/api/" — itu akan jadi double-path (/api/api/)
  const raw = (await tikwmPost("/", {
    url: tiktokUrl,
    hd: 1,
  })) as {
    code: number;
    msg: string;
    data: TikWMVideoDetail;
  };

  if (raw.code !== 0) {
    throw new Error(
      `TikWM video by URL error: ${raw.msg} (code ${raw.code}). URL: ${tiktokUrl}`
    );
  }

  return raw.data;
}

/**
 * Cari user TikTok berdasarkan keyword.
 * CONFIRMED WORKS saat diuji manual — Juli 2026.
 * ⚠️ Kadang terkena Cloudflare intermittent dari datacenter IP.
 *
 * @param keywords - Kata kunci pencarian (nama, nickname, handle)
 * @param count    - Jumlah hasil (default 10)
 * @param cursor   - Cursor pagination (mulai dari 0)
 *
 * @example
 * const { users } = await tikwmSearchUsers("mrbeast", 5);
 * for (const r of users) {
 *   console.log(r.user.uniqueId, r.stats.followerCount);
 * }
 */
export async function tikwmSearchUsers(
  keywords: string,
  count = 10,
  cursor = 0
): Promise<{ users: TikWMSearchUserResult[]; hasMore: boolean; cursor: number }> {
  const raw = (await tikwmPost("/user/search", {
    keywords,
    count,
    cursor,
  })) as {
    code: number;
    msg: string;
    data: {
      user_list: Array<{
        user: TikWMSearchUserResult["user"];
        stats: TikWMSearchUserResult["stats"];
      }>;
      cursor: number;
      has_more: boolean;
    };
  };

  if (raw.code !== 0) {
    throw new Error(`TikWM user/search error: ${raw.msg} (code ${raw.code})`);
  }

  const users: TikWMSearchUserResult[] = (raw.data?.user_list ?? []).map(item => ({
    user: item.user,
    stats: item.stats,
  }));

  return {
    users,
    hasMore: raw.data?.has_more ?? false,
    cursor: raw.data?.cursor ?? 0,
  };
}

/**
 * Helper: build TikTok video URL dari uniqueId + videoId.
 * Berguna untuk mempersiapkan input ke tikwmVideoByUrl().
 *
 * @example
 * const url = buildTikTokVideoUrl("mrbeast", "7370428688920396075");
 * const detail = await tikwmVideoByUrl(url);
 */
export function buildTikTokVideoUrl(uniqueId: string, videoId: string): string {
  return `https://www.tiktok.com/@${uniqueId}/video/${videoId}`;
}

// ─── Endpoint Baru Juli 2026 — Batch 2 ──────────────────────────────────────

export interface TikWMFollowing {
  /** User ID numerik */
  id: string;
  /** Username TikTok (tanpa @) */
  unique_id: string;
  /** Nama tampilan */
  nickname: string;
  /** Region asal user */
  region: string;
  /** Avatar thumbnail URL */
  avatar_thumb: string;
  /** Apakah akun private */
  is_private_account: boolean;
  /** Sec UID (dipakai TikTok internal) */
  sec_uid: string;
  /** Signature / bio */
  signature: string;
  verified: boolean;
}

/**
 * Ambil daftar following (akun yang di-follow) dari user TikTok.
 * CONFIRMED WORKS — diuji Juli 2026 ✅
 *
 * ⚠️ Hanya tersedia jika user tidak menyembunyikan following list.
 * Beberapa akun selebriti menyembunyikannya → error "Profile user is hiding following list."
 *
 * @param userId  - User ID numerik (bukan username). Dapatkan dari tikwmUserInfo().
 *                  Contoh: dapatkan id dari tikwmUserInfo("charlidamelio").user.id
 * @param count   - Jumlah per halaman (default 10, max 30)
 * @param cursor  - Cursor pagination (mulai dari 0)
 *
 * @example
 * // Step 1: dapatkan userId dari tikwmUserInfo
 * const { user } = await tikwmUserInfo("tiktokcreators");
 * // Step 2: ambil following list pakai user.id (numerik)
 * const { followings } = await tikwmUserFollowing(user.id);
 * for (const f of followings) {
 *   console.log(f.unique_id, f.nickname, f.verified);
 * }
 */
export async function tikwmUserFollowing(
  userId: string,
  count = 10,
  cursor = 0
): Promise<{ followings: TikWMFollowing[]; hasMore: boolean; cursor: number }> {
  const raw = (await tikwmPost("/user/following", {
    user_id: userId,
    count,
    cursor,
  })) as {
    code: number;
    msg: string;
    data: {
      followings: TikWMFollowing[];
      cursor: number;
      has_more: boolean | number;
    };
  };

  if (raw.code !== 0) {
    throw new Error(`TikWM user/following error: ${raw.msg} (code ${raw.code})`);
  }

  return {
    followings: raw.data?.followings ?? [],
    hasMore: !!raw.data?.has_more,
    cursor: raw.data?.cursor ?? 0,
  };
}

export interface TikWMFeedVideo {
  video_id: string;
  region: string;
  title: string;
  /** Cover image URL */
  cover: string;
  /** URL play video tanpa watermark */
  play: string;
  /** URL play video dengan watermark */
  wmplay: string;
  duration: number;
  play_count: number;
  digg_count: number;
  comment_count: number;
  share_count: number;
  collect_count: number;
  download_count: number;
  create_time: number;
  music_id: string;
  author: {
    id: string;
    unique_id: string;
    nickname: string;
    avatar: string;
  };
}

/**
 * Ambil feed/trending video TikTok berdasarkan region.
 * CONFIRMED WORKS — diuji Juli 2026 ✅
 *
 * Endpoint: POST https://www.tikwm.com/api/feed/list
 *
 * @param region - Kode negara 2 huruf ISO 3166-1 alpha-2.
 *                 Contoh: "US", "ID", "GB", "JP", "KR", "IN", "BR"
 *                 Default "US".
 * @param count  - Jumlah video per request (default 10, max 30)
 * @param cursor - Cursor pagination (mulai dari 0)
 *
 * @example
 * // Trending Indonesia
 * const { videos } = await tikwmFeedList("ID", 10);
 * for (const v of videos) {
 *   console.log(v.author.unique_id, "→", v.title.slice(0, 60));
 * }
 *
 * @example
 * // Trending US, halaman kedua
 * const page1 = await tikwmFeedList("US", 10, 0);
 * const page2 = await tikwmFeedList("US", 10, page1.cursor);
 */
export async function tikwmFeedList(
  region = "US",
  count = 10,
  cursor = 0
): Promise<{ videos: TikWMFeedVideo[]; hasMore: boolean; cursor: number }> {
  const raw = (await tikwmPost("/feed/list", {
    region,
    count,
    cursor,
  })) as {
    code: number;
    msg: string;
    data: TikWMFeedVideo[] | { videos?: TikWMFeedVideo[]; has_more?: boolean; cursor?: number };
  };

  if (raw.code !== 0) {
    throw new Error(`TikWM feed/list error: ${raw.msg} (code ${raw.code})`);
  }

  // Response bisa berupa array langsung atau object dengan key videos
  let videos: TikWMFeedVideo[] = [];
  let hasMore = false;
  let nextCursor = 0;

  if (Array.isArray(raw.data)) {
    // Format array langsung (diamati Juli 2026)
    videos = raw.data as TikWMFeedVideo[];
    hasMore = videos.length === count;
    nextCursor = cursor + count;
  } else if (raw.data && typeof raw.data === "object") {
    const d = raw.data as { videos?: TikWMFeedVideo[]; has_more?: boolean; cursor?: number };
    videos = d.videos ?? [];
    hasMore = !!d.has_more;
    nextCursor = d.cursor ?? 0;
  }

  return { videos, hasMore, cursor: nextCursor };
}
