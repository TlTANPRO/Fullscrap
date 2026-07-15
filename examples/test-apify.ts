/**
 * TEST: TikTok & Instagram via Apify
 *
 * Jalankan:
 *   npx ts-node examples/test-apify.ts
 *
 * Daftar di: https://apify.com (free $5/bulan)
 *
 * Set di .env:
 *   APIFY_TOKEN=your_token
 */

import "dotenv/config";
import {
  scrapeTikTokProfiles,
  scrapeTikTokVideos,
} from "../src/apify/tiktok";
import {
  scrapeInstagramProfiles,
  scrapeInstagramPosts,
} from "../src/apify/instagram";

const TT_USERNAMES = ["charlidamelio"];
const IG_USERNAMES = ["nike"];

async function main() {
  console.log(`\n🚀 Apify Scraper Test`);
  console.log(`Token: ${process.env.APIFY_TOKEN ? "✅ Set" : "❌ Tidak ada (set APIFY_TOKEN)"}`);
  console.log("─".repeat(60));
  console.log("CATATAN: Apify sync run bisa membutuhkan waktu 1-3 menit.");
  console.log("         Jika timeout, coba kurangi resultsPerPage.\n");

  // Test 1: TikTok Profile
  console.log("[1/4] TikTok — scrapeTikTokProfiles...");
  const t0 = Date.now();
  try {
    const profiles = await scrapeTikTokProfiles(TT_USERNAMES);
    console.log(`✅ ${profiles.length} profil TikTok scraped (${Date.now() - t0}ms)`);
    if (profiles.length > 0) {
      const p = profiles[0] as Record<string, unknown>;
      console.log({
        username: p.authorMeta?.uniqueId ?? p.uniqueId ?? p.username,
        fans: p.authorMeta?.fans ?? p.followerCount,
      });
    }
  } catch (err) {
    console.error(`❌ TikTok profiles: ${(err as Error).message}`);
  }

  // Test 2: TikTok Videos
  console.log("\n[2/4] TikTok — scrapeTikTokVideos (10 videos)...");
  const t1 = Date.now();
  try {
    const videos = await scrapeTikTokVideos(TT_USERNAMES, 10);
    console.log(`✅ ${videos.length} videos TikTok scraped (${Date.now() - t1}ms)`);
    if (videos.length > 0) {
      const v = videos[0] as Record<string, unknown>;
      console.log({
        id: v.id,
        text: String(v.text ?? "").slice(0, 60),
        playCount: v.playCount,
        diggCount: v.diggCount,
      });
    }
  } catch (err) {
    console.error(`❌ TikTok videos: ${(err as Error).message}`);
  }

  // Test 3: Instagram Profile
  console.log("\n[3/4] Instagram — scrapeInstagramProfiles...");
  const t2 = Date.now();
  try {
    const igProfiles = await scrapeInstagramProfiles(IG_USERNAMES);
    console.log(`✅ ${igProfiles.length} profil Instagram scraped (${Date.now() - t2}ms)`);
    if (igProfiles.length > 0) {
      const p = igProfiles[0] as Record<string, unknown>;
      console.log({
        username: p.username,
        followersCount: p.followersCount,
        postsCount: p.postsCount,
      });
    }
  } catch (err) {
    console.error(`❌ Instagram profiles: ${(err as Error).message}`);
  }

  // Test 4: Instagram Posts
  console.log("\n[4/4] Instagram — scrapeInstagramPosts (10 posts)...");
  const t3 = Date.now();
  try {
    const igPosts = await scrapeInstagramPosts(IG_USERNAMES, 10);
    console.log(`✅ ${igPosts.length} posts Instagram scraped (${Date.now() - t3}ms)`);
    if (igPosts.length > 0) {
      const p = igPosts[0] as Record<string, unknown>;
      console.log({
        url: p.url ?? p.shortCode,
        likesCount: p.likesCount,
        commentsCount: p.commentsCount,
        timestamp: p.timestamp,
      });
    }
  } catch (err) {
    console.error(`❌ Instagram posts: ${(err as Error).message}`);
  }

  console.log("\n✅ Test Apify selesai!");
}

main().catch(err => {
  console.error("\n❌ Fatal Error:", err.message ?? err);
  process.exit(1);
});
