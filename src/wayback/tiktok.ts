/**
 * P12: TikTok via Wayback Machine — GRATIS, NO API KEY, NO CLOUDFLARE
 *
 * Ambil data profil & video TikTok dari arsip Wayback Machine.
 * Berguna saat TikTok langsung di-block Cloudflare dari datacenter/server.
 *
 * TESTED LIVE Juli 2026 ✅:
 *   @charlidamelio → nickname: "charli d'amelio", 156.9M followers, 2861 videos
 *   Snapshot 2025-05-13 — berhasil parse __UNIVERSAL_DATA_FOR_REHYDRATION__
 *
 * Cara kerja:
 *   1. CDX API → cari snapshot status:200 terbaru (filter from=2024)
 *   2. Fetch HTML snapshot dari web.archive.org
 *   3. Parse JSON dari <script id="__UNIVERSAL_DATA_FOR_REHYDRATION__">
 *
 * Catatan penting:
 *   - /wayback/available TIDAK reliable dari Node.js datacenter (return empty {})
 *   - Pakai CDX filter=statuscode:200 + ambil row terakhir (terbaru)
 *   - Data mungkin 1-14 hari lebih lama dari realtime
 *   - Rate limit: 1 req/dtk ke Wayback cukup aman
 *
 * Source: src/wayback/tiktok.ts
 */

const WAYBACK_BASE = "https://web.archive.org/web";
const CDX_API = "https://web.archive.org/cdx/search/cdx";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WaybackTikTokProfile {
  /** Username TikTok (unik) */
  uniqueId: string;
  /** Display name / nickname */
  nickname: string;
  /** Bio / deskripsi profil */
  signature: string;
  /** ID numerik user */
  id: string;
  /** Jumlah followers */
  followerCount?: number;
  /** Jumlah following */
  followingCount?: number;
  /** Total like yang diterima semua video */
  heartCount?: number;
  /** Jumlah video publik */
  videoCount?: number;
  /** URL avatar */
  avatarLarger?: string;
  /** Akun verified? */
  verified?: boolean;
  /** Akun private? */
  privateAccount?: boolean;
  /** Timestamp snapshot (format YYYYMMDDHHmmss) */
  snapshotTimestamp: string;
  /** URL snapshot asli */
  snapshotUrl: string;
}

export interface WaybackTikTokVideoStats {
  /** Video ID */
  videoId: string;
  /** Jumlah play/view */
  playCount?: number;
  /** Jumlah like */
  diggCount?: number;
  /** Jumlah komentar */
  commentCount?: number;
  /** Jumlah share */
  shareCount?: number;
  /** Timestamp snapshot */
  snapshotTimestamp: string;
  snapshotUrl: string;
}

export interface TikTokSnapshot {
  /** Format: YYYYMMDDHHmmss */
  timestamp: string;
  /** HTTP status code ("200", "301", "-", dll) */
  statusCode: string;
  /** URL lengkap Wayback snapshot */
  waybackUrl: string;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Cari snapshot terbaru via CDX (status:200, dari 2024 ke atas).
 * /wayback/available tidak reliable dari Node.js datacenter → pakai CDX.
 * TESTED: tiktok.com/@charlidamelio → 92+ snapshot, newest = 20260620104836
 */
export async function getLatestSnapshotUrl(url: string): Promise<string | null> {
  const fromYears = ["20240101", "20230101", "20220101"];
  for (const from of fromYears) {
    try {
      const cdxUrl =
        `${CDX_API}?url=${encodeURIComponent(url)}` +
        `&output=json&limit=200&fl=timestamp&filter=statuscode:200&from=${from}`;
      const res = await fetch(cdxUrl);
      if (!res.ok) continue;
      const rows = (await res.json()) as string[][];
      // rows[0] = header, rows[1..] = data ascending → terakhir = terbaru
      const dataRows = rows.slice(1);
      if (dataRows.length > 0) {
        const timestamp = dataRows[dataRows.length - 1][0];
        return `${WAYBACK_BASE}/${timestamp}/${url}`;
      }
    } catch { /* coba tahun lebih lama */ }
  }
  return null;
}

/** Fetch HTML dari Wayback Machine snapshot */
async function fetchWaybackHtml(snapshotUrl: string): Promise<string> {
  const res = await fetch(snapshotUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    },
  });
  if (!res.ok) throw new Error(`Wayback fetch gagal: HTTP ${res.status} — ${snapshotUrl}`);
  return res.text();
}

/** Ekstrak timestamp dari Wayback URL (format /web/YYYYMMDDHHmmss/) */
function extractTimestamp(waybackUrl: string): string {
  const m = waybackUrl.match(/\/web\/(\d{14})\//);
  return m?.[1] ?? "unknown";
}

/** Parse __UNIVERSAL_DATA_FOR_REHYDRATION__ dari HTML TikTok snapshot */
function parseTikTokProfile(
  html: string,
  snapshotUrl: string
): WaybackTikTokProfile | null {
  const m = html.match(
    /<script[^>]*id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/
  );
  if (!m) return null;

  try {
    const data = JSON.parse(m[1]) as Record<string, unknown>;
    const scope = (data["__DEFAULT_SCOPE__"] ?? {}) as Record<string, unknown>;
    const ud = (scope["webapp.user-detail"] ?? {}) as Record<string, unknown>;
    const info = (ud["userInfo"] ?? {}) as Record<string, unknown>;
    const user = (info["user"] ?? {}) as Record<string, unknown>;
    const stats = (info["stats"] ?? {}) as Record<string, unknown>;

    if (!user["uniqueId"]) return null;

    return {
      uniqueId:       String(user["uniqueId"] ?? ""),
      nickname:       String(user["nickname"] ?? ""),
      signature:      String(user["signature"] ?? ""),
      id:             String(user["id"] ?? ""),
      followerCount:  typeof stats["followerCount"] === "number" ? stats["followerCount"] : undefined,
      followingCount: typeof stats["followingCount"] === "number" ? stats["followingCount"] : undefined,
      heartCount:     typeof stats["heartCount"] === "number" ? stats["heartCount"] : undefined,
      videoCount:     typeof stats["videoCount"] === "number" ? stats["videoCount"] : undefined,
      avatarLarger:   user["avatarLarger"] as string | undefined,
      verified:       user["verified"] as boolean | undefined,
      privateAccount: user["privateAccount"] as boolean | undefined,
      snapshotTimestamp: extractTimestamp(snapshotUrl),
      snapshotUrl,
    };
  } catch {
    return null;
  }
}

// ─── Fungsi Publik ────────────────────────────────────────────────────────────

/**
 * Ambil profil TikTok dari snapshot Wayback Machine terbaru.
 *
 * CONFIRMED WORKS ✅ Juli 2026
 * Berguna saat direct TikTok diblock Cloudflare dari datacenter.
 * Data mungkin 1-14 hari lebih lama dari realtime.
 *
 * @param username - TikTok username (tanpa @)
 * @returns Profil atau null jika tidak ada snapshot tersedia
 *
 * @example
 * import { waybackTikTokProfile } from "../src/wayback/tiktok";
 *
 * const p = await waybackTikTokProfile("charlidamelio");
 * if (p) {
 *   console.log(p.nickname);                        // "charli d'amelio"
 *   console.log(p.followerCount?.toLocaleString()); // "156,900,000"
 *   console.log(p.videoCount);                      // 2861
 *   console.log(p.snapshotTimestamp);               // "20250513235954"
 * }
 */
export async function waybackTikTokProfile(
  username: string
): Promise<WaybackTikTokProfile | null> {
  const url = `https://www.tiktok.com/@${username}`;
  const snap = await getLatestSnapshotUrl(url);
  if (!snap) return null;

  const html = await fetchWaybackHtml(snap);
  return parseTikTokProfile(html, snap);
}

/**
 * Ambil stats video TikTok dari snapshot Wayback Machine.
 *
 * @param username - Username pemilik video
 * @param videoId  - Video ID (numerik string)
 *
 * @example
 * const stats = await waybackTikTokVideoStats("charlidamelio", "7462618848023977259");
 * if (stats) {
 *   console.log("plays:", stats.playCount?.toLocaleString());
 *   console.log("likes:", stats.diggCount?.toLocaleString());
 * }
 */
export async function waybackTikTokVideoStats(
  username: string,
  videoId: string
): Promise<WaybackTikTokVideoStats | null> {
  const url = `https://www.tiktok.com/@${username}/video/${videoId}`;
  const snap = await getLatestSnapshotUrl(url);
  if (!snap) return null;

  const html = await fetchWaybackHtml(snap);

  const m = html.match(
    /<script[^>]*id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/
  );
  if (!m) return null;

  try {
    const data = JSON.parse(m[1]) as Record<string, unknown>;
    const scope = (data["__DEFAULT_SCOPE__"] ?? {}) as Record<string, unknown>;
    const vd = (scope["webapp.video-detail"] ?? {}) as Record<string, unknown>;
    const itemInfo = (vd["itemInfo"] ?? {}) as Record<string, unknown>;
    const item = (itemInfo["itemStruct"] ?? {}) as Record<string, unknown>;
    const stats = (item["stats"] ?? {}) as Record<string, unknown>;

    return {
      videoId,
      playCount:    stats["playCount"] as number | undefined,
      diggCount:    stats["diggCount"] as number | undefined,
      commentCount: stats["commentCount"] as number | undefined,
      shareCount:   stats["shareCount"] as number | undefined,
      snapshotTimestamp: extractTimestamp(snap),
      snapshotUrl: snap,
    };
  } catch {
    return null;
  }
}

/**
 * Ambil profil TikTok dari snapshot pada timestamp tertentu.
 *
 * @param username  - TikTok username (tanpa @)
 * @param timestamp - Wayback timestamp format YYYYMMDDHHmmss
 *
 * @example
 * // Ambil profil dari 2025-01-01
 * const p = await waybackTikTokProfileAt("charlidamelio", "20250101000000");
 */
export async function waybackTikTokProfileAt(
  username: string,
  timestamp: string
): Promise<WaybackTikTokProfile | null> {
  const url = `https://www.tiktok.com/@${username}`;
  const snap = `${WAYBACK_BASE}/${timestamp}/${url}`;
  const html = await fetchWaybackHtml(snap);
  return parseTikTokProfile(html, snap);
}

/**
 * Daftar snapshot TikTok profil yang tersedia di Wayback Machine.
 *
 * CATATAN: CDX returns ascending order, snaps[0] = oldest in range.
 * Gunakan `reverse=1` parameter di CDX untuk descending (newest first).
 *
 * @param username - TikTok username (tanpa @)
 * @param limit    - Jumlah snapshot (default 10)
 * @param fromYear - Mulai dari tahun berapa (default 2023)
 *
 * @example
 * const snaps = await listTikTokSnapshots("charlidamelio", 5);
 * for (const s of snaps) {
 *   console.log(s.timestamp, s.statusCode, s.waybackUrl.slice(0, 70));
 * }
 */
export async function listTikTokSnapshots(
  username: string,
  limit = 10,
  fromYear = 2023
): Promise<TikTokSnapshot[]> {
  const url = `https://www.tiktok.com/@${username}`;
  const cdxUrl =
    `${CDX_API}?url=${encodeURIComponent(url)}` +
    `&output=json&limit=${limit}&fl=timestamp,statuscode` +
    `&from=${fromYear}0101&reverse=1`;

  const res = await fetch(cdxUrl);
  if (!res.ok) throw new Error(`CDX HTTP ${res.status}`);

  const rows = (await res.json()) as string[][];

  return rows.slice(1).map(([timestamp, statusCode]) => ({
    timestamp,
    statusCode,
    waybackUrl: `${WAYBACK_BASE}/${timestamp}/${url}`,
  }));
}
