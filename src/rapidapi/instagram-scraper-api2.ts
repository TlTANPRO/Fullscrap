/**
 * PILIHAN 2b — Instagram via RapidAPI (instagram-scraper-api2)
 *
 * Provider  : dreaded_spin
 * Subscribe : https://rapidapi.com/dreaded_spin/api/instagram-scraper-api2
 * Free tier : Ada (basic plan, rate limited)
 * Base URL  : https://instagram-scraper-api2.p.rapidapi.com
 *
 * Env wajib : RAPIDAPI_KEY
 */

import { InstagramProfile, InstagramPost, ProviderUpstreamError } from "../ensembledata/types";

const BASE_URL = "https://instagram-scraper-api2.p.rapidapi.com";
const HOST = "instagram-scraper-api2.p.rapidapi.com";

function getKey(): string {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) throw new ProviderUpstreamError("RAPIDAPI_KEY tidak di-set di environment variables");
  return key;
}

async function rapidGet(path: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "x-rapidapi-key": getKey(),
      "x-rapidapi-host": HOST,
    },
  });

  if (!res.ok) {
    let errBody = "";
    try { errBody = await res.text(); } catch { /* noop */ }
    throw new ProviderUpstreamError(
      `RapidAPI instagram-scraper-api2 error ${res.status}: ${errBody.slice(0, 200)}`
    );
  }

  return res.json();
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Ambil profil Instagram + 12 post terbaru.
 * Parameter bisa berupa username, user_id, atau URL profil.
 *
 * @example
 * const { profile, posts } = await getInstagramInfo("nike");
 * // Atau dengan URL:
 * const { profile } = await getInstagramInfo("https://www.instagram.com/nike/");
 */
export async function getInstagramInfo(
  usernameOrIdOrUrl: string
): Promise<{ profile: InstagramProfile; recentPosts: InstagramPost[] }> {
  const raw = (await rapidGet(
    `/v1/info?username_or_id_or_url=${encodeURIComponent(usernameOrIdOrUrl)}`
  )) as { data?: Record<string, unknown> };

  const data = raw.data ?? {};
  const user = ((data.user ?? data) as Record<string, unknown>);

  const profile: InstagramProfile = {
    userId: String(user.pk ?? user.id ?? ""),
    username: String(user.username ?? usernameOrIdOrUrl),
    fullName: String(user.full_name ?? ""),
    profilePicUrl: String(user.profile_pic_url_hd ?? user.profile_pic_url ?? ""),
    biography: String(user.biography ?? ""),
    verified: Boolean(user.is_verified),
    followerCount: Number(user.follower_count ?? user.edge_followed_by?.count ?? 0),
    followingCount: Number(user.following_count ?? user.edge_follow?.count ?? 0),
    postCount: Number(user.media_count ?? user.edge_owner_to_timeline_media?.count ?? 0),
    externalUrl: String(user.external_url ?? ""),
  };

  const rawPosts = ((data.edge_owner_to_timeline_media as { edges?: unknown[] } | undefined)?.edges ?? []) as Array<{ node?: Record<string, unknown> }>;
  const recentPosts = rawPosts.map((edge) => normalizeRapidApiPost(edge.node ?? {}));

  return { profile, recentPosts };
}

/**
 * Ambil semua post user (dengan pagination).
 * Parameter bisa berupa username, user_id, atau URL profil.
 *
 * @param usernameOrIdOrUrl - Username / ID / URL Instagram
 * @param pageId            - Pagination cursor (kosong untuk awal)
 *
 * @example
 * // Halaman pertama
 * const page1 = await getInstagramPosts("nike");
 * // Halaman berikutnya
 * const page2 = await getInstagramPosts("nike", page1.nextPageId);
 */
export async function getInstagramPosts(
  usernameOrIdOrUrl: string,
  pageId = ""
): Promise<{ posts: InstagramPost[]; nextPageId: string; hasMore: boolean }> {
  let path = `/v1/posts?username_or_id_or_url=${encodeURIComponent(usernameOrIdOrUrl)}`;
  if (pageId) path += `&page_id=${encodeURIComponent(pageId)}`;

  const raw = (await rapidGet(path)) as {
    data?: {
      data?: { node?: Record<string, unknown> }[];
      page_info?: { has_next_page?: boolean; end_cursor?: string };
    };
  };

  const edges = raw.data?.data ?? [];
  const pageInfo = raw.data?.page_info ?? {};

  const posts = edges.map((edge) => normalizeRapidApiPost(edge.node ?? {}));

  return {
    posts,
    nextPageId: String(pageInfo.end_cursor ?? ""),
    hasMore: Boolean(pageInfo.has_next_page),
  };
}

/**
 * Ambil semua post dengan auto-pagination hingga batas maxPosts.
 *
 * @example
 * const allPosts = await getAllInstagramPosts("nike", 100);
 */
export async function getAllInstagramPosts(
  usernameOrIdOrUrl: string,
  maxPosts = 100
): Promise<InstagramPost[]> {
  const allPosts: InstagramPost[] = [];
  let pageId = "";
  let hasMore = true;

  while (hasMore && allPosts.length < maxPosts) {
    const { posts, nextPageId, hasMore: more } = await getInstagramPosts(usernameOrIdOrUrl, pageId);
    allPosts.push(...posts);
    pageId = nextPageId;
    hasMore = more;

    if (posts.length === 0 || !pageId) break;

    // Rate limit protection
    await new Promise(r => setTimeout(r, 500));
  }

  return allPosts.slice(0, maxPosts);
}

/**
 * Ambil reels user.
 *
 * @example
 * const reels = await getInstagramReels("nike");
 */
export async function getInstagramReels(
  usernameOrIdOrUrl: string,
  pageId = ""
): Promise<{ posts: InstagramPost[]; nextPageId: string }> {
  let path = `/v1/reels?username_or_id_or_url=${encodeURIComponent(usernameOrIdOrUrl)}`;
  if (pageId) path += `&page_id=${encodeURIComponent(pageId)}`;

  const raw = (await rapidGet(path)) as {
    data?: {
      data?: { node?: Record<string, unknown> }[];
      page_info?: { end_cursor?: string };
    };
  };

  const edges = raw.data?.data ?? [];
  const posts = edges.map((edge) => normalizeRapidApiPost(edge.node ?? {}));

  return {
    posts,
    nextPageId: String(raw.data?.page_info?.end_cursor ?? ""),
  };
}

/**
 * Ambil stories aktif user.
 *
 * @example
 * const stories = await getInstagramStories("nike");
 */
export async function getInstagramStories(usernameOrIdOrUrl: string): Promise<unknown> {
  return rapidGet(`/v1/stories?username_or_id_or_url=${encodeURIComponent(usernameOrIdOrUrl)}`);
}

/**
 * Ambil daftar following user.
 *
 * @example
 * const following = await getInstagramFollowing("nike");
 */
export async function getInstagramFollowing(
  usernameOrIdOrUrl: string,
  pageId = ""
): Promise<unknown> {
  let path = `/v1/following?username_or_id_or_url=${encodeURIComponent(usernameOrIdOrUrl)}`;
  if (pageId) path += `&page_id=${encodeURIComponent(pageId)}`;
  return rapidGet(path);
}

/**
 * Ambil highlights user.
 *
 * @example
 * const highlights = await getInstagramHighlights("nike");
 */
export async function getInstagramHighlights(usernameOrIdOrUrl: string): Promise<unknown> {
  return rapidGet(`/v1/highlights?username_or_id_or_url=${encodeURIComponent(usernameOrIdOrUrl)}`);
}

// ─── Internal ───────────────────────────────────────────────────────────────

function normalizeRapidApiPost(node: Record<string, unknown>): InstagramPost {
  const edgeCaption = node.edge_media_to_caption as {
    edges?: { node?: { text?: string } }[];
  } | undefined;

  const caption = String(
    edgeCaption?.edges?.[0]?.node?.text ??
    (node.caption as { text?: string } | undefined)?.text ??
    node.caption_text ??
    ""
  );

  const edgeLike = node.edge_liked_by as { count?: number } | undefined;
  const edgePreviewLike = node.edge_media_preview_like as { count?: number } | undefined;
  const likeCount = Number(edgeLike?.count ?? edgePreviewLike?.count ?? node.like_count ?? 0);

  const edgeComment = node.edge_media_to_comment as { count?: number } | undefined;
  const commentCount = Number(edgeComment?.count ?? node.comment_count ?? 0);

  const typename = String(node.__typename ?? "");
  let mediaType = "image";
  if (typename.includes("Video") || node.is_video) mediaType = "video";
  else if (typename.includes("Sidecar")) mediaType = "carousel";

  const shortcode = String(node.shortcode ?? node.code ?? "");

  return {
    id: String(node.id ?? node.pk ?? ""),
    caption,
    createTime: Number(node.taken_at_timestamp ?? node.taken_at ?? node.timestamp ?? 0),
    thumbnailUrl: String(node.display_url ?? node.thumbnail_url ?? ""),
    postUrl: shortcode ? `https://www.instagram.com/p/${shortcode}/` : "",
    mediaType,
    likeCount,
    commentCount,
    viewCount: Number(node.video_view_count ?? node.play_count ?? 0),
    saveCount: 0,
    durationSeconds: Number(node.video_duration ?? 0),
  };
}
