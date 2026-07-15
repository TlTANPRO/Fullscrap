/**
 * PILIHAN 6 — Instagram Graph API (Official Meta API)
 *
 * Ini adalah API RESMI dari Meta untuk business/creator accounts.
 * Hanya bisa mengakses data AKUN SENDIRI yang terhubung, bukan akun orang lain.
 *
 * Docs   : https://developers.facebook.com/docs/instagram-api
 * Daftar : https://developers.facebook.com/apps/
 *
 * REQUIREMENTS:
 * - Akun Instagram harus Business atau Creator (bukan Personal)
 * - Harus connect ke Facebook Page
 * - Buat Facebook App di developers.facebook.com
 * - Minta permission: instagram_basic, instagram_content_publish,
 *   instagram_manage_insights, pages_show_list
 *
 * Gunakan kasus:
 * - Akses insight/analytics akun sendiri
 * - Publish konten otomatis
 * - Kelola komentar di post sendiri
 * - Data akun sendiri (bukan scraping akun orang lain)
 *
 * Env wajib : INSTAGRAM_ACCESS_TOKEN (Long-lived user access token)
 *             INSTAGRAM_USER_ID      (Numeric Instagram user ID)
 */

import { ProviderUpstreamError } from "../ensembledata/types";

const BASE_URL = "https://graph.instagram.com/v20.0";

function getToken(): string {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) throw new ProviderUpstreamError(
    "INSTAGRAM_ACCESS_TOKEN tidak di-set. " +
    "Generate di: https://developers.facebook.com/tools/explorer/"
  );
  return token;
}

function getUserId(): string {
  const id = process.env.INSTAGRAM_USER_ID;
  if (!id) throw new ProviderUpstreamError("INSTAGRAM_USER_ID tidak di-set");
  return id;
}

async function graphGet(path: string, extraParams: Record<string, string> = {}): Promise<unknown> {
  const params = new URLSearchParams({ access_token: getToken(), ...extraParams });
  const url = `${BASE_URL}${path}?${params.toString()}`;

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ProviderUpstreamError(`Instagram Graph API error ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

// ─── Akun Sendiri ────────────────────────────────────────────────────────

/**
 * Ambil info profil akun sendiri.
 * Field yang bisa diminta: id, username, name, biography, followers_count,
 * follows_count, media_count, profile_picture_url, website
 *
 * @example
 * const me = await igGraphGetMe();
 * console.log(me.username, me.followers_count);
 */
export async function igGraphGetMe(
  fields = "id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url,website"
): Promise<{
  id: string;
  username: string;
  name: string;
  biography: string;
  followers_count: number;
  follows_count: number;
  media_count: number;
  profile_picture_url: string;
  website: string;
}> {
  const userId = getUserId();
  const raw = await graphGet(`/${userId}`, { fields });
  return raw as ReturnType<typeof igGraphGetMe>;
}

/**
 * Ambil daftar media (post) akun sendiri.
 * Field: id, caption, media_type, media_url, thumbnail_url, timestamp,
 *        like_count, comments_count, permalink, shortcode
 *
 * @example
 * const { data, paging } = await igGraphGetMedia();
 * // Halaman berikutnya:
 * const next = await igGraphGetMediaCursor(paging.cursors.after);
 */
export async function igGraphGetMedia(
  fields = "id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count,permalink,shortcode",
  limit = 25
): Promise<{
  data: unknown[];
  paging: { cursors: { before: string; after: string }; next?: string };
}> {
  const userId = getUserId();
  const raw = await graphGet(`/${userId}/media`, { fields, limit: String(limit) });
  return raw as ReturnType<typeof igGraphGetMedia>;
}

/**
 * Ambil halaman media berikutnya menggunakan cursor.
 *
 * @example
 * const page1 = await igGraphGetMedia();
 * const page2 = await igGraphGetMediaCursor(page1.paging.cursors.after);
 */
export async function igGraphGetMediaCursor(
  afterCursor: string,
  fields = "id,caption,media_type,timestamp,like_count,comments_count,permalink",
  limit = 25
): Promise<{ data: unknown[]; paging: unknown }> {
  const userId = getUserId();
  const raw = await graphGet(`/${userId}/media`, {
    fields,
    limit: String(limit),
    after: afterCursor,
  });
  return raw as ReturnType<typeof igGraphGetMediaCursor>;
}

/**
 * Ambil insights (analitik) post tertentu.
 * Metric yang tersedia: impressions, reach, engagement, saved, video_views
 *
 * @example
 * const insights = await igGraphGetMediaInsights("17854360229135492");
 */
export async function igGraphGetMediaInsights(
  mediaId: string,
  metric = "impressions,reach,engagement,saved,video_views"
): Promise<{ data: Array<{ name: string; period: string; values: unknown[]; title: string }> }> {
  const raw = await graphGet(`/${mediaId}/insights`, { metric });
  return raw as ReturnType<typeof igGraphGetMediaInsights>;
}

/**
 * Ambil insights akun (account-level analytics).
 * Metric: follower_count, reach, impressions, profile_views, website_clicks
 * Period: day | week | month | lifetime
 *
 * @example
 * const accountInsights = await igGraphGetAccountInsights("day", "follower_count,reach,impressions");
 */
export async function igGraphGetAccountInsights(
  period = "day",
  metric = "follower_count,reach,impressions,profile_views,website_clicks"
): Promise<unknown> {
  const userId = getUserId();
  return graphGet(`/${userId}/insights`, { metric, period });
}

/**
 * Ambil komentar sebuah post.
 *
 * @example
 * const comments = await igGraphGetComments("17854360229135492");
 */
export async function igGraphGetComments(mediaId: string): Promise<{
  data: Array<{ id: string; text: string; timestamp: string; username?: string }>;
  paging: unknown;
}> {
  const raw = await graphGet(`/${mediaId}/comments`, {
    fields: "id,text,timestamp,username,like_count,replies",
  });
  return raw as ReturnType<typeof igGraphGetComments>;
}

/**
 * Ambil data story akun sendiri.
 *
 * @example
 * const stories = await igGraphGetStories();
 */
export async function igGraphGetStories(
  fields = "id,media_type,media_url,timestamp"
): Promise<{ data: unknown[] }> {
  const userId = getUserId();
  const raw = await graphGet(`/${userId}/stories`, { fields });
  return raw as ReturnType<typeof igGraphGetStories>;
}

/**
 * Cara mendapatkan Access Token:
 *
 * 1. Buka: https://developers.facebook.com/tools/explorer/
 * 2. Pilih app Anda
 * 3. Add permissions: instagram_basic, instagram_manage_insights, pages_show_list
 * 4. Klik "Generate Access Token"
 * 5. Exchange ke Long-Lived Token (berlaku 60 hari):
 *
 * @example
 * const longLived = await igGraphExchangeToken("SHORT_LIVED_TOKEN");
 * // Simpan longLived.access_token dan longLived.expires_in
 */
export async function igGraphExchangeToken(shortLivedToken: string): Promise<{
  access_token: string;
  token_type: string;
  expires_in: number;
}> {
  const appId = process.env.INSTAGRAM_APP_ID;
  const appSecret = process.env.INSTAGRAM_APP_SECRET;
  if (!appId || !appSecret) throw new ProviderUpstreamError("INSTAGRAM_APP_ID / INSTAGRAM_APP_SECRET tidak di-set");

  const params = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: appSecret,
    access_token: shortLivedToken,
  });
  const res = await fetch(`https://graph.instagram.com/access_token?${params.toString()}`);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ProviderUpstreamError(`Token exchange error ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<ReturnType<typeof igGraphExchangeToken>>;
}
