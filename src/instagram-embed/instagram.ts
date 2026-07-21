/**
 * GRATIS — Instagram Post Info via Embed Page HTML Scraping
 *
 * Scrape halaman embed Instagram untuk mendapatkan like_count, comment_count,
 * dan username dari post publik — tanpa API key, tanpa login, tanpa library.
 *
 * Endpoint : GET https://www.instagram.com/p/SHORTCODE/embed/captioned/
 * UA       : facebookexternalhit/1.1 (wajib — UA biasa dapat JS bundle tanpa data)
 * Auth     : ❌ Tidak perlu
 * Harga    : Gratis
 *
 * ─────────────────────────────────────────────────────────────
 * CONFIRMED WORKS (diuji Juli 2026 dari datacenter/Replit):
 *   igEmbedPostInfo() → like_count, comment_count, author ✅
 *
 * PENTING — UA WAJIB facebookexternalhit:
 *   Browser biasa / desktop UA → Instagram menyajikan JS bundle (609KB)
 *   yang tidak mengandung like count dalam HTML.
 *   facebookexternalhit UA → Instagram menyajikan HTML statis dengan like + comment ✅
 *
 * HTML pattern yang diparse:
 *   Like    : `data-log-event="likeCountClick">2,779,825 likes</a>`
 *   Comment : `View all 59,890 comments</a>`
 *   Author  : `href="https://www.instagram.com/nike/?utm_source=ig_embed"`
 *
 * TIDAK TERSEDIA dari embed page:
 *   - caption / deskripsi lengkap
 *   - timestamp / upload date
 *   - thumbnail URL
 *   - user follower count / profil
 *
 * Untuk data lebih lengkap: gunakan igGetPostInfo() dari src/ytdlp/instagram.ts
 * ─────────────────────────────────────────────────────────────
 *
 * RATE LIMIT:
 * Lebih toleran dari endpoint i.instagram.com langsung.
 * Tetap tambahkan delay ≥ 1 detik antar request.
 *
 * Source: src/instagram-embed/instagram.ts
 */

/** WAJIB: UA facebookexternalhit agar Instagram menyajikan HTML statis */
const IG_EMBED_HEADERS = {
  "User-Agent":
    "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IGEmbedPostInfo {
  /** Shortcode Instagram (dari URL: /p/SHORTCODE/) */
  shortcode: string;
  /** URL post */
  url: string;
  /** Username pemilik post (dari href ig_embed) */
  author: string | null;
  /** Jumlah like (realtime) */
  like_count: number | null;
  /** Jumlah komentar (realtime) */
  comment_count: number | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Parse "2,779,794" → 2779794 */
function parseNumber(raw: string): number | null {
  const n = parseInt(raw.replace(/,/g, ""), 10);
  return isNaN(n) ? null : n;
}

// ─── Fungsi Utama ─────────────────────────────────────────────────────────────

/**
 * Ambil like_count dan comment_count dari embed page Instagram.
 *
 * CONFIRMED WORKS ✅ Juli 2026 — dari datacenter/Replit.
 *
 * PENTING: UA facebookexternalhit WAJIB dipakai. Jika UA diubah ke browser biasa,
 * Instagram akan menyajikan JS bundle yang tidak berisi like count dalam HTML.
 *
 * @param shortcode - Shortcode post Instagram (bagian setelah /p/ atau /reel/ di URL)
 * @throws Error jika halaman tidak bisa diakses atau rate-limited
 *
 * @example
 * const info = await igEmbedPostInfo("DZK3iOsRlWX");
 * console.log(info.like_count);    // 2779825
 * console.log(info.comment_count); // 59890
 * console.log(info.author);        // "nike"
 */
export async function igEmbedPostInfo(shortcode: string): Promise<IGEmbedPostInfo> {
  const url = `https://www.instagram.com/p/${shortcode}/`;
  const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;

  const res = await fetch(embedUrl, { headers: IG_EMBED_HEADERS });

  if (!res.ok) {
    throw new Error(`Instagram embed error ${res.status} for shortcode ${shortcode}`);
  }

  const html = await res.text();

  // Like count: `data-log-event="likeCountClick" ...>2,779,825 likes</a>`
  const likeMatch = html.match(/data-log-event="likeCountClick"[^>]*>([\d,]+)\s+likes?<\/a>/i)
    ?? html.match(/([\d,]+)\s+likes?<\/a>/i);
  const like_count = likeMatch ? parseNumber(likeMatch[1]) : null;

  // Comment count: `View all 59,890 comments</a>`
  const commentMatch = html.match(/View all\s+([\d,]+)\s+comments?<\/a>/i)
    ?? html.match(/data-log-event="captionCommentsClick"[^>]*>([\d,]+)\s+comments?<\/a>/i)
    ?? html.match(/([\d,]+)\s+comments?<\/a>/i);
  const comment_count = commentMatch ? parseNumber(commentMatch[1]) : null;

  // Author: `href="https://www.instagram.com/nike/?utm_source=ig_embed"`
  const authorMatch = html.match(/instagram\.com\/([a-zA-Z0-9._]{1,40})\/\?utm_source=ig_embed/);
  const author = authorMatch?.[1] ?? null;

  return { shortcode, url, author, like_count, comment_count };
}

/**
 * Ambil shortcode dari URL Instagram.
 *
 * @param url - URL post Instagram (p/ atau reel/)
 * @returns shortcode string atau null jika tidak valid
 *
 * @example
 * igExtractShortcode("https://www.instagram.com/p/DZK3iOsRlWX/") // "DZK3iOsRlWX"
 * igExtractShortcode("https://www.instagram.com/reel/DZK3iOsRlWX/") // "DZK3iOsRlWX"
 */
export function igExtractShortcode(url: string): string | null {
  const m = url.match(/instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

/**
 * Batch scrape beberapa post sekaligus.
 *
 * @param shortcodes - Array shortcode post
 * @param delayMs    - Delay antar request (default 1500ms)
 *
 * @example
 * const results = await igEmbedBatch(["DZK3iOsRlWX", "SHORTCODE2"], 1500);
 * for (const r of results) {
 *   if (r.status === "ok") {
 *     console.log(`${r.author}: ${r.like_count?.toLocaleString()} likes, ${r.comment_count?.toLocaleString()} comments`);
 *   }
 * }
 */
export async function igEmbedBatch(
  shortcodes: string[],
  delayMs = 1500
): Promise<
  Array<
    | ({ status: "ok" } & IGEmbedPostInfo)
    | { status: "error"; shortcode: string; error: string }
  >
> {
  const results = [];

  for (let i = 0; i < shortcodes.length; i++) {
    const shortcode = shortcodes[i];
    try {
      const info = await igEmbedPostInfo(shortcode);
      results.push({ status: "ok" as const, ...info });
    } catch (err) {
      results.push({
        status: "error" as const,
        shortcode,
        error: err instanceof Error ? err.message : String(err),
      });
    }
    if (i < shortcodes.length - 1) await new Promise((r) => setTimeout(r, delayMs));
  }

  return results;
}
