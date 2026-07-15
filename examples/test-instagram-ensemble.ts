/**
 * TEST: Instagram via EnsembleData
 *
 * Jalankan:
 *   IG_USERNAME=nike npx ts-node examples/test-instagram-ensemble.ts
 *
 * Atau set di .env:
 *   ENSEMBLEDATA_API_TOKEN=your_token
 */

import "dotenv/config";
import {
  fetchInstagramProfile,
  fetchInstagramPosts,
  fetchInstagramReels,
  scrapeInstagramAccount,
} from "../src/ensembledata/instagram";
import { parseInstagramUsername } from "../src/utils/parse-username";

async function main() {
  const rawInput = process.env.IG_USERNAME ?? process.argv[2] ?? "nike";
  const username = parseInstagramUsername(rawInput);

  console.log(`\n📸 Instagram Scraper — EnsembleData`);
  console.log(`Target: @${username}`);
  console.log(`Token : ${process.env.ENSEMBLEDATA_API_TOKEN ? "✅ Set" : "❌ Tidak ada (set ENSEMBLEDATA_API_TOKEN)"}`);
  console.log("─".repeat(60));

  // Test 1: Profil
  console.log("\n[1/4] Fetching Instagram profile...");
  const t0 = Date.now();
  const profile = await fetchInstagramProfile(username);
  console.log(`✅ Profile fetched (${Date.now() - t0}ms)`);
  console.log({
    userId: profile.userId,
    username: profile.username,
    fullName: profile.fullName,
    verified: profile.verified,
    followerCount: profile.followerCount.toLocaleString(),
    followingCount: profile.followingCount.toLocaleString(),
    postCount: profile.postCount.toLocaleString(),
    biography: profile.biography.slice(0, 80) + (profile.biography.length > 80 ? "..." : ""),
    externalUrl: profile.externalUrl,
  });

  // Test 2: Posts (pakai userId dari profil)
  console.log(`\n[2/4] Fetching posts (userId=${profile.userId}, depth=2, ~24 posts)...`);
  console.log("PENTING: Gunakan userId (numerik), BUKAN username untuk endpoint posts");
  const t1 = Date.now();
  const { posts } = await fetchInstagramPosts(profile.userId, 2);
  console.log(`✅ ${posts.length} posts fetched (${Date.now() - t1}ms)`);

  if (posts.length > 0) {
    const topPost = posts.sort((a, b) => b.likeCount - a.likeCount)[0];
    console.log("Top post by likes:");
    console.log({
      id: topPost.id,
      mediaType: topPost.mediaType,
      likeCount: topPost.likeCount.toLocaleString(),
      commentCount: topPost.commentCount.toLocaleString(),
      viewCount: topPost.viewCount.toLocaleString(),
      caption: topPost.caption.slice(0, 80),
      postUrl: topPost.postUrl,
    });

    // Hitung engagement rate sederhana
    const followers = profile.followerCount;
    if (followers > 0 && posts.length > 0) {
      const avgLikes = posts.reduce((s, p) => s + p.likeCount, 0) / posts.length;
      const avgComments = posts.reduce((s, p) => s + p.commentCount, 0) / posts.length;
      const engRate = ((avgLikes + avgComments) / followers * 100).toFixed(2);
      console.log(`\nEngagement rate (avg likes+comments / followers): ${engRate}%`);
    }
  }

  // Test 3: Reels
  console.log(`\n[3/4] Fetching reels (userId=${profile.userId}, depth=1)...`);
  const t2 = Date.now();
  const { posts: reels } = await fetchInstagramReels(profile.userId, 1);
  console.log(`✅ ${reels.length} reels fetched (${Date.now() - t2}ms)`);

  // Test 4: Convenience method
  console.log("\n[4/4] scrapeInstagramAccount (profile + posts, depth=1)...");
  const t3 = Date.now();
  const result = await scrapeInstagramAccount(username, 1);
  console.log(`✅ Complete in ${Date.now() - t3}ms`);
  console.log(`Profile: ${result.profile.fullName} | Posts scraped: ${result.posts.length}`);

  console.log("\n✅ Semua test berhasil!");
}

main().catch(err => {
  console.error("\n❌ Error:", err.message ?? err);
  process.exit(1);
});
