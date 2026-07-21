/**
 * TEST: Instagram Profile & Post via OpenGraph / Twitterbot UA (GRATIS)
 *
 * CONFIRMED WORKS — diuji Juli 2026 dari Replit (datacenter)
 * Namun ada RATE LIMIT ketat: ~3-5 request per IP sebelum 0-byte response.
 * Gunakan delay ≥ 5 detik antar request.
 *
 * Jalankan:
 *   npx ts-node examples/test-instagram-og.ts
 *
 * Atau dengan target spesifik:
 *   IG_USERNAME=nike IG_SHORTCODE=DZK3iOsRlWX npx ts-node examples/test-instagram-og.ts
 *
 * Data yang didapat:
 * Profile: follower_count (approx), following_count (exact), post_count (exact)
 * Post   : like_count (approx), comment_count (approx), caption (exact), username, date
 */

import "dotenv/config";
import { igOgProfile, igOgPost, parseSuffixedNumber } from "../src/instagram-og/instagram";

async function main() {
  console.log("\n📸 Instagram via OpenGraph / Twitterbot UA (GRATIS)");
  console.log("Auth    : ❌ Tidak perlu");
  console.log("Method  : og:description scraping dengan Twitterbot User-Agent");
  console.log("Status  : Confirmed Works Juli 2026");
  console.log("⚠️  Rate limit: ~3-5 req/IP — pakai delay ≥ 5s antar request");
  console.log("─".repeat(60));

  const username = process.env.IG_USERNAME ?? process.argv[2] ?? "nike";
  const shortcode = process.env.IG_SHORTCODE ?? process.argv[3] ?? "DZK3iOsRlWX";

  // ── Test 1: Profile ────────────────────────────────────────────────────────
  console.log(`\n[1/2] igOgProfile("${username}")`);
  const t0 = Date.now();
  try {
    const profile = await igOgProfile(username);
    console.log(`✅ Berhasil (${Date.now() - t0}ms)`);
    console.log({
      username: profile.username,
      display_name: profile.display_name,
      follower_count: profile.follower_count?.toLocaleString() + " (APPROX)",
      following_count: profile.following_count?.toLocaleString() + " (exact)",
      post_count: profile.post_count?.toLocaleString() + " (exact)",
    });
  } catch (e) {
    console.log(`❌ Error: ${(e as Error).message}`);
    console.log("   → Kemungkinan rate-limited. Tunggu 30+ detik lalu coba lagi.");
  }

  // Delay sebelum request berikutnya
  console.log("\n⏳ Delay 6 detik sebelum request berikutnya (rate limit)...");
  await new Promise((r) => setTimeout(r, 6000));

  // ── Test 2: Post ───────────────────────────────────────────────────────────
  console.log(`\n[2/2] igOgPost("${shortcode}")`);
  const t1 = Date.now();
  try {
    const post = await igOgPost(shortcode);
    console.log(`✅ Berhasil (${Date.now() - t1}ms)`);
    console.log({
      shortcode: post.shortcode,
      username: post.username,
      date: post.date_str,
      like_count: post.like_count?.toLocaleString() + " (APPROX)",
      comment_count: post.comment_count?.toLocaleString() + " (APPROX)",
      view_count: post.view_count?.toLocaleString() ?? null,
      caption: post.caption?.slice(0, 80),
      thumbnail: post.thumbnail?.slice(0, 60) + "...",
    });
  } catch (e) {
    console.log(`❌ Error: ${(e as Error).message}`);
    console.log("   → Kemungkinan rate-limited. Tunggu 30+ detik lalu coba lagi.");
  }

  // ── Test helper: parseSuffixedNumber ──────────────────────────────────────
  console.log("\n[helpers] parseSuffixedNumber():");
  for (const [raw, expected] of [
    ["292M", 292_000_000],
    ["60K", 60_000],
    ["3M", 3_000_000],
    ["1,666", 1_666],
    ["267", 267],
  ]) {
    const result = parseSuffixedNumber(String(raw));
    const ok = result === expected;
    console.log(`  ${ok ? "✅" : "❌"} "${raw}" → ${result?.toLocaleString()} (expected ${Number(expected).toLocaleString()})`);
  }

  // ── Ringkasan ─────────────────────────────────────────────────────────────
  console.log("\n" + "─".repeat(60));
  console.log("Ringkasan Instagram OG (Twitterbot UA):");
  console.log("  ✅ Profile: follower_count (approx), following_count, post_count (exact)");
  console.log("  ✅ Post: like_count (approx), comment_count (approx), caption (exact)");
  console.log("  ❌ Rate limit ketat dari datacenter: ~3-5 req/IP");
  console.log("  ❌ Tidak ada nilai exact untuk likes (3M bukan 2,779,808)");
  console.log("  Tool: src/instagram-og/instagram.ts");
}

main().catch((e) => {
  console.error("\n❌", e.message ?? e);
  process.exit(1);
});
