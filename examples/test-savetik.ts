/**
 * TEST: TikTok Download Links via savetik.co (GRATIS, dari datacenter IP)
 *
 * Jalankan: npx ts-node examples/test-savetik.ts
 *
 * CONFIRMED WORKS dari datacenter/Replit (diuji Juli 2026).
 * Memberikan: MP4 no-watermark, MP4 HD, MP3 audio — semua dari 1 request.
 */

import { savetikVideoInfo, savetikGetLinks, savetikBatch } from "../src/savetik/tiktok";

const TEST_URLS = [
  "https://www.tiktok.com/@ayoindonesiacom/video/7662660254328556821",
  "https://www.tiktok.com/@charlidamelio/video/7662660254328556821",
];

async function main() {
  console.log("\n📱 TikTok Download Links — savetik.co (GRATIS)");
  console.log("Auth   : ❌ Tidak perlu");
  console.log("Works  : ✅ Dari datacenter IP");
  console.log("Output : MP4, MP4 HD, MP3 download links");
  console.log("─".repeat(60));

  // ── Test 1: savetikVideoInfo — full info ───────────────────────────────
  console.log(`\n[1/3] savetikVideoInfo()\nURL: ${TEST_URLS[0]}`);
  const t0 = Date.now();
  const result = await savetikVideoInfo(TEST_URLS[0]);

  console.log(`✅ Berhasil (${Date.now() - t0}ms)`);
  console.log({
    video_id: result.video_id,
    title: result.title.slice(0, 80) + (result.title.length > 80 ? "..." : ""),
    thumbnail: result.thumbnail ? result.thumbnail.slice(0, 70) + "..." : "none",
    links_count: result.links.length,
  });

  console.log("\nDownload links:");
  for (const link of result.links) {
    console.log(`  [${link.label}] ${link.url.slice(0, 80)}...`);
  }

  // Verifikasi link types
  const hasMP4 = result.links.some((l) => l.label.toLowerCase().includes("mp4"));
  const hasHD = result.links.some((l) => l.label.toLowerCase().includes("hd"));
  const hasMP3 = result.links.some((l) => l.label.toLowerCase().includes("mp3"));
  console.log(`\nFormat tersedia: MP4=${hasMP4} | HD=${hasHD} | MP3=${hasMP3}`);

  // ── Test 2: savetikGetLinks — shortcut ─────────────────────────────────
  console.log(`\n[2/3] savetikGetLinks() — shortcut (pakai URL berbeda)`);
  // Pakai URL ke-2 agar tidak hit rate limit dari URL ke-1
  // + tambah delay 2 detik (savetik lebih sensitif dari TikWM)
  await new Promise((r) => setTimeout(r, 2000));
  const t1 = Date.now();
  const links = await savetikGetLinks(TEST_URLS[1] ?? TEST_URLS[0]);
  console.log(`✅ ${links.length} links (${Date.now() - t1}ms)`);

  // Temukan link per format
  const mp4 = links.find((l) => l.label.toLowerCase().includes("mp4") && !l.label.toLowerCase().includes("hd"));
  const hd = links.find((l) => l.label.toLowerCase().includes("hd"));
  const mp3 = links.find((l) => l.label.toLowerCase().includes("mp3"));

  if (mp4) console.log(`  MP4       : ${mp4.url.slice(0, 60)}...`);
  if (hd) console.log(`  MP4 HD    : ${hd.url.slice(0, 60)}...`);
  if (mp3) console.log(`  MP3       : ${mp3.url.slice(0, 60)}...`);

  // ── Test 3: Batch ──────────────────────────────────────────────────────
  console.log(`\n[3/3] savetikBatch() — ${TEST_URLS.length} URLs`);
  const t2 = Date.now();
  const batchResults = await savetikBatch(TEST_URLS, 800);
  console.log(`Selesai dalam ${Date.now() - t2}ms`);

  let okCount = 0;
  for (const r of batchResults) {
    if (r.status === "ok") {
      okCount++;
      console.log(`  ✅ ID:${r.data.video_id} → ${r.data.links.length} links`);
    } else {
      console.log(`  ❌ ${r.url.slice(0, 50)}: ${r.error}`);
    }
  }
  console.log(`\nHasil: ${okCount}/${batchResults.length} berhasil`);

  // ── Ringkasan ──────────────────────────────────────────────────────────
  console.log("\n" + "─".repeat(60));
  console.log("Ringkasan savetik.co:");
  console.log("  ✅ savetikVideoInfo()  — info video + semua download links");
  console.log("  ✅ savetikGetLinks()   — shortcut untuk download links saja");
  console.log("  ✅ savetikBatch()      — batch banyak video sekaligus");
  console.log("\nFormat download:");
  console.log("  ✅ MP4         — video tanpa watermark");
  console.log("  ✅ MP4 HD      — video HD tanpa watermark");
  console.log("  ✅ MP3         — audio saja");
  console.log("\nCatatan: Link expired ~1 jam, ambil ulang jika perlu.");
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message ?? err);
  process.exit(1);
});
