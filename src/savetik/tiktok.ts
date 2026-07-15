/**
 * GRATIS — TikTok Download Links via savetik.co
 *
 * savetik.co menyediakan link download no-watermark untuk video TikTok.
 * Tidak perlu API key, tidak perlu signup, tidak perlu login.
 * Diuji langsung: Juli 2026 — CONFIRMED WORKS dari datacenter IP.
 *
 * Website  : https://savetik.co
 * API      : https://savetik.co/api/ajaxSearch (POST, form data)
 * Auth     : ❌ Tidak perlu
 * Harga    : Gratis
 *
 * ─────────────────────────────────────────────────────────────
 * CONFIRMED WORKS (diuji Juli 2026 dari datacenter/Replit):
 *   savetikGetLinks()    → array link download (MP4, HD MP4, MP3) ✅
 *   savetikVideoInfo()   → info + links sekaligus ✅
 *
 * OUTPUT (per video):
 *   - MP4 no-watermark  → link download MP4 standar tanpa watermark ✅
 *   - MP4 HD            → link download MP4 resolusi tinggi ✅
 *   - MP3 (audio saja)  → link download audio MP3 ✅
 *   - thumbnail URL     → URL cover/thumbnail video ✅
 *   - title/caption     → teks deskripsi video ✅
 *   - video_id          → ID numerik video TikTok ✅
 *
 * CATATAN:
 *   - Link download menggunakan JWT-signed CDN URL (snapcdn.app)
 *   - Link expired setelah ~1 jam — ambil ulang jika perlu
 *   - Download URL 302-redirect ke TikTok CDN langsung
 * ─────────────────────────────────────────────────────────────
 *
 * KAPAN PAKAI PROVIDER INI vs TikWM:
 *   - Butuh semua format (MP4 + HD + MP3) dalam 1 request → savetik ✅
 *   - Butuh metadata (author stats, views) → TikWM tikwmVideoByUrl()
 *   - Butuh user posts / hashtag / search → TikWM
 */

/**
 * CATATAN IMPLEMENTASI:
 * savetik.co menggunakan Cloudflare TLS fingerprinting — Node.js fetch()
 * mendapat 403 karena TLS fingerprint berbeda dari browser/curl.
 * Solusi: gunakan curl via child_process (tersedia di semua server Linux/Mac).
 * Ini adalah workaround standar untuk CF-protected scraping dari server.
 */
import { execFileSync } from "child_process";

const SAVETIK_API = "https://savetik.co/api/ajaxSearch";

// ─── Types ────────────────────────────────────────────────────────────────

export interface SavetikDownloadLink {
  /** Label format: "MP4", "MP4 HD", "MP3" */
  label: string;
  /** URL download (snapcdn.app JWT token URL) — 302-redirect ke CDN TikTok */
  url: string;
}

export interface SavetikVideoResult {
  /** TikTok video ID numerik */
  video_id: string;
  /** Judul / caption video */
  title: string;
  /** URL thumbnail / cover */
  thumbnail: string;
  /** Array link download (MP4, HD, MP3) */
  links: SavetikDownloadLink[];
}

// ─── Internal helpers ─────────────────────────────────────────────────────

function parseHtml(html: string): SavetikVideoResult {
  // Video ID
  const vidMatch = html.match(/id="TikTokId"\s+value="(\d+)"/);
  const video_id = vidMatch?.[1] ?? "";

  // Title (h3 tag)
  const titleMatch = html.match(/<h3>([\s\S]*?)<\/h3>/);
  const title = titleMatch
    ? titleMatch[1].replace(/<[^>]+>/g, "").trim()
    : "";

  // Thumbnail
  const thumbMatch = html.match(/<img\s+src="([^"]+)"/);
  const thumbnail = thumbMatch?.[1] ?? "";

  // Download links — semua href ke dl.snapcdn.app
  const linkRegex =
    /href="(https:\/\/dl\.snapcdn\.app\/get\?token=[^"]+)"[^>]*rel="nofollow"[^>]*class="tik-button-dl[^"]*"><i[^>]*><\/i>\s*([^<]+)/g;

  const links: SavetikDownloadLink[] = [];
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(html)) !== null) {
    links.push({
      url: match[1],
      // Bersihkan HTML entities (&nbsp; dll) dan whitespace berlebih
      label: match[2]
        .trim()
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/\s+/g, " ")
        .trim(),
    });
  }

  // Fallback: jika regex di atas tidak match, cari semua snapcdn links
  if (links.length === 0) {
    const fallbackRegex = /https:\/\/dl\.snapcdn\.app\/get\?token=[^\s"<]+/g;
    const fallbackUrls = html.match(fallbackRegex) ?? [];
    const defaultLabels = ["MP4", "MP4 HD", "MP3"];
    fallbackUrls.forEach((url, i) => {
      links.push({ url, label: defaultLabels[i] ?? `Download ${i + 1}` });
    });
  }

  return { video_id, title, thumbnail, links };
}

// ─── API Functions ────────────────────────────────────────────────────────

/**
 * Ambil link download MP4, HD, dan MP3 untuk video TikTok.
 *
 * CONFIRMED WORKS dari datacenter IP (Juli 2026).
 * Berbeda dari TikWM: mendapat semua format (MP4 + HD + MP3) dalam 1 request.
 *
 * @param videoUrl - URL video TikTok (format: https://www.tiktok.com/@user/video/ID)
 * @returns Object dengan video_id, title, thumbnail, dan array download links
 *
 * @throws Error jika video tidak ditemukan atau server error
 *
 * @example
 * const result = await savetikVideoInfo(
 *   "https://www.tiktok.com/@charlidamelio/video/7662660254328556821"
 * );
 * console.log(result.title.slice(0, 80));
 * console.log(result.thumbnail);
 *
 * for (const link of result.links) {
 *   console.log(`${link.label}: ${link.url.slice(0, 60)}...`);
 * }
 * // MP4         : https://dl.snapcdn.app/get?token=eyJ...
 * // MP4 HD      : https://dl.snapcdn.app/get?token=eyJ...
 * // MP3         : https://dl.snapcdn.app/get?token=eyJ...
 */
export async function savetikVideoInfo(
  videoUrl: string
): Promise<SavetikVideoResult> {
  const body = new URLSearchParams({
    q: videoUrl,
    t: "media",
    lang: "en",
  });

  // Gunakan curl untuk bypass Cloudflare TLS fingerprinting.
  // Node.js fetch() mendapat 403 karena TLS fingerprint berbeda dari browser.
  // curl menggunakan OpenSSL TLS yang dikenali CF sebagai "normal".
  let rawOutput: string;
  try {
    rawOutput = execFileSync(
      "curl",
      [
        "-s",
        "-X", "POST",
        SAVETIK_API,
        "-H", "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "-H", "Content-Type: application/x-www-form-urlencoded",
        "-H", "Accept: application/json, text/javascript, */*; q=0.01",
        "-H", "Accept-Language: en-US,en;q=0.9",
        "-H", "X-Requested-With: XMLHttpRequest",
        "-H", "Origin: https://savetik.co",
        "-H", "Referer: https://savetik.co/",
        "-H", "Sec-Fetch-Dest: empty",
        "-H", "Sec-Fetch-Mode: cors",
        "-H", "Sec-Fetch-Site: same-origin",
        "--data-urlencode", `q=${videoUrl}`,
        "-d", "lang=en",
        "--compressed",
      ],
      { encoding: "utf8", timeout: 15000 }
    );
  } catch (err) {
    throw new Error(`savetik.co curl error: ${err instanceof Error ? err.message : String(err)}`);
  }

  const json = JSON.parse(rawOutput) as { status?: string; data?: string };

  if (json.status !== "ok" || !json.data) {
    throw new Error(
      `savetik.co error: status=${json.status ?? "unknown"}`
    );
  }

  const result = parseHtml(json.data);

  if (result.links.length === 0) {
    throw new Error(
      `savetik.co: tidak ada link download — video mungkin privat atau dihapus`
    );
  }

  return result;
}

/**
 * Shortcut: ambil hanya link download (tanpa info video).
 *
 * @param videoUrl - URL video TikTok
 * @returns Array SavetikDownloadLink — biasanya [MP4, MP4 HD, MP3]
 *
 * @example
 * const links = await savetikGetLinks(
 *   "https://www.tiktok.com/@charlidamelio/video/7662660254328556821"
 * );
 * const mp4Link = links.find(l => l.label.includes("MP4") && !l.label.includes("HD"));
 * const mp3Link = links.find(l => l.label.includes("MP3"));
 */
export async function savetikGetLinks(
  videoUrl: string
): Promise<SavetikDownloadLink[]> {
  const result = await savetikVideoInfo(videoUrl);
  return result.links;
}

/**
 * Batch: ambil download links untuk banyak video sekaligus.
 *
 * @param videoUrls - Array URL video TikTok
 * @param delayMs   - Jeda antar request dalam ms (default 800ms, savetik lebih sensitif)
 *
 * @example
 * const results = await savetikBatch([
 *   "https://www.tiktok.com/@user1/video/111...",
 *   "https://www.tiktok.com/@user2/video/222...",
 * ]);
 *
 * for (const r of results) {
 *   if (r.status === "ok") {
 *     console.log(r.data.title, r.data.links.length, "links");
 *   }
 * }
 */
export async function savetikBatch(
  videoUrls: string[],
  delayMs = 800
): Promise<
  Array<
    | { status: "ok"; url: string; data: SavetikVideoResult }
    | { status: "error"; url: string; error: string }
  >
> {
  const results = [];

  for (let i = 0; i < videoUrls.length; i++) {
    const url = videoUrls[i];
    try {
      const data = await savetikVideoInfo(url);
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
