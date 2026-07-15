/**
 * PILIHAN 1 — TikTok via EnsembleData
 *
 * EnsembleData adalah provider data sosial media berbayar (pay-per-use)
 * yang menyediakan API bersih untuk TikTok dan Instagram.
 *
 * Base URL  : https://ensembledata.com/apis/tt
 * Docs      : https://ensembledata.com/apis#tiktok
 * Dashboard : https://dashboard.ensembledata.com
 *
 * Env wajib : ENSEMBLEDATA_API_TOKEN
 */

import {
  TikTokProfile,
  TikTokVideo,
  TikTokFetchResult,
  ProviderNotFoundError,
  ProviderUpstreamError,
} from "./types";

const ENSEMBLE_BASE_URL = "https://ensembledata.com/apis/tt";

// Jumlah halaman pagination yang diambil.
// Setiap depth menghasilkan ~9-10 video.
// depth=10 → ~90-100 video terakhir.
export const DEFAULT_DEPTH = 10;

// ─── Internal helpers ───────────────────────────────────────────────────────

function getToken(): string {
  const token = process.env.ENSEMBLEDATA_API_TOKEN;
  if (!token) {
    throw new ProviderUpstreamError(
      "ENSEMBLEDATA_API_TOKEN tidak di-set di environment variables"
    );
  }
  return token;
}

async function ensembleGet(
  path: string,
  params: Record<string, string>
): Promise<{ data: unknown }> {
  const token = getToken();
  const query = new URLSearchParams({ ...params, token });
  const url = `${ENSEMBLE_BASE_URL}${path}?${query.toString()}`;

  const res = await fetch(url);

  if (!res.ok) {
    if (res.status === 404) {
      throw new ProviderNotFoundError("TikTok", params.username ?? "unknown");
    }
    let errBody = "";
    try { errBody = await res.text(); } catch { /* noop */ }
    throw new ProviderUpstreamError(
      `EnsembleData TikTok API error ${res.status}: ${errBody.slice(0, 200)}`
    );
  }

  return res.json() as Promise<{ data: unknown }>;
}

function pickAvatarUrl(user: Record<string, unknown>): string {
  for (const key of ["avatarLarger", "avatarMedium", "avatarThumb"]) {
    const v = user[key];
    if (typeof v === "string" && v.length > 0) return v;
  }
  for (const key of ["avatar_larger", "avatar_medium", "avatar_thumb"]) {
    const v = user[key] as { url_list?: string[] } | undefined;
    const url = v?.url_list?.[0];
    if (typeof url === "string" && url.length > 0) return url;
  }
  return "";
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Ambil profil TikTok berdasarkan username.
 *
 * @example
 * const profile = await fetchTikTokProfile("charlidamelio");
 * console.log(profile.followerCount); // 153000000
 */
export async function fetchTikTokProfile(
  username: string
): Promise<TikTokProfile> {
  const result = await ensembleGet("/user/info", { username });
  const data = result.data as {
    user?: Record<string, unknown>;
    stats?: Record<string, number>;
  } | null;

  if (!data?.user) {
    throw new ProviderNotFoundError("TikTok", username);
  }

  const user = data.user;
  const stats = data.stats ?? {};

  return {
    uniqueId: String(user.uniqueId ?? user.unique_id ?? username),
    nickname: String(user.nickname ?? username),
    avatarUrl: pickAvatarUrl(user),
    bio: String(user.signature ?? ""),
    verified: Boolean(user.verified),
    followerCount: Number(stats.followerCount ?? stats.fans ?? user.followerCount ?? 0),
    followingCount: Number(stats.followingCount ?? user.followingCount ?? 0),
    heartCount: Number(stats.heartCount ?? stats.diggCount ?? user.heartCount ?? 0),
    videoCount: Number(stats.videoCount ?? user.videoCount ?? 0),
    friendCount: Number(stats.friendCount ?? user.friendCount ?? 0),
  };
}

/**
 * Ambil daftar video TikTok milik user.
 *
 * @param username  - TikTok username tanpa @
 * @param depth     - Jumlah halaman yang diambil (default 10 → ~90-100 video)
 *
 * @example
 * const videos = await fetchTikTokVideos("charlidamelio", 5);
 * console.log(videos.length); // ~45-50 video
 */
export async function fetchTikTokVideos(
  username: string,
  depth = DEFAULT_DEPTH
): Promise<{ videos: TikTokVideo[]; authorStatsOverride: Partial<TikTokProfile> }> {
  const result = await ensembleGet("/user/posts", {
    username,
    depth: String(depth),
  });

  const data = result.data as { videos?: unknown[]; cursor?: unknown } | null;
  const rawVideos: unknown[] = data?.videos ?? (Array.isArray(result.data) ? (result.data as unknown[]) : []);

  let authorStatsOverride: Partial<TikTokProfile> = {};

  const videos: TikTokVideo[] = rawVideos.map((v) => {
    const item = v as Record<string, unknown>;
    const author = item.author as Record<string, unknown> | undefined;
    const stats = item.stats as Record<string, unknown> | undefined;
    const music = item.music as Record<string, unknown> | undefined;

    // Gunakan stats dari video untuk override profil (lebih akurat)
    if (author) {
      const authorStats = author.stats as Record<string, unknown> | undefined;
      if (authorStats) {
        authorStatsOverride = {
          followerCount: Number(authorStats.followerCount ?? authorStats.fans ?? 0) || undefined,
          heartCount: Number(authorStats.heartCount ?? authorStats.diggCount ?? 0) || undefined,
          videoCount: Number(authorStats.videoCount ?? 0) || undefined,
        } as Partial<TikTokProfile>;
      }
    }

    const video = item.video as Record<string, unknown> | undefined;
    const coverUrls = (video?.cover as { url_list?: string[] } | undefined)?.url_list ?? [];

    return {
      id: String(item.id ?? item.aweme_id ?? ""),
      description: String(item.desc ?? item.description ?? ""),
      createTime: Number(item.createTime ?? item.create_time ?? 0),
      coverUrl: typeof video?.cover === "string" ? video.cover : (coverUrls[0] ?? ""),
      videoUrl: String((video?.playAddr as { url_list?: string[] } | undefined)?.url_list?.[0] ?? ""),
      playCount: Number(stats?.playCount ?? stats?.play_count ?? 0),
      diggCount: Number(stats?.diggCount ?? stats?.digg_count ?? 0),
      commentCount: Number(stats?.commentCount ?? stats?.comment_count ?? 0),
      shareCount: Number(stats?.shareCount ?? stats?.share_count ?? 0),
      collectCount: Number(stats?.collectCount ?? stats?.collect_count ?? 0),
      durationSeconds: Number(video?.duration ?? music?.duration ?? 0),
    };
  });

  return { videos, authorStatsOverride };
}

/**
 * Fetch profil + video sekaligus dalam satu call.
 * Wrapper convenience yang menggabungkan fetchTikTokProfile + fetchTikTokVideos.
 *
 * @example
 * const { profile, videos } = await scrapeTikTokAccount("charlidamelio");
 * console.log(`${profile.nickname}: ${profile.followerCount} followers, ${videos.length} videos`);
 */
export async function scrapeTikTokAccount(
  username: string,
  depth = DEFAULT_DEPTH
): Promise<TikTokFetchResult> {
  const [profile, { videos, authorStatsOverride }] = await Promise.all([
    fetchTikTokProfile(username),
    fetchTikTokVideos(username, depth),
  ]);

  const mergedProfile: TikTokProfile = { ...profile, ...(authorStatsOverride as TikTokProfile) };

  return { profile: mergedProfile, videos };
}

/**
 * Ambil detail satu video TikTok berdasarkan aweme_id (video ID).
 *
 * @example
 * const video = await fetchTikTokVideoDetail("7123456789012345678");
 */
export async function fetchTikTokVideoDetail(awemeId: string): Promise<TikTokVideo> {
  const result = await ensembleGet("/post/info", { aweme_id: awemeId });
  const item = result.data as Record<string, unknown>;
  const stats = item.stats as Record<string, unknown> | undefined;
  const video = item.video as Record<string, unknown> | undefined;
  const coverUrls = (video?.cover as { url_list?: string[] } | undefined)?.url_list ?? [];

  return {
    id: String(item.id ?? item.aweme_id ?? awemeId),
    description: String(item.desc ?? ""),
    createTime: Number(item.createTime ?? item.create_time ?? 0),
    coverUrl: typeof video?.cover === "string" ? video.cover : (coverUrls[0] ?? ""),
    videoUrl: String((video?.playAddr as { url_list?: string[] } | undefined)?.url_list?.[0] ?? ""),
    playCount: Number(stats?.playCount ?? 0),
    diggCount: Number(stats?.diggCount ?? 0),
    commentCount: Number(stats?.commentCount ?? 0),
    shareCount: Number(stats?.shareCount ?? 0),
    collectCount: Number(stats?.collectCount ?? 0),
    durationSeconds: Number(video?.duration ?? 0),
  };
}

/**
 * Cari video berdasarkan hashtag.
 *
 * @example
 * const results = await searchTikTokByHashtag("fyp", "0");
 */
export async function searchTikTokByHashtag(
  hashtag: string,
  cursor = "0"
): Promise<{ videos: unknown[]; nextCursor: string }> {
  const result = await ensembleGet("/hashtag/search", {
    name: hashtag.replace(/^#/, ""),
    cursor,
  });
  const data = result.data as { videos?: unknown[]; cursor?: string } | null;
  return {
    videos: data?.videos ?? [],
    nextCursor: String(data?.cursor ?? "0"),
  };
}
