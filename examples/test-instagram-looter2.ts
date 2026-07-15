/**
 * TEST: Instagram via RapidAPI (instagram-looter2)
 *
 * Jalankan:
 *   IG_USERNAME=nike npx ts-node examples/test-instagram-looter2.ts
 *
 * Subscribe di:
 *   https://rapidapi.com/sandro.volpicella/api/instagram-looter2
 *
 * Set di .env:
 *   RAPIDAPI_KEY=your_key
 */

import "dotenv/config";
import {
  looterGetProfile,
  looterGetProfilePosts,
  looterGetAllPosts,
  looterGetReels,
  looterGetStories,
  looterGetHighlights,
  looterGetTagPosts,
  looterSearchUser,
} from "../src/rapidapi/instagram-looter2";
import { parseInstagramUsername } from "../src/utils/parse-username";

async function main() {
  const rawInput = process.env.IG_USERNAME ?? process.argv[2] ?? "nike";
  const username = parseInstagramUsername(rawInput);

  console.log(`\n📸 Instagram Scraper — instagram-looter2 (RapidAPI)`);
  console.log(`Target: @${username}`);
  console.log(`Key   : ${process.env.RAPIDAPI_KEY ? "✅ Set" : "❌ Tidak ada (set RAPIDAPI_KEY)"}`);
  console.log("─".repeat(60));

  // Test 1: Profile
  console.log("\n[1/5] Fetching profile...");
  const t0 = Date.now();
  const profile = await looterGetProfile(username);
  console.log(`✅ Profile fetched (${Date.now() - t0}ms)`);
  const p = profile as Record<string, unknown>;
  console.log({
    id: p.id ?? p.pk,
    username: p.username,
    followerCount: p.follower_count ?? p.edge_followed_by,
    postCount: p.media_count,
    isVerified: p.is_verified,
  });

  // Test 2: Posts (page 1)
  console.log("\n[2/5] Fetching posts page 1...");
  const t1 = Date.now();
  const page1 = await looterGetProfilePosts(username);
  console.log(`✅ ${page1.items.length} posts (hasMore: ${page1.hasMore}, nextMaxId: ${page1.nextMaxId.slice(0, 20)}...) (${Date.now() - t1}ms)`);

  // Test 3: Posts page 2 (if available)
  if (page1.hasMore && page1.nextMaxId) {
    console.log("\n[3/5] Fetching posts page 2...");
    const t2 = Date.now();
    const page2 = await looterGetProfilePosts(username, page1.nextMaxId);
    console.log(`✅ ${page2.items.length} more posts (${Date.now() - t2}ms)`);
    console.log(`Total so far: ${page1.items.length + page2.items.length} posts`);
  } else {
    console.log("\n[3/5] Skipped (no more pages)");
  }

  // Test 4: Reels
  console.log("\n[4/5] Fetching reels...");
  const t3 = Date.now();
  const reelsResult = await looterGetReels(username);
  console.log(`✅ ${reelsResult.items.length} reels (${Date.now() - t3}ms)`);

  // Test 5: Hashtag posts
  const HASHTAG = "adidas";
  console.log(`\n[5/5] Fetching hashtag posts (#${HASHTAG})...`);
  const t4 = Date.now();
  const tagResult = await looterGetTagPosts(HASHTAG);
  console.log(`✅ ${tagResult.items.length} posts for #${HASHTAG} (${Date.now() - t4}ms)`);

  console.log("\n✅ Semua test instagram-looter2 berhasil!");
}

main().catch(err => {
  console.error("\n❌ Error:", err.message ?? err);
  process.exit(1);
});
