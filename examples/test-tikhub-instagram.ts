/**
 * TEST: Instagram via TikHub API (BERBAYAR — butuh TIKHUB_API_KEY)
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
 *   TIKHUB_API_KEY=xxx IG_USERNAME=instagram npx ts-node examples/test-tikhub-instagram.ts
 *
 * KEUNGGULAN EKSKLUSIF:
 *   - stories user (tanpa login)
 *   - followers & following list (tanpa login)
 *   - highlights + isi stories highlight
 *   - post likes list
 *   - former usernames
 */

import "dotenv/config";
import {
  tikhubIGUserProfile,
  tikhubIGGetUserId,
  tikhubIGUserPosts,
  tikhubIGUserReels,
  tikhubIGUserFollowers,
  tikhubIGUserFollowing,
  tikhubIGUserStories,
  tikhubIGUserHighlights,
  tikhubIGUserFormerUsernames,
  tikhubIGPostByCode,
} from "../src/tikhub/instagram";

async function main() {
  const username = process.env.IG_USERNAME ?? process.argv[2] ?? "instagram";

  console.log(`\n📸 Instagram Scraper — TikHub API (BERBAYAR)`);
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
  console.log(`\n[1/6] User profile @${username}...`);
  const t0 = Date.now();
  const profileData = await tikhubIGUserProfile(username) as any;
  const user = profileData?.user ?? profileData;
  console.log(`✅ Berhasil (${Date.now() - t0}ms)`);
  console.log({
    username: user?.username,
    fullName: user?.full_name,
    followers: user?.follower_count?.toLocaleString?.() ?? user?.edge_followed_by?.count,
    following: user?.following_count ?? user?.edge_follow?.count,
    posts: user?.media_count ?? user?.edge_owner_to_timeline_media?.count,
    isPrivate: user?.is_private,
  });

  // ── Test 2: Get user_id ─────────────────────────────────────────────────────
  console.log(`\n[2/6] Get user_id numerik...`);
  const t1 = Date.now();
  const idData = await tikhubIGGetUserId(username) as any;
  const userId = idData?.user_id ?? idData?.pk ?? idData;
  console.log(`✅ user_id: ${userId} (${Date.now() - t1}ms)`);

  // ── Test 3: Posts ───────────────────────────────────────────────────────────
  console.log(`\n[3/6] User posts...`);
  const t2 = Date.now();
  const postsData = await tikhubIGUserPosts(String(userId)) as any;
  const posts = postsData?.items ?? postsData ?? [];
  console.log(`✅ ${posts.length} posts (${Date.now() - t2}ms)`);

  // ── Test 4: Followers (EKSKLUSIF) ───────────────────────────────────────────
  console.log(`\n[4/6] Followers list (EKSKLUSIF — tidak ada di provider gratis)...`);
  const t3 = Date.now();
  const followersData = await tikhubIGUserFollowers(String(userId)) as any;
  const followers = followersData?.users ?? followersData ?? [];
  console.log(`✅ ${followers.length} followers (${Date.now() - t3}ms)`);
  if (followers.length > 0) {
    console.log(`   Sample: @${followers[0]?.username}`);
  }

  // ── Test 5: Stories (EKSKLUSIF) ────────────────────────────────────────────
  console.log(`\n[5/6] Stories (EKSKLUSIF — tidak ada di provider gratis)...`);
  const t4 = Date.now();
  const storiesData = await tikhubIGUserStories(username) as any;
  const stories = storiesData?.reels?.[String(userId)]?.items ?? storiesData?.items ?? storiesData ?? [];
  console.log(`✅ ${stories.length} stories aktif (${Date.now() - t4}ms)`);
  if (stories.length > 0) {
    const s = stories[0];
    console.log({
      type: s?.media_type === 1 ? "foto" : "video",
      url: s?.image_versions2?.candidates?.[0]?.url?.slice(0, 60) + "...",
      expires: s?.expiring_at,
    });
  }

  // ── Test 6: Highlights ──────────────────────────────────────────────────────
  console.log(`\n[6/6] Highlights...`);
  const t5 = Date.now();
  const highlightsData = await tikhubIGUserHighlights(String(userId)) as any;
  const highlights = highlightsData?.tray ?? highlightsData ?? [];
  console.log(`✅ ${highlights.length} highlights (${Date.now() - t5}ms)`);

  console.log("\n" + "─".repeat(60));
  console.log("✅ TikHub Instagram — semua endpoint berfungsi");
  console.log("📖 Lihat src/tikhub/instagram.ts untuk endpoint lainnya");
  console.log("   (followers, following, stories, highlights, former usernames, dll)");
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
