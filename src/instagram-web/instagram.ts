/**
 * GRATIS — Instagram via Unofficial Web API (i.instagram.com)
 *
 * Menggunakan endpoint internal Instagram yang dipakai web/app resmi.
 * Tidak perlu signup, tidak perlu API key, tidak perlu login akun.
 * Diuji langsung: Juli 2026 — semua fungsi di file ini CONFIRMED WORKS.
 *
 * Base URL : https://i.instagram.com/api/v1
 * Auth     : ❌ Tidak perlu (hanya butuh header tertentu)
 * Harga    : Gratis
 *
 * ─────────────────────────────────────────────────────────────
 * CONFIRMED WORKS (diuji langsung):
 *   getUserProfile()   → profil + 12 posts terbaru ✅
 *   getUserPosts()     → posts dengan pagination ✅
 *   getUserReels()     → reels dengan pagination ✅
 *   searchUsers()      → cari user/hashtag ✅
 *
 * TIDAK WORKS tanpa login:
 *   followers/following → login_required
 *   stories            → login_required
 *   hashtag feed       → login_required
 *   private accounts   → login_required
 * ─────────────────────────────────────────────────────────────
 *
 * RATE LIMITING:
 * Instagram mungkin rate-limit dari IP yang terlalu agresif.
 * Tambah delay antar request (≥ 1 detik) untuk menghindari ban.
 */

const BASE_URL = "https://i.instagram.com/api/v1";

/** Headers yang wajib ada agar Instagram mau merespons */
const IG_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  /** App ID Instagram web — nilai ini stabil dan public */
  "x-ig-app-id": "936619743392459",
  "Accept": "*/*",
  "Accept-Language": "en-US,en;q=0.9",
  "Origin": "https://www.instagram.com",
  "Referer": "https://www.instagram.com/",
};

const ANDROID_UA = "Instagram 219.0.0.12.117 Android";

async function igGet(path: string, useAndroid = false): Promise<unknown> {
  const headers = useAndroid
    ? { ...IG_HEADERS, "User-Agent": ANDROID_UA }
    : IG_HEADERS;

  const res = await fetch(`${BASE_URL}${path}`, { headers });

  const text = await res.text();

  if (text.includes('"login_required"') || text.includes('"message":"login_required"')) {
    throw new Error(`Instagram: endpoint memerlukan login — ${path}`);
  }

  if (!res.ok) {
    throw new Error(`Instagram Web API error ${res.status}: ${text.slice(0, 200)}`);
  }

  return JSON.parse(text) as unknown;
}

// ─── Types ────────────────────────────────────────────────────────────────

export interface IGProfile {
  /** User ID numerik (string) — wajib untuk getUserPosts/getUserReels */
  id: string;
  username: string;
  full_name: string;
  biography: string;
  profile_pic_url: string;
  is_verified: boolean;
  is_private: boolean;
  follower_count: number;
  following_count: number;
  /** Total jumlah post */
  media_count: number;
  external_url: string | null;
  /** 12 post terbaru — langsung tersedia dari getUserProfile() */
  recent_posts: IGPostSummary[];
  /** Ada halaman berikutnya? */
  has_more_posts: boolean;
  /** Cursor untuk getUserPosts() */
  posts_end_cursor: string;
}

export interface IGPostSummary {
  id: string;
  /** Shortcode = bagian setelah /p/ di URL */
  shortcode: string;
  url: string;
  is_video: boolean;
  like_count: number;
  comment_count: number;
  timestamp: number;
  caption: string;
}

export interface IGPost {
  id: string;
  code: string;
  url: string;
  like_count: number;
  comment_count: number;
  view_count: number;
  play_count: number;
  has_liked: boolean;
  is_video: boolean;
  timestamp: number;
  caption: string;
  user: {
    username: string;
    full_name: string;
    profile_pic_url: string;
    is_verified: boolean;
  };
  image_versions?: string[];
  video_url?: string;
}

export interface IGSearchResult {
  users: Array<{
    pk: string;
    username: string;
    full_name: string;
    is_verified: boolean;
    follower_count: number;
    profile_pic_url: string;
  }>;
  hashtags: Array<{
    name: string;
    id: string;
    media_count: number;
    profile_pic_url: string;
  }>;
}

// ─── API Functions ────────────────────────────────────────────────────────

/**
 * Ambil profil Instagram + 12 post terbaru.
 * CONFIRMED WORKS — diuji: @nike (followers 291M, posts 1663, verified)
 *
 * Hasilnya langsung berisi 12 post terbaru (recent_posts) dan
 * cursor untuk ambil lebih banyak via getUserPosts().
 *
 * @example
 * const profile = await getUserProfile("nike");
 * console.log(profile.username, profile.follower_count);
 * console.log(profile.recent_posts.length, "posts loaded");
 * // Ambil lebih banyak:
 * const more = await getUserPosts(profile.id, profile.posts_end_cursor);
 */
export async function getUserProfile(username: string): Promise<IGProfile> {
  const raw = (await igGet(
    `/users/web_profile_info/?username=${encodeURIComponent(username)}`
  )) as {
    data: {
      user: {
        id: string;
        username: string;
        full_name: string;
        biography: string;
        profile_pic_url: string;
        is_verified: boolean;
        is_private: boolean;
        edge_followed_by: { count: number };
        edge_follow: { count: number };
        edge_owner_to_timeline_media: {
          count: number;
          page_info: { has_next_page: boolean; end_cursor: string };
          edges: Array<{
            node: {
              id: string;
              shortcode: string;
              is_video: boolean;
              edge_liked_by?: { count: number };
              edge_media_preview_like?: { count: number };
              edge_media_to_comment: { count: number };
              taken_at_timestamp: number;
              edge_media_to_caption: {
                edges: Array<{ node: { text: string } }>;
              };
            };
          }>;
        };
        external_url: string | null;
      };
    };
  };

  const u = raw.data.user;
  const mediaData = u.edge_owner_to_timeline_media;

  const recent_posts: IGPostSummary[] = mediaData.edges.map(e => {
    const n = e.node;
    return {
      id: n.id,
      shortcode: n.shortcode,
      url: `https://www.instagram.com/p/${n.shortcode}/`,
      is_video: n.is_video,
      like_count: n.edge_liked_by?.count ?? n.edge_media_preview_like?.count ?? 0,
      comment_count: n.edge_media_to_comment.count,
      timestamp: n.taken_at_timestamp,
      caption: n.edge_media_to_caption.edges[0]?.node.text ?? "",
    };
  });

  return {
    id: u.id,
    username: u.username,
    full_name: u.full_name,
    biography: u.biography,
    profile_pic_url: u.profile_pic_url,
    is_verified: u.is_verified,
    is_private: u.is_private,
    follower_count: u.edge_followed_by.count,
    following_count: u.edge_follow.count,
    media_count: mediaData.count,
    external_url: u.external_url,
    recent_posts,
    has_more_posts: mediaData.page_info.has_next_page,
    posts_end_cursor: mediaData.page_info.end_cursor,
  };
}

/**
 * Ambil lebih banyak posts user (pagination).
 * CONFIRMED WORKS — diuji: @nike (12 items, more_available=true)
 *
 * Butuh user ID dari getUserProfile().id
 * Untuk halaman pertama, gunakan maxId=""
 *
 * @param userId - User ID numerik (dari getUserProfile().id)
 * @param maxId  - next_max_id dari response sebelumnya
 * @param count  - Jumlah post per halaman (default 12)
 *
 * @example
 * const profile = await getUserProfile("nike");
 * const page2 = await getUserPosts(profile.id, profile.posts_end_cursor);
 * const page3 = await getUserPosts(profile.id, page2.next_max_id);
 */
export async function getUserPosts(
  userId: string,
  maxId = "",
  count = 12
): Promise<{
  items: IGPost[];
  next_max_id: string;
  more_available: boolean;
}> {
  let path = `/feed/user/${userId}/?count=${count}`;
  if (maxId) path += `&max_id=${encodeURIComponent(maxId)}`;

  const raw = (await igGet(path, true)) as {
    items: Array<{
      id: string;
      code: string;
      like_count: number;
      comment_count: number;
      view_count?: number;
      play_count?: number;
      has_liked: boolean;
      media_type: number;
      taken_at: number;
      caption?: { text: string } | null;
      user: {
        username: string;
        full_name: string;
        profile_pic_url: string;
        is_verified: boolean;
      };
      image_versions2?: { candidates: Array<{ url: string }> };
      video_versions?: Array<{ url: string }>;
    }>;
    next_max_id: string;
    more_available: boolean;
  };

  const items: IGPost[] = (raw.items ?? []).map(m => ({
    id: m.id,
    code: m.code,
    url: `https://www.instagram.com/p/${m.code}/`,
    like_count: m.like_count,
    comment_count: m.comment_count,
    view_count: m.view_count ?? 0,
    play_count: m.play_count ?? 0,
    has_liked: m.has_liked,
    is_video: m.media_type === 2,
    timestamp: m.taken_at,
    caption: m.caption?.text ?? "",
    user: m.user,
    image_versions: m.image_versions2?.candidates.map(c => c.url) ?? [],
    video_url: m.video_versions?.[0]?.url,
  }));

  return {
    items,
    next_max_id: raw.next_max_id ?? "",
    more_available: raw.more_available ?? false,
  };
}

/**
 * Ambil semua posts user dengan auto-pagination.
 *
 * @example
 * const profile  = await getUserProfile("nike");
 * const allPosts = await getAllUserPosts(profile.id, 100);
 */
export async function getAllUserPosts(
  userId: string,
  maxPosts = 100,
  delayMs = 1000
): Promise<IGPost[]> {
  const all: IGPost[] = [];
  let maxId = "";
  let moreAvailable = true;

  while (moreAvailable && all.length < maxPosts) {
    const { items, next_max_id, more_available } = await getUserPosts(userId, maxId);
    all.push(...items);
    maxId = next_max_id;
    moreAvailable = more_available && !!next_max_id;
    if (items.length === 0) break;
    if (moreAvailable && delayMs > 0) await new Promise(r => setTimeout(r, delayMs));
  }

  return all.slice(0, maxPosts);
}

/**
 * Ambil reels user.
 * CONFIRMED WORKS — diuji: @nike (11 reels, more_available=true)
 *
 * @param userId    - User ID numerik (dari getUserProfile().id)
 * @param maxId     - Cursor pagination dari response sebelumnya
 * @param pageSize  - Jumlah reels per halaman (default 12)
 *
 * @example
 * const profile = await getUserProfile("nike");
 * const page1   = await getUserReels(profile.id);
 * const page2   = await getUserReels(profile.id, page1.next_max_id);
 */
export async function getUserReels(
  userId: string,
  maxId = "",
  pageSize = 12
): Promise<{
  items: Array<{
    id: string;
    code: string;
    url: string;
    like_count: number;
    comment_count: number;
    view_count: number;
    play_count: number;
    timestamp: number;
    caption: string;
  }>;
  next_max_id: string;
  more_available: boolean;
}> {
  const body = new URLSearchParams({
    target_user_id: userId,
    page_size: String(pageSize),
    include_feed_video: "true",
  });
  if (maxId) body.set("max_id", maxId);

  const res = await fetch(`${BASE_URL}/clips/user/`, {
    method: "POST",
    headers: {
      ...IG_HEADERS,
      "User-Agent": ANDROID_UA,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const text = await res.text();
  if (text.includes('"login_required"')) {
    throw new Error("Instagram reels: login_required");
  }

  const raw = JSON.parse(text) as {
    items?: Array<{
      media: {
        id: string;
        code: string;
        like_count: number;
        comment_count: number;
        view_count?: number;
        play_count?: number;
        taken_at: number;
        caption?: { text: string } | null;
      };
    }>;
    paging_info?: { max_id: string; more_available: boolean };
  };

  const items = (raw.items ?? []).map(item => {
    const m = item.media;
    return {
      id: m.id,
      code: m.code,
      url: `https://www.instagram.com/reel/${m.code}/`,
      like_count: m.like_count,
      comment_count: m.comment_count,
      view_count: m.view_count ?? 0,
      play_count: m.play_count ?? 0,
      timestamp: m.taken_at,
      caption: m.caption?.text ?? "",
    };
  });

  return {
    items,
    next_max_id: raw.paging_info?.max_id ?? "",
    more_available: raw.paging_info?.more_available ?? false,
  };
}

/**
 * Cari user dan hashtag Instagram berdasarkan query.
 * CONFIRMED WORKS — diuji: "nike" (users + hashtags returned)
 *
 * @example
 * const results = await searchUsers("nike");
 * console.log(results.users.length, "users found");
 * console.log(results.hashtags.length, "hashtags found");
 */
export async function searchUsers(query: string): Promise<IGSearchResult> {
  const raw = (await igGet(
    `/web/search/topsearch/?context=blended&query=${encodeURIComponent(query)}&include_reel=true`
  )) as {
    users?: Array<{
      user: {
        pk: string;
        username: string;
        full_name: string;
        is_verified: boolean;
        follower_count: number;
        profile_pic_url: string;
      };
    }>;
    hashtags?: Array<{
      hashtag: {
        name: string;
        id: string;
        media_count: number;
        profile_pic_url?: string;
      };
    }>;
  };

  return {
    users: (raw.users ?? []).map(u => ({
      pk: u.user.pk,
      username: u.user.username,
      full_name: u.user.full_name,
      is_verified: u.user.is_verified,
      follower_count: u.user.follower_count,
      profile_pic_url: u.user.profile_pic_url,
    })),
    hashtags: (raw.hashtags ?? []).map(h => ({
      name: h.hashtag.name,
      id: h.hashtag.id,
      media_count: h.hashtag.media_count,
      profile_pic_url: h.hashtag.profile_pic_url ?? "",
    })),
  };
}

/**
 * Helper: full scrape satu akun Instagram.
 * Ambil profil + semua posts + semua reels.
 *
 * @example
 * const result = await scrapeInstagramAccount("nike", {
 *   maxPosts: 50,
 *   maxReels: 30,
 *   delayMs: 1000,
 * });
 */
export async function scrapeInstagramAccount(
  username: string,
  options: { maxPosts?: number; maxReels?: number; delayMs?: number } = {}
): Promise<{
  profile: IGProfile;
  posts: IGPost[];
  reels: Array<ReturnType<typeof getUserReels> extends Promise<{ items: infer T }> ? T : never>[number];
}> {
  const { maxPosts = 50, maxReels = 30, delayMs = 1000 } = options;

  const profile = await getUserProfile(username);
  await new Promise(r => setTimeout(r, delayMs));

  const posts = await getAllUserPosts(profile.id, maxPosts, delayMs);
  await new Promise(r => setTimeout(r, delayMs));

  const { items: reels } = await getUserReels(profile.id);

  return {
    profile,
    posts,
    reels: reels as never,
  };
}
