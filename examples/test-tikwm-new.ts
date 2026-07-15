/**
 * TEST: TikTok via TikWM — Endpoint Baru Batch 2 (GRATIS, no API key)
 *
 * Menguji endpoint-endpoint yang ditemukan Juli 2026 Batch 2:
 *   - tikwmUserFollowing()  → daftar following user by numeric user_id ✅ BARU
 *   - tikwmFeedList()       → trending video by region ✅ BARU
 *
 * Jalankan: npx ts-node examples/test-tikwm-new.ts
 * Tidak perlu API key atau setup apapun.
 */

import "dotenv/config";
import {
  tikwmUserInfo,
  tikwmUserFollowing,
  tikwmFeedList,
} from "../src/tikwm/tiktok";

async function main() {
  console.log(`\n🎵 TikTok Scraper — TikWM Endpoint Baru Batch 2 (GRATIS)`);
  console.log(`Auth    : ❌ Tidak perlu`);
  console.log(`Status  : tikwmUserFollowing + tikwmFeedList — Confirmed Works Juli 2026`);
  console.log("─".repeat(60));

  // ── Test 1: User Following ────────────────────────────────────────────────
  console.log("\n[1/2] tikwmUserFollowing() — daftar following user...");
  console.log("  ⚠️ Perlu user_id NUMERIK (bukan username)");
  console.log("  → Dapatkan user_id lewat: tikwmUserInfo(username).user.id");

  const TARGET_USER = "tiktokcreators";
  let userId: string;
  try {
    const { user } = await tikwmUserInfo(TARGET_USER);
    userId = user.id;
    console.log(`  → user_id untuk @${TARGET_USER}: ${userId}`);
  } catch {
    userId = "107955"; // fallback user_id
    console.log(`  → tikwmUserInfo gagal, pakai fallback user_id: ${userId}`);
  }

  const t0 = Date.now();
  const { followings, hasMore, cursor } = await tikwmUserFollowing(userId, 5);
  console.log(`✅ Berhasil (${Date.now() - t0}ms) — ${followings.length} following ditemukan`);

  for (const f of followings.slice(0, 3)) {
    console.log({
      unique_id: f.unique_id,
      nickname: f.nickname,
      region: f.region,
      verified: f.verified,
      is_private: f.is_private_account,
    });
  }
  console.log(`hasMore: ${hasMore} | nextCursor: ${cursor}`);

  // ── Test 2: Feed List (Trending by Region) ────────────────────────────────
  console.log("\n[2/2] tikwmFeedList('ID') — trending video di Indonesia...");
  const t1 = Date.now();
  const { videos } = await tikwmFeedList("ID", 5);
  console.log(`✅ Berhasil (${Date.now() - t1}ms) — ${videos.length} video trending`);

  for (const v of videos.slice(0, 3)) {
    console.log({
      video_id: v.video_id,
      author: v.author?.unique_id,
      region: v.region,
      title: (v.title ?? "").slice(0, 60),
      play_count: v.play_count?.toLocaleString?.() ?? v.play_count,
      digg_count: v.digg_count?.toLocaleString?.() ?? v.digg_count,
      duration: `${v.duration}s`,
    });
  }

  // ── Ringkasan ──────────────────────────────────────────────────────────────
  console.log("\n" + "─".repeat(60));
  console.log("Ringkasan endpoint baru Batch 2:");
  console.log("  ✅ tikwmUserFollowing(userId, count, cursor)");
  console.log("     → Input: user_id numerik (bukan username!)");
  console.log("     → Output: followings[], hasMore, cursor");
  console.log("     ⚠️ Error jika user sembunyikan following list (bukan crash)");
  console.log("");
  console.log("  ✅ tikwmFeedList(region, count, cursor)");
  console.log("     → Input: kode negara ISO 2 huruf (US, ID, GB, JP, KR, dll)");
  console.log("     → Output: videos[], hasMore, cursor");
  console.log("     ℹ️ Response berupa array langsung (bukan {videos:[...]})\n");
}

main().catch(err => {
  console.error("\n❌ Error:", err.message ?? err);
  process.exit(1);
});
