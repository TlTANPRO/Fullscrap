/**
 * GRATIS — Instagram via Android API Endpoints (Extended)
 *
 * Menggunakan endpoint internal Instagram yang dipakai aplikasi Android resmi.
 * Berbeda dari Provider 3 (instagram-web) karena mengekspos endpoint yang
 * memberikan DATA LEBIH LENGKAP — terutama play_count pada reels.
 *
 * Base URL : https://i.instagram.com/api/v1
 * Auth     : ❌ Tidak perlu (hanya butuh Android User-Agent + App ID)
 * Harga    : Gratis
 *
 * Diuji langsung: Juli 2026 — CONFIRMED WORKS.
 *
 * ─────────────────────────────────────────────────────────────
 * CONFIRMED WORKS (diuji Juli 2026 dari datacenter/Replit):
 *   getReelsFeed()        → reels user + PLAY COUNT ✅ ← yang ini BARU
 *   getPostsFeed()        → posts dengan next_max_id pagination ✅
 *   getAllReels()         → auto-pagination semua reels ✅
 *   getAllPosts()         → auto-pagination semua posts ✅
 *
 * PERBEDAAN vs Provider 3 (instagram-web):
 *   Provider 3 getUserReels() — beberapa versi tidak expose play_count
 *   Provider INI getReelsFeed() — SELALU expose play_count via clips/user ✅
 *
 * TIDAK WORKS tanpa login:
 *   - stories, highlights  → login_required
 *   - followers/following  → login_required / rate-limited
 *   - akun private         → login_required
 * ─────────────────────────────────────────────────────────────
 *
 * CATATAN RATE LIMIT:
 * Provider ini dan Provider 3 (instagram-web) BERBAGI rate limit
 * karena keduanya hit domain i.instagram.com. Jangan pakai keduanya
 * bersamaan secara agresif. Tambah delay ≥ 1 detik antar request.
 *
 * CARA PAKAI:
 * 1. Dapatkan userId dari Provider 3 atau dari getUserProfile() Provider 3
 * 2. Gunakan userId di sini untuk getReelsFeed() atau getPostsFeed()
 */

const BASE_URL = "https://i.instagram.com/api/v1";

/** Android Instagram app headers — diperlukan untuk semua request */
const ANDROID_HEADERS = {
  /** App version yang dipakai saat diuji */
  "User-Agent":
    "Instagram 219.0.0.12.117 Android (26/8.0.0; 480dpi; 1080x1920; OnePlus; 6T Dev; devitron; qcom; en_US; 314665256)",
  /** Instagram web app ID — stabil dan public */
  "x-ig-app-id": "936619743392459",
  Accept: "*/*",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  /** Sec-Fetch headers — beberapa endpoint Instagram mensyaratkannya */
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-site",
};

// ─── Types ────────────────────────────────────────────────────────────────

export interface IGReel {
  /** Media ID Instagram */
  id: string;
  /** Shortcode (bagian setelah /reel/ di URL) */
  code: string;
  /** URL reel di Instagram */
  url: string;
  /** Jumlah like */
  like_count: number;
  /** Jumlah komentar */
  comment_count: number;
  /**
   * Jumlah play/view — tersedia khusus di endpoint clips/user ✅
   * (Provider 3 tidak selalu expose field ini)
   */
  play_count: number;
  /** Durasi video dalam detik */
  duration_seconds: number;
  /** Unix timestamp waktu upload */
  taken_at: number;
  /** Caption / deskripsi reel */
  caption: string;
  /** URL thumbnail/cover */
  thumbnail_url: string;
  /** URL video langsung (dari video_versions) */
  video_url: string;
  /** Username pembuat */
  owner_username: string;
}

export interface IGPost {
  /** Media ID */
  id: string;
  /** Shortcode (bagian setelah /p/ di URL) */
  code: string;
  /** URL post di Instagram */
  url: string;
  /**
   * Tipe media:
   *   1 = foto
   *   2 = video (reel / video post)
   *   8 = carousel (album)
   */
  media_type: number;
  /** Apakah video */
  is_video: boolean;
  /** Jumlah like */
  like_count: number;
  /** Jumlah komentar */
  comment_count: number;
  /** Jumlah play (hanya untuk video) */
  play_count: number;
  /** Unix timestamp waktu upload */
  taken_at: number;
  /** Caption */
  caption: string;
  /** URL thumbnail */
  thumbnail_url: string;
  /** URL video (hanya jika media_type=2) */
  video_url: string;
}

// ─── Internal helpers ─────────────────────────────────────────────────────

async function igGet(path: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: ANDROID_HEADERS,
  });

  const text = await res.text();

  if (text.includes('"login_required"')) {
    throw new Error(`Instagram: login required — ${path}`);
  }

  if (!res.ok) {
    throw new Error(`Instagram Android API error ${res.status}: ${text.slice(0, 200)}`);
  }

  return JSON.parse(text);
}

async function igPost(path: string, formData: Record<string, string>): Promise<unknown> {
  const body = new URLSearchParams(formData);

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      ...ANDROID_HEADERS,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const text = await res.text();

  if (text.includes('"login_required"')) {
    throw new Error(`Instagram: login required — ${path}`);
  }

  if (!res.ok) {
    throw new Error(`Instagram Android API error ${res.status}: ${text.slice(0, 200)}`);
  }

  return JSON.parse(text);
}

function parseCaption(cap: unknown): string {
  if (!cap) return "";
  if (typeof cap === "string") return cap;
  if (typeof cap === "object" && cap !== null) {
    return String((cap as Record<string, unknown>).text ?? "");
  }
  return "";
}

function parseReel(item: Record<string, unknown>): IGReel {
  const media = (item.media ?? item) as Record<string, unknown>;
  const vv = (media.video_versions as Array<{ url: string }> | undefined) ?? [];
  const imgs = ((media.image_versions2 as Record<string, unknown> | undefined)
    ?.candidates as Array<{ url: string }> | undefined) ?? [];
  const owner = (media.user ?? media.owner ?? {}) as Record<string, unknown>;

  return {
    id: String(media.id ?? ""),
    code: String(media.code ?? ""),
    url: `https://www.instagram.com/reel/${media.code ?? ""}/`,
    like_count: Number(media.like_count ?? 0),
    comment_count: Number(media.comment_count ?? 0),
    play_count: Number(media.play_count ?? 0),
    duration_seconds: Number(media.video_duration ?? 0),
    taken_at: Number(media.taken_at ?? 0),
    caption: parseCaption(media.caption),
    thumbnail_url: imgs[0]?.url ?? "",
    video_url: vv[0]?.url ?? "",
    owner_username: String(owner.username ?? ""),
  };
}

function parsePost(item: Record<string, unknown>): IGPost {
  const vv = (item.video_versions as Array<{ url: string }> | undefined) ?? [];
  const imgs = ((item.image_versions2 as Record<string, unknown> | undefined)
    ?.candidates as Array<{ url: string }> | undefined) ?? [];
  const mediaType = Number(item.media_type ?? 1);

  return {
    id: String(item.id ?? ""),
    code: String(item.code ?? ""),
    url: `https://www.instagram.com/p/${item.code ?? ""}/`,
    media_type: mediaType,
    is_video: mediaType === 2,
    like_count: Number(item.like_count ?? 0),
    comment_count: Number(item.comment_count ?? 0),
    play_count: Number(item.play_count ?? 0),
    taken_at: Number(item.taken_at ?? 0),
    caption: parseCaption(item.caption),
    thumbnail_url: imgs[0]?.url ?? "",
    video_url: vv[0]?.url ?? "",
  };
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Ambil reels user Instagram dengan PLAY COUNT.
 *
 * Menggunakan endpoint `POST /api/v1/clips/user/` yang memberikan play_count
 * — data yang tidak selalu tersedia via endpoint reels lain.
 *
 * CONFIRMED WORKS untuk semua akun public (diuji: @instagram, @charlidamelio).
 *
 * @param userId  - User ID numerik (dapat dari Provider 3 getUserProfile().id)
 * @param maxId   - Cursor untuk pagination (kosong untuk halaman pertama)
 * @param pageSize - Jumlah reels per halaman (default 12)
 *
 * @returns items: array reels, moreAvailable: ada halaman lagi?, nextMaxId: cursor berikutnya
 *
 * @example
 * // Dapatkan userId dulu via Provider 3:
 * // const profile = await getUserProfile("charlidamelio");
 * // const userId = profile.id;
 *
 * const page1 = await getReelsFeed("183250726");
 * console.log(page1.items[0].play_count);  // ← play count tersedia! ✅
 * console.log(page1.items[0].like_count);
 *
 * // Halaman 2:
 * if (page1.moreAvailable) {
 *   const page2 = await getReelsFeed("183250726", page1.nextMaxId);
 * }
 */
export async function getReelsFeed(
  userId: string,
  maxId = "",
  pageSize = 12
): Promise<{
  items: IGReel[];
  moreAvailable: boolean;
  nextMaxId: string;
}> {
  const raw = (await igPost("/clips/user/", {
    target_user_id: userId,
    page_size: String(pageSize),
    max_id: maxId,
  })) as {
    status: string;
    items: Array<Record<string, unknown>>;
    paging_info?: { more_available?: boolean; max_id?: string };
  };

  if (raw.status !== "ok") {
    throw new Error(`Instagram clips/user error: status=${raw.status}`);
  }

  const items = (raw.items ?? []).map(parseReel);
  const paging = raw.paging_info ?? {};

  return {
    items,
    moreAvailable: Boolean(paging.more_available),
    nextMaxId: String(paging.max_id ?? ""),
  };
}

/**
 * Ambil posts user Instagram.
 *
 * Menggunakan endpoint `GET /api/v1/feed/user/{userId}/`.
 * Setiap post menyertakan media_type (1=foto, 2=video, 8=carousel).
 *
 * @param userId   - User ID numerik
 * @param nextMaxId - Cursor untuk pagination (kosong untuk halaman pertama)
 *
 * @returns items: posts, moreAvailable, nextMaxId
 *
 * @example
 * const page1 = await getPostsFeed("183250726");
 * console.log(page1.items.length);    // 12 posts
 * console.log(page1.moreAvailable);   // true
 *
 * // Paginasi:
 * const page2 = await getPostsFeed("183250726", page1.nextMaxId);
 */
export async function getPostsFeed(
  userId: string,
  nextMaxId = ""
): Promise<{
  items: IGPost[];
  moreAvailable: boolean;
  nextMaxId: string;
}> {
  const path = nextMaxId
    ? `/feed/user/${userId}/?max_id=${encodeURIComponent(nextMaxId)}`
    : `/feed/user/${userId}/`;

  const raw = (await igGet(path)) as {
    status: string;
    items: Array<Record<string, unknown>>;
    more_available?: boolean;
    next_max_id?: string;
  };

  if (raw.status !== "ok") {
    throw new Error(`Instagram feed/user error: status=${raw.status}`);
  }

  return {
    items: (raw.items ?? []).map(parsePost),
    moreAvailable: Boolean(raw.more_available),
    nextMaxId: String(raw.next_max_id ?? ""),
  };
}

/**
 * Helper: ambil SEMUA reels user dengan auto-pagination.
 *
 * @param userId    - User ID numerik
 * @param maxReels  - Batas maksimal (default 100)
 * @param delayMs   - Jeda antar halaman (default 1000ms)
 *
 * @example
 * const allReels = await getAllReels("183250726", 50);
 * const totalPlays = allReels.reduce((s, r) => s + r.play_count, 0);
 * console.log(`Total plays: ${totalPlays.toLocaleString()}`);
 */
export async function getAllReels(
  userId: string,
  maxReels = 100,
  delayMs = 1000
): Promise<IGReel[]> {
  const all: IGReel[] = [];
  let maxId = "";
  let hasMore = true;

  while (hasMore && all.length < maxReels) {
    const { items, moreAvailable, nextMaxId } = await getReelsFeed(
      userId,
      maxId,
      12
    );
    all.push(...items);
    maxId = nextMaxId;
    hasMore = moreAvailable && items.length > 0;
    if (hasMore && delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
  }

  return all.slice(0, maxReels);
}

/**
 * Helper: ambil SEMUA posts user dengan auto-pagination.
 *
 * @param userId   - User ID numerik
 * @param maxPosts - Batas maksimal (default 100)
 * @param delayMs  - Jeda antar halaman (default 1000ms)
 *
 * @example
 * const allPosts = await getAllPosts("183250726", 50);
 * const photos = allPosts.filter(p => p.media_type === 1);
 * const videos = allPosts.filter(p => p.media_type === 2);
 * const carousels = allPosts.filter(p => p.media_type === 8);
 */
export async function getAllPosts(
  userId: string,
  maxPosts = 100,
  delayMs = 1000
): Promise<IGPost[]> {
  const all: IGPost[] = [];
  let nextMaxId = "";
  let hasMore = true;

  while (hasMore && all.length < maxPosts) {
    const { items, moreAvailable, nextMaxId: nextId } = await getPostsFeed(
      userId,
      nextMaxId
    );
    all.push(...items);
    nextMaxId = nextId;
    hasMore = moreAvailable && items.length > 0;
    if (hasMore && delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
  }

  return all.slice(0, maxPosts);
}

// ─── Endpoint Baru Juli 2026 ────────────────────────────────────────────────

export interface IGUserBasicInfo {
  /** User ID numerik (string) */
  pk: string;
  /** Username (tanpa @) */
  username: string;
  /** URL foto profil */
  profile_pic_url: string;
  /** Apakah ada badge IG App Switcher */
  show_ig_app_switcher_badge?: boolean;
}

/**
 * Ambil info dasar user Instagram berdasarkan User ID numerik.
 * CONFIRMED WORKS — diuji Juli 2026 ✅
 *
 * Endpoint: GET https://i.instagram.com/api/v1/users/{user_id}/info/
 *
 * ⚠️ Data yang dikembalikan MINIMAL: hanya pk, username, profile_pic_url.
 * Untuk profil lengkap (follower count, bio, media_count, dll), gunakan
 * getUserProfile() dari provider instagram-web.
 *
 * KAPAN PAKAI igGetUserById():
 * - Kamu punya user_id numerik (dari webhook, DB, atau API lain) dan butuh username
 * - Reverse lookup: user_id → username → profil lengkap via getUserProfile()
 * - Cek cepat apakah suatu user_id masih aktif
 *
 * @param userId - User ID numerik Instagram (string).
 *                 Contoh: nike = "13460080", instagram = "25025320"
 *
 * @example
 * // Reverse lookup: user_id → username
 * const info = await igGetUserById("13460080");
 * console.log(info.username); // "nike"
 *
 * // Lanjutkan dengan profil lengkap jika perlu:
 * // import { getUserProfile } from "../instagram-web/instagram";
 * // const fullProfile = await getUserProfile(info.username);
 */
export async function igGetUserById(userId: string): Promise<IGUserBasicInfo> {
  const res = await fetch(
    `${BASE_URL}/users/${userId}/info/`,
    { headers: ANDROID_HEADERS }
  );

  const text = await res.text();

  if (text.includes('"login_required"') || text.includes('"message":"login_required"')) {
    throw new Error(`Instagram: user/${userId}/info requires login`);
  }

  if (!res.ok) {
    throw new Error(`Instagram user/info error ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = JSON.parse(text) as {
    user?: IGUserBasicInfo;
    status?: string;
  };

  if (!json.user) {
    throw new Error(`Instagram: user ID "${userId}" tidak ditemukan atau tidak tersedia`);
  }

  return {
    pk: json.user.pk,
    username: json.user.username,
    profile_pic_url: json.user.profile_pic_url,
    show_ig_app_switcher_badge: json.user.show_ig_app_switcher_badge,
  };
}
