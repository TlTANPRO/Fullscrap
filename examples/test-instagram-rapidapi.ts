/**
 * TEST: Instagram via RapidAPI (instagram-scraper-api2)
 *
 * Jalankan:
 *   IG_USERNAME=nike npx ts-node examples/test-instagram-rapidapi.ts
 *
 * Subscribe dulu di:
 *   https://rapidapi.com/dreaded_spin/api/instagram-scraper-api2
 *
 * Set di .env:
 *   RAPIDAPI_KEY=your_key
 */

import "dotenv/config";
import {
  getInstagramInfo,
  getInstagramPosts,
  getAllInstagramPosts,
  getInstagramReels,
} from "../src/rapidapi/instagram-scraper-api2";
import { parseInstagramUsername } from "../src/utils/parse-username";

async function main() {
  const rawInput = process.env.IG_USERNAME ?? process.argv[2] ?? "nike";
  const username = parseInstagramUsername(rawInput);

  console.log(`\n📸 Instagram Scraper — RapidAPI (instagram-scraper-api2)`);
  console.log(`Target: @${username}`);
  console.log(`Key   : ${process.env.RAPIDAPI_KEY ? "✅ Set" : "❌ Tidak ada (set RAPIDAPI_KEY)"}`);
  console.log("─".repeat(60));

  // Test 1: Info (profil + 12 post terbaru)
  console.log("\n[1/4] getInstagramInfo (profil + 12 recent posts)...");
  const t0 = Date.now();
  const { profile, recentPosts } = await getInstagramInfo(username);
  console.log(`✅ Info fetched (${Date.now() - t0}ms)`);
  console.log({
    userId: profile.userId,
    username: profile.username,
    fullName: profile.fullName,
    followerCount: profile.followerCount.toLocaleString(),
    postCount: profile.postCount.toLocaleString(),
    verified: profile.verified,
  });
  console.log(`Recent posts: ${recentPosts.length} items`);

  // Test 2: Posts pagination halaman 1
  console.log("\n[2/4] getInstagramPosts halaman 1...");
  const t1 = Date.now();
  const page1 = await getInstagramPosts(username);
  console.log(`✅ ${page1.posts.length} posts (${Date.now() - t1}ms)`);
  console.log(`Has more: ${page1.hasMore} | Next page ID: ${page1.nextPageId.slice(0, 30)}...`);

  // Test 3: Lanjut ke halaman 2
  if (page1.hasMore && page1.nextPageId) {
    console.log("\n[3/4] getInstagramPosts halaman 2...");
    const t2 = Date.now();
    const page2 = await getInstagramPosts(username, page1.nextPageId);
    console.log(`✅ ${page2.posts.length} posts halaman 2 (${Date.now() - t2}ms)`);
    console.log(`Total so far: ${page1.posts.length + page2.posts.length} posts`);
  } else {
    console.log("\n[3/4] Skipped (no more pages)");
  }

  // Test 4: Reels
  console.log("\n[4/4] getInstagramReels...");
  const t3 = Date.now();
  const { posts: reels } = await getInstagramReels(username);
  console.log(`✅ ${reels.length} reels (${Date.now() - t3}ms)`);

  if (reels.length > 0) {
    const topReel = reels.sort((a, b) => b.viewCount - a.viewCount)[0];
    console.log("Top reel by view count:");
    console.log({
      id: topReel.id,
      viewCount: topReel.viewCount.toLocaleString(),
      likeCount: topReel.likeCount.toLocaleString(),
      commentCount: topReel.commentCount.toLocaleString(),
    });
  }

  console.log("\n✅ Semua test RapidAPI Instagram berhasil!");
}

main().catch(err => {
  console.error("\n❌ Error:", err.message ?? err);
  process.exit(1);
});
