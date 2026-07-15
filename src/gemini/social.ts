/**
 * GRATIS (dengan API key, free tier) — TikTok & Instagram via Gemini + Google Search
 *
 * Gemini 2.5 Flash dengan Google Search grounding melakukan pencarian Google
 * secara real-time dan mengekstrak data profil dari hasil pencarian.
 * Lebih segar dari Perplexity karena langsung search Google (bukan indeks cached).
 *
 * API key      : GEMINI_API_KEY di .env
 * Daftar free  : https://aistudio.google.com → Get API key
 * Harga        : Free tier tersedia (terbatas), paid tier lebih reliable
 * Model        : gemini-2.5-flash (paling efisien untuk task ini)
 *
 * ─────────────────────────────────────────────────────────────
 * CONFIRMED WORKS (diuji langsung Juli 2026):
 *   Instagram profil via Google Search grounding ✅
 *   TikTok profil via Google Search grounding ✅
 *
 * YANG TIDAK WORKS:
 *   url_context untuk Instagram → URL_RETRIEVAL_STATUS_ERROR (Instagram block) ❌
 *   url_context untuk TikTok   → URL_RETRIEVAL_STATUS_ERROR (TikTok block) ❌
 *   gemini-2.5-flash-lite → "no longer available to new users" ❌
 *
 * KETERBATASAN:
 *   - Data bisa 1–7 hari stale (dari Google's search index)
 *   - following_count dan video_count kadang 0 (tidak konsisten terindeks)
 *   - bio lebih sering terisi dibanding Perplexity (Google punya snippet lebih kaya)
 *   - Free tier: ~15 request/menit, kuota harian terbatas
 *   - Akun private tidak tersedia
 * ─────────────────────────────────────────────────────────────
 */

import * as dotenv from "dotenv";
dotenv.config();

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_MODEL = "gemini-2.5-flash";

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY tidak ditemukan di .env\n" +
      "Daftar gratis di https://aistudio.google.com → Get API key"
    );
  }
  return key;
}

async function geminiSearch(prompt: string, maxOutputTokens = 1024): Promise<string> {
  const url = `${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${getApiKey()}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: [{ google_search: {} }],
      generationConfig: { maxOutputTokens },
    }),
  });

  const json = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      groundingMetadata?: { webSearchQueries?: string[] };
    }>;
    error?: { code: number; message: string };
  };

  if (json.error) {
    if (json.error.code === 429) {
      throw new Error(
        `Gemini: quota habis (free tier). Coba lagi setelah beberapa menit, ` +
        `atau aktifkan billing di https://aistudio.google.com. ` +
        `Error: ${json.error.message.slice(0, 100)}`
      );
    }
    throw new Error(`Gemini error (${json.error.code}): ${json.error.message.slice(0, 200)}`);
  }

  const parts = json.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map(p => p.text ?? "").join("").trim();
  if (!text) throw new Error("Gemini: response kosong atau tidak ada teks");
  return text;
}

/** Ekstrak JSON dari respons yang mungkin ada markdown code block */
function extractJson(raw: string): string {
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) return match[1].trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1) return raw.slice(start, end + 1);
  return raw.trim();
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GeminiIGProfile {
  username: string;
  full_name: string;
  follower_count: number;
  following_count: number;
  post_count: number;
  bio: string;
  is_verified: boolean;
  /** ⚠️ Data dari Google Search grounding. Mungkin 1–7 hari stale. */
  _data_note: "google-search-grounding";
}

export interface GeminiTTProfile {
  username: string;
  full_name: string;
  follower_count: number;
  following_count: number;
  /** Total likes/hearts semua video */
  likes_count: number;
  video_count: number;
  bio: string;
  is_verified: boolean;
  /** ⚠️ Data dari Google Search grounding. Mungkin 1–7 hari stale. */
  _data_note: "google-search-grounding";
}

// ─── Functions ────────────────────────────────────────────────────────────────

/**
 * Ambil profil Instagram menggunakan Gemini + Google Search grounding.
 * CONFIRMED WORKS — diuji Juli 2026 ✅
 *
 * Gemini akan otomatis mencari Google untuk mendapatkan data terbaru.
 * Lebih segar dari Perplexity karena langsung hit Google Search.
 *
 * @param username - Username Instagram (tanpa @). Contoh: "nike", "leomessi"
 *
 * @example
 * const profile = await geminiInstagramProfile("therock");
 * console.log(profile.follower_count, profile.bio);
 * // → 382961360, "raising daughters 💪🏾🤎"
 */
export async function geminiInstagramProfile(username: string): Promise<GeminiIGProfile> {
  const prompt =
    `Search for current stats of Instagram account @${username}. ` +
    `Return ONLY compact JSON (no markdown, no spaces, no explanation): ` +
    `{"username":"${username}","full_name":"","follower_count":0,"following_count":0,"post_count":0,"bio":"","is_verified":false}`;

  const raw = await geminiSearch(prompt, 1024);
  const parsed = JSON.parse(extractJson(raw)) as Omit<GeminiIGProfile, "_data_note">;

  return { ...parsed, _data_note: "google-search-grounding" };
}

/**
 * Ambil profil TikTok menggunakan Gemini + Google Search grounding.
 * CONFIRMED WORKS — diuji Juli 2026 ✅
 *
 * @param username - Username TikTok (tanpa @). Contoh: "charlidamelio", "khaby.lame"
 *
 * @example
 * const profile = await geminiTikTokProfile("khaby.lame");
 * console.log(profile.follower_count, profile.bio);
 * // → 162300000, "Silent-comedy content creator..."
 */
export async function geminiTikTokProfile(username: string): Promise<GeminiTTProfile> {
  const prompt =
    `Search for current stats of TikTok account @${username}. ` +
    `Return ONLY compact JSON (no markdown, no spaces, no explanation): ` +
    `{"username":"${username}","full_name":"","follower_count":0,"following_count":0,"likes_count":0,"video_count":0,"bio":"","is_verified":false}`;

  const raw = await geminiSearch(prompt, 1024);
  const parsed = JSON.parse(extractJson(raw)) as Omit<GeminiTTProfile, "_data_note">;

  return { ...parsed, _data_note: "google-search-grounding" };
}
