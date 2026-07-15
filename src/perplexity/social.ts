/**
 * GRATIS (dengan API key) — TikTok & Instagram via Perplexity Sonar (OpenRouter)
 *
 * Perplexity Sonar adalah model LLM dengan kemampuan real-time web search.
 * Endpoint ini bisa mengambil data profil TikTok/Instagram dari indeks web
 * tanpa perlu bypass Cloudflare atau session Instagram.
 *
 * Akses via    : OpenRouter API (https://openrouter.ai)
 * API key      : OPENROUTER_API_KEY di .env
 * Harga        : ~$0.001–0.01 per request (bukan gratis, tapi murah)
 * Daftar       : https://openrouter.ai → Settings → Credits
 *
 * ─────────────────────────────────────────────────────────────
 * ENDPOINT & MODEL YANG CONFIRMED WORKS (diuji langsung Juli 2026):
 *   perplexity/sonar          → profil IG & TT, hashtag count ✅
 *   perplexity/sonar-pro      → lebih akurat, sama kemampuannya ✅
 *   perplexity/sonar-pro-search → khusus search, paling akurat ✅
 *
 * KETERBATASAN (penting diketahui):
 *   - Data BUKAN real-time: bersumber dari indeks web, bisa 1–14 hari stale
 *   - following_count & video_count kadang 0 (tidak selalu terindeks Google)
 *   - bio kadang kosong untuk akun besar (jarang muncul di search snippet)
 *   - Tidak bisa ambil data per-video (view/like satu video spesifik)
 *   - Akun private tidak tersedia
 * ─────────────────────────────────────────────────────────────
 */

import * as dotenv from "dotenv";
dotenv.config();

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export type PerplexityModel =
  | "perplexity/sonar"           // cheapest, $1/1M in — cukup untuk profil
  | "perplexity/sonar-pro"       // lebih akurat, $3/1M in
  | "perplexity/sonar-pro-search"; // paling akurat untuk data search

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error(
      "OPENROUTER_API_KEY tidak ditemukan di .env\n" +
      "Daftar di https://openrouter.ai → Settings → API Keys"
    );
  }
  return key;
}

async function sonarQuery(
  prompt: string,
  model: PerplexityModel,
  maxTokens = 600
): Promise<string> {
  const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const json = (await res.json()) as {
    choices?: Array<{ message: { content: string } }>;
    error?: { message: string; code?: number };
  };

  if (json.error) {
    throw new Error(`OpenRouter error (${json.error.code ?? res.status}): ${json.error.message}`);
  }

  const content = json.choices?.[0]?.message?.content ?? "";
  if (!content) throw new Error("Perplexity: response kosong");
  return content;
}

/** Ekstrak JSON dari respons yang mungkin mengandung markdown code block */
function extractJson(raw: string): string {
  // Hapus ```json ... ``` atau ``` ... ```
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) return match[1].trim();
  // Coba langsung parse sebagai JSON
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1) return raw.slice(start, end + 1);
  return raw.trim();
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PerplexityIGProfile {
  username: string;
  full_name: string;
  /** Jumlah follower (mungkin tidak presisi, bersumber dari indeks web) */
  follower_count: number;
  /** Jumlah following (kadang 0 jika tidak terindeks) */
  following_count: number;
  /** Total post (mungkin tidak presisi) */
  post_count: number;
  bio: string;
  is_verified: boolean;
  /** ⚠️ Data bersumber dari indeks web. Mungkin 1–14 hari stale. */
  _data_note: "web-search-index";
}

export interface PerplexityTTProfile {
  username: string;
  full_name: string;
  /** Jumlah follower */
  follower_count: number;
  /** Jumlah following (kadang 0 jika tidak terindeks) */
  following_count: number;
  /** Total likes/hearts di semua video */
  likes_count: number;
  /** Jumlah video (kadang 0 jika tidak terindeks) */
  video_count: number;
  bio: string;
  is_verified: boolean;
  /** ⚠️ Data bersumber dari indeks web. Mungkin 1–14 hari stale. */
  _data_note: "web-search-index";
}

export interface PerplexityHashtagStats {
  hashtag: string;
  /** Perkiraan jumlah post (Instagram) */
  post_count: number;
  /** true = angka ini adalah estimasi */
  approximate: boolean;
  _data_note: "web-search-index";
}

// ─── Functions ────────────────────────────────────────────────────────────────

/**
 * Ambil profil Instagram berdasarkan username.
 * CONFIRMED WORKS — diuji Juli 2026 ✅
 *
 * @param username - Username Instagram (tanpa @). Contoh: "nike", "leomessi"
 * @param model    - Model Perplexity. Default: "perplexity/sonar" (paling murah)
 *
 * @example
 * const profile = await perplexityInstagramProfile("nike");
 * console.log(profile.follower_count, profile.full_name);
 * // → 292000000, "Nike"
 */
export async function perplexityInstagramProfile(
  username: string,
  model: PerplexityModel = "perplexity/sonar"
): Promise<PerplexityIGProfile> {
  const prompt =
    `Current public stats for Instagram account @${username}. ` +
    `Return ONLY valid JSON (no markdown, no explanation): ` +
    `{"username":"${username}","full_name":"","follower_count":0,"following_count":0,"post_count":0,"bio":"","is_verified":false}`;

  const raw = await sonarQuery(prompt, model, 500);
  const parsed = JSON.parse(extractJson(raw)) as Omit<PerplexityIGProfile, "_data_note">;

  return { ...parsed, _data_note: "web-search-index" };
}

/**
 * Ambil profil TikTok berdasarkan username.
 * CONFIRMED WORKS — diuji Juli 2026 ✅
 *
 * @param username - Username TikTok (tanpa @). Contoh: "charlidamelio", "khaby.lame"
 * @param model    - Model Perplexity. Default: "perplexity/sonar"
 *
 * @example
 * const profile = await perplexityTikTokProfile("charlidamelio");
 * console.log(profile.follower_count, profile.is_verified);
 * // → 155800000, true
 */
export async function perplexityTikTokProfile(
  username: string,
  model: PerplexityModel = "perplexity/sonar"
): Promise<PerplexityTTProfile> {
  const prompt =
    `Current public stats for TikTok account @${username}. ` +
    `Return ONLY valid JSON (no markdown, no explanation): ` +
    `{"username":"${username}","full_name":"","follower_count":0,"following_count":0,"likes_count":0,"video_count":0,"bio":"","is_verified":false}`;

  const raw = await sonarQuery(prompt, model, 500);
  const parsed = JSON.parse(extractJson(raw)) as Omit<PerplexityTTProfile, "_data_note">;

  return { ...parsed, _data_note: "web-search-index" };
}

/**
 * Ambil perkiraan jumlah post dari hashtag Instagram.
 * CONFIRMED WORKS — diuji Juli 2026 ✅
 *
 * @param hashtag - Nama hashtag tanpa #. Contoh: "travel", "food", "indonesia"
 * @param model   - Default: "perplexity/sonar"
 *
 * @example
 * const stats = await perplexityInstagramHashtag("travel");
 * console.log(stats.post_count);
 * // → 750000000
 */
export async function perplexityInstagramHashtag(
  hashtag: string,
  model: PerplexityModel = "perplexity/sonar"
): Promise<PerplexityHashtagStats> {
  const prompt =
    `How many posts use Instagram hashtag #${hashtag}? ` +
    `Return ONLY valid JSON (no markdown): ` +
    `{"hashtag":"${hashtag}","post_count":0,"approximate":true}`;

  const raw = await sonarQuery(prompt, model, 300);
  const parsed = JSON.parse(extractJson(raw)) as Omit<PerplexityHashtagStats, "_data_note">;

  return { ...parsed, _data_note: "web-search-index" };
}
