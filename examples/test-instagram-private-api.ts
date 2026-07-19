/**
 * TEST: Instagram via instagram-private-api Node.js (butuh login)
 *
 * STATUS: ⚠️ Butuh npm install instagram-private-api + akun Instagram
 * Library confirmed aktif: v1.46.1 (Juli 2026)
 *
 * Setup:
 *   npm install instagram-private-api
 *   export IG_USERNAME=your_username
 *   export IG_PASSWORD=your_password
 *
 * Jalankan:
 *   IG_USERNAME=xxx IG_PASSWORD=yyy IG_TARGET=instagram npx ts-node examples/test-instagram-private-api.ts
 *
 * NOTE: Gunakan instagrapi (Python) jika server sudah ada Python.
 *       Paket ini untuk environment pure Node.js/TypeScript.
 */

import "dotenv/config";
import {
  igPrivateUserInfo,
  igPrivateUserPosts,
  igPrivateUserStories,
  igPrivateUserFollowers,
  igPrivateUserFollowing,
  igPrivateUserHighlights,
} from "../src/instagram-private-api/instagram";

async function main() {
  const username = process.env.IG_TARGET ?? process.argv[2] ?? "instagram";

  console.log(`\n📸 Instagram Scraper — instagram-private-api (Node.js, butuh login)`);
  console.log(`Target  : @${username}`);
  console.log(`Auth    : ✅ Login required (IG_USERNAME + IG_PASSWORD)`);
  console.log(`Install : npm install instagram-private-api`);
  console.log(`Harga   : GRATIS`);
  console.log("─".repeat(60));

  if (!process.env.IG_USERNAME || !process.env.IG_PASSWORD) {
    console.error("\n❌ Set IG_USERNAME dan IG_PASSWORD di environment");
    process.exit(1);
  }

  // ── Test 1: User info ────────────────────────────────────────────────────
  console.log(`\n[1/5] User info @${username}...`);
  const t0 = Date.now();
  const info = await igPrivateUserInfo(username) as any;
  console.log(`✅ Berhasil (${Date.now() - t0}ms)`);
  console.log({
    username: info?.username,
    fullName: info?.full_name,
    followers: info?.follower_count?.toLocaleString(),
    following: info?.following_count,
    posts: info?.media_count,
    isPrivate: info?.is_private,
  });

  // ── Test 2: Stories (EKSKLUSIF) ─────────────────────────────────────────
  console.log(`\n[2/5] Stories @${username} (EKSKLUSIF)...`);
  const t1 = Date.now();
  const stories = await igPrivateUserStories(username) as any[];
  console.log(`✅ ${stories.length} stories aktif (${Date.now() - t1}ms)`);
  if (stories.length > 0) {
    const s = stories[0] as any;
    console.log({
      type: s?.media_type === 1 ? "foto" : "video",
      taken_at: s?.taken_at,
    });
  }

  // ── Test 3: Posts ───────────────────────────────────────────────────────
  console.log(`\n[3/5] 5 posts terakhir @${username}...`);
  const t2 = Date.now();
  const posts = await igPrivateUserPosts(username, 5) as any[];
  console.log(`✅ ${posts.length} posts (${Date.now() - t2}ms)`);
  for (const p of posts.slice(0, 3)) {
    const type = { 1: "foto", 2: "video", 8: "album" }[p?.media_type as 1|2|8] ?? "?";
    console.log(`   [${type}] ${(p?.like_count ?? 0).toLocaleString()} likes`);
  }

  // ── Test 4: Followers (EKSKLUSIF) ──────────────────────────────────────
  console.log(`\n[4/5] Followers list @${username} (EKSKLUSIF, 10 saja)...`);
  const t3 = Date.now();
  const followers = await igPrivateUserFollowers(username, 10) as any[];
  console.log(`✅ ${followers.length} followers sample (${Date.now() - t3}ms)`);
  for (const f of followers.slice(0, 3)) {
    console.log(`   @${f?.username} — ${f?.full_name}`);
  }

  // ── Test 5: Highlights ──────────────────────────────────────────────────
  console.log(`\n[5/5] Highlights @${username}...`);
  const t4 = Date.now();
  const highlights = await igPrivateUserHighlights(username) as any[];
  console.log(`✅ ${highlights.length} highlights (${Date.now() - t4}ms)`);

  console.log("\n" + "─".repeat(60));
  console.log("✅ instagram-private-api — semua endpoint berfungsi");
  console.log("📖 Lihat src/instagram-private-api/instagram.ts untuk fungsi lengkap");
}

main().catch((e) => {
  console.error("❌", e.message);
  if (e.message?.includes("tidak terinstall")) {
    console.error("   Install: npm install instagram-private-api");
  }
  process.exit(1);
});
