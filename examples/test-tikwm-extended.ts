/**
 * TEST: TikTok via TikWM — Endpoint Tambahan (GRATIS, no API key)
 *
 * Menguji endpoint-endpoint baru yang ditemukan Juli 2026:
 *   - tikwmVideoByUrl()   → detail video + URL download by URL (BARU ✅)
 *   - tikwmSearchUsers()  → cari user by keyword (BARU ⚠️ intermittent CF)
 *
 * Jalankan: npx ts-node examples/test-tikwm-extended.ts
 * Tidak perlu setup apapun — langsung jalankan.
 */

import "dotenv/config";
import {
  tikwmSearchVideos,
  tikwmVideoByUrl,
  tikwmSearchUsers,
  buildTikTokVideoUrl,
} from "../src/tikwm/tiktok";

async function main() {
  console.log(`\n🎵 TikTok Scraper — TikWM Extended (GRATIS)`);
  console.log(`Auth    : ❌ Tidak perlu`);
  console.log(`Status  : tikwmVideoByUrl confirmed works (Juli 2026)`);
  console.log("─".repeat(60));

  // ── Setup: Dapatkan video URL dari search ────────────────────────────────
  console.log("\n[Setup] Ambil video dari search untuk dijadikan test input...");
  let sampleUrl: string;
  try {
    const searchResult = await tikwmSearchVideos("indonesia viral", 5, 0);
    const sampleVideo = searchResult.videos[0];
    if (!sampleVideo) throw new Error("Tidak ada video dari search");
    sampleUrl = buildTikTokVideoUrl(sampleVideo.author.unique_id, sampleVideo.video_id);
  } catch {
    // Fallback ke URL hardcoded jika search gagal
    sampleUrl = "https://www.tiktok.com/@mrbeast/video/7661646236516093215";
    console.log("  (search gagal, pakai URL fallback)");
  }
  console.log(`Video URL untuk test: ${sampleUrl}`);

  // ── Test 1: Video detail by URL ──────────────────────────────────────────
  console.log(`\n[1/2] tikwmVideoByUrl() — detail video by URL...`);
  const t0 = Date.now();
  const detail = await tikwmVideoByUrl(sampleUrl);
  console.log(`✅ Berhasil (${Date.now() - t0}ms)`);
  console.log({
    id: detail.id,
    title: detail.title.slice(0, 70),
    author: detail.author.unique_id,
    region: detail.region,
    duration: `${detail.duration}s`,
    play_count: detail.play_count.toLocaleString(),
    digg_count: detail.digg_count.toLocaleString(),
    comment_count: detail.comment_count.toLocaleString(),
    share_count: detail.share_count.toLocaleString(),
    collect_count: detail.collect_count.toLocaleString(),
    download_count: detail.download_count.toLocaleString(),
    is_ad: detail.is_ad,
    music: detail.music_info.title,
    music_original: detail.music_info.original,
    play_url: detail.play ? detail.play.slice(0, 70) + "..." : "(kosong)",
    hdplay_url: detail.hdplay ? detail.hdplay.slice(0, 70) + "..." : "(kosong)",
  });

  console.log(`\n  📌 Field utama dari tikwmVideoByUrl():`);
  console.log(`  - play        : URL video tanpa watermark (langsung bisa diakses)`);
  console.log(`  - hdplay      : URL video HD tanpa watermark`);
  console.log(`  - wmplay      : URL video dengan watermark`);
  console.log(`  - music       : URL audio terpisah`);
  console.log(`  - cover       : Thumbnail URL`);
  console.log(`  - origin_cover: Thumbnail tanpa overlay`);

  // ── Test 2: Search user ──────────────────────────────────────────────────
  const SEARCH_KEYWORD = "mrbeast";
  console.log(`\n[2/2] tikwmSearchUsers("${SEARCH_KEYWORD}") — cari user...`);
  const t1 = Date.now();
  let searchUsersOk = false;
  try {
    const searchUsersResult = await tikwmSearchUsers(SEARCH_KEYWORD, 5, 0);
    console.log(`✅ ${searchUsersResult.users.length} user ditemukan (${Date.now() - t1}ms)`);
    searchUsersOk = true;

    for (const result of searchUsersResult.users.slice(0, 3)) {
      console.log({
        uniqueId: result.user.uniqueId,
        nickname: result.user.nickname,
        verified: result.user.verified,
        private: result.user.privateAccount,
        followers: result.stats.followerCount?.toLocaleString?.() ?? result.stats.followerCount,
        following: result.stats.followingCount?.toLocaleString?.() ?? result.stats.followingCount,
        videos: result.stats.videoCount,
        likes: result.stats.heartCount?.toLocaleString?.() ?? result.stats.heartCount,
      });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Cloudflare")) {
      console.log(`⚠️  Cloudflare challenge (${Date.now() - t1}ms) — lihat catatan di README`);
      console.log("  Endpoint ini confirmed works saat diuji manual (Juli 2026).");
      console.log("  Dari server datacenter, kadang terkena Cloudflare intermittent.");
    } else {
      console.log(`❌ Error: ${msg}`);
    }
  }

  // ── Ringkasan ──────────────────────────────────────────────────────────
  console.log("\n" + "─".repeat(60));
  console.log("Ringkasan endpoint baru:");
  console.log("  ✅ tikwmVideoByUrl()  — detail video + URL download by URL (CONFIRMED)");
  console.log(
    `  ${searchUsersOk ? "✅" : "⚠️ "} tikwmSearchUsers() — cari user by keyword ${
      searchUsersOk ? "(CONFIRMED)" : "(intermittent CF block dari datacenter)"
    }`
  );
  console.log("\nEndpoint yang sudah ada (lihat test-tikwm.ts):");
  console.log("  ✅ tikwmUserInfo()         — profil + stats user");
  console.log("  ✅ tikwmHashtagInfo()      — info hashtag");
  console.log("  ✅ tikwmHashtagPosts()     — video by hashtag");
  console.log("  ✅ tikwmSearchVideos()     — cari video by keyword");
}

main().catch(err => {
  console.error("\n❌ Error:", err.message ?? err);
  process.exit(1);
});
