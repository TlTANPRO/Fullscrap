/**
 * TEST — P13: Instagram via web_profile_info (GRATIS, no login)
 * Jalankan: npx ts-node examples/test-instagram-web-v2.ts
 *
 * CONFIRMED WORKS ✅ Juli 2026 (diuji live dari curl):
 *   @natgeo    → 269M followers, 31803 posts, verified ✅
 *   @instagram → 685M followers, 8522 posts, verified ✅
 *   @nasa      → 104M followers, 4850 posts, verified ✅
 *   @mrbeast   → 87.7M followers, 489 posts, verified ✅
 *
 * ⚠️  Rate limit: agresif dari datacenter IP.
 *    Jika 429, tunggu 2-5 menit sebelum retry.
 *    Endpoint: GET instagram.com/api/v1/users/web_profile_info/?username=X
 */
import "dotenv/config";
import { igWebV2Profile, igWebV2Batch } from "../src/instagram-web-v2/instagram";

async function main() {
  console.log("\n📸 P13 — Instagram web_profile_info (GRATIS, no API key, no login)");
  console.log("─".repeat(65));
  console.log("⚠️  Rate limit agresif dari datacenter. Jika 429, tunggu 2-5 menit.\n");

  // ── 1. Single profile ──────────────────────────────────────────────────────
  console.log(`[1/3] igWebV2Profile("natgeo")`);
  const t1 = Date.now();
  try {
    const p = await igWebV2Profile("natgeo");
    console.log(`✅ OK (${Date.now() - t1}ms)`);
    console.log({
      username:          p.username,
      fullName:          p.fullName,
      biography:         p.biography.slice(0, 80),
      followerCount:     p.followerCount.toLocaleString(),
      followingCount:    p.followingCount.toLocaleString(),
      mediaCount:        p.mediaCount.toLocaleString(),
      isVerified:        p.isVerified,
      isBusinessAccount: p.isBusinessAccount,
      categoryName:      p.categoryName,
      externalUrl:       p.externalUrl,
      bioLinks:          p.bioLinks.length,
      id:                p.id,
    });
  } catch (e: unknown) {
    console.log(`❌ ${e instanceof Error ? e.message : e}`);
    if (e instanceof Error && e.message.includes("429")) {
      console.log("   → Tunggu 2-5 menit lalu jalankan ulang.");
      process.exit(0);
    }
  }

  await new Promise(r => setTimeout(r, 2000));

  // ── 2. Content creator ────────────────────────────────────────────────────
  console.log(`\n[2/3] igWebV2Profile("mrbeast")`);
  const t2 = Date.now();
  try {
    const p = await igWebV2Profile("mrbeast");
    console.log(`✅ OK (${Date.now() - t2}ms)`);
    console.log({
      username:      p.username,
      fullName:      p.fullName,
      followerCount: p.followerCount.toLocaleString(),
      mediaCount:    p.mediaCount,
      isVerified:    p.isVerified,
      hasClips:      p.hasClips,
    });
  } catch (e: unknown) { console.log(`❌ ${e instanceof Error ? e.message : e}`); }

  await new Promise(r => setTimeout(r, 2000));

  // ── 3. Batch ──────────────────────────────────────────────────────────────
  console.log(`\n[3/3] igWebV2Batch(["instagram", "nasa"], delay=2000ms)`);
  const t3 = Date.now();
  try {
    const results = await igWebV2Batch(["instagram", "nasa"], 2000);
    console.log(`✅ OK (${Date.now() - t3}ms)`);
    for (const r of results) {
      if (r.status === "ok") {
        console.log(
          `  ✅ @${r.username}: ${r.followerCount.toLocaleString()} followers` +
          ` | ${r.mediaCount} posts | verified: ${r.isVerified}`
        );
      } else {
        console.log(`  ❌ @${r.username}: ${r.error}`);
      }
    }
  } catch (e: unknown) { console.log(`❌ ${e instanceof Error ? e.message : e}`); }

  console.log("\n" + "─".repeat(65));
  console.log("Source: src/instagram-web-v2/instagram.ts");
  console.log("Fields: username, fullName, biography, followerCount, followingCount,");
  console.log("        mediaCount, isVerified, isPrivate, isBusinessAccount,");
  console.log("        profilePicUrl, profilePicUrlHd, externalUrl, bioLinks[]");
}

main().catch(e => { console.error("Fatal:", e?.message); process.exit(1); });
