/**
 * P14: Instagram via imginn.com — GRATIS, NO API KEY
 *
 * Scrape profil Instagram dari imginn.com — Instagram viewer publik.
 * Tidak butuh login, tidak butuh API key, tidak ada rate limit agresif.
 *
 * TESTED LIVE Juli 2026 ✅:
 *   @natgeo    → 269M followers, 193 following, 31806 posts ✅
 *   @nasa      → 104.3M followers, 91 following, 4851 posts ✅
 *   @instagram → 685.8M followers, 256 following, 8525 posts ✅
 *
 * Data source: imginn.com scrape HTML profil
 * Parse: HTML counter-item divs + og:description + og:title
 *
 * Keuntungan vs P13 (igWebV2):
 *   - Tidak kena rate limit 429 dari datacenter
 *   - Tidak perlu User-Agent spesifik
 *   - Lebih stabil untuk batch scraping
 *
 * Kekurangan:
 *   - Data mungkin sedikit delay vs realtime
 *   - Bergantung pada ketersediaan imginn.com
 *
 * Source: src/imginn/instagram.ts
 */

const IMGINN_BASE = "https://imginn.com";

const IMGINN_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ImginnProfile {
  /** Username Instagram (tanpa @) */
  username: string;
  /** Display name / nama lengkap */
  fullName?: string;
  /** Bio profil */
  biography?: string;
  /** Jumlah followers (angka, e.g. 269000000) */
  followerCount?: number;
  /** Jumlah following */
  followingCount?: number;
  /** Jumlah posts */
  mediaCount?: number;
  /** URL foto profil */
  profilePicUrl?: string;
  /** URL sumber: imginn.com/username/ */
  sourceUrl: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Parse "269M" / "104.3M" / "1,234" / "193" → angka */
function parseCount(raw: string): number | undefined {
  if (!raw) return undefined;
  const s = raw.trim().replace(/,/g, "");
  if (/^[\d.]+M$/i.test(s)) return Math.round(parseFloat(s) * 1_000_000);
  if (/^[\d.]+K$/i.test(s)) return Math.round(parseFloat(s) * 1_000);
  if (/^[\d.]+B$/i.test(s)) return Math.round(parseFloat(s) * 1_000_000_000);
  const n = parseInt(s, 10);
  return isNaN(n) ? undefined : n;
}

/**
 * Parse HTML imginn.com profil.
 *
 * Dua strategi:
 * 1. HTML counter-item divs: `<div class="num">269M</div><span>followers</span>`
 * 2. og:description fallback: "bio 269M Followers, 193 Following, 31806 Posts"
 */
function parseImginnHtml(html: string, username: string): Omit<ImginnProfile, "sourceUrl"> {
  // ── Full name dari og:title: "National Geographic(@natgeo)" ───────────────
  const titleMatch = html.match(
    /property="og:title"\s+content="([^"(]+)\(@[^)]+\)/
  );
  const fullName = titleMatch?.[1]?.trim();

  // ── Bio dari og:description (teks sebelum angka followers) ────────────────
  const descMatch = html.match(/property="og:description"\s+content="([^"]+)"/);
  const descText = descMatch?.[1] ?? "";

  // og:description format: "bio text 269M Followers, 193 Following, 31806 Posts"
  const bioMatch = descText.match(/^(.*?)\s*[\d,.]+[KMB]?\s+Followers?/i);
  const biography = bioMatch?.[1]?.trim() || undefined;

  // ── Counter items dari HTML: <div class="num">X</div><span>posts</span> ───
  // Regex: ambil angka dari <div class="num">X</div> lalu label dari <span>label</span>
  const counterPattern = /<div[^>]*class="num"[^>]*>([\d.,KMB]+)<\/div>\s*<span[^>]*>([^<]+)<\/span>/gi;
  const counters: Record<string, string> = {};
  let m: RegExpExecArray | null;
  while ((m = counterPattern.exec(html)) !== null) {
    const val = m[1].trim();
    const label = m[2].trim().toLowerCase();
    counters[label] = val;
  }

  // Kalau counter pattern tidak ditemukan, fallback ke og:description
  let followerCount = parseCount(counters["followers"]);
  let followingCount = parseCount(counters["following"]);
  let mediaCount = parseCount(counters["posts"]);

  if (!followerCount) {
    const fm = descText.match(/([\d,.]+[KMB]?)\s+Followers?/i);
    followerCount = fm ? parseCount(fm[1]) : undefined;
  }
  if (!followingCount) {
    const fm = descText.match(/([\d,.]+[KMB]?)\s+Following/i);
    followingCount = fm ? parseCount(fm[1]) : undefined;
  }
  if (!mediaCount) {
    const fm = descText.match(/([\d,.]+[KMB]?)\s+Posts?/i);
    mediaCount = fm ? parseCount(fm[1]) : undefined;
  }

  // ── Profile pic dari og:image ─────────────────────────────────────────────
  const picMatch = html.match(/property="og:image"\s+content="([^"]+)"/);
  const profilePicUrl = picMatch?.[1];

  return {
    username,
    fullName,
    biography,
    followerCount,
    followingCount,
    mediaCount,
    profilePicUrl,
  };
}

// ─── Fungsi Publik ────────────────────────────────────────────────────────────

/**
 * Ambil profil Instagram dari imginn.com.
 *
 * CONFIRMED WORKS ✅ Juli 2026
 * Tidak kena 429 seperti igWebV2, cocok untuk batch scraping dari datacenter.
 *
 * @param username - Instagram username (tanpa @)
 * @throws Error jika user tidak ditemukan atau imginn down
 *
 * @example
 * import { imginnProfile } from "../src/imginn/instagram";
 *
 * const p = await imginnProfile("natgeo");
 * console.log(p.fullName);                        // "National Geographic"
 * console.log(p.followerCount?.toLocaleString()); // "269,000,000"
 * console.log(p.mediaCount);                      // 31806
 * console.log(p.biography);                       // "Step into wonder..."
 *
 * @example
 * // Batch — delay manual untuk hindari ban
 * const accounts = ["natgeo", "nasa", "instagram"];
 * for (const u of accounts) {
 *   const p = await imginnProfile(u);
 *   console.log(`@${p.username}: ${p.followerCount?.toLocaleString()}`);
 *   await new Promise(r => setTimeout(r, 800));
 * }
 */
export async function imginnProfile(username: string): Promise<ImginnProfile> {
  const url = `${IMGINN_BASE}/${encodeURIComponent(username)}/`;
  const res = await fetch(url, { headers: IMGINN_HEADERS });

  if (!res.ok) {
    throw new Error(
      `imginnProfile HTTP ${res.status}: username="${username}". ` +
        (res.status === 404 ? "User tidak ditemukan di imginn."
          : res.status === 403 ? "Diblokir oleh imginn — coba lagi nanti."
          : "Coba lagi nanti.")
    );
  }

  const html = await res.text();

  // Cek apakah halaman profil valid (bukan 404/error page)
  if (html.includes("User not found") || html.includes("404 Not Found")) {
    throw new Error(`imginnProfile: user "@${username}" tidak ditemukan di imginn.`);
  }

  const parsed = parseImginnHtml(html, username);
  return { ...parsed, sourceUrl: url };
}

/**
 * Batch ambil beberapa profil sekaligus dari imginn.com.
 * Auto-delay antar request.
 *
 * @param usernames - Array username Instagram (tanpa @)
 * @param delayMs   - Delay ms antar request (default 800)
 *
 * @example
 * const results = await imginnBatch(["natgeo", "nasa", "mrbeast"]);
 * for (const r of results) {
 *   if (r.status === "ok") {
 *     console.log(`@${r.username}: ${r.followerCount?.toLocaleString()} followers`);
 *   } else {
 *     console.log(`@${r.username}: ERROR — ${r.error}`);
 *   }
 * }
 */
export async function imginnBatch(
  usernames: string[],
  delayMs = 800
): Promise<
  Array<
    | ({ status: "ok" } & ImginnProfile)
    | { status: "error"; username: string; error: string }
  >
> {
  const results = [];
  for (let i = 0; i < usernames.length; i++) {
    const username = usernames[i];
    try {
      const p = await imginnProfile(username);
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
