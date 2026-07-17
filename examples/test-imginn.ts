/**
 * TEST — P14: Instagram via imginn.com (GRATIS, no login, no API key)
 * Jalankan: npx ts-node examples/test-imginn.ts
 *
 * CONFIRMED WORKS ✅ Juli 2026 (diuji live):
 *   @natgeo    → 269M followers, 193 following, 31806 posts ✅
 *   @nasa      → 104.3M followers, 91 following, 4851 posts ✅
 *   @instagram → 685.8M followers, 256 following, 8525 posts ✅
 *
 * Keunggulan vs P13 (igWebV2): tidak kena 429 dari datacenter.
 */
import "dotenv/config";
import { imginnProfile, imginnBatch } from "../src/imginn/instagram";

async function main() {
  console.log("\n🖼️  P14 — imginn.com Instagram Scraper (GRATIS, no API key)");
  console.log("─".repeat(60));

  // ── 1. Single profile ──────────────────────────────────────────────────────
  console.log(`\n[1/3] imginnProfile("natgeo")`);
  const t1 = Date.now();
  try {
    const p = await imginnProfile("natgeo");
    console.log(`✅ OK (${Date.now() - t1}ms)`);
    console.log({
      username:      p.username,
      fullName:      p.fullName,
      biography:     p.biography?.slice(0, 80),
      followerCount: p.followerCount?.toLocaleString(),
      followingCount:p.followingCount,
      mediaCount:    p.mediaCount,
      profilePicUrl: p.profilePicUrl?.slice(0, 70),
      sourceUrl:     p.sourceUrl,
    });
  } catch (e: unknown) {
    console.log(`❌ ${e instanceof Error ? e.message : e}`);
  }

  await new Promise(r => setTimeout(r, 800));

  // ── 2. Second account ──────────────────────────────────────────────────────
  console.log(`\n[2/3] imginnProfile("nasa")`);
  const t2 = Date.now();
  try {
    const p = await imginnProfile("nasa");
    console.log(`✅ OK (${Date.now() - t2}ms)`);
    console.log({
      username:      p.username,
      fullName:      p.fullName,
      followerCount: p.followerCount?.toLocaleString(),
      followingCount:p.followingCount,
      mediaCount:    p.mediaCount,
    });
  } catch (e: unknown) {
    console.log(`❌ ${e instanceof Error ? e.message : e}`);
  }

  await new Promise(r => setTimeout(r, 800));

  // ── 3. Batch ───────────────────────────────────────────────────────────────
  console.log(`\n[3/3] imginnBatch(["instagram", "mrbeast"], delay=800ms)`);
  const t3 = Date.now();
  try {
    const results = await imginnBatch(["instagram", "mrbeast"], 800);
    console.log(`✅ OK (${Date.now() - t3}ms)`);
    for (const r of results) {
      if (r.status === "ok") {
        console.log(
          `  ✅ @${r.username}: ${r.followerCount?.toLocaleString() ?? "?"} followers` +
          ` | ${r.mediaCount ?? "?"} posts`
        );
      } else {
        console.log(`  ❌ @${r.username}: ${r.error}`);
      }
    }
  } catch (e: unknown) {
    console.log(`❌ ${e instanceof Error ? e.message : e}`);
  }

  console.log("\n" + "─".repeat(60));
  console.log("Source: src/imginn/instagram.ts");
  console.log("Endpoint: GET imginn.com/{username}/");
  console.log("Parse: HTML counter-item divs + og:description + og:title");
  console.log("Advantage: no 429 rate limit, works from datacenter");
}

main().catch(e => { console.error("Fatal:", e?.message); process.exit(1); });
