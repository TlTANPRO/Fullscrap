/**
 * TEST: TikTok & Instagram via Perplexity Sonar (OpenRouter) — P8
 *
 * Menggunakan Perplexity Sonar yang punya kemampuan real-time web search.
 * Tidak perlu bypass Cloudflare atau session Instagram — cukup API key OpenRouter.
 *
 * Setup:
 *   1. Daftar di https://openrouter.ai → Settings → API Keys → Create Key
 *   2. Isi credits minimal $5 di https://openrouter.ai/settings/credits
 *   3. Tambahkan ke .env:  OPENROUTER_API_KEY=sk-or-v1-xxxx
 *
 * Jalankan: npx ts-node examples/test-perplexity.ts
 *
 * ⚠️ Bukan gratis — ~$0.001–0.01 per request
 * ⚠️ Data mungkin 1–14 hari stale (bersumber dari indeks web)
 */

import "dotenv/config";
import {
  perplexityInstagramProfile,
  perplexityTikTokProfile,
  perplexityInstagramHashtag,
} from "../src/perplexity/social";

async function main() {
  console.log(`\n🤖 TikTok & Instagram via Perplexity Sonar (OpenRouter) — P8`);
  console.log(`Auth    : OPENROUTER_API_KEY diperlukan`);
  console.log(`Harga   : ~$0.001–0.01 per request`);
  console.log(`Status  : Confirmed Works Juli 2026`);
  console.log("─".repeat(60));

  // ── Test 1: Instagram profil ───────────────────────────────────────────────
  const IG_USER = "nike";
  console.log(`\n[1/3] perplexityInstagramProfile("${IG_USER}") — model: sonar`);
  const t0 = Date.now();
  const igProfile = await perplexityInstagramProfile(IG_USER, "perplexity/sonar");
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

  await new Promise(r => setTimeout(r, 1000));

  // ── Test 2: TikTok profil ──────────────────────────────────────────────────
  const TT_USER = "charlidamelio";
  console.log(`\n[2/3] perplexityTikTokProfile("${TT_USER}") — model: sonar-pro`);
  const t1 = Date.now();
  const ttProfile = await perplexityTikTokProfile(TT_USER, "perplexity/sonar-pro");
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

  await new Promise(r => setTimeout(r, 1000));

  // ── Test 3: Instagram hashtag ──────────────────────────────────────────────
  const HASHTAG = "travel";
  console.log(`\n[3/3] perplexityInstagramHashtag("${HASHTAG}")`);
  const t2 = Date.now();
  const hashtagStats = await perplexityInstagramHashtag(HASHTAG);
  console.log(`✅ Berhasil (${Date.now() - t2}ms)`);
  console.log({
    hashtag: `#${hashtagStats.hashtag}`,
    post_count: hashtagStats.post_count?.toLocaleString(),
    approximate: hashtagStats.approximate,
  });

  // ── Ringkasan ─────────────────────────────────────────────────────────────
  console.log("\n" + "─".repeat(60));
  console.log("Ringkasan Provider P8 — Perplexity via OpenRouter:");
  console.log("  ✅ perplexityInstagramProfile(username, model?)");
  console.log("     → follower_count, following_count, post_count, full_name, is_verified");
  console.log("  ✅ perplexityTikTokProfile(username, model?)");
  console.log("     → follower_count, following_count, likes_count, video_count, bio");
  console.log("  ✅ perplexityInstagramHashtag(hashtag, model?)");
  console.log("     → post_count (estimasi dari indeks web)");
  console.log("");
  console.log("  Model tersedia:");
  console.log("     perplexity/sonar          — cheapest, ~$1/1M in");
  console.log("     perplexity/sonar-pro       — lebih akurat, ~$3/1M in");
  console.log("     perplexity/sonar-pro-search — paling akurat untuk search");
  console.log("");
  console.log("  ⚠️ Keterbatasan:");
  console.log("     - Data mungkin 1–14 hari stale (dari indeks web)");
  console.log("     - following_count/video_count kadang 0 (tidak terindeks)");
  console.log("     - Tidak bisa ambil stats per-video atau list post terbaru");
  console.log("     - Akun private tidak tersedia");
}

main().catch(err => {
  console.error("\n❌ Error:", err.message ?? err);
  process.exit(1);
});
