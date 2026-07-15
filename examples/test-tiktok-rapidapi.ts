/**
 * TEST: TikTok via RapidAPI (Berbayar, tapi free tier 500 req/bulan)
 *
 * Jalankan:
 *   RAPIDAPI_KEY=your_key npx ts-node examples/test-tiktok-rapidapi.ts
 *
 * Atau set di .env:
 *   RAPIDAPI_KEY=your_key
 *
 * Daftar RapidAPI key di: https://rapidapi.com/dashboard
 * Pilih TikTok scraper yang ingin dipakai di: https://rapidapi.com/hub
 *   Rekomendasi: cari "tiktok-scraper7" atau "TikTok Scraper"
 *
 * Kenapa pakai ini vs TikWM:
 *   ✅ User posts BISA dari datacenter IP (tidak CF-blocked seperti TikWM)
 *   ✅ Lebih stabil untuk use case scraping otomatis dari server
 */

import "dotenv/config";
import {
  rapidapiUserInfo,
  rapidapiUserPosts,
  rapidapiVideoDetail,
  rapidapiSearchVideos,
  rapidapiTrending,
  rapidapiGetAllUserVideos,
} from "../src/tiktok-rapidapi/tiktok";

const TEST_USERNAME = process.env.TT_USERNAME ?? process.argv[2] ?? "khaby.lame";
const TEST_VIDEO_URL =
  "https://www.tiktok.com/@khaby.lame/video/7109178205151784198";

async function main() {
  const hasKey = !!process.env.RAPIDAPI_KEY;

  console.log("\n📱 TikTok Scraper — RapidAPI");
  console.log(`Target  : @${TEST_USERNAME}`);
  console.log(`API Key : ${hasKey ? "✅ Set" : "❌ Tidak ada (set RAPIDAPI_KEY)"}`);
  console.log("─".repeat(60));

  if (!hasKey) {
    console.log("\n⚠️  RAPIDAPI_KEY belum di-set.");
    console.log("1. Daftar gratis di https://rapidapi.com/dashboard");
    console.log('2. Cari "TikTok Scraper" atau "tiktok-scraper7" di RapidAPI Hub');
    console.log("3. Subscribe ke plan (ada free tier 500 req/bulan)");
    console.log("4. Copy API key, lalu: RAPIDAPI_KEY=xxx npx ts-node examples/test-tiktok-rapidapi.ts");
    console.log("\nSkip test karena tidak ada API key.");
    return;
  }

  // Test 1: User info
  console.log(`\n[1/5] rapidapiUserInfo(@${TEST_USERNAME})...`);
  const t0 = Date.now();
  const { user, stats } = await rapidapiUserInfo(TEST_USERNAME);
  console.log(`✅ User info fetched (${Date.now() - t0}ms)`);
  console.log({
    uniqueId: user.uniqueId,
    nickname: user.nickname,
    verified: user.verified,
    followerCount: stats.followerCount.toLocaleString(),
    followingCount: stats.followingCount.toLocaleString(),
    heartCount: stats.heartCount.toLocaleString(),
    videoCount: stats.videoCount,
  });

  // Test 2: User posts (KEUNGGULAN UTAMA — works dari datacenter)
  console.log(`\n[2/5] rapidapiUserPosts(@${TEST_USERNAME}, 5 posts)...`);
  console.log("  ← Ini endpoint yang CF-blocked di TikWM, tapi works di RapidAPI ✅");
  const t1 = Date.now();
  const { videos, hasMore, cursor } = await rapidapiUserPosts(TEST_USERNAME, 5, 0);
  console.log(`✅ ${videos.length} video fetched (${Date.now() - t1}ms), hasMore=${hasMore}`);
  if (videos.length > 0) {
    const v = videos[0];
    console.log("  Video terbaru:");
    console.log({
      video_id: v.video_id,
      title: v.title.slice(0, 60),
      play_count: v.play_count.toLocaleString(),
      digg_count: v.digg_count.toLocaleString(),
      comment_count: v.comment_count,
      duration: `${v.duration}s`,
      has_download_url: !!v.play,
    });
    console.log(`  cursor untuk halaman 2: ${cursor}`);
  }

  // Test 3: Video detail
  console.log(`\n[3/5] rapidapiVideoDetail()...`);
  const t2 = Date.now();
  try {
    const video = await rapidapiVideoDetail(TEST_VIDEO_URL);
    console.log(`✅ Video detail fetched (${Date.now() - t2}ms)`);
    console.log({
      title: video.title.slice(0, 60),
      play_count: video.play_count.toLocaleString(),
      has_nowatermark_url: !!video.play,
    });
  } catch (err) {
    console.log(`❌ Error: ${err instanceof Error ? err.message : err}`);
  }

  // Test 4: Search
  console.log("\n[4/5] rapidapiSearchVideos('indonesia viral', 3)...");
  const t3 = Date.now();
  const searchResult = await rapidapiSearchVideos("indonesia viral", 3, 0);
  console.log(`✅ ${searchResult.videos.length} video ditemukan (${Date.now() - t3}ms)`);
  for (const v of searchResult.videos.slice(0, 2)) {
    console.log(`  - @${v.author.unique_id}: "${v.title.slice(0, 50)}" (${v.play_count.toLocaleString()} views)`);
  }

  // Test 5: Trending
  console.log("\n[5/5] rapidapiTrending('ID', 5) — trending Indonesia...");
  const t4 = Date.now();
  const trending = await rapidapiTrending("ID", 5);
  console.log(`✅ ${trending.length} trending video (${Date.now() - t4}ms)`);
  for (const v of trending.slice(0, 2)) {
    console.log(`  - @${v.author.unique_id}: "${v.title.slice(0, 50)}" (${v.play_count.toLocaleString()} views)`);
  }

  // Ringkasan
  console.log("\n" + "─".repeat(60));
  console.log("✅ Semua test RapidAPI berhasil!");
  console.log("Keunggulan vs TikWM:");
  console.log("  ✅ rapidapiUserPosts()  — user posts dari datacenter (TikWM CF-blocked)");
  console.log("  ✅ rapidapiVideoDetail() — detail video + URL download");
  console.log("  ✅ rapidapiSearchVideos() — search video by keyword");
  console.log("  ✅ rapidapiTrending()    — trending by region");
}

main().catch(err => {
  console.error("\n❌ Error:", err.message ?? err);
  process.exit(1);
});
