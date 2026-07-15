/**
 * TEST: TikTok via RapidAPI (tiktok-api23)
 *
 * Jalankan:
 *   TT_USERNAME=charlidamelio npx ts-node examples/test-tiktok-api23.ts
 *
 * Subscribe di:
 *   https://rapidapi.com/Lundehund/api/tiktok-api23
 *
 * Set di .env:
 *   RAPIDAPI_KEY=your_key
 */

import "dotenv/config";
import {
  api23UserInfo,
  api23UserPosts,
  api23PostDetail,
  api23SearchUser,
  api23HashtagInfo,
} from "../src/rapidapi/tiktok-api23";
import { parseTikTokUsername } from "../src/utils/parse-username";

async function main() {
  const rawInput = process.env.TT_USERNAME ?? process.argv[2] ?? "charlidamelio";
  const username = parseTikTokUsername(rawInput);

  console.log(`\n🎵 TikTok Scraper — tiktok-api23 (RapidAPI)`);
  console.log(`Target: @${username}`);
  console.log(`Key   : ${process.env.RAPIDAPI_KEY ? "✅ Set" : "❌ Tidak ada (set RAPIDAPI_KEY)"}`);
  console.log("─".repeat(60));

  // Test 1: User info
  console.log("\n[1/4] Fetching user info...");
  const t0 = Date.now();
  const profile = await api23UserInfo(username);
  console.log(`✅ User info (${Date.now() - t0}ms)`);
  console.log({
    uniqueId: profile.uniqueId,
    nickname: profile.nickname,
    followerCount: profile.followerCount.toLocaleString(),
    heartCount: profile.heartCount.toLocaleString(),
    videoCount: profile.videoCount.toLocaleString(),
    verified: profile.verified,
  });

  // Test 2: Posts (cursor pagination)
  console.log("\n[2/4] Fetching posts (cursor=0, count=10)...");
  const t1 = Date.now();
  const page1 = await api23UserPosts(username, "0", 10);
  console.log(`✅ ${page1.videos.length} videos (hasMore: ${page1.hasMore}, next: ${page1.nextCursor}) (${Date.now() - t1}ms)`);

  // Get video ID from first page for detail test
  const firstVideo = (page1.videos[0] as Record<string, unknown> | undefined);
  const videoId = String(firstVideo?.id ?? firstVideo?.aweme_id ?? "");

  // Test 3: Post detail
  if (videoId) {
    console.log(`\n[3/4] Fetching post detail (id=${videoId})...`);
    const t2 = Date.now();
    const detail = await api23PostDetail(videoId);
    console.log(`✅ Post detail fetched (${Date.now() - t2}ms)`);
    const d = detail as Record<string, unknown>;
    console.log({
      id: d.id,
      desc: String(d.desc ?? "").slice(0, 60),
    });
  } else {
    console.log("\n[3/4] Skipped (no video ID)");
  }

  // Test 4: Hashtag info
  console.log("\n[4/4] Fetching hashtag info (#fyp)...");
  const t3 = Date.now();
  const tagInfo = await api23HashtagInfo("fyp");
  console.log(`✅ Hashtag info fetched (${Date.now() - t3}ms)`);
  const t = tagInfo as Record<string, unknown>;
  console.log({ id: t.id, title: t.title, viewCount: t.viewCount ?? t.stats });

  console.log("\n✅ Semua test tiktok-api23 berhasil!");
}

main().catch(err => {
  console.error("\n❌ Error:", err.message ?? err);
  process.exit(1);
});
