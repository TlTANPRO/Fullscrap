/**
 * TEST: TikTok & Instagram via SocialBlade HTML scraping — P10
 *
 * SocialBlade adalah situs analitik sosial media yang menampilkan statistik
 * publik tanpa perlu login atau API key apapun.
 *
 * Setup  : Tidak perlu setup! Tidak ada API key.
 * Jalankan: npx ts-node examples/test-socialblade.ts
 *
 * ✅ Gratis sepenuhnya, tidak perlu API key
 * ⚠️ Angka TikTok dibulatkan (162.3M bukan exact), Instagram lebih presisi
 * ⚠️ Data mungkin 1–3 hari stale (SocialBlade update harian)
 */

import "dotenv/config";
import {
  socialbladeTikTokProfile,
  socialbladeInstagramProfile,
} from "../src/socialblade/social";

async function main() {
  console.log(`\n📊 TikTok & Instagram via SocialBlade HTML Scraping — P10`);
  console.log(`Auth    : Tidak diperlukan (gratis sepenuhnya!)`);
  console.log(`Status  : Confirmed Works Juli 2026`);
  console.log("─".repeat(60));

  // ── Test 1: TikTok profil ──────────────────────────────────────────────────
  const TT_USER = "khaby.lame";
  console.log(`\n[1/4] socialbladeTikTokProfile("${TT_USER}")`);
  const t0 = Date.now();
  const ttProfile = await socialbladeTikTokProfile(TT_USER);
  console.log(`✅ Berhasil (${Date.now() - t0}ms)`);
  console.log({
    username: ttProfile.username,
    follower_count: ttProfile.follower_count.toLocaleString(),
    following_count: ttProfile.following_count,
    total_likes: ttProfile.total_likes.toLocaleString(),
    video_count: ttProfile.video_count,
    note: ttProfile._data_note,
  });

  await new Promise(r => setTimeout(r, 800));

  // ── Test 2: TikTok akun lain ───────────────────────────────────────────────
  const TT_USER2 = "charlidamelio";
  console.log(`\n[2/4] socialbladeTikTokProfile("${TT_USER2}")`);
  const t1 = Date.now();
  const ttProfile2 = await socialbladeTikTokProfile(TT_USER2);
  console.log(`✅ Berhasil (${Date.now() - t1}ms)`);
  console.log({
    follower_count: ttProfile2.follower_count.toLocaleString(),
    following_count: ttProfile2.following_count.toLocaleString(),
    total_likes: ttProfile2.total_likes.toLocaleString(),
    video_count: ttProfile2.video_count,
  });

  await new Promise(r => setTimeout(r, 800));

  // ── Test 3: Instagram profil ───────────────────────────────────────────────
  const IG_USER = "nike";
  console.log(`\n[3/4] socialbladeInstagramProfile("${IG_USER}")`);
  const t2 = Date.now();
  const igProfile = await socialbladeInstagramProfile(IG_USER);
  console.log(`✅ Berhasil (${Date.now() - t2}ms)`);
  console.log({
    username: igProfile.username,
    follower_count: igProfile.follower_count.toLocaleString(),
    following_count: igProfile.following_count,
    media_count: igProfile.media_count.toLocaleString(),
    avg_likes: igProfile.avg_likes.toLocaleString(),
    avg_comments: igProfile.avg_comments.toLocaleString(),
    engagement_rate: igProfile.engagement_rate + "%",
  });

  await new Promise(r => setTimeout(r, 800));

  // ── Test 4: Instagram akun lain ────────────────────────────────────────────
  const IG_USER2 = "cristiano";
  console.log(`\n[4/4] socialbladeInstagramProfile("${IG_USER2}")`);
  const t3 = Date.now();
  const igProfile2 = await socialbladeInstagramProfile(IG_USER2);
  console.log(`✅ Berhasil (${Date.now() - t3}ms)`);
  console.log({
    follower_count: igProfile2.follower_count.toLocaleString(),
    following_count: igProfile2.following_count.toLocaleString(),
    media_count: igProfile2.media_count.toLocaleString(),
    avg_likes: igProfile2.avg_likes.toLocaleString(),
    engagement_rate: igProfile2.engagement_rate + "%",
  });

  // ── Ringkasan ─────────────────────────────────────────────────────────────
  console.log("\n" + "─".repeat(60));
  console.log("Ringkasan Provider P10 — SocialBlade (GRATIS, tanpa API key):");
  console.log("");
  console.log("  ✅ socialbladeTikTokProfile(username)");
  console.log("     → follower_count, following_count, total_likes, video_count");
  console.log("     ⚠️  Angka dibulatkan (162.3M), update harian");
  console.log("");
  console.log("  ✅ socialbladeInstagramProfile(username)");
  console.log("     → follower_count, following_count, media_count");
  console.log("     → avg_likes, avg_comments, engagement_rate");
  console.log("     ✨ avg_likes & avg_comments TIDAK ADA di provider lain!");
  console.log("");
  console.log("  Kelebihan vs P2 (TikWM) & P3 (Instagram Web API):");
  console.log("     - Tidak perlu header khusus / user-agent trick");
  console.log("     - Memberikan avg_likes & avg_comments (IG) — unik!");
  console.log("     - Cocok sebagai fallback ketika P2/P3 down");
  console.log("");
  console.log("  ⚠️ Keterbatasan:");
  console.log("     - Tidak ada: bio, is_verified, profile_pic_url");
  console.log("     - Angka TikTok dibulatkan (162.3M bukan 162,345,678)");
  console.log("     - Data 1–3 hari stale (update harian SocialBlade)");
  console.log("     - Rate limit tidak tertulis, hindari >30 req/menit");
}

main().catch(err => {
  console.error("\n❌ Error:", err.message ?? err);
  process.exit(1);
});
