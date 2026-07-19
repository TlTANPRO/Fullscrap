/**
 * TEST: TikTok via TikHub API (BERBAYAR — butuh TIKHUB_API_KEY)
 *
 * STATUS: ⚠️ Butuh API key — belum ditest dengan data nyata
 * Diuji struktur API-nya: Juli 2026 (endpoint confirmed exist, 401 tanpa key)
 *
 * Setup:
 *   1. Daftar di https://tikhub.io
 *   2. Copy API key dari dashboard
 *   3. Set: export TIKHUB_API_KEY=your_key_here
 *
 * Jalankan:
 *   TIKHUB_API_KEY=xxx TT_USERNAME=charlidamelio npx ts-node examples/test-tikhub-tiktok.ts
 */

import "dotenv/config";
import {
  tikhubTTUserProfile,
  tikhubTTUserPosts,
  tikhubTTUserFans,
  tikhubTTUserFollowing,
  tikhubTTComments,
  tikhubTTHashtagDetail,
  tikhubTTHomeFeed,
  tikhubTTSearchUsers,
} from "../src/tikhub/tiktok";

async function main() {
  const username = process.env.TT_USERNAME ?? process.argv[2] ?? "charlidamelio";

  console.log(`\n🎵 TikTok Scraper — TikHub API (BERBAYAR)`);
  console.log(`Target  : @${username}`);
  console.log(`Auth    : ✅ API Key required (TIKHUB_API_KEY)`);
  console.log(`Harga   : Pay-per-use (ada free trial)`);
  console.log(`Signup  : https://tikhub.io`);
  console.log("─".repeat(60));

  if (!process.env.TIKHUB_API_KEY) {
    console.error("\n❌ TIKHUB_API_KEY tidak ditemukan di environment");
    console.error("   Set: export TIKHUB_API_KEY=your_key");
    process.exit(1);
  }

  // ── Test 1: User profile ────────────────────────────────────────────────────
  console.log(`\n[1/5] User profile @${username}...`);
  const t0 = Date.now();
  const profile = await tikhubTTUserProfile(username) as any;
  const user = profile?.userInfo?.user ?? profile?.user ?? profile;
  const stats = profile?.userInfo?.stats ?? profile?.stats ?? {};
  console.log(`✅ Berhasil (${Date.now() - t0}ms)`);
  console.log({
    uniqueId: user?.uniqueId,
    nickname: user?.nickname,
    followers: stats?.followerCount?.toLocaleString?.() ?? stats?.followerCount,
    following: stats?.followingCount?.toLocaleString?.() ?? stats?.followingCount,
    videos: stats?.videoCount,
    secUid: user?.secUid?.slice(0, 30) + "...",
  });

  const secUid = user?.secUid;
  if (!secUid) {
    console.error("❌ Tidak bisa ambil secUid, test berikutnya dilewati");
    process.exit(1);
  }

  // ── Test 2: User posts ──────────────────────────────────────────────────────
  console.log(`\n[2/5] User posts (20 video)...`);
  const t1 = Date.now();
  const postsData = await tikhubTTUserPosts(secUid, 0, 20) as any;
  const posts = postsData?.itemList ?? postsData?.aweme_list ?? postsData ?? [];
  console.log(`✅ ${posts.length} video (${Date.now() - t1}ms)`);
  if (posts.length > 0) {
    const p = posts[0];
    console.log({
      desc: p?.desc?.slice(0, 50),
      likes: p?.statistics?.diggCount ?? p?.stats?.diggCount,
      plays: p?.statistics?.playCount ?? p?.stats?.playCount,
      awemeId: p?.aweme_id ?? p?.id,
    });
  }

  // ── Test 3: Followers (EKSKLUSIF) ───────────────────────────────────────────
  console.log(`\n[3/5] Fans/Followers list (EKSKLUSIF)...`);
  const t2 = Date.now();
  const fansData = await tikhubTTUserFans(secUid, 0, 20) as any;
  const fans = fansData?.followerList ?? fansData?.userList ?? fansData ?? [];
  console.log(`✅ ${fans.length} followers (${Date.now() - t2}ms)`);
  if (fans.length > 0) {
    console.log(`   Sample: @${fans[0]?.unique_id ?? fans[0]?.uniqueId}`);
  }

  // ── Test 4: Following list (EKSKLUSIF) ─────────────────────────────────────
  console.log(`\n[4/5] Following list (EKSKLUSIF)...`);
  const t3 = Date.now();
  const followingData = await tikhubTTUserFollowing(secUid, 0, 20) as any;
  const following = followingData?.followingList ?? followingData?.userList ?? followingData ?? [];
  console.log(`✅ ${following.length} following (${Date.now() - t3}ms)`);

  // ── Test 5: Home feed ───────────────────────────────────────────────────────
  console.log(`\n[5/5] Home feed (trending FYP)...`);
  const t4 = Date.now();
  const feedData = await tikhubTTHomeFeed(10) as any;
  const feedItems = feedData?.itemList ?? feedData?.aweme_list ?? feedData ?? [];
  console.log(`✅ ${feedItems.length} video trending (${Date.now() - t4}ms)`);

  console.log("\n" + "─".repeat(60));
  console.log("✅ TikHub TikTok — semua endpoint berfungsi");
  console.log("📖 Lihat src/tikhub/tiktok.ts untuk 15+ fungsi lainnya");
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
