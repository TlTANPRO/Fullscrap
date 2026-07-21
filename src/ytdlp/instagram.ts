/**
 * GRATIS — Instagram Post Info via yt-dlp
 *
 * yt-dlp adalah CLI open-source yang mendukung Instagram tanpa login.
 * Tersedia via `uvx yt-dlp` (tanpa install permanen) atau `yt-dlp` (jika terinstall).
 *
 * Install  : pip install yt-dlp  ATAU pakai uvx yt-dlp (tanpa install)
 * GitHub   : https://github.com/yt-dlp/yt-dlp
 * Versi    : 2026.07.04 (tested)
 * Auth     : ❌ Tidak perlu (untuk post publik)
 * Harga    : Gratis
 *
 * ─────────────────────────────────────────────────────────────
 * CONFIRMED WORKS (diuji Juli 2026 dari datacenter/Replit):
 *   igGetPostInfo()   → like_count, comment_count, caption, thumbnail ✅
 *   igBatchPostInfo() → batch beberapa post ✅
 *
 * TIDAK WORKS (rate-limited dari datacenter):
 *   User profile pages (/nike/) → 429
 *   User post listings (/nike/posts/, /nike/reels/, /nike/tagged/) → 429 atau 0 result
 *
 * KEUNGGULAN vs Provider lain:
 *   - Dapat like_count & comment_count REALTIME untuk post by URL
 *   - Dapat thumbnail URL CDN
 *   - Dapat formats list (resolusi video yang tersedia untuk download)
 *   - Tidak perlu API key, tidak perlu login
 *
 * CATATAN:
 * - Butuh yt-dlp terinstall di sistem (pip install yt-dlp) atau via uvx
 * - Hanya untuk post/reel individual (bukan user listing)
 * - Rate limit dari datacenter untuk user listing — gunakan Provider 3/13 untuk itu
 * ─────────────────────────────────────────────────────────────
 */

import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IGYtdlpPost {
  /** Shortcode / ID Instagram (e.g. "DZK3iOsRlWX") */
  id: string;
  /** URL post Instagram */
  url: string;
  /** Username pemilik post */
  uploader: string;
  /** user_id numerik */
  uploader_id: string;
  /** URL profil uploader */
  uploader_url: string;
  /** Jumlah like — REALTIME ✅ */
  like_count: number;
  /** Jumlah komentar — REALTIME ✅ */
  comment_count: number;
  /** Caption / deskripsi post */
  description: string;
  /** Tanggal upload format YYYYMMDD */
  upload_date: string;
  /** Unix timestamp upload */
  timestamp: number;
  /** Durasi video dalam detik (null untuk foto) */
  duration: number | null;
  /** URL thumbnail/cover */
  thumbnail: string;
  /** Apakah ini video */
  is_video: boolean;
  /** Jumlah format video tersedia (resolusi berbeda) */
  formats_count: number;
}

// ─── Internal ─────────────────────────────────────────────────────────────────

/** Resolve binary yt-dlp yang tersedia di sistem */
async function resolveYtdlpBin(): Promise<string> {
  // Coba uvx dulu (tersedia di Replit Nix tanpa install)
  try {
    await execFileAsync("uvx", ["yt-dlp", "--version"], { timeout: 15_000 });
    return "uvx";
  } catch {
    // Fallback ke yt-dlp langsung
    return "yt-dlp";
  }
}

async function runYtdlp(args: string[]): Promise<string> {
  const bin = await resolveYtdlpBin();
  const realArgs = bin === "uvx" ? ["yt-dlp", ...args] : args;

  const { stdout, stderr } = await execFileAsync(bin, realArgs, {
    timeout: 60_000,
    maxBuffer: 10 * 1024 * 1024,
  });

  if (!stdout && stderr) throw new Error(`yt-dlp error: ${stderr.slice(0, 400)}`);
  return stdout;
}

function parsePost(raw: Record<string, unknown>, url: string): IGYtdlpPost {
  return {
    id: String(raw.id ?? ""),
    url,
    uploader: String(raw.uploader ?? ""),
    uploader_id: String(raw.uploader_id ?? ""),
    uploader_url: String(raw.uploader_url ?? ""),
    like_count: Number(raw.like_count ?? 0),
    comment_count: Number(raw.comment_count ?? 0),
    description: String(raw.description ?? raw.title ?? ""),
    upload_date: String(raw.upload_date ?? ""),
    timestamp: Number(raw.timestamp ?? 0),
    duration: raw.duration != null ? Number(raw.duration) : null,
    thumbnail: String(raw.thumbnail ?? ""),
    is_video: Boolean(raw.duration),
    formats_count: Array.isArray(raw.formats) ? raw.formats.length : 0,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Ambil info post Instagram by URL.
 *
 * CONFIRMED WORKS ✅ Juli 2026 — dari Replit (datacenter)
 * Dapat: like_count, comment_count, caption, thumbnail, format list.
 *
 * Support URL format:
 *   https://www.instagram.com/p/SHORTCODE/
 *   https://www.instagram.com/reel/SHORTCODE/
 *
 * @param postUrl - URL post atau reel Instagram
 * @throws Error jika yt-dlp tidak tersedia atau post tidak bisa diakses
 *
 * @example
 * const post = await igGetPostInfo("https://www.instagram.com/p/DZK3iOsRlWX/");
 * console.log(post.uploader);      // "Nike"
 * console.log(post.like_count);    // 2779788
 * console.log(post.comment_count); // 59888
 * console.log(post.description);   // "It was all going to plan..."
 */
export async function igGetPostInfo(postUrl: string): Promise<IGYtdlpPost> {
  const stdout = await runYtdlp(["--skip-download", "--dump-json", "--no-playlist", postUrl]);

  // Ambil baris JSON terakhir yang valid
  const lines = stdout.trim().split("\n").filter((l) => l.trim().startsWith("{"));
  if (!lines.length) throw new Error(`yt-dlp: tidak ada output JSON untuk ${postUrl}`);

  const raw = JSON.parse(lines[lines.length - 1]) as Record<string, unknown>;
  return parsePost(raw, postUrl);
}

/**
 * Batch: ambil info beberapa post Instagram sekaligus.
 * yt-dlp memproses URL satu per satu, delay opsional antar request.
 *
 * @param postUrls  - Array URL post Instagram
 * @param delayMs   - Delay antar request dalam ms (default 2000)
 *
 * @example
 * const urls = [
 *   "https://www.instagram.com/p/DZK3iOsRlWX/",
 *   "https://www.instagram.com/reel/C9Dcs1hvRMT/",
 * ];
 * const posts = await igBatchPostInfo(urls, 2000);
 * for (const r of posts) {
 *   if (r.status === "ok") {
 *     console.log(`${r.uploader}: ${r.like_count.toLocaleString()} likes`);
 *   } else {
 *     console.log(`ERROR ${r.url}: ${r.error}`);
 *   }
 * }
 */
export async function igBatchPostInfo(
  postUrls: string[],
  delayMs = 2000
): Promise<Array<({ status: "ok" } & IGYtdlpPost) | { status: "error"; url: string; error: string }>> {
  const results = [];

  for (let i = 0; i < postUrls.length; i++) {
    const url = postUrls[i];
    try {
      const post = await igGetPostInfo(url);
      results.push({ status: "ok" as const, ...post });
    } catch (err) {
      results.push({
        status: "error" as const,
        url,
        error: err instanceof Error ? err.message : String(err),
      });
    }
    if (i < postUrls.length - 1) await new Promise((r) => setTimeout(r, delayMs));
  }

  return results;
}

/**
 * Convert shortcode Instagram ke URL penuh.
 *
 * @example
 * igShortcodeToUrl("DZK3iOsRlWX") // "https://www.instagram.com/p/DZK3iOsRlWX/"
 */
export function igShortcodeToUrl(shortcode: string): string {
  return `https://www.instagram.com/p/${shortcode}/`;
}
