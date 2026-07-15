/**
 * TEST: Instagram via Unofficial Web API (GRATIS, no API key)
 *
 * CONFIRMED WORKS — diuji Juli 2026
 * Jalankan: IG_USERNAME=nike npx ts-node examples/test-instagram-web.ts
 *
 * Tidak perlu setup apapun — langsung jalankan.
 */

import "dotenv/config";
import {
  getUserProfile,
  getUserPosts,
  getUserReels,
  searchUsers,
  getAllUserPosts,
} from "../src/instagram-web/instagram";
import { parseInstagramUsername } from "../src/utils/parse-username";

async function main() {
  const rawInput = process.env.IG_USERNAME ?? process.argv[2] ?? "nike";
  const username = parseInstagramUsername(rawInput);

  console.log(`\n📸 Instagram Scraper — Unofficial Web API (GRATIS)`);
  console.log(`Target  : @${username}`);
  console.log(`Auth    : ❌ Tidak perlu`);
  console.log(`Status  : Confirmed works (Juli 2026)`);
  console.log("─".repeat(60));

  // ── Test 1: Profile ────────────────────────────────────────────
  console.log("\n[1/4] Fetching profile...");
  const t0 = Date.now();
  const profile = await getUserProfile(username);
  console.log(`✅ Berhasil (${Date.now() - t0}ms)`);
  console.log({
    id: profile.id,
    username: profile.username,
    full_name: profile.full_name,
    verified: profile.is_verified,
    private: profile.is_private,
    followers: profile.follower_count.toLocaleString(),
    following: profile.following_count.toLocaleString(),
    total_posts: profile.media_count.toLocaleString(),
    biography: profile.biography.slice(0, 80),
    external_url: profile.external_url,
    recent_posts_loaded: profile.recent_posts.length,
    has_more_posts: profile.has_more_posts,
  });

  if (profile.recent_posts.length > 0) {
    const topPost = profile.recent_posts.sort((a, b) => b.like_count - a.like_count)[0];
    console.log("\nTop post dari 12 terbaru:", {
      shortcode: topPost.shortcode,
      url: topPost.url,
      likes: topPost.like_count.toLocaleString(),
      comments: topPost.comment_count.toLocaleString(),
      is_video: topPost.is_video,
      caption: topPost.caption.slice(0, 60),
    });
  }

  // ── Test 2: Posts pagination ───────────────────────────────────
  console.log(`\n[2/4] Fetching more posts (page 2, cursor pagination)...`);
  const t1 = Date.now();
  const page2 = await getUserPosts(profile.id, profile.posts_end_cursor);
  console.log(`✅ ${page2.items.length} more posts (more_available: ${page2.more_available}) (${Date.now() - t1}ms)`);
  console.log(`Total loaded so far: ${profile.recent_posts.length + page2.items.length} posts`);
  console.log(`Next cursor: ${page2.next_max_id.slice(0, 30)}...`);

  // ── Test 3: Reels ──────────────────────────────────────────────
  console.log(`\n[3/4] Fetching reels...`);
  const t2 = Date.now();
  const reelsResult = await getUserReels(profile.id);
  console.log(`✅ ${reelsResult.items.length} reels (more_available: ${reelsResult.more_available}) (${Date.now() - t2}ms)`);
  if (reelsResult.items.length > 0) {
    const r = reelsResult.items[0];
    console.log("First reel:", {
      id: r.id,
      url: r.url,
      likes: r.like_count.toLocaleString(),
      views: r.view_count.toLocaleString(),
      caption: r.caption.slice(0, 60),
    });
  }

  // ── Test 4: Search ─────────────────────────────────────────────
  const SEARCH_QUERY = username;
  console.log(`\n[4/4] Search users ("${SEARCH_QUERY}")...`);
  const t3 = Date.now();
  const searchResult = await searchUsers(SEARCH_QUERY);
  console.log(`✅ ${searchResult.users.length} users, ${searchResult.hashtags.length} hashtags (${Date.now() - t3}ms)`);
  if (searchResult.users.length > 0) {
    const topUser = searchResult.users[0];
    console.log("Top user result:", {
      username: topUser.username,
      full_name: topUser.full_name,
      followers: topUser.follower_count?.toLocaleString(),
      verified: topUser.is_verified,
    });
  }

  console.log("\n✅ Semua test Instagram Web API berhasil!");
  console.log("─".repeat(60));
  console.log("Ringkasan endpoint yang works:");
  console.log("  ✅ getUserProfile()  — profil + 12 post terbaru");
  console.log("  ✅ getUserPosts()    — posts dengan cursor pagination");
  console.log("  ✅ getUserReels()    — reels dengan pagination");
  console.log("  ✅ searchUsers()     — cari user dan hashtag");
  console.log("  ⚠️  followers       — login_required");
  console.log("  ⚠️  stories         — login_required");
  console.log("  ⚠️  hashtag feed    — login_required");
}

main().catch(err => {
  console.error("\n❌ Error:", err.message ?? err);
  process.exit(1);
});
