/**
 * TEST: TikTok via oEmbed (Official, GRATIS, no API key)
 *
 * Jalankan: npx ts-node examples/test-tiktok-oembed.ts
 *
 * ⚠️  CATATAN HASIL TEST (Juli 2026):
 *   - Dari DATACENTER IP (Replit, AWS, GCP): TIDAK WORKS
 *     TikTok redirect ke /in/about — tidak mengembalikan JSON.
 *   - Dari RESIDENTIAL IP / Browser: WORKS
 *     Mengembalikan JSON metadata video normal.
 *
 * parseTikTokVideoId() tetap works di mana saja (lokal, tanpa network).
 */

import {
  getTikTokOEmbed,
  parseTikTokVideoId,
  batchOEmbed,
} from "../src/tiktok-oembed/tiktok";

// Video public TikTok untuk test — ganti jika perlu
const TEST_URLS = [
  "https://www.tiktok.com/@khaby.lame/video/7109178205151784198",
  "https://www.tiktok.com/@mrbeast/video/7280853799002500394",
];

async function main() {
  console.log("\n📱 TikTok oEmbed — Official API (GRATIS)");
  console.log("Tidak perlu API key, tidak perlu signup");
  console.log("─".repeat(60));

  // Test 1: Parse video ID dari URL
  console.log("\n[1/3] Test parseTikTokVideoId()");
  for (const url of TEST_URLS) {
    const id = parseTikTokVideoId(url);
    console.log(`  ${url}`);
    console.log(`  → Video ID: ${id ?? "❌ tidak ditemukan"}`);
  }
  console.log("✅ parseTikTokVideoId OK");

  // Test 2: Single video oEmbed
  console.log(`\n[2/3] Test getTikTokOEmbed() — ${TEST_URLS[0]}`);
  const t0 = Date.now();
  try {
    const meta = await getTikTokOEmbed(TEST_URLS[0]);
    console.log(`✅ oEmbed fetched (${Date.now() - t0}ms)`);
    console.log({
      title: meta.title?.slice(0, 80),
      author_name: meta.author_name,
      author_url: meta.author_url,
      thumbnail_url: meta.thumbnail_url?.slice(0, 80) + "...",
      thumbnail_width: meta.thumbnail_width,
      thumbnail_height: meta.thumbnail_height,
      provider_name: meta.provider_name,
      version: meta.version,
    });
  } catch (err) {
    console.log(`❌ Error: ${err instanceof Error ? err.message : err}`);
  }

  // Test 3: Batch oEmbed
  console.log(`\n[3/3] Test batchOEmbed() — ${TEST_URLS.length} URLs`);
  const t1 = Date.now();
  const results = await batchOEmbed(TEST_URLS, 500);
  console.log(`Selesai dalam ${Date.now() - t1}ms`);

  let okCount = 0;
  for (const r of results) {
    if (r.status === "ok") {
      okCount++;
      console.log(`  ✅ ${r.data.author_name}: "${r.data.title?.slice(0, 60)}"`);
    } else {
      console.log(`  ❌ ${r.url.slice(0, 60)}`);
      console.log(`     Error: ${r.error}`);
    }
  }
  console.log(`\nHasil: ${okCount}/${results.length} berhasil`);

  // Ringkasan
  console.log("\n" + "─".repeat(60));
  console.log("Ringkasan provider TikTok oEmbed:");
  console.log("  ✅ parseTikTokVideoId() — ekstrak video ID dari URL");
  console.log("  ✅ getTikTokOEmbed()    — metadata video (title, author, thumbnail)");
  console.log("  ✅ batchOEmbed()        — batch metadata banyak video");
  console.log("\nCatatan: oEmbed hanya untuk metadata dasar.");
  console.log("Untuk stats (views/likes) atau user posts → gunakan TikWM / EnsembleData / RapidAPI");
}

main().catch(err => {
  console.error("\n❌ Fatal:", err.message ?? err);
  process.exit(1);
});
