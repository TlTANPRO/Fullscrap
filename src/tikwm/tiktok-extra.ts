/**
 * TikWM — Endpoint Tambahan Batch 3 (Juli 2026)
 * File terpisah — tidak mengubah src/tikwm/tiktok.ts yang sudah ada.
 *
 * CONFIRMED WORKS ✅ (diuji live Juli 2026):
 *   tikwmUserReposts — POST /api/user/reposts — code 0, returns videos[]
 *
 * Endpoint yang DIUJI dan TIDAK WORK dari datacenter (tidak dimasukkan):
 *   ❌ /api/music/info  — parameter 'url' required, semua format URL TikTok gagal
 *   ❌ /api/music/posts — sama
 *   ❌ /api/comment/list — code 0 tapi selalu return 0 komentar (datacenter block)
 *   ❌ /api/user/liked  — HTTP 404
 *   ❌ /api/user/mix    — HTTP 404
 *
 * Source: src/tikwm/tiktok-extra.ts
 */

// ─── Internal HTTP helper (direplikasi dari tiktok.ts agar tidak perlu import private fn) ──

const TIKWM_BASE = "https://www.tikwm.com/api";

const TIKWM_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Referer: "https://www.tikwm.com/",
  Accept: "application/json",
};

async function tikwmRequest(
  path: string,
  body: Record<string, string | number>
): Promise<unknown> {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(body)) params.set(k, String(v));

  const res = await fetch(`${TIKWM_BASE}${path}`, {
    method: "POST",
    headers: TIKWM_HEADERS,
    body: params,
  });

  const text = await res.text();

  if (text.startsWith("<!DOCTYPE") || text.startsWith("<html")) {
    throw new Error(
      `TikWM: Cloudflare challenge. Endpoint ini perlu residential IP. HTTP ${res.status}`
    );
  }

  return JSON.parse(text) as unknown;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TikWMRepostVideo {
  /** Video ID (string numerik) */
  video_id: string;
  region: string;
  title: string;
  cover: string;
  play: string;
  duration: number;
  play_count: number;
  digg_count: number;
  comment_count: number;
  share_count: number;
  collect_count: number;
  create_time: number;
  author: {
    id: string;
    unique_id: string;
    nickname: string;
    avatar: string;
  };
}

// ─── Fungsi ───────────────────────────────────────────────────────────────────

/**
 * Ambil daftar video yang di-repost oleh user TikTok.
 *
 * CONFIRMED WORKS ✅ Juli 2026 — diuji live, code 0, returns videos[]
 * Endpoint : POST https://www.tikwm.com/api/user/reposts
 * Auth     : ❌ Tidak perlu
 * Harga    : Gratis
 *
 * Jika akun tidak punya repost publik, videos[] akan kosong (bukan error).
 *
 * @param uniqueId - Username TikTok (tanpa @)
 * @param count    - Jumlah video per halaman (default 20, max 35)
 * @param cursor   - Cursor untuk pagination (mulai dari 0)
 *
 * @example
 * import { tikwmUserReposts } from "../src/tikwm/tiktok-extra";
 *
 * const { videos, hasMore, cursor } = await tikwmUserReposts("charlidamelio", 10);
 * for (const v of videos) {
 *   console.log(`Original: @${v.author.unique_id}`);
 *   console.log(`  Title : ${v.title.slice(0, 60)}`);
 *   console.log(`  Plays : ${v.play_count.toLocaleString()}`);
 * }
 *
 * @example
 * // Pagination — ambil semua repost
 * let cur = 0, more = true;
 * const all: TikWMRepostVideo[] = [];
 * while (more && all.length < 200) {
 *   const page = await tikwmUserReposts("username", 20, cur);
 *   all.push(...page.videos);
 *   cur = page.cursor;
 *   more = page.hasMore;
 * }
 */
export async function tikwmUserReposts(
  uniqueId: string,
  count = 20,
  cursor = 0
): Promise<{ videos: TikWMRepostVideo[]; hasMore: boolean; cursor: number }> {
  const raw = (await tikwmRequest("/user/reposts", {
    unique_id: uniqueId,
    count,
    cursor,
  })) as {
    code: number;
    msg: string;
    data: {
      videos: TikWMRepostVideo[];
      hasMore: boolean | number;
      cursor: number;
    };
  };

  if (raw.code !== 0) {
    throw new Error(`TikWM user/reposts error: ${raw.msg} (code ${raw.code})`);
  }

  return {
    videos: raw.data?.videos ?? [],
    hasMore: !!raw.data?.hasMore,
    cursor: raw.data?.cursor ?? 0,
  };
}
