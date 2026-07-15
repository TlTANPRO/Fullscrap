/**
 * TEST: Instagram via HikerAPI
 *
 * Jalankan:
 *   IG_USERNAME=nike npx ts-node examples/test-hikerapi.ts
 *
 * Daftar di: https://hikerapi.com/sign-up (100 request gratis)
 *
 * Set di .env:
 *   HIKERAPI_KEY=your_key
 */

import "dotenv/config";
import {
  hikerUserByUsername,
  hikerGetAllMedias,
  hikerUserClips,
  hikerUserStories,
  hikerUserHighlights,
  hikerUserFollowers,
  hikerHashtagTopPosts,
  hikerHashtagRecentPosts,
  hikerSearchUsers,
} from "../src/hikerapi/instagram";
import { parseInstagramUsername } from "../src/utils/parse-username";

async function main() {
  const rawInput = process.env.IG_USERNAME ?? process.argv[2] ?? "nike";
  const username = parseInstagramUsername(rawInput);

  console.log(`\n📸 Instagram Scraper — HikerAPI`);
  console.log(`Target: @${username}`);
  console.log(`Key   : ${process.env.HIKERAPI_KEY ? "✅ Set" : "❌ Tidak ada (set HIKERAPI_KEY, daftar di hikerapi.com)"}`);
  console.log(`Harga : $0.0006/request | 100 request GRATIS saat daftar`);
  console.log("─".repeat(60));

  // Test 1: Profil
  console.log("\n[1/5] Fetching profile...");
  const t0 = Date.now();
  const profile = await hikerUserByUsername(username);
  console.log(`✅ Profile fetched (${Date.now() - t0}ms)`);
  console.log({
    pk: profile.pk,
    username: profile.username,
    full_name: profile.full_name,
    is_verified: profile.is_verified,
    follower_count: profile.follower_count?.toLocaleString(),
    following_count: profile.following_count?.toLocaleString(),
    media_count: profile.media_count?.toLocaleString(),
    biography: profile.biography?.slice(0, 80),
  });

  // Test 2: Media (posts + reels)
  console.log(`\n[2/5] Fetching all media (userId=${profile.pk}, max 30)...`);
  const t1 = Date.now();
  const medias = await hikerGetAllMedias(profile.pk, 30);
  console.log(`✅ ${medias.length} media fetched (${Date.now() - t1}ms)`);

  if (medias.length > 0) {
    const top = (medias as Array<Record<string, unknown>>).sort((a, b) => Number(b.like_count ?? 0) - Number(a.like_count ?? 0))[0];
    console.log("Top media by likes:", {
      pk: top.pk,
      like_count: top.like_count,
      comment_count: top.comment_count,
      media_type: top.media_type,
    });
  }

  // Test 3: Clips (reels saja)
  console.log(`\n[3/5] Fetching reels/clips...`);
  const t2 = Date.now();
  const { items: clips } = await hikerUserClips(profile.pk);
  console.log(`✅ ${clips.length} reels fetched (${Date.now() - t2}ms)`);

  // Test 4: Hashtag posts
  const HASHTAG = "sneakers";
  console.log(`\n[4/5] Fetching hashtag top posts (#${HASHTAG})...`);
  const t3 = Date.now();
  const tagPosts = await hikerHashtagTopPosts(HASHTAG);
  console.log(`✅ ${tagPosts.length} hashtag posts fetched (${Date.now() - t3}ms)`);

  // Test 5: Search users
  console.log(`\n[5/5] Search users ("${username}")...`);
  const t4 = Date.now();
  const searchResults = await hikerSearchUsers(username);
  console.log(`✅ ${searchResults.length} users found (${Date.now() - t4}ms)`);

  console.log("\n✅ Semua test HikerAPI berhasil!");
  console.log(`Total requests used: ~7 (dari 100 gratis)`);
}

main().catch(err => {
  console.error("\n❌ Error:", err.message ?? err);
  process.exit(1);
});
