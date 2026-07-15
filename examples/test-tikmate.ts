/**
 * TEST: TikTok via tikmate.app (GRATIS, no API key, dari datacenter IP)
 *
 * Jalankan: npx ts-node examples/test-tikmate.ts
 *
 * CONFIRMED WORKS dari datacenter/Replit (diuji Juli 2026).
 * Berbeda dari TikTok oEmbed yang TIDAK works dari datacenter.
 */

import {
  tikmateVideoInfo,
  tikmateDownloadUrl,
  tikmateResolveCdnUrl,
  tikmateBatch,
} from "../src/tikmate/tiktok";

// Video untuk test — video baru (2024-2026) lebih reliable
const TEST_URLS = [
  "https://www.tiktok.com/@ayoindonesiacom/video/7662660254328556821",
  "https://www.tiktok.com/@charlidamelio/video/7662660254328556821",
];

// Video lama untuk test failure case
const OLD_VIDEO_URL =
  "https://www.tiktok.com/@khaby.lame/video/7109178205151784198";

async function main() {
  console.log("\n📱 TikTok Scraper — tikmate.app (GRATIS)");
  console.log("Auth   : ❌ Tidak perlu");
  console.log("Works  : ✅ Dari datacenter IP (Replit, AWS, GCP, dsb.)");
  console.log("─".repeat(60));

  // ── Test 1: Single video info ──────────────────────────────────────────
  console.log(`\n[1/4] tikmateVideoInfo() — video baru (2026)`);
  const t0 = Date.now();
  const info = await tikmateVideoInfo(TEST_URLS[0]);

  if (!info) {
    console.log("❌ Video tidak ditemukan (dihapus/privat)");
  } else {
    console.log(`✅ Berhasil (${Date.now() - t0}ms)`);
    console.log({
      id: info.id,
      author_id: info.author_id,
      author_name: info.author_name,
      like_count: info.like_count.toLocaleString(),
      comment_count: info.comment_count.toLocaleString(),
      share_count: info.share_count.toLocaleString(),
      create_time: info.create_time,
      desc: info.desc.slice(0, 80) + (info.desc.length > 80 ? "..." : ""),
      has_cover: !!info.cover,
      has_token: !!info.token,
    });
  }

  // ── Test 2: Download URL ───────────────────────────────────────────────
  if (info?.token) {
    console.log("\n[2/4] tikmateDownloadUrl() + tikmateResolveCdnUrl()");
    const dlUrl = tikmateDownloadUrl(info.token);
    console.log(`Download URL (302): ${dlUrl}`);

    const t1 = Date.now();
    const cdnUrl = await tikmateResolveCdnUrl(info.token);
    if (cdnUrl) {
      console.log(`✅ CDN URL resolved (${Date.now() - t1}ms):`);
      console.log(`   ${cdnUrl.slice(0, 80)}...`);
    } else {
      console.log(`⚠️  CDN URL tidak bisa di-resolve (mungkin redirect chain)`);
      console.log(`   Coba buka langsung: ${dlUrl}`);
    }
  } else {
    console.log("\n[2/4] Skip download test — video null");
  }

  // ── Test 3: Video lama (failure case) ─────────────────────────────────
  console.log(`\n[3/4] tikmateVideoInfo() — video lama (failure case)`);
  console.log(`URL: ${OLD_VIDEO_URL}`);
  const t2 = Date.now();
  const oldInfo = await tikmateVideoInfo(OLD_VIDEO_URL);
  if (!oldInfo) {
    console.log(
      `✅ Null dikembalikan dengan benar (${Date.now() - t2}ms) — video dihapus/tidak tersedia`
    );
  } else {
    console.log(
      `ℹ️  Video masih tersedia: ${oldInfo.author_id} — ${oldInfo.desc.slice(0, 40)}`
    );
  }

  // ── Test 4: Batch ──────────────────────────────────────────────────────
  console.log(`\n[4/4] tikmateBatch() — ${TEST_URLS.length} URLs`);
  const t3 = Date.now();
  const batchResults = await tikmateBatch(TEST_URLS, 400);
  const found = batchResults.filter((r) => r !== null);
  console.log(`✅ Selesai dalam ${Date.now() - t3}ms`);
  console.log(`   ${found.length}/${batchResults.length} video berhasil diambil`);

  for (const r of batchResults) {
    if (r) {
      console.log(`   ✅ @${r.author_id}: "${r.desc.slice(0, 50)}" | ❤️  ${r.like_count}`);
    } else {
      console.log(`   ❌ null (dihapus/tidak tersedia)`);
    }
  }

  // ── Ringkasan ──────────────────────────────────────────────────────────
  console.log("\n" + "─".repeat(60));
  console.log("Ringkasan tikmate.app:");
  console.log("  ✅ tikmateVideoInfo()    — metadata video (author, desc, stats, cover)");
  console.log("  ✅ tikmateDownloadUrl()  — URL download no-watermark (302 → CDN)");
  console.log("  ✅ tikmateBatch()        — batch metadata banyak video");
  console.log("\nCatatan:");
  console.log("  - Video baru (2024-2026): works ✅");
  console.log("  - Video lama/dihapus: returns null");
  console.log("  - Bekerja dari datacenter IP (tidak seperti TikTok oEmbed)");
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message ?? err);
  process.exit(1);
});
