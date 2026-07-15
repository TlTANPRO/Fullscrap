/**
 * GRATIS — TikTok via oEmbed (Official API)
 *
 * Endpoint resmi dari TikTok untuk embed metadata video.
 * Tidak perlu API key, tidak perlu signup, tidak perlu login.
 *
 * Docs    : https://developers.tiktok.com/doc/embed-videos
 * Base URL: https://www.tiktok.com/oembed
 * Auth    : ❌ Tidak perlu
 * Harga   : Gratis
 *
 * ─────────────────────────────────────────────────────────────
 * STATUS (diuji Juli 2026):
 *
 * ⚠️  DATACENTER IP (Replit, AWS, GCP, dsb.): TIDAK WORKS
 *     TikTok men-redirect request dari datacenter IP ke halaman lain
 *     (misalnya tiktok.com/in/about) — tidak mengembalikan JSON.
 *
 * ✅  RESIDENTIAL IP / BROWSER: WORKS
 *     Dari browser, VPS residential, atau IP non-datacenter, endpoint
 *     ini bekerja normal dan mengembalikan JSON metadata video.
 *
 * CONFIRMED WORKS (dari residential IP):
 *   getTikTokOEmbed()     → metadata: title, author, thumbnail ✅
 *   parseTikTokVideoId()  → ekstrak video ID dari URL ✅
 *   batchOEmbed()         → batch metadata banyak video ✅
 *
 * TIDAK DISEDIAKAN (butuh provider lain):
 *   - Daftar video user   → gunakan TikWM, RapidAPI, atau EnsembleData
 *   - Video download URL  → gunakan TikWM tikwmVideoByUrl()
 *   - Stats (views, likes)→ gunakan TikWM atau EnsembleData
 * ─────────────────────────────────────────────────────────────
 *
 * KAPAN PAKAI PROVIDER INI:
 * - Dari browser / residential server
 * - Cukup butuh judul, author, dan thumbnail dari sebuah URL video
 * - Ingin generate embed HTML untuk tampil di website
 */

const OEMBED_URL = "https://www.tiktok.com/oembed";

// ─── Types ────────────────────────────────────────────────────────────────

export interface TikTokOEmbed {
  /** Judul video */
  title: string;
  /** Nama akun pembuat video */
  author_name: string;
  /** URL profil pembuat */
  author_url: string;
  /** URL thumbnail/cover video */
  thumbnail_url: string;
  /** Lebar thumbnail (px) */
  thumbnail_width: number;
  /** Tinggi thumbnail (px) */
  thumbnail_height: number;
  /** HTML `<blockquote>` untuk embed video di website */
  html: string;
  /** Lebar embed (px) */
  width: number;
  /** Tinggi embed (px) */
  height: number;
  /** Nama provider: "TikTok" */
  provider_name: string;
  /** URL provider: "https://www.tiktok.com" */
  provider_url: string;
  /** Versi oEmbed: "1.0" */
  version: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Ekstrak video ID dari URL TikTok dalam berbagai format.
 *
 * Format yang didukung:
 *   - https://www.tiktok.com/@user/video/7441234567890123456
 *   - https://vm.tiktok.com/ZMhXXXXXX/  (short link — perlu redirect dulu)
 *   - https://vt.tiktok.com/ZSXxXxXx/   (short link — perlu redirect dulu)
 *
 * @returns Video ID string, atau null jika tidak ditemukan
 *
 * @example
 * parseTikTokVideoId("https://www.tiktok.com/@mrbeast/video/7441234567890123456")
 * // "7441234567890123456"
 */
export function parseTikTokVideoId(url: string): string | null {
  // Format panjang: /video/VIDEO_ID
  const longMatch = url.match(/\/video\/(\d+)/);
  if (longMatch) return longMatch[1];

  // Format numerik langsung
  const numericMatch = url.match(/\b(\d{15,20})\b/);
  if (numericMatch) return numericMatch[1];

  return null;
}

/**
 * Buat URL video TikTok canonical dari username + video ID.
 *
 * @example
 * makeTikTokVideoUrl("mrbeast", "7441234567890123456")
 * // "https://www.tiktok.com/@mrbeast/video/7441234567890123456"
 */
export function makeTikTokVideoUrl(username: string, videoId: string): string {
  const u = username.replace(/^@/, "");
  return `https://www.tiktok.com/@${u}/video/${videoId}`;
}

// ─── API Function ─────────────────────────────────────────────────────────

/**
 * Ambil metadata video TikTok via oEmbed API resmi.
 *
 * CONFIRMED WORKS — diuji Juli 2026 dengan berbagai video public.
 *
 * @param videoUrl - URL video TikTok lengkap (bukan short link)
 * @returns Metadata video: title, author, thumbnail, embed HTML
 *
 * @throws Error jika video tidak ditemukan, privat, atau dihapus
 *
 * @example
 * const meta = await getTikTokOEmbed(
 *   "https://www.tiktok.com/@mrbeast/video/7441234567890123456"
 * );
 * console.log(meta.title);         // "I Survived 100 Days..."
 * console.log(meta.author_name);   // "MrBeast"
 * console.log(meta.thumbnail_url); // "https://p16-sign.tiktokcdn-us.com/..."
 */
export async function getTikTokOEmbed(videoUrl: string): Promise<TikTokOEmbed> {
  const params = new URLSearchParams({ url: videoUrl });
  const endpoint = `${OEMBED_URL}?${params.toString()}`;

  const res = await fetch(endpoint, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "application/json",
    },
  });

  if (res.status === 404) {
    throw new Error(
      `TikTok oEmbed: video tidak ditemukan atau privat — ${videoUrl}`
    );
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `TikTok oEmbed error ${res.status}: ${body.slice(0, 200)}`
    );
  }

  return res.json() as Promise<TikTokOEmbed>;
}

/**
 * Ambil metadata banyak video TikTok sekaligus.
 * Otomatis skip URL yang gagal (privat/dihapus) dan lanjut ke berikutnya.
 *
 * @param videoUrls  - Array URL video TikTok
 * @param delayMs    - Jeda antar request dalam ms (default 300ms)
 *
 * @returns Array result — setiap item berisi status "ok" atau "error"
 *
 * @example
 * const results = await batchOEmbed([
 *   "https://www.tiktok.com/@user1/video/111...",
 *   "https://www.tiktok.com/@user2/video/222...",
 * ]);
 * const success = results.filter(r => r.status === "ok");
 * console.log(`${success.length}/${results.length} berhasil`);
 */
export async function batchOEmbed(
  videoUrls: string[],
  delayMs = 300
): Promise<
  Array<
    | { status: "ok"; url: string; data: TikTokOEmbed }
    | { status: "error"; url: string; error: string }
  >
> {
  const results = [];

  for (let i = 0; i < videoUrls.length; i++) {
    const url = videoUrls[i];
    try {
      const data = await getTikTokOEmbed(url);
      results.push({ status: "ok" as const, url, data });
    } catch (err) {
      results.push({
        status: "error" as const,
        url,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    if (i < videoUrls.length - 1 && delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return results;
}
