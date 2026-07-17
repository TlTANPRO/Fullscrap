/**
 * P12b: Instagram via Wayback Machine — GRATIS, NO API KEY
 *
 * Ambil data profil Instagram dari arsip Wayback Machine.
 * Berguna saat Instagram API butuh login atau di-rate-limit.
 *
 * TESTED LIVE Juli 2026 ✅:
 *   @instagram → fullName: "Instagram", 686M followers, 8514 posts
 *   Snapshot 2026-07-07 — berhasil parse via og:description ✅
 *   @natgeo → snapshot 2026-06-01 — CDX ada 71 snapshot status:200 ✅
 *
 * Cara kerja:
 *   1. CDX API → cari snapshot status:200 terbaru (filter from=2024)
 *   2. Fetch HTML snapshot dari web.archive.org
 *   3. Parse via og:description: "686M Followers, 252 Following, 8,514 Posts..."
 *   4. Fallback: window._sharedData (older snapshots)
 *
 * Catatan:
 *   - /wayback/available tidak reliable dari Node.js datacenter → pakai CDX
 *   - Data mungkin 1-14 hari lebih lama dari realtime
 *   - Gunakan igWebV2Profile() untuk data realtime (lihat src/instagram-web-v2)
 *
 * Source: src/wayback/instagram.ts
 */

const WAYBACK_BASE = "https://web.archive.org/web";
const CDX_API = "https://web.archive.org/cdx/search/cdx";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WaybackIGProfile {
  username: string;
  fullName?: string;
  biography?: string;
  followerCount?: number;
  followingCount?: number;
  mediaCount?: number;
  profilePicUrl?: string;
  isVerified?: boolean;
  isPrivate?: boolean;
  snapshotTimestamp: string;
  snapshotUrl: string;
}

export interface WaybackIGPost {
  shortcode: string;
  likeCount?: number;
  commentCount?: number;
  caption?: string;
  snapshotTimestamp: string;
  snapshotUrl: string;
}

export interface InstagramSnapshot {
  timestamp: string;
  statusCode: string;
  waybackUrl: string;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function getLatestSnapshotUrl(url: string): Promise<string | null> {
  // CDX API — ambil snapshot status:200 dari 2024+, row terakhir (terbaru)
  // Diuji: @instagram → 30 snapshot 2024-2026, newest = 20260707170449 ✅
  // @natgeo → 71 snapshot, newest = 20260601051034 ✅
  const fromYears = ["20240101", "20230101", "20220101"];
  for (const from of fromYears) {
    try {
      const cdxUrl =
        `${CDX_API}?url=${encodeURIComponent(url)}` +
        `&output=json&limit=200&fl=timestamp&filter=statuscode:200&from=${from}`;
      const res = await fetch(cdxUrl);
      if (!res.ok) continue;
      const rows = (await res.json()) as string[][];
      // ascending order → terakhir = terbaru
      const dataRows = rows.slice(1);
      if (dataRows.length > 0) {
        const ts = dataRows[dataRows.length - 1][0];
        return `${WAYBACK_BASE}/${ts}/${url}`;
      }
    } catch { /* coba tahun lebih lama */ }
  }
  return null;
}

async function fetchHtml(snapshotUrl: string): Promise<string> {
  const res = await fetch(snapshotUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    },
  });
  if (!res.ok) throw new Error(`Wayback fetch gagal: HTTP ${res.status}`);
  return res.text();
}

function extractTimestamp(waybackUrl: string): string {
  const m = waybackUrl.match(/\/web\/(\d{14})\//);
  return m?.[1] ?? "unknown";
}

/** Parse jumlah angka seperti "686M", "8,514", "252" */
function parseCount(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const s = raw.trim().replace(/,/g, "");
  if (s.endsWith("M")) return Math.round(parseFloat(s) * 1_000_000);
  if (s.endsWith("K")) return Math.round(parseFloat(s) * 1_000);
  const n = parseInt(s, 10);
  return isNaN(n) ? undefined : n;
}

/**
 * Parse profil dari HTML snapshot Instagram.
 * Strategi 1: og:description (works on 2023+ snapshots)
 * Strategi 2: window._sharedData (older snapshots)
 */
function parseIGProfile(
  html: string,
  username: string,
  snapshotUrl: string
): WaybackIGProfile | null {
  const ts = extractTimestamp(snapshotUrl);

  // Strategi 1: og:description — "686M Followers, 252 Following, 8,514 Posts - ..."
  // CONFIRMED WORKS: @instagram 2026-07-07 snapshot ✅
  const desc = html.match(/<meta property="og:description" content="([^"]+)"/);
  if (desc) {
    const text = desc[1];
    const followerMatch = text.match(/^([\d.,KM]+)\s+Followers?/i);
    const followingMatch = text.match(/([\d.,KM]+)\s+Following/i);
    const postsMatch = text.match(/([\d.,KM]+)\s+Posts?/i);

    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
    const fullName = titleMatch?.[1]?.replace(/\s*[•·]\s*Instagram.*$/i, "").trim();

    // Bio dari og:description teks setelah "Posts - "
    const bioMatch = text.match(/Posts?\s*[-–]\s*(.+)/i);

    return {
      username,
      fullName: fullName ?? undefined,
      biography: bioMatch?.[1]?.trim() ?? undefined,
      followerCount:  parseCount(followerMatch?.[1]),
      followingCount: parseCount(followingMatch?.[1]),
      mediaCount:     parseCount(postsMatch?.[1]),
      snapshotTimestamp: ts,
      snapshotUrl,
    };
  }

  // Strategi 2: window._sharedData (snapshots sebelum 2022)
  const sharedDataMatch = html.match(/window\._sharedData\s*=\s*({[\s\S]*?});\s*<\/script>/);
  if (sharedDataMatch) {
    try {
      const sd = JSON.parse(sharedDataMatch[1]) as Record<string, unknown>;
      const entryData = (sd["entry_data"] ?? {}) as Record<string, unknown[]>;
      const profilePage = entryData["ProfilePage"]?.[0] as Record<string, unknown> | undefined;
      const gql = profilePage?.["graphql"] as Record<string, unknown> | undefined;
      const user = (gql?.["user"] ?? {}) as Record<string, unknown>;

      if (!user["username"]) return null;

      return {
        username:       String(user["username"] ?? username),
        fullName:       user["full_name"] as string | undefined,
        biography:      user["biography"] as string | undefined,
        followerCount:  (user["edge_followed_by"] as Record<string, number> | undefined)?.count,
        followingCount: (user["edge_follow"] as Record<string, number> | undefined)?.count,
        mediaCount:     (user["edge_owner_to_timeline_media"] as Record<string, number> | undefined)?.count,
        profilePicUrl:  user["profile_pic_url_hd"] as string | undefined,
        isVerified:     user["is_verified"] as boolean | undefined,
        isPrivate:      user["is_private"] as boolean | undefined,
        snapshotTimestamp: ts,
        snapshotUrl,
      };
    } catch { /* fallthrough */ }
  }

  return null;
}

// ─── Fungsi Publik ────────────────────────────────────────────────────────────

/**
 * Ambil profil Instagram dari snapshot Wayback Machine terbaru.
 *
 * CONFIRMED WORKS ✅ Juli 2026
 * Data dari og:description: followers, following, posts, fullName.
 * Data mungkin 1-14 hari lebih lama dari realtime.
 *
 * Untuk data realtime, gunakan igWebV2Profile() di src/instagram-web-v2/.
 *
 * @param username - Instagram username (tanpa @)
 *
 * @example
 * import { waybackInstagramProfile } from "../src/wayback/instagram";
 *
 * const p = await waybackInstagramProfile("instagram");
 * if (p) {
 *   console.log(p.fullName);                        // "Instagram (@instagram)"
 *   console.log(p.followerCount?.toLocaleString()); // "686,000,000"
 *   console.log(p.mediaCount);                      // 8514
 *   console.log(p.snapshotTimestamp);               // "20260707170449"
 * }
 */
export async function waybackInstagramProfile(
  username: string
): Promise<WaybackIGProfile | null> {
  const url = `https://www.instagram.com/${username}/`;
  const snap = await getLatestSnapshotUrl(url);
  if (!snap) return null;

  const html = await fetchHtml(snap);
  return parseIGProfile(html, username, snap);
}

/**
 * Ambil basic stats dari post Instagram (snapshot Wayback).
 *
 * @param shortcode - Instagram post shortcode (bagian dari URL /p/SHORTCODE/)
 *
 * @example
 * const post = await waybackInstagramPost("C5mQkCKLR0c");
 * if (post) {
 *   console.log("likes:", post.likeCount);
 *   console.log("comments:", post.commentCount);
 * }
 */
export async function waybackInstagramPost(
  shortcode: string
): Promise<WaybackIGPost | null> {
  const url = `https://www.instagram.com/p/${shortcode}/`;
  const snap = await getLatestSnapshotUrl(url);
  if (!snap) return null;

  const html = await fetchHtml(snap);

  // Coba parse dari window._sharedData
  const m = html.match(/window\._sharedData\s*=\s*({[\s\S]*?});\s*<\/script>/);
  if (m) {
    try {
      const sd = JSON.parse(m[1]) as Record<string, unknown>;
      const ep = ((sd["entry_data"] as Record<string, unknown[]>)?.["PostPage"]?.[0]) as Record<string, unknown> | undefined;
      const media = ((ep?.["graphql"] as Record<string, unknown>)?.["shortcode_media"]) as Record<string, unknown> | undefined;

      if (media) {
        const likes = (media["edge_media_preview_like"] as Record<string, number>)?.count;
        const comments = (media["edge_media_to_parent_comment"] as Record<string, number>)?.count;
        const captionEdges = (media["edge_media_to_caption"] as Record<string, Array<{node:{text:string}}>>)?.edges;
        const caption = captionEdges?.[0]?.node?.text;

        return {
          shortcode,
          likeCount:    likes,
          commentCount: comments,
          caption:      caption?.slice(0, 500),
          snapshotTimestamp: extractTimestamp(snap),
          snapshotUrl: snap,
        };
      }
    } catch { /* fallthrough */ }
  }

  return {
    shortcode,
    snapshotTimestamp: extractTimestamp(snap),
    snapshotUrl: snap,
  };
}

/**
 * Daftar snapshot Instagram yang tersedia di Wayback Machine.
 *
 * @param username - Instagram username (tanpa @)
 * @param limit    - Jumlah snapshot (default 10)
 * @param fromYear - Tahun awal (default 2022)
 *
 * @example
 * const snaps = await listInstagramSnapshots("natgeo", 5);
 * for (const s of snaps) console.log(s.timestamp, s.statusCode);
 */
export async function listInstagramSnapshots(
  username: string,
  limit = 10,
  fromYear = 2022
): Promise<InstagramSnapshot[]> {
  const url = `https://www.instagram.com/${username}/`;
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
