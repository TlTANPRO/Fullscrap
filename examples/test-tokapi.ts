/**
 * TEST: TikTok via RapidAPI (tokapi-mobile-version)
 *
 * Jalankan:
 *   TT_USERNAME=charlidamelio npx ts-node examples/test-tokapi.ts
 *
 * Subscribe di:
 *   https://rapidapi.com/Carloss8824/api/tokapi-mobile-version
 *
 * Set di .env:
 *   RAPIDAPI_KEY=your_key
 */

import "dotenv/config";
import {
  tokapiUserInfo,
  tokapiUserTimeline,
  tokapiGetAllVideos,
  tokapiUserFollowers,
  tokapiVideoComments,
  tokapiSearchVideos,
} from "../src/rapidapi/tokapi-tiktok";
import { parseTikTokUsername } from "../src/utils/parse-username";

async function main() {
  const rawInput = process.env.TT_USERNAME ?? process.argv[2] ?? "charlidamelio";
  const username = parseTikTokUsername(rawInput);

  console.log(`\n🎵 TikTok Scraper — tokapi-mobile-version (RapidAPI)`);
  console.log(`Target: @${username}`);
  console.log(`Key   : ${process.env.RAPIDAPI_KEY ? "✅ Set" : "❌ Tidak ada (set RAPIDAPI_KEY)"}`);
  console.log("─".repeat(60));

  // Test 1: User info
  console.log("\n[1/4] Fetching user info...");
  const t0 = Date.now();
  const user = await tokapiUserInfo(username);
  console.log(`✅ User info fetched (${Date.now() - t0}ms)`);
  console.log({
    userId: user.userId,
    uniqueId: user.uniqueId,
    nickname: user.nickname,
    followerCount: user.followerCount.toLocaleString(),
    heartCount: user.heartCount.toLocaleString(),
    videoCount: user.videoCount.toLocaleString(),
    bio: user.bio.slice(0, 80),
  });

  // Test 2: Timeline (video list) - butuh userId numerik
  console.log(`\n[2/4] Fetching user timeline (userId=${user.userId}, count=20, offset=0)...`);
  const t1 = Date.now();
  const timeline = await tokapiUserTimeline(user.userId, 20, 0);
  console.log(`✅ ${timeline.videos.length} videos (hasMore: ${timeline.hasMore}, total: ${timeline.total}) (${Date.now() - t1}ms)`);

  // Test 3: Auto-pagination (max 50 videos)
  console.log(`\n[3/4] getAllVideos (max 50, auto-pagination)...`);
  const t2 = Date.now();
  const allVideos = await tokapiGetAllVideos(user.userId, 50);
  console.log(`✅ ${allVideos.length} total videos fetched (${Date.now() - t2}ms)`);

  // Test 4: Search video
  console.log(`\n[4/4] searchVideos("indonesia viral", count=5)...`);
  const t3 = Date.now();
  const searchRes = await tokapiSearchVideos("indonesia viral", 5, 0);
  console.log(`✅ ${searchRes.videos.length} videos found (${Date.now() - t3}ms)`);

  console.log("\n✅ Semua test tokapi berhasil!");
}

main().catch(err => {
  console.error("\n❌ Error:", err.message ?? err);
  process.exit(1);
});
