/**
 * TEST: Instagram Post Info via yt-dlp (GRATIS, no API key)
 *
 * CONFIRMED WORKS — diuji Juli 2026 dari Replit (datacenter)
 *
 * Jalankan:
 *   npx ts-node examples/test-ytdlp-instagram.ts
 *
 * Requirement:
 *   uvx tersedia di Nix/Replit (auto), ATAU pip install yt-dlp
 *
 * Cara pakai:
 *   IG_POST_URL=https://www.instagram.com/p/DZK3iOsRlWX/ npx ts-node examples/test-ytdlp-instagram.ts
 */

import "dotenv/config";
import { igGetPostInfo, igBatchPostInfo, igShortcodeToUrl } from "../src/ytdlp/instagram";

async function main() {
  console.log("\n📸 Instagram via yt-dlp (GRATIS)");
  console.log("Auth    : ❌ Tidak perlu");
  console.log("Tool    : yt-dlp (via uvx atau pip install yt-dlp)");
  console.log("Status  : Confirmed Works Juli 2026");
  console.log("─".repeat(60));

  // ── Test 1: Single post by URL ────────────────────────────────────────────
  const postUrl =
    process.env.IG_POST_URL ??
    process.argv[2] ??
    "https://www.instagram.com/p/DZK3iOsRlWX/";

  console.log(`\n[1/2] igGetPostInfo("${postUrl}")`);
  console.log("      ← Mengambil like_count, comment_count, caption via yt-dlp...");

  const t0 = Date.now();
  const post = await igGetPostInfo(postUrl);
  console.log(`✅ Berhasil (${Date.now() - t0}ms)`);
  console.log({
    id: post.id,
    uploader: post.uploader,
    like_count: post.like_count.toLocaleString(),
    comment_count: post.comment_count.toLocaleString(),
    is_video: post.is_video,
    duration: post.duration ? `${post.duration.toFixed(1)}s` : null,
    formats_count: post.formats_count,
    thumbnail: post.thumbnail.slice(0, 70) + "...",
    description: post.description.slice(0, 100),
    upload_date: post.upload_date,
  });

  // ── Test 2: Batch beberapa post ──────────────────────────────────────────
  const BATCH_URLS = [
    "https://www.instagram.com/p/DZK3iOsRlWX/",
    igShortcodeToUrl("C9Dcs1hvRMT"),
  ];

  console.log(`\n[2/2] igBatchPostInfo() — ${BATCH_URLS.length} posts`);
  const t1 = Date.now();
  const results = await igBatchPostInfo(BATCH_URLS, 2000);
  console.log(`✅ Done (${Date.now() - t1}ms)`);

  for (const r of results) {
    if (r.status === "ok") {
      console.log(
        `  ✅ ${r.id}: @${r.uploader} | ${r.like_count.toLocaleString()} likes | ${r.comment_count.toLocaleString()} comments`
      );
    } else {
      console.log(`  ❌ ${r.url}: ${r.error}`);
    }
  }

  // ── Ringkasan ─────────────────────────────────────────────────────────────
  console.log("\n" + "─".repeat(60));
  console.log("Ringkasan yt-dlp Instagram:");
  console.log("  ✅ Single post by URL: like_count, comment_count, caption, thumbnail");
  console.log("  ✅ Batch mode support");
  console.log("  ✅ Tidak perlu API key, tidak perlu login");
  console.log("  ❌ User listings (/nike/posts/, /reels/) → 429 dari datacenter");
  console.log("  ❌ Stories → perlu login");
  console.log("  Tool: src/ytdlp/instagram.ts");
}

main().catch((e) => {
  console.error("\n❌", e.message ?? e);
  if (e.message?.includes("yt-dlp") || e.message?.includes("uvx")) {
    console.error("   Install yt-dlp: pip install yt-dlp");
    console.error("   Atau gunakan uvx (tersedia di Replit Nix)");
  }
  process.exit(1);
});
