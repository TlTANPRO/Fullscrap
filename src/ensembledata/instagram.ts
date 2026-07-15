/**
 * PILIHAN 1 — Instagram via EnsembleData
 *
 * EnsembleData menyediakan API bersih untuk Instagram.
 *
 * Base URL  : https://ensembledata.com/apis/instagram
 * Docs      : https://ensembledata.com/apis#instagram
 * Dashboard : https://dashboard.ensembledata.com
 *
 * Env wajib : ENSEMBLEDATA_API_TOKEN
 *
 * PENTING: Endpoint posts/reels memerlukan user_id numerik (bukan username).
 *          Selalu ambil profil dulu, lalu gunakan profile.userId untuk posts.
 */

import {
  InstagramProfile,
  InstagramPost,
  InstagramFetchResult,
  ProviderNotFoundError,
  ProviderUpstreamError,
} from "./types";

const ENSEMBLE_BASE_URL = "https://ensembledata.com/apis/instagram";

// Jumlah halaman pagination. Setiap depth ~12 posts.
// depth=8 → ~96 post terakhir (cukup untuk analisis)
export const DEFAULT_DEPTH = 8;

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
      throw new ProviderNotFoundError(
        "Instagram",
        params.username ?? params.user_id ?? "unknown"
      );
    }
    let errBody = "";
    try { errBody = await res.text(); } catch { /* noop */ }
    throw new ProviderUpstreamError(
      `EnsembleData Instagram API error ${res.status}: ${errBody.slice(0, 200)}`
    );
  }

  return res.json() as Promise<{ data: unknown }>;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Ambil profil Instagram berdasarkan username.
 * Response mengandung user_id (field `pk` atau `id`) yang diperlukan untuk fetch posts.
 *
 * @example
 * const profile = await fetchInstagramProfile("nike");
 * console.log(profile.userId);       // "167224140"
 * console.log(profile.followerCount); // 300000000
 */
export async function fetchInstagramProfile(
  username: string
): Promise<InstagramProfile> {
  const result = await ensembleGet("/user/info", { username });
  const raw = result.data as Record<string, unknown> | null;

  if (!raw) throw new ProviderNotFoundError("Instagram", username);

  // EnsembleData kadang membungkus di .user, kadang langsung
  const user = ((raw.user ?? raw) as Record<string, unknown>);

  if (!user.username && !user.pk) {
    throw new ProviderNotFoundError("Instagram", username);
  }

  const edgeFollowedBy = user.edge_followed_by as { count?: number } | undefined;
  const edgeFollow = user.edge_follow as { count?: number } | undefined;
  const edgeMedia = user.edge_owner_to_timeline_media as { count?: number } | undefined;

  return {
    userId: String(user.pk ?? user.id ?? user.user_id ?? ""),
    username: String(user.username ?? username),
    fullName: String(user.full_name ?? ""),
    profilePicUrl: String(user.profile_pic_url_hd ?? user.profile_pic_url ?? ""),
    biography: String(user.biography ?? ""),
    verified: Boolean(user.is_verified ?? user.verified),
    followerCount: Number(
      edgeFollowedBy?.count ?? user.follower_count ?? user.followers ?? 0
    ),
    followingCount: Number(
      edgeFollow?.count ?? user.following_count ?? user.following ?? 0
    ),
    postCount: Number(
      edgeMedia?.count ?? user.media_count ?? user.post_count ?? 0
    ),
    externalUrl: String(user.external_url ?? ""),
  };
}

/**
 * Ambil daftar posts Instagram milik user.
 *
 * PENTING: Gunakan userId (numerik) dari fetchInstagramProfile(), bukan username.
 *
 * @param userId  - User ID numerik (dari profile.userId)
 * @param depth   - Jumlah halaman (default 8 → ~96 post)
 *
 * @example
 * const profile = await fetchInstagramProfile("nike");
 * const { posts } = await fetchInstagramPosts(profile.userId, 8);
 */
export async function fetchInstagramPosts(
  userId: string,
  depth = DEFAULT_DEPTH
): Promise<{
  posts: InstagramPost[];
  authorStatsOverride: Partial<InstagramProfile>;
}> {
  const result = await ensembleGet("/user/posts", {
    user_id: userId,
    depth: String(depth),
  });

  const data = result.data as {
    data?: unknown[];
    count?: number;
    owner?: Record<string, unknown>;
  } | null;

  const rawPosts: unknown[] = data?.data ?? (Array.isArray(result.data) ? (result.data as unknown[]) : []);

  let authorStatsOverride: Partial<InstagramProfile> = {};
  if (data?.owner) {
    const owner = data.owner;
    authorStatsOverride = {
      followerCount: Number((owner.edge_followed_by as { count?: number } | undefined)?.count ?? owner.follower_count ?? 0) || undefined,
      postCount: Number((owner.edge_owner_to_timeline_media as { count?: number } | undefined)?.count ?? owner.media_count ?? 0) || undefined,
    } as Partial<InstagramProfile>;
  }

  const posts: InstagramPost[] = rawPosts.map((p) => {
    const item = p as Record<string, unknown>;
    const node = ((item.node ?? item) as Record<string, unknown>);
    const shortcode = String(node.shortcode ?? node.code ?? "");

    // Caption
    const edgeCaption = node.edge_media_to_caption as {
      edges?: { node?: { text?: string } }[];
    } | undefined;
    const caption =
      String(
        edgeCaption?.edges?.[0]?.node?.text ??
        node.caption ??
        ""
      );

    // Like count
    const edgeLike = node.edge_liked_by as { count?: number } | undefined;
    const edgePreviewLike = node.edge_media_preview_like as { count?: number } | undefined;
    const likeCount = Number(
      edgeLike?.count ?? edgePreviewLike?.count ?? node.like_count ?? 0
    );

    // Comment count
    const edgeComment = node.edge_media_to_comment as { count?: number } | undefined;
    const commentCount = Number(edgeComment?.count ?? node.comment_count ?? 0);

    // Media type
    const typename = String(node.__typename ?? node.media_type ?? "");
    let mediaType = "image";
    if (typename.includes("Video") || node.is_video) mediaType = "video";
    else if (typename.includes("Sidecar") || node.product_type === "carousel_container") mediaType = "carousel";

    // Thumbnail
    const resources = node.thumbnail_resources as { src?: string; config_width?: number }[] | undefined;
    const thumbnailUrl = String(
      node.thumbnail_url ??
      node.display_url ??
      resources?.find(r => (r.config_width ?? 0) >= 320)?.src ??
      resources?.[0]?.src ??
      ""
    );

    return {
      id: String(node.id ?? ""),
      caption,
      createTime: Number(node.taken_at_timestamp ?? node.timestamp ?? node.taken_at ?? 0),
      thumbnailUrl,
      postUrl: shortcode ? `https://www.instagram.com/p/${shortcode}/` : "",
      mediaType,
      likeCount,
      commentCount,
      viewCount: Number(node.video_view_count ?? node.view_count ?? node.play_count ?? 0),
      saveCount: Number(node.save_count ?? 0),
      durationSeconds: Number(node.video_duration ?? node.duration ?? 0),
    };
  });

  return { posts, authorStatsOverride };
}

/**
 * Ambil reels milik user.
 *
 * @param userId  - User ID numerik
 * @param depth   - Jumlah halaman
 *
 * @example
 * const { posts: reels } = await fetchInstagramReels(profile.userId, 5);
 */
export async function fetchInstagramReels(
  userId: string,
  depth = 5
): Promise<{ posts: InstagramPost[] }> {
  const result = await ensembleGet("/user/reels", {
    user_id: userId,
    depth: String(depth),
  });

  const data = result.data as { data?: unknown[] } | null;
  const rawItems: unknown[] = data?.data ?? (Array.isArray(result.data) ? (result.data as unknown[]) : []);

  const posts: InstagramPost[] = rawItems.map((p) => {
    const item = (p as Record<string, unknown>);
    const media = ((item.media ?? item) as Record<string, unknown>);

    return {
      id: String(media.id ?? media.pk ?? ""),
      caption: String(
        (media.caption as { text?: string } | undefined)?.text ??
        media.caption_text ??
        ""
      ),
      createTime: Number(media.taken_at ?? media.timestamp ?? 0),
      thumbnailUrl: String(
        (media.image_versions2 as { candidates?: { url?: string }[] } | undefined)?.candidates?.[0]?.url ??
        media.thumbnail_url ??
        ""
      ),
      postUrl: media.code ? `https://www.instagram.com/reel/${media.code}/` : "",
      mediaType: "video",
      likeCount: Number((media.like_count) ?? 0),
      commentCount: Number(media.comment_count ?? 0),
      viewCount: Number(media.play_count ?? media.view_count ?? 0),
      saveCount: Number(media.save_count ?? 0),
      durationSeconds: Number(media.video_duration ?? 0),
    };
  });

  return { posts };
}

/**
 * Fetch profil + posts sekaligus dalam satu call.
 *
 * @example
 * const { profile, posts } = await scrapeInstagramAccount("nike");
 * console.log(`${profile.fullName}: ${profile.followerCount} followers, ${posts.length} posts`);
 */
export async function scrapeInstagramAccount(
  username: string,
  depth = DEFAULT_DEPTH
): Promise<InstagramFetchResult> {
  const profile = await fetchInstagramProfile(username);
  const { posts, authorStatsOverride } = await fetchInstagramPosts(profile.userId, depth);
  const mergedProfile: InstagramProfile = { ...profile, ...(authorStatsOverride as InstagramProfile) };
  return { profile: mergedProfile, posts };
}

/**
 * Detail satu post berdasarkan shortcode.
 * Shortcode ada di URL post: instagram.com/p/SHORTCODE/
 *
 * @example
 * const post = await fetchInstagramPostDetail("CxYZ123abc");
 */
export async function fetchInstagramPostDetail(
  shortcode: string
): Promise<InstagramPost> {
  const result = await ensembleGet("/post/details", { shortcode });
  const item = ((result.data ?? {}) as Record<string, unknown>);

  const edgeCaption = item.edge_media_to_caption as {
    edges?: { node?: { text?: string } }[];
  } | undefined;

  return {
    id: String(item.id ?? ""),
    caption: String(edgeCaption?.edges?.[0]?.node?.text ?? item.caption ?? ""),
    createTime: Number(item.taken_at_timestamp ?? 0),
    thumbnailUrl: String(item.display_url ?? item.thumbnail_url ?? ""),
    postUrl: `https://www.instagram.com/p/${shortcode}/`,
    mediaType: item.is_video ? "video" : "image",
    likeCount: Number(
      (item.edge_liked_by as { count?: number } | undefined)?.count ??
      item.like_count ??
      0
    ),
    commentCount: Number(
      (item.edge_media_to_comment as { count?: number } | undefined)?.count ??
      item.comment_count ??
      0
    ),
    viewCount: Number(item.video_view_count ?? 0),
    saveCount: 0,
    durationSeconds: Number(item.video_duration ?? 0),
  };
}

/**
 * Cari post berdasarkan hashtag.
 *
 * @example
 * const { posts } = await searchInstagramByHashtag("adidas");
 */
export async function searchInstagramByHashtag(
  hashtag: string,
  cursor = ""
): Promise<{ posts: unknown[]; nextCursor: string }> {
  const params: Record<string, string> = { name: hashtag.replace(/^#/, "") };
  if (cursor) params.cursor = cursor;

  const result = await ensembleGet("/hashtag/posts", params);
  const data = result.data as { data?: unknown[]; end_cursor?: string } | null;

  return {
    posts: data?.data ?? [],
    nextCursor: String(data?.end_cursor ?? ""),
  };
}
