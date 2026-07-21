/**
 * P19: TikTok via Jina AI Reader — GRATIS, NO API KEY
 *
 * Jina AI Reader (r.jina.ai) adalah layanan yang me-render halaman web
 * dan mengembalikannya dalam format JSON/Markdown yang bersih.
 * Jina bertindak sebagai browser headless, sehingga bisa bypass CF dan
 * JavaScript rendering yang biasanya memblokir fetch biasa.
 *
 * Website  : https://r.jina.ai
 * Base URL : https://r.jina.ai/{target-url}
 * Auth     : ❌ Tidak perlu (no key, no signup untuk pemakaian wajar)
 * Harga    : Gratis (ada rate limit wajar ~200 req/hari tanpa key)
 *
 * ─────────────────────────────────────────────────────────────
 * CONFIRMED WORKS ✅ (diuji langsung Juli 2026 dari datacenter/Replit):
 *   jinaTikTokProfile()   → profil user: follower, following, total likes, bio, avatar ✅
 *   jinaTikTokHashtag()   → hashtag info: post count ✅
 *   jinaTikTokVideoMeta() → metadata video: judul/caption (hanya video publik) ✅
 *
 * ❌ TIDAK WORKS:
 *   Instagram via Jina → Instagram return halaman login (block Jina bot)
 *   TikTok video yang sudah dihapus / unavailable → "Video currently unavailable"
 *   TikTok following/liked-by page → redirect ke login wall
 *
 * CATATAN:
 *   - Data profil diambil dari <title> dan <meta description> halaman TikTok
 *   - Angka follower dibulatkan (e.g. 159.3M, bukan 159,312,456)
 *   - Tambahkan delay ≥ 1-2 detik antar request agar tidak kena rate limit
 *   - Response bervariasi: beberapa akun kecil mungkin tidak ter-parse dengan baik
 *   - TIDAK ada session, TIDAK ada login, TIDAK ada cookie yang diperlukan
 *
 * PERBEDAAN vs Provider lain:
 *   vs P3 (instagram-web) → P19 untuk TikTok, P3 untuk Instagram
 *   vs P2 (TikWM)         → P19 beri bio + avatar langsung, TikWM lebih lengkap
 *   vs P10 (SocialBlade)  → P19 gratis tanpa scraping HTML kompleks
 *   vs P8 (Perplexity)    → P19 gratis (tanpa API key), Perplexity butuh key
 *   Ideal untuk: quick check follower count TikTok tanpa API key apapun
 *
 * Source: src/jina/tiktok.ts
 */

const JINA_BASE = "https://r.jina.ai";

const JINA_HEADERS = {
  Accept: "application/json",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
};

// ─── Internal helper ──────────────────────────────────────────────────────────

async function jinaFetch(targetUrl: string): Promise<{
  title: string;
  description: string;
  content: string;
  url: string;
}> {
  const res = await fetch(`${JINA_BASE}/${targetUrl}`, {
    headers: JINA_HEADERS,
  });

  if (!res.ok) {
    throw new Error(`Jina AI HTTP ${res.status} untuk URL: ${targetUrl}`);
  }

  const json = (await res.json()) as {
    code: number;
    data?: {
      title?: string;
      description?: string;
      content?: string;
      url?: string;
      warning?: string;
    };
  };

  if (json.code !== 200) {
    throw new Error(`Jina AI error code ${json.code}`);
  }

  const d = json.data ?? {};
  return {
    title: d.title ?? "",
    description: d.description ?? "",
    content: d.content ?? "",
    url: d.url ?? targetUrl,
  };
}

// ─── Value parser ──────────────────────────────────────────────────────────────

/**
 * Parse angka dari format TikTok: "159.3M" → 159_300_000
 * Mendukung: K, M, B, angka biasa dengan koma
 */
export function parseJinaCount(raw: string | undefined): number {
  if (!raw) return 0;
  const s = raw.trim().replace(/,/g, "");
  const m = s.match(/^([\d.]+)([KkMmBb]?)$/);
  if (!m) return parseInt(s) || 0;
  const n = parseFloat(m[1]);
  switch (m[2].toUpperCase()) {
    case "K": return Math.round(n * 1_000);
    case "M": return Math.round(n * 1_000_000);
    case "B": return Math.round(n * 1_000_000_000);
    default: return Math.round(n);
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JinaTikTokProfile {
  /** Username TikTok (tanpa @) */
  username: string;
  /** Nama tampilan / display name */
  displayName: string;
  /** Bio / deskripsi akun */
  bio: string;
  /**
   * Jumlah follower (dibulatkan, e.g. 159_300_000 untuk 159.3M)
   * Format asli TikTok: 1 desimal, dibulatkan ke nearest K/M/B
   */
  followerCount: number;
  /** Jumlah following */
  followingCount: number;
  /**
   * Total likes semua video (dibulatkan)
   * Ini adalah lifetime total likes, bukan rata-rata
   */
  totalLikes: number;
  /** URL avatar/foto profil (CDN TikTok, mungkin expire dalam beberapa jam) */
  avatarUrl: string;
  /** URL profil TikTok */
  profileUrl: string;
  /** Metadata tambahan mentah (untuk debugging) */
  _raw?: {
    title: string;
    description: string;
    contentSnippet: string;
  };
}

export interface JinaTikTokHashtag {
  /** Nama hashtag (tanpa #) */
  name: string;
  /** Jumlah post (dibulatkan) */
  postCount: number;
  /** URL halaman hashtag */
  hashtagUrl: string;
}

export interface JinaTikTokVideoMeta {
  /** ID video TikTok */
  videoId: string;
  /** Username pembuat (dari URL) */
  username: string;
  /** Judul / caption video (dari <title> Jina) */
  title: string;
  /** Deskripsi singkat (dari <meta description>) */
  description: string;
  /** URL video TikTok */
  videoUrl: string;
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * Ambil profil user TikTok via Jina AI Reader.
 *
 * CONFIRMED WORKS ✅ Juli 2026 — diuji dengan: charlidamelio, mrbeast, nike,
 * khaby.lame, therock. Semua berhasil parse follower/following/likes/bio/avatar.
 *
 * Catatan:
 * - Angka follower DIBULATKAN (159.3M, bukan nilai exact)
 * - Bio diambil dari meta description (ada kemungkinan terpotong)
 * - Avatar URL dari CDN TikTok — bisa expire dalam beberapa jam
 * - Beberapa akun dengan username ambigu bisa return data akun lain
 *
 * @param username - Username TikTok (tanpa @)
 *
 * @example
 * const profile = await jinaTikTokProfile("charlidamelio");
 * console.log(profile.followerCount.toLocaleString()); // "159,300,000"
 * console.log(profile.totalLikes.toLocaleString());    // "12,300,000,000"
 * console.log(profile.bio);                            // "Watch the latest video..."
 *
 * @example
 * // Batch profil dengan delay
 * const users = ["charlidamelio", "mrbeast", "nike"];
 * const profiles = [];
 * for (const u of users) {
 *   profiles.push(await jinaTikTokProfile(u));
 *   await new Promise(r => setTimeout(r, 1500));
 * }
 */
export async function jinaTikTokProfile(username: string): Promise<JinaTikTokProfile> {
  const targetUrl = `https://www.tiktok.com/@${username}`;
  const { title, description, content, url } = await jinaFetch(targetUrl);

  // Parse follower dari description: "12.3B Likes. 159.3M Followers. ..."
  const descFollowers = description.match(/([\d.]+[KMBkb]?)\s*Followers/i)?.[1];
  const descLikes = description.match(/([\d.]+[KMBkb]?)\s*Likes/i)?.[1];

  // Parse dari content (format markdown): "**159.3M**Followers"
  const contentFollowers = content.match(/\*\*([\d,.]+[KMBkb]?)\*\*\s*Followers/i)?.[1];
  const contentFollowing = content.match(/\*\*([\d,.]+[KMBkb]?)\*\*\s*Following/i)?.[1];
  const contentLikes = content.match(/\*\*([\d,.]+[KMBkb]?)\*\*\s*Likes/i)?.[1];

  // Display name dari title: "charli d'amelio (@charlidamelio) | TikTok"
  const displayName = title
    .replace(/\s*\(@[^)]+\).*$/, "")
    .replace(/\s*\|.*$/, "")
    .trim();

  // Username canonical dari title
  const canonicalUsername = title.match(/@([^\)]+)\)/)?.[1] ?? username;

  // Bio: dari description setelah info followers
  const bioMatch = description.match(/Followers\.\s*(.+?)(?:\.\s*Watch|$)/i);
  const bio = bioMatch?.[1]?.trim() ?? "";

  // Avatar: URL pertama dari content (format markdown: ![Image 1](url))
  const avatarMatch = content.match(/!\[Image 1\]\((https?:\/\/[^)]+tiktokcdn[^)]+)\)/);
  const avatarUrl = avatarMatch?.[1] ?? "";

  return {
    username: canonicalUsername,
    displayName,
    bio,
    followerCount: parseJinaCount(contentFollowers ?? descFollowers),
    followingCount: parseJinaCount(contentFollowing),
    totalLikes: parseJinaCount(contentLikes ?? descLikes),
    avatarUrl,
    profileUrl: url,
    _raw: {
      title,
      description,
      contentSnippet: content.slice(0, 300),
    },
  };
}

/**
 * Ambil info hashtag TikTok via Jina AI Reader.
 *
 * CONFIRMED WORKS ✅ Juli 2026 — diuji: #fyp (9.1B posts), #mrbeast (3.4M posts)
 *
 * @param hashtag - Nama hashtag (tanpa #)
 *
 * @example
 * const ht = await jinaTikTokHashtag("fyp");
 * console.log(`#${ht.name}: ${ht.postCount.toLocaleString()} posts`);
 * // → #fyp: 9,100,000,000 posts
 *
 * @example
 * const viral = await jinaTikTokHashtag("viral");
 * console.log(viral.postCount); // e.g. 1_600_000_000
 */
export async function jinaTikTokHashtag(hashtag: string): Promise<JinaTikTokHashtag> {
  const cleanHashtag = hashtag.replace(/^#/, "");
  const targetUrl = `https://www.tiktok.com/tag/${cleanHashtag}`;
  const { title, description } = await jinaFetch(targetUrl);

  // description format: "mr beast | 3.4M posts Watch the latest videos about #mrbeast on TikTok."
  // title format: "#fyp | TikTok"
  const postCountMatch =
    description.match(/([\d.]+[KMBkb]?)\s*posts/i);

  const postCount = parseJinaCount(postCountMatch?.[1]);

  // hashtag name dari description sebelum " | "
  const nameFromDesc = description.split("|")[0]?.trim() ?? cleanHashtag;

  return {
    name: nameFromDesc || cleanHashtag,
    postCount,
    hashtagUrl: targetUrl,
  };
}

/**
 * Ambil metadata video TikTok via Jina AI Reader.
 *
 * CONFIRMED WORKS ✅ Juli 2026 — hanya untuk video yang masih tersedia publik.
 * Video yang sudah dihapus / unavailable → mengembalikan null.
 *
 * Keterbatasan:
 * - Tidak ada like_count, comment_count, atau play_count dari endpoint ini
 * - Untuk data statistik video, gunakan tikwmVideoByUrl() (P2) yang lebih lengkap
 * - Jina lebih berguna untuk ambil caption/judul saat tikwm down
 *
 * @param username - Username pemilik video (tanpa @)
 * @param videoId  - ID video TikTok (numerik string)
 *
 * @returns null jika video tidak tersedia/dihapus
 *
 * @example
 * const meta = await jinaTikTokVideoMeta("espn", "7664344969548713246");
 * if (meta) {
 *   console.log(meta.title);       // "ESPN on TikTok"
 *   console.log(meta.description); // "That's fire 🔥 ..."
 * }
 */
export async function jinaTikTokVideoMeta(
  username: string,
  videoId: string
): Promise<JinaTikTokVideoMeta | null> {
  const videoUrl = `https://www.tiktok.com/@${username}/video/${videoId}`;

  const { title, description, content } = await jinaFetch(videoUrl);

  // Jika video tidak tersedia, Jina return "Video currently unavailable"
  if (
    content.includes("Video currently unavailable") ||
    title === "TikTok - Make Your Day" ||
    !description
  ) {
    return null;
  }

  return {
    videoId,
    username,
    title,
    description,
    videoUrl,
  };
}

/**
 * Batch ambil profil beberapa user TikTok sekaligus.
 * Auto-delay antar request untuk menghindari rate limit Jina.
 *
 * @param usernames - Array username TikTok (tanpa @)
 * @param delayMs   - Delay ms antar request (default 1500ms)
 *
 * @example
 * const results = await jinaTikTokBatch(["charlidamelio", "mrbeast", "nike"]);
 * for (const r of results) {
 *   if (r.status === "ok") {
 *     console.log(`@${r.username}: ${r.followerCount.toLocaleString()} followers`);
 *   } else {
 *     console.log(`@${r.username}: ERROR — ${r.error}`);
 *   }
 * }
 */
export async function jinaTikTokBatch(
  usernames: string[],
  delayMs = 1500
): Promise<
  Array<
    | ({ status: "ok" } & JinaTikTokProfile)
    | { status: "error"; username: string; error: string }
  >
> {
  const results = [];
  for (let i = 0; i < usernames.length; i++) {
    const username = usernames[i];
    try {
      const profile = await jinaTikTokProfile(username);
      results.push({ status: "ok" as const, ...profile });
    } catch (err) {
      results.push({
        status: "error" as const,
        username,
        error: err instanceof Error ? err.message : String(err),
      });
    }
    if (i < usernames.length - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return results;
}
