/**
 * TEST — P12b: Wayback Machine Instagram
 * Jalankan: npx ts-node examples/test-wayback-instagram.ts
 *
 * CONFIRMED WORKS ✅ Juli 2026 (diuji live):
 *   @instagram → "Instagram", 686M followers, 8514 posts (snapshot 2026-07-07)
 *   @natgeo    → CDX ada 71 snapshot status:200, newest 2026-06-01
 */
import "dotenv/config";
import {
  waybackInstagramProfile,
  waybackInstagramPost,
  listInstagramSnapshots,
} from "../src/wayback/instagram";

async function main() {
  console.log("\n📦 P12b — Wayback Machine Instagram (GRATIS, no API key)");
  console.log("─".repeat(60));

  // ── 1. listInstagramSnapshots ──────────────────────────────────────────────
  console.log(`\n[1/3] listInstagramSnapshots("instagram", 5)`);
  try {
    const t = Date.now();
    const snaps = await listInstagramSnapshots("instagram", 5);
    console.log(`✅ OK (${Date.now() - t}ms) | snapshots: ${snaps.length}`);
    for (const s of snaps.slice(0, 3)) {
      console.log(`  ts=${s.timestamp} | status=${s.statusCode}`);
    }
  } catch (e: unknown) { console.log(`❌ ${e instanceof Error ? e.message : e}`); }

  await new Promise(r => setTimeout(r, 1000));

  // ── 2. waybackInstagramProfile ─────────────────────────────────────────────
  console.log(`\n[2/3] waybackInstagramProfile("instagram")`);
  try {
    const t = Date.now();
    const p = await waybackInstagramProfile("instagram");
    if (!p) { console.log("❌ null — no snapshot"); }
    else {
      console.log(`✅ OK (${Date.now() - t}ms)`);
      console.log({
        username:       p.username,
        fullName:       p.fullName,
        followerCount:  p.followerCount?.toLocaleString(),
        followingCount: p.followingCount,
        mediaCount:     p.mediaCount,
        snapshotTs:     p.snapshotTimestamp,
      });
    }
  } catch (e: unknown) { console.log(`❌ ${e instanceof Error ? e.message : e}`); }

  await new Promise(r => setTimeout(r, 1500));

  // ── 3. waybackInstagramProfile @natgeo ─────────────────────────────────────
  console.log(`\n[3/3] waybackInstagramProfile("natgeo")`);
  try {
    const t = Date.now();
    const p = await waybackInstagramProfile("natgeo");
    if (!p) { console.log("❌ null — no snapshot"); }
    else {
      console.log(`✅ OK (${Date.now() - t}ms) | followers: ${p.followerCount?.toLocaleString()} | posts: ${p.mediaCount} | snapshotTs: ${p.snapshotTimestamp}`);
    }
  } catch (e: unknown) { console.log(`❌ ${e instanceof Error ? e.message : e}`); }

  console.log("\n" + "─".repeat(60));
  console.log("Source: src/wayback/instagram.ts");
  console.log("Parse strategy: og:description (primary), window._sharedData (fallback)");
}

main().catch(e => { console.error("Fatal:", e?.message); process.exit(1); });
