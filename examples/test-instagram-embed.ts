/**
 * TEST: Instagram Post Like & Comment Count via Embed Page (GRATIS)
 *
 * CONFIRMED WORKS — diuji Juli 2026 dari Replit (datacenter)
 * Scrape halaman embed Instagram untuk like_count + comment_count.
 *
 * Jalankan:
 *   IG_SHORTCODE=DZK3iOsRlWX npx ts-node examples/test-instagram-embed.ts
 *
 * Atau langsung:
 *   npx ts-node examples/test-instagram-embed.ts
 *
 * Data yang didapat:
 *   - like_count (realtime)
 *   - comment_count (realtime)
 *   - author username
 *
 * Tidak perlu: API key, signup, login
 */

import "dotenv/config";
import { igEmbedPostInfo, igEmbedBatch, igExtractShortcode } from "../src/instagram-embed/instagram";

async function main() {
  console.log("\n📸 Instagram Embed — Like + Comment Count (GRATIS)");
  console.log("Auth    : ❌ Tidak perlu");
  console.log("Method  : HTML scraping /p/SHORTCODE/embed/captioned/");
  console.log("Status  : Confirmed Works Juli 2026");
  console.log("─".repeat(60));

  // Shortcode dari env atau default
  const shortcode = process.env.IG_SHORTCODE ?? process.argv[2] ?? "DZK3iOsRlWX";

  // ── Test 1: Single post ────────────────────────────────────────────────────
  console.log(`\n[1/2] igEmbedPostInfo("${shortcode}")`);
  const t0 = Date.now();
  const info = await igEmbedPostInfo(shortcode);
  console.log(`✅ Berhasil (${Date.now() - t0}ms)`);
  console.log({
    shortcode: info.shortcode,
    url: info.url,
    author: info.author,
    like_count: info.like_count?.toLocaleString(),
    comment_count: info.comment_count?.toLocaleString(),
  });

  // ── Test 2: Extract shortcode dari URL ────────────────────────────────────
  console.log("\n[helpers] igExtractShortcode():");
  const examples = [
    "https://www.instagram.com/p/DZK3iOsRlWX/",
    "https://www.instagram.com/reel/C9Dcs1hvRMT/?igsh=abc",
  ];
  for (const url of examples) {
    console.log(`  "${url.slice(30)}..." → "${igExtractShortcode(url)}"`);
  }

  // ── Test 3: Batch ──────────────────────────────────────────────────────────
  const BATCH = ["DZK3iOsRlWX", "C9Dcs1hvRMT"];
  console.log(`\n[2/2] igEmbedBatch([${BATCH.map(s => `"${s}"`).join(", ")}])`);
  const t1 = Date.now();
  const results = await igEmbedBatch(BATCH, 1500);
  console.log(`✅ Done (${Date.now() - t1}ms)`);
  for (const r of results) {
    if (r.status === "ok") {
      console.log(
        `  ✅ ${r.shortcode}: @${r.author ?? "?"} | ` +
        `${r.like_count?.toLocaleString() ?? "?"} likes | ` +
        `${r.comment_count?.toLocaleString() ?? "?"} comments`
      );
    } else {
      console.log(`  ❌ ${r.shortcode}: ${r.error}`);
    }
  }

  // ── Ringkasan ──────────────────────────────────────────────────────────────
  console.log("\n" + "─".repeat(60));
  console.log("Ringkasan instagram-embed:");
  console.log("  ✅ like_count realtime dari HTML embed");
  console.log("  ✅ comment_count realtime dari HTML embed");
  console.log("  ✅ author username");
  console.log("  ❌ caption / deskripsi lengkap → gunakan yt-dlp untuk ini");
  console.log("  ❌ thumbnail, timestamp, profil user");
  console.log("  Source: src/instagram-embed/instagram.ts");
}

main().catch((e) => {
  console.error("\n❌", e.message ?? e);
  process.exit(1);
});
