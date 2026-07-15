/**
 * GRATIS — TikTok via tikmate.app
 *
 * tikmate.app menyediakan JSON API untuk metadata video TikTok.
 * Tidak perlu API key, tidak perlu signup, tidak perlu login.
 * Diuji langsung: Juli 2026 — CONFIRMED WORKS dari datacenter IP.
 *
 * Website  : https://tikmate.app
 * API      : https://api.tikmate.app/api/lookup
 * Auth     : ❌ Tidak perlu
 * Harga    : Gratis
 *
 * ─────────────────────────────────────────────────────────────
 * CONFIRMED WORKS (diuji Juli 2026 dari datacenter/Replit):
 *   tikmateVideoInfo()    → metadata video: author, desc, stats, cover ✅
 *   tikmateDownloadUrl()  → URL download no-watermark (302 → CDN) ✅
 *   tikmateBatch()        → batch metadata banyak video ✅
 *
 * CATATAN:
 *   - Video lama (2022-2023) atau video yang sudah dihapus → success: false
 *   - Video baru (2024-2026) umumnya works
 *   - Tidak menyediakan: daftar video user, trending, search
 * ─────────────────────────────────────────────────────────────
 *
 * KAPAN PAKAI PROVIDER INI vs TikWM:
 *   - Butuh author info (avatar, nama) → tikmate ✅ (TikWM ada juga)
 *   - Butuh download URL MP4 → tikmate atau TikWM tikwmVideoByUrl()
 *   - Butuh hashtag/trending/search → TikWM ✅
 *   - Butuh user posts dari server → EnsembleData / RapidAPI (berbayar)
 */

const TIKMATE_API = "https://api.tikmate.app/api";

// ─── Types ────────────────────────────────────────────────────────────────

export interface TikmateVideoInfo {
  /** TikTok video ID */
  id: string;
  /** Apakah berhasil (false = video tidak ditemukan / dihapus) */
  success: boolean;
  /** Username pembuat video */
  author_id: string;
  /** Nama tampil pembuat */
  author_name: string;
  /** URL avatar pembuat */
  author_avatar: string;
  /** Deskripsi / caption video */
  desc: string;
  /** URL cover / thumbnail */
  cover: string;
  /** URL dynamic cover (GIF-style) */
  dynamic_cover: string;
  /** Jumlah like */
  like_count: number;
  /** Jumlah komentar */
  comment_count: number;
  /** Jumlah share */
  share_count: number;
  /** Waktu upload (string, contoh: "Jul 15, 2026") */
  create_time: string;
  /**
   * Token internal — gunakan bersama tikmateDownloadUrl() untuk dapat URL download.
   * URL download: https://api.tikmate.app/download?token=TOKEN
   * URL ini 302-redirect ke CDN URL MP4 no-watermark.
   */
  token: string;
}

// ─── Internal helpers ─────────────────────────────────────────────────────

async function tikmateFetch(videoUrl: string): Promise<unknown> {
  const body = new URLSearchParams({ url: videoUrl });

  const res = await fetch(`${TIKMATE_API}/lookup`, {
    method: "POST",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Content-Type": "application/x-www-form-urlencoded",
      Origin: "https://tikmate.app",
      Referer: "https://tikmate.app/",
    },
    body,
  });

  // 404 = video dihapus / privat / tidak ditemukan — bukan server error
  if (res.status === 404) {
    return { success: false, id: videoUrl };
  }

  if (!res.ok) {
    throw new Error(`tikmate.app HTTP ${res.status}`);
  }

  return res.json();
}

// ─── API Functions ────────────────────────────────────────────────────────

/**
 * Ambil metadata video TikTok via tikmate.app.
 *
 * CONFIRMED WORKS dari datacenter IP (berbeda dari TikTok oEmbed yang geo-block).
 *
 * @param videoUrl - URL video TikTok (format: https://www.tiktok.com/@user/video/ID)
 * @returns TikmateVideoInfo, atau null jika video tidak ditemukan / dihapus
 *
 * @throws Error jika ada masalah koneksi / HTTP error
 *
 * @example
 * const info = await tikmateVideoInfo(
 *   "https://www.tiktok.com/@charlidamelio/video/7662660254328556821"
 * );
 * if (!info) { console.log("Video tidak ditemukan"); return; }
 * console.log(info.author_name);  // "charli d'amelio"
 * console.log(info.like_count);   // 556
 * console.log(info.desc);         // caption video
 */
export async function tikmateVideoInfo(
  videoUrl: string
): Promise<TikmateVideoInfo | null> {
  const raw = (await tikmateFetch(videoUrl)) as Record<string, unknown>;

  if (!raw.success) {
    // Video dihapus, privat, atau tidak tersedia
    return null;
  }

  return {
    id: String(raw.id ?? ""),
    success: true,
    author_id: String(raw.author_id ?? ""),
    author_name: String(raw.author_name ?? ""),
    author_avatar: String(raw.author_avatar ?? ""),
    desc: String(raw.desc ?? ""),
    cover: String(raw.cover ?? ""),
    dynamic_cover: String(raw.dynamic_cover ?? ""),
    like_count: Number(raw.like_count ?? 0),
    comment_count: Number(raw.comment_count ?? 0),
    share_count: Number(raw.share_count ?? 0),
    create_time: String(raw.create_time ?? ""),
    token: String(raw.token ?? ""),
  };
}

/**
 * Buat URL download MP4 no-watermark dari token tikmate.
 *
 * URL ini 302-redirect ke CDN URL MP4 TikTok (tanpa watermark).
 * Bisa langsung dibuka di browser atau di-fetch dengan follow redirect.
 *
 * @param token - Token dari TikmateVideoInfo.token
 * @returns URL download (perlu follow 302 redirect untuk dapat CDN URL asli)
 *
 * @example
 * const info = await tikmateVideoInfo("https://www.tiktok.com/@user/video/ID");
 * if (info) {
 *   const downloadUrl = tikmateDownloadUrl(info.token);
 *   // downloadUrl = "https://api.tikmate.app/download?token=..."
 *   // Buka di browser atau fetch dengan follow redirect untuk unduh MP4
 * }
 */
export function tikmateDownloadUrl(token: string): string {
  // Endpoint download ada di root (bukan /api), jadi hardcode base URL
  return `https://api.tikmate.app/download?token=${token}`;
}

/**
 * Resolve URL download tikmate → URL CDN asli (TikTok CDN).
 *
 * Ikuti redirect 302 untuk dapat URL CDN langsung (bisa di-download tanpa token).
 *
 * @param token - Token dari TikmateVideoInfo.token
 * @returns URL CDN MP4 asli (tanpa watermark), atau null jika redirect gagal
 *
 * @example
 * const cdnUrl = await tikmateResolveCdnUrl(info.token);
 * // "https://v16m.tiktokcdn-us.com/..."
 */
export async function tikmateResolveCdnUrl(
  token: string
): Promise<string | null> {
  const downloadUrl = tikmateDownloadUrl(token);

  // Fetch tanpa follow redirect, ambil Location header
  const res = await fetch(downloadUrl, {
    redirect: "manual",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    },
  });

  if (res.status === 302) {
    return res.headers.get("location") ?? null;
  }

  return null;
}

/**
 * Ambil metadata banyak video TikTok sekaligus.
 * Video yang tidak ditemukan / dihapus otomatis di-skip (null).
 *
 * @param videoUrls - Array URL video TikTok
 * @param delayMs   - Jeda antar request dalam ms (default 400ms)
 *
 * @example
 * const results = await tikmateBatch([
 *   "https://www.tiktok.com/@user1/video/111...",
 *   "https://www.tiktok.com/@user2/video/222...",
 * ]);
 * const found = results.filter(r => r !== null);
 * console.log(`${found.length} video berhasil diambil`);
 */
export async function tikmateBatch(
  videoUrls: string[],
  delayMs = 400
): Promise<Array<TikmateVideoInfo | null>> {
  const results: Array<TikmateVideoInfo | null> = [];

  for (let i = 0; i < videoUrls.length; i++) {
    try {
      const info = await tikmateVideoInfo(videoUrls[i]);
      results.push(info);
    } catch {
      results.push(null);
    }

    if (i < videoUrls.length - 1 && delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return results;
}
