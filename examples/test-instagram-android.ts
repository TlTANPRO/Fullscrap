/**
 * TEST: Instagram Android API Endpoints (GRATIS, no API key)
 *
 * Jalankan:
 *   IG_USER_ID=183250726 npx ts-node examples/test-instagram-android.ts
 *
 * User IDs confirmed works (Juli 2026):
 *   183250726  = @charlidamelio
 *   25025320   = @instagram
 *
 * Dapat user_id dari Provider 3 (instagram-web):
 *   const profile = await getUserProfile("charlidamelio");
 *   console.log(profile.id); // 183250726
 *
 * KEUNGGULAN vs Provider 3:
 *   Provider ini expose PLAY COUNT pada reels via endpoint clips/user
 */

import "dotenv/config";
import {
  getReelsFeed,
  getPostsFeed,
  getAllReels,
} from "../src/instagram-android/instagram";

// Default: charlidamelio — ganti dengan user_id lain
const USER_ID = process.env.IG_USER_ID ?? process.argv[2] ?? "183250726";
const USERNAME_HINT = USER_ID === "183250726" ? "@charlidamelio" : `user_id=${USER_ID}`;

async function main() {
  console.log("\n📸 Instagram Android API — Extended Endpoints (GRATIS)");
  console.log(`Target  : ${USERNAME_HINT} (user_id=${USER_ID})`);
  console.log("Auth    : ❌ Tidak perlu");
  console.log("Feature : ✅ Play count tersedia untuk reels");
  console.log("─".repeat(60));

  // ── Test 1: Reels dengan play count ───────────────────────────────────
  console.log("\n[1/3] getReelsFeed() — reels dengan PLAY COUNT");
  console.log("  ← Endpoint ini expose play_count yang tidak selalu ada di Provider 3");
  const t0 = Date.now();
  const reels = await getReelsFeed(USER_ID, "", 6);
  console.log(`✅ ${reels.items.length} reels fetched (${Date.now() - t0}ms)`);
  console.log(`   moreAvailable: ${reels.moreAvailable}`);

  if (reels.items.length > 0) {
    const r = reels.items[0];
    console.log("\nFirst reel:");
    console.log({
      id: r.id,
      code: r.code,
      url: r.url,
      like_count: r.like_count.toLocaleString(),
      comment_count: r.comment_count.toLocaleString(),
      play_count: r.play_count.toLocaleString(),   // ← KEUNGGULAN UTAMA
      duration_seconds: r.duration_seconds.toFixed(1) + "s",
      has_video_url: !!r.video_url,
      has_thumbnail: !!r.thumbnail_url,
      caption: r.caption.slice(0, 60) + (r.caption.length > 60 ? "..." : ""),
    });

    // Hitung total play count dari halaman ini
    const totalPlays = reels.items.reduce((s, r) => s + r.play_count, 0);
    const avgPlays = Math.round(totalPlays / reels.items.length);
    console.log(`\nStats ${reels.items.length} reels terbaru:`);
    console.log(`  Total plays   : ${totalPlays.toLocaleString()}`);
    console.log(`  Avg plays     : ${avgPlays.toLocaleString()}`);
    console.log(
      `  Avg likes     : ${Math.round(reels.items.reduce((s, r) => s + r.like_count, 0) / reels.items.length).toLocaleString()}`
    );
    console.log(
      `  Avg comments  : ${Math.round(reels.items.reduce((s, r) => s + r.comment_count, 0) / reels.items.length).toLocaleString()}`
    );
  }

  // ── Test 2: Posts feed ────────────────────────────────────────────────
  console.log("\n[2/3] getPostsFeed() — posts");
  const t1 = Date.now();
  const posts = await getPostsFeed(USER_ID);
  console.log(`✅ ${posts.items.length} posts fetched (${Date.now() - t1}ms)`);
  console.log(`   moreAvailable: ${posts.moreAvailable}`);

  if (posts.items.length > 0) {
    // Breakdown media type
    const photos = posts.items.filter((p) => p.media_type === 1).length;
    const videos = posts.items.filter((p) => p.media_type === 2).length;
    const carousels = posts.items.filter((p) => p.media_type === 8).length;
    console.log(`\nBreakdown: foto=${photos} | video=${videos} | carousel=${carousels}`);

    const topPost = [...posts.items].sort((a, b) => b.like_count - a.like_count)[0];
    console.log("\nTop post (by likes):");
    console.log({
      id: topPost.id,
      url: topPost.url,
      media_type: topPost.media_type === 1 ? "foto" : topPost.media_type === 2 ? "video" : "carousel",
      like_count: topPost.like_count.toLocaleString(),
      comment_count: topPost.comment_count.toLocaleString(),
      play_count: topPost.play_count > 0 ? topPost.play_count.toLocaleString() : "n/a (foto)",
      caption: topPost.caption.slice(0, 60),
    });
  }

  // ── Test 3: Pagination reels ──────────────────────────────────────────
  if (reels.moreAvailable) {
    console.log("\n[3/3] Pagination test — halaman 2 reels");
    const t2 = Date.now();
    const page2 = await getReelsFeed(USER_ID, reels.nextMaxId, 6);
    console.log(`✅ ${page2.items.length} reels halaman 2 (${Date.now() - t2}ms)`);
    console.log(`   moreAvailable: ${page2.moreAvailable}`);
    if (page2.items.length > 0) {
      console.log(`   First item play_count: ${page2.items[0].play_count.toLocaleString()}`);
    }
  } else {
    console.log("\n[3/3] Skip pagination — sudah habis (moreAvailable=false)");
  }

  // ── Ringkasan ──────────────────────────────────────────────────────────
  console.log("\n" + "─".repeat(60));
  console.log("Ringkasan Instagram Android endpoints:");
  console.log("  ✅ getReelsFeed()  — reels + PLAY COUNT (clips/user endpoint)");
  console.log("  ✅ getPostsFeed()  — posts dengan media_type breakdown");
  console.log("  ✅ getAllReels()   — auto-pagination semua reels");
  console.log("  ✅ getAllPosts()   — auto-pagination semua posts");
  console.log("\nKeunggulan vs Provider 3 (instagram-web):");
  console.log("  ✅ play_count tersedia untuk semua reels");
  console.log("  ✅ Endpoint berbeda → lebih tahan rate limit");
  console.log("\nCatatan: Butuh user_id numerik (bukan username).");
  console.log("  Cara dapat: const p = await getUserProfile('username'); p.id");
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message ?? err);
  process.exit(1);
});
