/**
 * GRATIS — Instagram Profile & Post via OpenGraph / og:description
 *
 * Scrape og:description dari halaman Instagram dengan Twitterbot User-Agent.
 * Instagram menyajikan meta tags dengan data statistik untuk bot social media.
 *
 * Endpoint : GET https://www.instagram.com/{username}/  (profile)
 *            GET https://www.instagram.com/p/{shortcode}/  (post)
 * UA WAJIB : Twitterbot/1.0 (UA browser biasa → dapat JS bundle tanpa data)
 * Auth     : ❌ Tidak perlu
 * Harga    : Gratis
 *
 * ─────────────────────────────────────────────────────────────
 * CONFIRMED WORKS (diuji Juli 2026 dari datacenter/Replit):
 *   igOgProfile(username)  → follower_count, following_count, post_count ✅
 *   igOgPost(shortcode)    → approx like_count, comment_count, username, date, caption ✅
 *
 * CATATAN PENTING — RATE LIMIT:
 * Instagram rate-limit Twitterbot UA per-IP.
 * Dari datacenter: ~3-5 request berturut-turut works, setelah itu 0-byte response.
 * Solusi: delay ≥ 5 detik antar request, atau ganti IP / gunakan residential proxy.
 *
 * CATATAN DATA:
 * Profile: follower_count approximate (292M = 292_000_000), following dan post EXACT
 * Post   : like_count approximate (3M = 3_000_000), comment APPROXIMATE (60K = 60_000)
 *          caption EXACT, username EXACT, date EXACT
 *
 * og:description profile format:
 *   "292M Followers, 267 Following, 1,666 Posts - See Instagram photos and videos from Nike (@nike)"
 *
 * og:description post format:
 *   "3M likes, 60K comments - nike on June 4, 2026: "caption text here.""
 * ─────────────────────────────────────────────────────────────
 *
 * Source: src/instagram-og/instagram.ts
 */

/** Decode HTML entities tanpa package eksternal */
function decodeHtml(str: string): string {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x2026;/g, "…")
    .replace(/&#x2019;/g, "'")
    .replace(/&#x2018;/g, "'")
    .replace(/&#x201C;/g, '"')
    .replace(/&#x201D;/g, '"')
    .replace(/&#064;/g, "@")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

/** WAJIB: Twitterbot UA agar Instagram sajikan HTML statis dengan og:description */
const TWITTERBOT_HEADERS = {
  "User-Agent": "Twitterbot/1.0",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IGOgProfile {
  username: string;
  /** Follower count — APPROXIMATE untuk akun besar (292M = 292_000_000) */
  follower_count: number | null;
  /** Following count — EXACT */
  following_count: number | null;
  /** Post count — EXACT */
  post_count: number | null;
  /** Display name (dari og:title) */
  display_name: string | null;
}

export interface IGOgPost {
  shortcode: string;
  /** Jumlah likes — APPROXIMATE (3M = 3_000_000, 60K = 60_000) */
  like_count: number | null;
  /** Jumlah komentar — APPROXIMATE */
  comment_count: number | null;
  /** View count (untuk video/reel) — APPROXIMATE, null untuk foto */
  view_count: number | null;
  /** Username pemilik */
  username: string | null;
  /** Tanggal upload, format: "June 4, 2026" */
  date_str: string | null;
  /** Caption / deskripsi post — EXACT */
  caption: string | null;
  /** og:image URL */
  thumbnail: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Parse angka dengan suffix K/M/B: "292M" → 292_000_000, "60K" → 60_000 */
export function parseSuffixedNumber(raw: string): number | null {
  if (!raw) return null;
  const clean = raw.trim().replace(/,/g, "");
  const num = parseFloat(clean);
  if (isNaN(num)) return null;
  const suffix = clean.slice(-1).toUpperCase();
  if (suffix === "B") return Math.round(num * 1_000_000_000);
  if (suffix === "M") return Math.round(num * 1_000_000);
  if (suffix === "K") return Math.round(num * 1_000);
  return Math.round(num);
}

/** Parse "1,666" → 1666 */
function parseExactNumber(raw: string): number | null {
  const n = parseInt(raw.replace(/,/g, ""), 10);
  return isNaN(n) ? null : n;
}

async function igFetchOg(url: string): Promise<{ html: string; ok: boolean }> {
  const res = await fetch(url, { headers: TWITTERBOT_HEADERS });
  if (!res.ok) return { html: "", ok: false };
  // Jangan decode dulu — decode dilakukan setelah ekstraksi atribut
  // agar &quot; di dalam content="..." tidak merusak regex attribute parsing
  return { html: await res.text(), ok: true };
}

function extractOgContent(html: string, property: string): string | null {
  // Ekstrak raw attribute value (masih HTML-encoded), lalu decode
  const m = html.match(
    new RegExp(`<meta[^>]+property="${property}"[^>]+content="([^"]{0,1000})"`, "i")
  ) ?? html.match(
    new RegExp(`<meta[^>]+content="([^"]{0,1000})"[^>]+property="${property}"`, "i")
  );
  return m ? decodeHtml(m[1].trim()) : null;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Ambil statistik profil Instagram via og:description (Twitterbot UA).
 *
 * CONFIRMED WORKS ✅ Juli 2026 — dari Replit (datacenter)
 *
 * RATE LIMIT: ~3-5 req/IP sebelum Instagram menyajikan respons kosong.
 * Tambahkan delay ≥ 5 detik antar request.
 *
 * @param username - Instagram username (tanpa @)
 * @returns Profil dengan follower/following/post count
 *
 * @example
 * const profile = await igOgProfile("nike");
 * console.log(profile.follower_count); // 292000000 (APPROXIMATE)
 * console.log(profile.following_count); // 267 (EXACT)
 * console.log(profile.post_count);      // 1666 (EXACT)
 * console.log(profile.display_name);    // "Nike"
 */
export async function igOgProfile(username: string): Promise<IGOgProfile> {
  const url = `https://www.instagram.com/${username}/`;
  const { html, ok } = await igFetchOg(url);

  if (!ok || !html) {
    throw new Error(`Instagram OG: tidak bisa akses profil @${username} (0-byte response — rate limited?)`);
  }

  // og:description: "292M Followers, 267 Following, 1,666 Posts - See Instagram..."
  const desc = extractOgContent(html, "og:description");

  let follower_count: number | null = null;
  let following_count: number | null = null;
  let post_count: number | null = null;

  if (desc) {
    const followerMatch = desc.match(/([\d,.]+[KMBkmb]?)\s+Followers?/i);
    if (followerMatch) follower_count = parseSuffixedNumber(followerMatch[1]);

    const followingMatch = desc.match(/([\d,.]+[KMBkmb]?)\s+Following/i);
    if (followingMatch) following_count = parseExactNumber(followingMatch[1]);

    const postMatch = desc.match(/([\d,.]+[KMBkmb]?)\s+Posts?/i);
    if (postMatch) post_count = parseExactNumber(postMatch[1]);
  }

  // og:title: "Nike (@nike) • Instagram profile"
  const title = extractOgContent(html, "og:title");
  const display_name = title ? title.replace(/\s*\(.*$/, "").trim() : null;

  return { username, follower_count, following_count, post_count, display_name };
}

/**
 * Ambil statistik post Instagram via og:description (Twitterbot UA).
 *
 * CONFIRMED WORKS ✅ Juli 2026 — dari Replit (datacenter)
 *
 * RATE LIMIT: ~3-5 req/IP sebelum Instagram menyajikan respons kosong.
 *
 * @param shortcode - Shortcode post Instagram (bagian setelah /p/ atau /reel/)
 *
 * @example
 * const post = await igOgPost("DZK3iOsRlWX");
 * console.log(post.like_count);    // 3000000 (APPROXIMATE — "3M likes")
 * console.log(post.comment_count); // 60000 (APPROXIMATE — "60K comments")
 * console.log(post.username);      // "nike"
 * console.log(post.date_str);      // "June 4, 2026"
 * console.log(post.caption);       // "It was all going to plan until instincts..."
 */
export async function igOgPost(shortcode: string): Promise<IGOgPost> {
  const url = `https://www.instagram.com/p/${shortcode}/`;
  const { html, ok } = await igFetchOg(url);

  if (!ok || !html) {
    throw new Error(`Instagram OG: tidak bisa akses post ${shortcode} (0-byte response — rate limited?)`);
  }

  // og:description: "3M likes, 60K comments - nike on June 4, 2026: "caption""
  // OR: "15M views, 3M likes, 60K comments: "caption"" (untuk video)
  const desc = extractOgContent(html, "og:description");

  let like_count: number | null = null;
  let comment_count: number | null = null;
  let view_count: number | null = null;
  let username: string | null = null;
  let date_str: string | null = null;
  let caption: string | null = null;

  if (desc) {
    // Views (untuk video/reel)
    const viewMatch = desc.match(/([\d,.]+[KMBkmb]?)\s+views?/i);
    if (viewMatch) view_count = parseSuffixedNumber(viewMatch[1]);

    // Likes
    const likeMatch = desc.match(/([\d,.]+[KMBkmb]?)\s+likes?/i);
    if (likeMatch) like_count = parseSuffixedNumber(likeMatch[1]);

    // Comments
    const commentMatch = desc.match(/([\d,.]+[KMBkmb]?)\s+comments?/i);
    if (commentMatch) comment_count = parseSuffixedNumber(commentMatch[1]);

    // Username + date: "- nike on June 4, 2026:"
    const authorDateMatch = desc.match(/-\s+(\S+)\s+on\s+([A-Za-z]+ \d+, \d{4}):/);
    if (authorDateMatch) {
      username = authorDateMatch[1];
      date_str = authorDateMatch[2];
    }

    // Caption: everything after the first `"` following the date/author
    const captionMatch = desc.match(/:\s+"(.+)"\s*\.?\s*$/s);
    if (captionMatch) caption = captionMatch[1].trim();
  }

  // og:image
  const thumbnail = extractOgContent(html, "og:image");

  return { shortcode, like_count, comment_count, view_count, username, date_str, caption, thumbnail };
}

/**
 * Batch ambil profil beberapa akun Instagram.
 * Gunakan delay besar (≥ 5 detik) untuk menghindari rate limit.
 *
 * @param usernames - Array username Instagram
 * @param delayMs   - Delay antar request (default 6000ms — JANGAN kurangi dari 5000)
 */
export async function igOgProfileBatch(
  usernames: string[],
  delayMs = 6000
): Promise<
  Array<
    | ({ status: "ok" } & IGOgProfile)
    | { status: "error"; username: string; error: string }
  >
> {
  const results = [];
  for (let i = 0; i < usernames.length; i++) {
    const username = usernames[i];
    try {
      const profile = await igOgProfile(username);
      results.push({ status: "ok" as const, ...profile });
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
