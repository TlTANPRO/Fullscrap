/**
 * TEST: TikTok via RapidAPI (tiktok-scraper7)
 *
 * Jalankan:
 *   TT_USERNAME=charlidamelio npx ts-node examples/test-tiktok-rapidapi.ts
 *
 * Subscribe dulu di:
 *   https://rapidapi.com/tikwm-tikwm-default/api/tiktok-scraper7
 *
 * Set di .env:
 *   RAPIDAPI_KEY=your_key
 */

import "dotenv/config";
import {
  getTikTokUserInfo,
  getTikTokUserPosts,
  getAllTikTokVideos,
} from "../src/rapidapi/tiktok-scraper7";
import { parseTikTokUsername } from "../src/utils/parse-username";

async function main() {
  const rawInput = process.env.TT_USERNAME ?? process.argv[2] ?? "charlidamelio";
  const username = parseTikTokUsername(rawInput);

  console.log(`\n🎵 TikTok Scraper — RapidAPI (tiktok-scraper7)`);
  console.log(`Target: @${username}`);
  console.log(`Key   : ${process.env.RAPIDAPI_KEY ? "✅ Set" : "❌ Tidak ada (set RAPIDAPI_KEY)"}`);
  console.log("─".repeat(60));

  // Test 1: User info
  console.log("\n[1/3] Fetching user info...");
  const t0 = Date.now();
  const profile = await getTikTokUserInfo(username);
  console.log(`✅ Profile fetched (${Date.now() - t0}ms)`);
  console.log({
    uniqueId: profile.uniqueId,
    nickname: profile.nickname,
    followerCount: profile.followerCount.toLocaleString(),
    heartCount: profile.heartCount.toLocaleString(),
    videoCount: profile.videoCount.toLocaleString(),
  });

  // Test 2: User posts (1 page)
  console.log("\n[2/3] Fetching posts (count=20, cursor=0)...");
  const t1 = Date.now();
  const page1 = await getTikTokUserPosts(username, 20, "0");
  console.log(`✅ ${page1.videos.length} videos fetched (${Date.now() - t1}ms)`);
  console.log(`Has more: ${page1.hasMore} | Next cursor: ${page1.nextCursor}`);

  if (page1.videos.length > 0) {
    const top = page1.videos.sort((a, b) => b.playCount - a.playCount)[0];
    console.log("Top video:");
    console.log({
      id: top.id,
      description: top.description.slice(0, 60),
      playCount: top.playCount.toLocaleString(),
      diggCount: top.diggCount.toLocaleString(),
    });
  }

  // Test 3: Auto-pagination (max 50 videos)
  console.log("\n[3/3] getAllTikTokVideos (max 50 videos, auto-pagination)...");
  const t2 = Date.now();
  const allVideos = await getAllTikTokVideos(username, 50);
  console.log(`✅ ${allVideos.length} total videos fetched (${Date.now() - t2}ms)`);

  console.log("\n✅ Semua test RapidAPI TikTok berhasil!");
}

main().catch(err => {
  console.error("\n❌ Error:", err.message ?? err);
  process.exit(1);
});
