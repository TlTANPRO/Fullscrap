/**
 * GRATIS (tanpa API key) — TikTok & Instagram via SocialBlade HTML scraping
 *
 * SocialBlade adalah situs analitik sosial media yang menampilkan statistik
 * publik TikTok dan Instagram tanpa memerlukan login atau API key.
 * HTML-nya dapat di-fetch langsung, tidak ada Cloudflare protection.
 *
 * URL       : https://socialblade.com/tiktok/user/{username}
 *             https://socialblade.com/instagram/user/{username}
 * Auth      : Tidak diperlukan ✅
 * Harga     : Gratis ✅
 *
 * ─────────────────────────────────────────────────────────────
 * CONFIRMED WORKS — diuji langsung Juli 2026:
 *   TikTok profil    → followers, following, likes (total), videos ✅
 *   Instagram profil → followers, following, media_count, avg_likes,
 *                      avg_comments, engagement_rate ✅
 *
 * KETERBATASAN:
 *   - Angka TikTok dibulatkan/disingkat (misal 162.3M bukan exact)
 *   - Angka Instagram lebih presisi (misal 291,785,098)
 *   - Data bisa 1–3 hari stale (SocialBlade update harian)
 *   - Rate limit tidak tertulis, hindari >30 request/menit
 *   - Akun private tidak tersedia
 *   - Tidak ada: bio, is_verified, profile_pic_url
 *
 * Perbedaan dengan P2 (TikWM) dan P3 (Instagram Web API):
 *   - SocialBlade LEBIH SEDERHANA: pure HTML, tidak perlu header khusus
 *   - SocialBlade memberikan avg_likes & avg_comments (IG) — P3 tidak punya
 *   - SocialBlade memberikan total likes (TikTok) — TikWM sudah punya
 *   - Berguna sebagai FALLBACK ketika P2/P3 down
 * ─────────────────────────────────────────────────────────────
 */

const SB_BASE = "https://socialblade.com";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml",
  "Accept-Language": "en-US,en;q=0.9",
};

// ─── Value parser ─────────────────────────────────────────────────────────────

/**
 * Parse nilai seperti "162.3M", "2.6B", "291,785,098", "1,342", "--", "0.11"
 * menjadi number.
 */
export function parseSBValue(raw: string): number {
  const s = raw.trim().replace(/,/g, "");
  if (!s || s === "--" || s === "N/A") return 0;
  const m = s.match(/^([\d.]+)([KkMmBb]?)$/);
  if (!m) return parseFloat(s) || 0;
  const n = parseFloat(m[1]);
  switch (m[2].toUpperCase()) {
    case "K": return Math.round(n * 1_000);
    case "M": return Math.round(n * 1_000_000);
    case "B": return Math.round(n * 1_000_000_000);
    default:  return Math.round(n);
  }
}

/**
 * Parse pasangan label → nilai dari HTML SocialBlade.
 * Struktur di HTML:
 *   <p class="...font-medium capitalize...">followers</p>
 *   <p class="...font-extralight...">162.3M</p>
 */
function parseStatPairs(html: string): Record<string, string> {
  const result: Record<string, string> = {};
  const re =
    /font-medium capitalize[^>]*>([^<]+)<\/p>\s*<p[^>]*font-extralight[^>]*>([^<]+)<\/p>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const label = m[1].trim().toLowerCase().replace(/\s+/g, "_");
    result[label] = m[2].trim();
  }
  return result;
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) {
    throw new Error(`SocialBlade HTTP ${res.status} untuk ${url}`);
  }
  const html = await res.text();
  if (!html.includes("font-medium capitalize")) {
    throw new Error(
      "SocialBlade: struktur halaman berubah atau akun tidak ditemukan"
    );
  }
  return html;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SBTikTokProfile {
  username: string;
  /** Jumlah follower (dibulatkan, misal 162300000 = 162.3M) */
  follower_count: number;
  /** Jumlah following */
  following_count: number;
  /** Total likes dari semua video (dibulatkan) */
  total_likes: number;
  /** Jumlah video yang diunggah */
  video_count: number;
  /** ⚠️ Angka dibulatkan (misal 162.3M). Data mungkin 1–3 hari stale. */
  _data_note: "socialblade-rounded";
}

export interface SBInstagramProfile {
  username: string;
  /** Jumlah follower (presisi penuh, misal 291785098) */
  follower_count: number;
  /** Jumlah following */
  following_count: number;
  /** Jumlah total post/media */
  media_count: number;
  /** Rata-rata likes per post */
  avg_likes: number;
  /** Rata-rata komentar per post */
  avg_comments: number;
  /** Engagement rate (persen, misal 0.11 = 0.11%) */
  engagement_rate: number;
  /** ⚠️ Data mungkin 1–3 hari stale. */
  _data_note: "socialblade-html";
}

// ─── Functions ────────────────────────────────────────────────────────────────

/**
 * Ambil statistik profil TikTok dari SocialBlade.
 * CONFIRMED WORKS — diuji Juli 2026 ✅
 *
 * Tidak memerlukan API key, session, atau login apapun.
 * Angka dibulatkan (misal 162.3M) — untuk angka presisi pakai TikWM (P2).
 *
 * @param username - Username TikTok (tanpa @). Contoh: "khaby.lame", "charlidamelio"
 *
 * @example
 * const p = await socialbladeTikTokProfile("khaby.lame");
 * // → { follower_count: 162300000, total_likes: 2600000000, video_count: 1342, ... }
 */
export async function socialbladeTikTokProfile(
  username: string
): Promise<SBTikTokProfile> {
  const url = `${SB_BASE}/tiktok/user/${encodeURIComponent(username)}`;
  const html = await fetchHtml(url);
  const stats = parseStatPairs(html);

  if (!stats["followers"]) {
    throw new Error(
      `SocialBlade: data TikTok untuk "${username}" tidak ditemukan. ` +
      `Pastikan username benar dan akun memang ada di SocialBlade.`
    );
  }

  return {
    username,
    follower_count: parseSBValue(stats["followers"] ?? "0"),
    following_count: parseSBValue(stats["following"] ?? "0"),
    total_likes: parseSBValue(stats["likes"] ?? "0"),
    video_count: parseSBValue(stats["videos"] ?? "0"),
    _data_note: "socialblade-rounded",
  };
}

/**
 * Ambil statistik profil Instagram dari SocialBlade.
 * CONFIRMED WORKS — diuji Juli 2026 ✅
 *
 * Tidak memerlukan API key, session, atau login apapun.
 * Memberikan avg_likes & avg_comments yang tidak ada di provider lain.
 *
 * @param username - Username Instagram (tanpa @). Contoh: "nike", "cristiano"
 *
 * @example
 * const p = await socialbladeInstagramProfile("nike");
 * // → { follower_count: 291785098, following_count: 264, media_count: 1663,
 * //     avg_likes: 328589, avg_comments: 2886, engagement_rate: 0.11 }
 */
export async function socialbladeInstagramProfile(
  username: string
): Promise<SBInstagramProfile> {
  const url = `${SB_BASE}/instagram/user/${encodeURIComponent(username)}`;
  const html = await fetchHtml(url);
  const stats = parseStatPairs(html);

  if (!stats["followers"]) {
    throw new Error(
      `SocialBlade: data Instagram untuk "${username}" tidak ditemukan. ` +
      `Pastikan username benar dan akun memang ada di SocialBlade.`
    );
  }

  return {
    username,
    follower_count: parseSBValue(stats["followers"] ?? "0"),
    following_count: parseSBValue(stats["following"] ?? "0"),
    media_count: parseSBValue(stats["media_count"] ?? "0"),
    avg_likes: parseSBValue(stats["average_likes"] ?? "0"),
    avg_comments: parseSBValue(stats["average_comments"] ?? "0"),
    engagement_rate: parseFloat(stats["engagement_rate"] ?? "0") || 0,
    _data_note: "socialblade-html",
  };
}
