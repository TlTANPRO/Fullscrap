/**
 * TEST: TikTok via EnsembleData
 *
 * Jalankan:
 *   TT_USERNAME=charlidamelio npx ts-node examples/test-tiktok-ensemble.ts
 *
 * Atau set di .env:
 *   ENSEMBLEDATA_API_TOKEN=your_token
 */

import "dotenv/config";
import {
  scrapeTikTokAccount,
  fetchTikTokProfile,
  fetchTikTokVideos,
} from "../src/ensembledata/tiktok";
import { parseTikTokUsername } from "../src/utils/parse-username";

async function main() {
  const rawInput = process.env.TT_USERNAME ?? process.argv[2] ?? "charlidamelio";
  const username = parseTikTokUsername(rawInput);

  console.log(`\n🎵 TikTok Scraper — EnsembleData`);
  console.log(`Target: @${username}`);
  console.log(`Token : ${process.env.ENSEMBLEDATA_API_TOKEN ? "✅ Set" : "❌ Tidak ada (set ENSEMBLEDATA_API_TOKEN)"}`);
  console.log("─".repeat(60));

  // Test 1: Profil saja
  console.log("\n[1/3] Fetching profile...");
  const t0 = Date.now();
  const profile = await fetchTikTokProfile(username);
  console.log(`✅ Profile fetched (${Date.now() - t0}ms)`);
  console.log({
    uniqueId: profile.uniqueId,
    nickname: profile.nickname,
    verified: profile.verified,
    followerCount: profile.followerCount.toLocaleString(),
    heartCount: profile.heartCount.toLocaleString(),
    videoCount: profile.videoCount.toLocaleString(),
    bio: profile.bio.slice(0, 80) + (profile.bio.length > 80 ? "..." : ""),
  });

  // Test 2: Videos saja (depth=3 untuk test cepat)
  console.log("\n[2/3] Fetching videos (depth=3, ~27-30 videos)...");
  const t1 = Date.now();
  const { videos } = await fetchTikTokVideos(username, 3);
  console.log(`✅ ${videos.length} videos fetched (${Date.now() - t1}ms)`);

  if (videos.length > 0) {
    const topVideo = videos.sort((a, b) => b.playCount - a.playCount)[0];
    console.log("Top video by play count:");
    console.log({
      id: topVideo.id,
      description: topVideo.description.slice(0, 80),
      playCount: topVideo.playCount.toLocaleString(),
      diggCount: topVideo.diggCount.toLocaleString(),
      commentCount: topVideo.commentCount.toLocaleString(),
      shareCount: topVideo.shareCount.toLocaleString(),
      durationSeconds: topVideo.durationSeconds,
    });

    // Hitung engagement rate
    const totalPlays = videos.reduce((s, v) => s + v.playCount, 0);
    const totalEngagements = videos.reduce(
      (s, v) => s + v.diggCount + v.commentCount + v.shareCount, 0
    );
    const engRate = totalPlays > 0 ? (totalEngagements / totalPlays * 100).toFixed(2) : "0";
    console.log(`\nEngagement rate (sample ${videos.length} videos): ${engRate}%`);
    console.log(`Avg play count: ${Math.round(totalPlays / videos.length).toLocaleString()}`);
  }

  // Test 3: Profile + Videos sekaligus (convenience method)
  console.log("\n[3/3] scrapeTikTokAccount (profile + videos, depth=2)...");
  const t2 = Date.now();
  const result = await scrapeTikTokAccount(username, 2);
  console.log(`✅ Complete in ${Date.now() - t2}ms`);
  console.log(`Profile: ${result.profile.nickname} | Videos scraped: ${result.videos.length}`);

  console.log("\n✅ Semua test berhasil!");
}

main().catch(err => {
  console.error("\n❌ Error:", err.message ?? err);
  process.exit(1);
});
