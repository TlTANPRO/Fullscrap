/**
 * TEST: TikTok & Instagram via Gemini + Google Search Grounding — P9
 *
 * Menggunakan Gemini 2.5 Flash dengan Google Search grounding.
 * Gemini akan otomatis mencari Google secara real-time untuk mendapatkan
 * data profil TikTok/Instagram dari hasil pencarian.
 *
 * Setup:
 *   1. Daftar gratis di https://aistudio.google.com → Get API key
 *   2. Tambahkan ke .env:  GEMINI_API_KEY=AIzaSy...
 *
 * Jalankan: npx ts-node examples/test-gemini.ts
 *
 * ⚠️ Free tier sangat terbatas (~15 req/menit, kuota harian kecil)
 * ⚠️ Data mungkin 1–7 hari stale (dari Google Search index)
 */

import "dotenv/config";
import {
  geminiInstagramProfile,
  geminiTikTokProfile,
} from "../src/gemini/social";

async function main() {
  console.log(`\n✨ TikTok & Instagram via Gemini + Google Search Grounding — P9`);
  console.log(`Auth    : GEMINI_API_KEY diperlukan (gratis di aistudio.google.com)`);
  console.log(`Model   : gemini-2.5-flash + google_search tool`);
  console.log(`Status  : Confirmed Works Juli 2026`);
  console.log("─".repeat(60));

  // ── Test 1: Instagram profil ───────────────────────────────────────────────
  const IG_USER = "therock";
  console.log(`\n[1/2] geminiInstagramProfile("${IG_USER}")`);
  const t0 = Date.now();
  try {
    const igProfile = await geminiInstagramProfile(IG_USER);
    console.log(`✅ Berhasil (${Date.now() - t0}ms)`);
    console.log({
      username: igProfile.username,
      full_name: igProfile.full_name,
      follower_count: igProfile.follower_count?.toLocaleString(),
      following_count: igProfile.following_count,
      post_count: igProfile.post_count,
      bio: igProfile.bio || "(kosong)",
      is_verified: igProfile.is_verified,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("quota")) {
      console.log(`⚠️ Quota habis (${Date.now() - t0}ms): ${msg.slice(0, 100)}`);
      console.log("  Solusi: tunggu beberapa menit atau aktifkan billing.");
    } else {
      console.log(`❌ Error (${Date.now() - t0}ms): ${msg}`);
    }
  }

  // Delay untuk hindari rate limit free tier
  await new Promise(r => setTimeout(r, 3000));

  // ── Test 2: TikTok profil ──────────────────────────────────────────────────
  const TT_USER = "khaby.lame";
  console.log(`\n[2/2] geminiTikTokProfile("${TT_USER}")`);
  const t1 = Date.now();
  try {
    const ttProfile = await geminiTikTokProfile(TT_USER);
    console.log(`✅ Berhasil (${Date.now() - t1}ms)`);
    console.log({
      username: ttProfile.username,
      full_name: ttProfile.full_name,
      follower_count: ttProfile.follower_count?.toLocaleString(),
      following_count: ttProfile.following_count,
      likes_count: ttProfile.likes_count?.toLocaleString(),
      video_count: ttProfile.video_count,
      bio: ttProfile.bio || "(kosong)",
      is_verified: ttProfile.is_verified,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("quota")) {
      console.log(`⚠️ Quota habis (${Date.now() - t1}ms): ${msg.slice(0, 100)}`);
      console.log("  Solusi: tunggu beberapa menit atau aktifkan billing.");
    } else {
      console.log(`❌ Error (${Date.now() - t1}ms): ${msg}`);
    }
  }

  // ── Ringkasan ─────────────────────────────────────────────────────────────
  console.log("\n" + "─".repeat(60));
  console.log("Ringkasan Provider P9 — Gemini Google Search Grounding:");
  console.log("  ✅ geminiInstagramProfile(username)");
  console.log("     → follower_count, following_count, post_count, full_name, bio, is_verified");
  console.log("  ✅ geminiTikTokProfile(username)");
  console.log("     → follower_count, likes_count, bio, full_name, is_verified");
  console.log("");
  console.log("  Cara kerja: Gemini otomatis query Google Search → parse hasil");
  console.log("  Kelebihan vs Perplexity: bio lebih sering terisi, data lebih segar");
  console.log("");
  console.log("  ⚠️ Keterbatasan:");
  console.log("     - Free tier: quota rendah (~15 req/menit, kuota harian terbatas)");
  console.log("     - Data mungkin 1–7 hari stale (dari Google Search index)");
  console.log("     - maxOutputTokens harus ≥1024 agar JSON tidak terpotong");
  console.log("     - url_context TIDAK works untuk IG/TikTok (keduanya block fetch)");
  console.log("     - Akun private tidak tersedia");
}

main().catch(err => {
  console.error("\n❌ Error:", err.message ?? err);
  process.exit(1);
});
