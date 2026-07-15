/**
 * TEST: TikTok via TikWM (GRATIS, no API key)
 *
 * CONFIRMED WORKS — diuji Juli 2026
 * Jalankan: TT_USERNAME=charlidamelio npx ts-node examples/test-tikwm.ts
 *
 * Tidak perlu setup apapun — langsung jalankan.
 */

import "dotenv/config";
import {
  tikwmUserInfo,
  tikwmHashtagInfo,
  tikwmHashtagPosts,
  tikwmSearchVideos,
  tikwmUserPostsNote,
} from "../src/tikwm/tiktok";
import { parseTikTokUsername } from "../src/utils/parse-username";

async function main() {
  const rawInput = process.env.TT_USERNAME ?? process.argv[2] ?? "charlidamelio";
  const username = parseTikTokUsername(rawInput);

  console.log(`\n🎵 TikTok Scraper — TikWM (GRATIS)`);
  console.log(`Target  : @${username}`);
  console.log(`Auth    : ❌ Tidak perlu`);
  console.log(`Status  : Confirmed works (Juli 2026)`);
  console.log("─".repeat(60));

  let userId = "";

  // ── Test 1: User info ──────────────────────────────────────────
  console.log("\n[1/4] User info...");
  const t0 = Date.now();
  const { user, stats } = await tikwmUserInfo(username);
  console.log(`✅ Berhasil (${Date.now() - t0}ms)`);
  console.log({
    uniqueId: user.uniqueId,
    nickname: user.nickname,
    verified: user.verified,
    followers: stats.followerCount.toLocaleString(),
    following: stats.followingCount.toLocaleString(),
    likes: stats.heartCount.toLocaleString(),
    videos: stats.videoCount.toLocaleString(),
    bio: user.signature.slice(0, 80),
  });
  userId = user.id;

  // Catatan untuk user posts
  console.log("\n[!] User posts endpoint:");
  console.log(" ", tikwmUserPostsNote());

  // ── Test 2: Hashtag info ───────────────────────────────────────
  const HASHTAG = "fyp";
  console.log(`\n[2/4] Hashtag info (#${HASHTAG})...`);
  const t1 = Date.now();
  const tagInfo = await tikwmHashtagInfo(HASHTAG);
  console.log(`✅ Berhasil (${Date.now() - t1}ms)`);
  console.log({
    id: tagInfo.id,
    name: tagInfo.cha_name,
    user_count: tagInfo.user_count?.toLocaleString(),
    view_count: tagInfo.view_count?.toLocaleString(),
  });

  // ── Test 3: Hashtag posts ──────────────────────────────────────
  console.log(`\n[3/4] Hashtag posts (#${HASHTAG})...`);
  const t2 = Date.now();
  const hashtagResult = await tikwmHashtagPosts(tagInfo.id, 5, 0);
  console.log(`✅ ${hashtagResult.videos.length} videos (hasMore: ${hashtagResult.hasMore}) (${Date.now() - t2}ms)`);
  if (hashtagResult.videos.length > 0) {
    const top = hashtagResult.videos.sort((a, b) => b.play_count - a.play_count)[0];
    console.log("Top video:", {
      id: top.video_id,
      title: top.title.slice(0, 60),
      play_count: top.play_count.toLocaleString(),
      digg_count: top.digg_count.toLocaleString(),
      author: top.author.unique_id,
    });
  }

  // ── Test 4: Search ─────────────────────────────────────────────
  const KEYWORD = "indonesia viral";
  console.log(`\n[4/4] Search videos ("${KEYWORD}")...`);
  const t3 = Date.now();
  const searchResult = await tikwmSearchVideos(KEYWORD, 5, 0);
  console.log(`✅ ${searchResult.videos.length} videos (hasMore: ${searchResult.hasMore}) (${Date.now() - t3}ms)`);
  if (searchResult.videos.length > 0) {
    const v = searchResult.videos[0];
    console.log("First result:", {
      id: v.video_id,
      title: v.title.slice(0, 60),
      play_count: v.play_count?.toLocaleString(),
      author: v.author?.unique_id,
    });
  }

  console.log("\n✅ Semua test TikWM berhasil!");
  console.log("─".repeat(60));
  console.log("Ringkasan endpoint yang works:");
  console.log("  ✅ user/info       — profil + stats user");
  console.log("  ✅ challenge/info  — info hashtag (id, nama, view count)");
  console.log("  ✅ challenge/posts — video berdasarkan hashtag");
  console.log("  ✅ feed/search     — cari video berdasarkan keyword");
  console.log("  ⚠️  user/posts    — Cloudflare block dari server (works dari browser/residential IP)");
}

main().catch(err => {
  console.error("\n❌ Error:", err.message ?? err);
  process.exit(1);
});
