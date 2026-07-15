/**
 * PILIHAN 2e — Instagram via RapidAPI (instagram-looter2)
 *
 * Provider  : sandro.volpicella
 * Subscribe : https://rapidapi.com/sandro.volpicella/api/instagram-looter2
 * Free tier : Ada
 * Base URL  : https://instagram-looter2.p.rapidapi.com
 *
 * Kelebihan: Endpoint sederhana dan bersih, sangat mudah dipahami
 * Cocok untuk: profil, feed post, reels
 *
 * Env wajib : RAPIDAPI_KEY
 */

import { ProviderUpstreamError } from "../ensembledata/types";

const BASE_URL = "https://instagram-looter2.p.rapidapi.com";
const HOST = "instagram-looter2.p.rapidapi.com";

function getKey(): string {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) throw new ProviderUpstreamError("RAPIDAPI_KEY tidak di-set");
  return key;
}

async function looterGet(path: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "x-rapidapi-key": getKey(),
      "x-rapidapi-host": HOST,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ProviderUpstreamError(`instagram-looter2 error ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

// ─── Endpoint table ───────────────────────────────────────────────────────
// GET /profile?username=nike                    → profil user
// GET /profile-posts?username_or_id=nike&nextMaxId= → posts user (pagination)
// GET /profile-reels?username_or_id=nike&nextMaxId= → reels user
// GET /post-info?link=https://...              → detail post dari URL
// GET /user-stories?username=nike              → stories user
// GET /highlights?username=nike               → highlights user
// GET /tag?tag=fashion&nextMaxId=             → posts berdasarkan hashtag
// GET /location?location_id=ID&nextMaxId=     → posts di lokasi tertentu
// GET /search?query=nike                      → search user

/**
 * Ambil profil Instagram.
 *
 * @example
 * const profile = await looterGetProfile("nike");
 */
export async function looterGetProfile(username: string): Promise<unknown> {
  return looterGet(`/profile?username=${encodeURIComponent(username)}`);
}

/**
 * Ambil posts user dengan pagination.
 *
 * @param usernameOrId - Username atau user ID
 * @param nextMaxId    - Cursor untuk halaman berikutnya (kosong untuk awal)
 *
 * @example
 * const page1 = await looterGetProfilePosts("nike");
 * const page2 = await looterGetProfilePosts("nike", page1.nextMaxId);
 */
export async function looterGetProfilePosts(
  usernameOrId: string,
  nextMaxId = ""
): Promise<{ items: unknown[]; nextMaxId: string; hasMore: boolean }> {
  let path = `/profile-posts?username_or_id=${encodeURIComponent(usernameOrId)}`;
  if (nextMaxId) path += `&nextMaxId=${encodeURIComponent(nextMaxId)}`;

  const raw = (await looterGet(path)) as {
    data?: {
      items?: unknown[];
      next_max_id?: string;
      more_available?: boolean;
    };
    items?: unknown[];
    next_max_id?: string;
    more_available?: boolean;
  };

  const data = raw.data ?? raw;
  return {
    items: (data as Record<string, unknown>).items as unknown[] ?? [],
    nextMaxId: String((data as Record<string, unknown>).next_max_id ?? ""),
    hasMore: Boolean((data as Record<string, unknown>).more_available),
  };
}

/**
 * Ambil semua posts user dengan auto-pagination.
 *
 * @example
 * const allPosts = await looterGetAllPosts("nike", 100);
 */
export async function looterGetAllPosts(
  usernameOrId: string,
  maxPosts = 100
): Promise<unknown[]> {
  const all: unknown[] = [];
  let nextMaxId = "";
  let hasMore = true;

  while (hasMore && all.length < maxPosts) {
    const { items, nextMaxId: next, hasMore: more } = await looterGetProfilePosts(usernameOrId, nextMaxId);
    all.push(...items);
    nextMaxId = next;
    hasMore = more && !!next;
    if (items.length === 0) break;
    await new Promise(r => setTimeout(r, 400));
  }

  return all.slice(0, maxPosts);
}

/**
 * Ambil reels user.
 *
 * @example
 * const reels = await looterGetReels("nike");
 */
export async function looterGetReels(
  usernameOrId: string,
  nextMaxId = ""
): Promise<{ items: unknown[]; nextMaxId: string; hasMore: boolean }> {
  let path = `/profile-reels?username_or_id=${encodeURIComponent(usernameOrId)}`;
  if (nextMaxId) path += `&nextMaxId=${encodeURIComponent(nextMaxId)}`;

  const raw = (await looterGet(path)) as {
    data?: Record<string, unknown>;
    items?: unknown[];
    next_max_id?: string;
    more_available?: boolean;
  };

  const data = (raw.data ?? raw) as Record<string, unknown>;
  return {
    items: (data.items as unknown[]) ?? [],
    nextMaxId: String(data.next_max_id ?? ""),
    hasMore: Boolean(data.more_available),
  };
}

/**
 * Ambil detail post dari URL Instagram lengkap.
 *
 * @example
 * const detail = await looterGetPostInfo("https://www.instagram.com/p/ABC123/");
 */
export async function looterGetPostInfo(postUrl: string): Promise<unknown> {
  return looterGet(`/post-info?link=${encodeURIComponent(postUrl)}`);
}

/**
 * Ambil stories user.
 *
 * @example
 * const stories = await looterGetStories("nike");
 */
export async function looterGetStories(username: string): Promise<unknown> {
  return looterGet(`/user-stories?username=${encodeURIComponent(username)}`);
}

/**
 * Ambil highlights user.
 *
 * @example
 * const highlights = await looterGetHighlights("nike");
 */
export async function looterGetHighlights(username: string): Promise<unknown> {
  return looterGet(`/highlights?username=${encodeURIComponent(username)}`);
}

/**
 * Cari post berdasarkan hashtag.
 *
 * @example
 * const posts = await looterGetTagPosts("sneakers");
 * const page2 = await looterGetTagPosts("sneakers", posts.nextMaxId);
 */
export async function looterGetTagPosts(
  tag: string,
  nextMaxId = ""
): Promise<{ items: unknown[]; nextMaxId: string }> {
  let path = `/tag?tag=${encodeURIComponent(tag.replace(/^#/, ""))}`;
  if (nextMaxId) path += `&nextMaxId=${encodeURIComponent(nextMaxId)}`;

  const raw = (await looterGet(path)) as { items?: unknown[]; next_max_id?: string };
  return {
    items: raw.items ?? [],
    nextMaxId: String(raw.next_max_id ?? ""),
  };
}

/**
 * Search user berdasarkan query.
 *
 * @example
 * const results = await looterSearchUser("nike shoes");
 */
export async function looterSearchUser(query: string): Promise<unknown> {
  return looterGet(`/search?query=${encodeURIComponent(query)}`);
}
