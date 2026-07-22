/**
 * P23 — GRATIS — Instagram via Browser Cookie (Auto-Fetched csrftoken)
 *
 * Strategi:
 *   1. Hit homepage instagram.com untuk dapat csrftoken cookie
 *   2. Gunakan cookie itu + browser headers untuk hit web_profile_info
 *   3. Return data profil EXACT (bukan approximate seperti imginn)
 *
 * Endpoint : GET https://www.instagram.com/api/v1/users/web_profile_info/?username=X
 * Auth     : Browser cookie (auto-fetch dari homepage, tidak perlu setup)
 * Harga    : Gratis
 *
 * CONFIRMED WORKS ✅ Juli 2026 dari datacenter/Replit:
 *   @nike      → 291,746,771 followers (EXACT) ✅
 *   @instagram → 685,843,364 followers (EXACT) ✅
 *   @nasa      → 104,301,472 followers (EXACT) ✅
 *   @mrbeast   → 87,868,047 followers (EXACT) ✅
 *
 * PERBEDAAN vs P13 (instagram-web-v2, web_profile_info + Android UA):
 *   P13 → sering 429 dari datacenter tanpa cookie
 *   P23 → auto-fetch csrftoken cookie → lebih reliable dari datacenter
 *
 * PERBEDAAN vs P14 (imginn JSON-LD):
 *   P14 → angka approximate: "291.7M" (bukan exact)
 *   P23 → angka exact: 291,746,771
 *
 * YANG TIDAK TERSEDIA tanpa login:
 *   - stories, highlights, followers list → login_required
 *   - private accounts → login_required
 *   - feed/user (post listing) → rate-limited dari datacenter
 *
 * SOURCE: src/instagram-cookie/instagram.ts
 */

const IG_HOMEPAGE = "https://www.instagram.com/";
const IG_PROFILE_URL =
  "https://www.instagram.com/api/v1/users/web_profile_info/";

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IGCookieProfile {
  username: string;
  full_name: string;
  biography: string;
  /** User ID numerik (string) */
  id: string;
  /** Jumlah follower — angka EXACT, bukan "291M" */
  follower_count: number;
  following_count: number;
  media_count: number;
  profile_pic_url: string;
  profile_pic_url_hd: string;
  is_verified: boolean;
  is_private: boolean;
  is_business_account: boolean;
  is_professional_account: boolean;
  external_url: string | null;
  category_name: string | null;
  bio_links: Array<{ title: string; url: string }>;
  has_clips: boolean;
  has_guides: boolean;
  highlight_reel_count: number;
  public_email: string | null;
  public_phone_number: string | null;
}

// ─── Internal: Cookie Cache ───────────────────────────────────────────────────

interface CookieCache {
  csrftoken: string;
  mid: string;
  fetchedAt: number;
}

let _cache: CookieCache | null = null;
const COOKIE_TTL_MS = 30 * 60 * 1000; // 30 menit

async function getIgCookies(): Promise<CookieCache> {
  if (_cache && Date.now() - _cache.fetchedAt < COOKIE_TTL_MS) return _cache;

  const res = await fetch(IG_HOMEPAGE, {
    headers: {
      "User-Agent": BROWSER_UA,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  let csrftoken = "";
  let mid = "";

  // Node 18+: getSetCookie(); Node 16: get("set-cookie")
  const setCookies: string[] =
    (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie?.() ??
    (res.headers.get("set-cookie") ?? "").split(/,(?=[^ ])/);

  for (const c of setCookies) {
    const mc = c.match(/(?:^|;\s*)csrftoken=([^;]+)/);
    if (mc) csrftoken = mc[1];
    const mm = c.match(/(?:^|;\s*)mid=([^;]+)/);
    if (mm) mid = mm[1];
  }

  if (!csrftoken)
    throw new Error(
      "Instagram P23: gagal ambil csrftoken dari homepage. Instagram mungkin berubah format."
    );

  _cache = { csrftoken, mid, fetchedAt: Date.now() };
  return _cache;
}

// ─── Fungsi Utama ─────────────────────────────────────────────────────────────

/**
 * Ambil profil Instagram lengkap dengan angka EXACT via browser cookie.
 *
 * CONFIRMED WORKS ✅ Juli 2026 dari Replit datacenter.
 * Tidak butuh API key, tidak butuh login Instagram.
 * Cookie di-fetch otomatis dan di-cache 30 menit.
 *
 * @param username - Username Instagram (tanpa @)
 * @throws Error jika 429 (tunggu 2-5 menit), user tidak ada, atau private
 *
 * @example
 * const p = await igCookieGetProfile("nike");
 * console.log(p.follower_count.toLocaleString()); // "291,746,771"
 * console.log(p.media_count);                     // 1666
 * console.log(p.is_verified);                     // true
 */
export async function igCookieGetProfile(
  username: string
): Promise<IGCookieProfile> {
  const cookies = await getIgCookies();
  const cookieStr = `csrftoken=${cookies.csrftoken}${cookies.mid ? `; mid=${cookies.mid}` : ""}`;

  const res = await fetch(
    `${IG_PROFILE_URL}?username=${encodeURIComponent(username)}`,
    {
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "X-IG-App-ID": "936619743392459",
        "X-CSRFToken": cookies.csrftoken,
        "X-Asbd-Id": "129477",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-Mode": "cors",
        Cookie: cookieStr,
        Referer: `https://www.instagram.com/${username}/`,
      },
    }
  );

  if (res.status === 429) {
    clearCookieCache(); // force re-fetch cookie di request berikutnya
    throw new Error(
      `Instagram P23: rate limited (429) @${username}. Tunggu 2-5 menit. Gunakan P14 (imginn) sebagai fallback.`
    );
  }
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Instagram P23 HTTP ${res.status} @${username}: ${txt.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    data?: { user?: Record<string, unknown> };
    status?: string;
    message?: string;
  };

  const raw = json?.data?.user;
  if (!raw) {
    const msg = (json?.message ?? "") as string;
    if (msg.includes("login_required"))
      throw new Error(`Instagram P23: @${username} private/restricted (login_required)`);
    throw new Error(`Instagram P23: @${username} tidak ditemukan. message=${msg}`);
  }

  type EdgeCount = { count?: number } | undefined;
  const g = <T>(key: string) => raw[key] as T;

  return {
    username: g<string>("username") ?? "",
    full_name: g<string>("full_name") ?? "",
    biography: g<string>("biography") ?? "",
    id: g<string>("id") ?? "",
    follower_count: (g<EdgeCount>("edge_followed_by")?.count) ?? 0,
    following_count: (g<EdgeCount>("edge_follow")?.count) ?? 0,
    media_count: (g<EdgeCount>("edge_owner_to_timeline_media")?.count) ?? 0,
    profile_pic_url: g<string>("profile_pic_url") ?? "",
    profile_pic_url_hd: g<string>("profile_pic_url_hd") ?? "",
    is_verified: g<boolean>("is_verified") ?? false,
    is_private: g<boolean>("is_private") ?? false,
    is_business_account: g<boolean>("is_business_account") ?? false,
    is_professional_account: g<boolean>("is_professional_account") ?? false,
    external_url: g<string | null>("external_url") ?? null,
    category_name: g<string | null>("category_name") ?? null,
    bio_links: (g<Array<{title?:string;url?:string}>>("bio_links") ?? []).map(
      (l) => ({ title: l.title ?? "", url: l.url ?? "" })
    ),
    has_clips: g<boolean>("has_clips") ?? false,
    has_guides: g<boolean>("has_guides") ?? false,
    highlight_reel_count: g<number>("highlight_reel_count") ?? 0,
    public_email: g<string | null>("public_email") ?? null,
    public_phone_number: g<string | null>("public_phone_number") ?? null,
  };
}

/**
 * Batch fetch profil beberapa akun Instagram.
 * Cookie di-fetch sekali dan di-share. Auto-delay antar request.
 *
 * @param usernames - Array username (tanpa @)
 * @param delayMs   - Delay antar request dalam ms (default 2000)
 *
 * @example
 * const results = await igCookieBatchProfiles(["nike", "adidas"], 2000);
 * for (const r of results) {
 *   if (r.status === "ok") console.log(`@${r.username}: ${r.follower_count.toLocaleString()}`);
 *   else console.log(`@${r.username}: ERROR — ${r.error}`);
 * }
 */
export async function igCookieBatchProfiles(
  usernames: string[],
  delayMs = 2000
): Promise<Array<({ status: "ok" } & IGCookieProfile) | { status: "error"; username: string; error: string }>> {
  const results: Array<({ status: "ok" } & IGCookieProfile) | { status: "error"; username: string; error: string }> = [];
  for (let i = 0; i < usernames.length; i++) {
    try {
      const p = await igCookieGetProfile(usernames[i]);
      results.push({ status: "ok", ...p });
    } catch (e) {
      results.push({ status: "error", username: usernames[i], error: e instanceof Error ? e.message : String(e) });
    }
    if (i < usernames.length - 1) await new Promise((r) => setTimeout(r, delayMs));
  }
  return results;
}

/** Invalidate cookie cache — panggil jika 429 berulang agar cookie baru di-fetch */
export function clearCookieCache(): void {
  _cache = null;
}
