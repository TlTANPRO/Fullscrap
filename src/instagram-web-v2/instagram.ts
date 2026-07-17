/**
 * P13: Instagram via web_profile_info — GRATIS, NO API KEY
 *
 * Endpoint resmi Instagram yang bisa dipanggil tanpa login.
 * Return JSON lengkap: followers, following, posts, bio, verified, dll.
 *
 * TESTED LIVE Juli 2026 ✅:
 *   @natgeo    → 269M followers, 193 following, 31803 posts, verified ✅
 *   @instagram → 685M followers, 252 following, 8522 posts, verified ✅
 *   @nasa      → 104M followers, 4850 posts, verified ✅
 *   @mrbeast   → 87.7M followers, 489 posts, verified ✅
 *
 * Endpoint : GET https://www.instagram.com/api/v1/users/web_profile_info/?username=USERNAME
 * Headers  : User-Agent: Instagram Android App + X-IG-App-ID: 936619743392459
 * Auth     : ❌ Tidak perlu
 * Harga    : Gratis
 *
 * Rate limit: agresif dari datacenter — disarankan delay 60-120 detik antar burst.
 * Kalau dapat 429, tunggu 2-5 menit sebelum retry.
 *
 * Berbeda dengan P3 (instagram-web) yang hit endpoint berbeda dan sering
 * return 401. Endpoint ini lebih stabil untuk profil data.
 *
 * Source: src/instagram-web-v2/instagram.ts
 */

const IG_PROFILE_URL =
  "https://www.instagram.com/api/v1/users/web_profile_info/";

const IG_HEADERS = {
  "User-Agent":
    "Instagram 123.0.0.21.114 Android (26/8.0.0; 440dpi; 1080x1920; samsung; SM-G930F; herolte; samsungexynos8890; en_US; 180322800)",
  "X-IG-App-ID": "936619743392459",
  Accept: "application/json",
  "Accept-Language": "en-US",
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IGWebV2Profile {
  username: string;
  fullName: string;
  biography: string;
  id: string;
  fbid?: string;
  followerCount: number;
  followingCount: number;
  mediaCount: number;
  highlightReelCount: number;
  profilePicUrl: string;
  profilePicUrlHd: string;
  isVerified: boolean;
  isPrivate: boolean;
  isBusinessAccount: boolean;
  isProfessionalAccount: boolean;
  externalUrl?: string;
  categoryName?: string;
  bioLinks: Array<{ title: string; url: string }>;
  hasClips: boolean;
  hasGuides: boolean;
}

// ─── Raw response type (internal) ─────────────────────────────────────────────

interface IGRawUser {
  username: string;
  full_name: string;
  biography: string;
  id: string;
  fbid?: string;
  edge_followed_by?: { count: number };
  edge_follow?: { count: number };
  edge_owner_to_timeline_media?: { count: number };
  highlight_reel_count?: number;
  profile_pic_url?: string;
  profile_pic_url_hd?: string;
  is_verified?: boolean;
  is_private?: boolean;
  is_business_account?: boolean;
  is_professional_account?: boolean;
  external_url?: string;
  category_name?: string;
  bio_links?: Array<{ title?: string; url?: string; lynx_url?: string }>;
  has_clips?: boolean;
  has_guides?: boolean;
}

// ─── Fungsi Utama ─────────────────────────────────────────────────────────────

/**
 * Ambil profil Instagram lengkap via web_profile_info.
 *
 * CONFIRMED WORKS ✅ Juli 2026
 * Lebih lengkap dari P3 (instagram-web), lebih stabil, tidak butuh session.
 *
 * Rate limit: agresif dari datacenter. Jika 429, tunggu 2-5 menit.
 *
 * @param username - Username Instagram (tanpa @)
 * @throws Error jika user tidak ditemukan atau rate limited
 *
 * @example
 * import { igWebV2Profile } from "../src/instagram-web-v2/instagram";
 *
 * const p = await igWebV2Profile("natgeo");
 * console.log(p.fullName);                          // "National Geographic"
 * console.log(p.followerCount.toLocaleString());    // "269,027,008"
 * console.log(p.mediaCount);                        // 31803
 * console.log(p.isVerified);                        // true
 */
export async function igWebV2Profile(username: string): Promise<IGWebV2Profile> {
  const url = `${IG_PROFILE_URL}?username=${encodeURIComponent(username)}`;
  const res = await fetch(url, { headers: IG_HEADERS });

  if (!res.ok) {
    throw new Error(
      `igWebV2Profile HTTP ${res.status}: username="${username}". ` +
        (res.status === 429
          ? "Rate limited — tunggu 2-5 menit sebelum retry."
          : res.status === 404
          ? "User tidak ditemukan."
          : "Coba lagi nanti.")
    );
  }

  const data = (await res.json()) as {
    data?: { user?: IGRawUser };
    status?: string;
  };

  const u = data?.data?.user;
  if (!u) throw new Error(`igWebV2Profile: user tidak ditemukan — "${username}"`);

  return {
    username:              u.username,
    fullName:              u.full_name ?? "",
    biography:             u.biography ?? "",
    id:                    u.id,
    fbid:                  u.fbid,
    followerCount:         u.edge_followed_by?.count ?? 0,
    followingCount:        u.edge_follow?.count ?? 0,
    mediaCount:            u.edge_owner_to_timeline_media?.count ?? 0,
    highlightReelCount:    u.highlight_reel_count ?? 0,
    profilePicUrl:         u.profile_pic_url ?? "",
    profilePicUrlHd:       u.profile_pic_url_hd ?? u.profile_pic_url ?? "",
    isVerified:            u.is_verified ?? false,
    isPrivate:             u.is_private ?? false,
    isBusinessAccount:     u.is_business_account ?? false,
    isProfessionalAccount: u.is_professional_account ?? false,
    externalUrl:           u.external_url ?? undefined,
    categoryName:          u.category_name ?? undefined,
    bioLinks: (u.bio_links ?? []).map((l) => ({
      title: l.title ?? "",
      url: l.url ?? l.lynx_url ?? "",
    })),
    hasClips:  u.has_clips ?? false,
    hasGuides: u.has_guides ?? false,
  };
}

/**
 * Batch ambil beberapa profil Instagram sekaligus.
 * Otomatis delay antar request untuk hindari rate limit.
 *
 * @param usernames - Array username Instagram (tanpa @)
 * @param delayMs   - Delay antar request ms (default 2000 — lebih aman dari datacenter)
 *
 * @example
 * const profiles = await igWebV2Batch(["natgeo", "nasa", "mrbeast"], 2000);
 * for (const r of profiles) {
 *   if (r.status === "ok") {
 *     console.log(`@${r.username}: ${r.followerCount.toLocaleString()} followers`);
 *   } else {
 *     console.log(`@${r.username}: ERROR — ${r.error}`);
 *   }
 * }
 */
export async function igWebV2Batch(
  usernames: string[],
  delayMs = 2000
): Promise<
  Array<
    | ({ status: "ok" } & IGWebV2Profile)
    | { status: "error"; username: string; error: string }
  >
> {
  const results = [];
  for (let i = 0; i < usernames.length; i++) {
    const username = usernames[i];
    try {
      const p = await igWebV2Profile(username);
      results.push({ status: "ok" as const, ...p });
    } catch (err) {
      results.push({
        status: "error" as const,
        username,
        error: err instanceof Error ? err.message : String(err),
      });
    }
    if (i < usernames.length - 1) await new Promise((r) => setTimeout(r, delayMs));
  }
  return results;
}
