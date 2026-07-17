/**
 * TEST — P12: Wayback Machine TikTok
 * Jalankan: npx ts-node examples/test-wayback-tiktok.ts
 *
 * CONFIRMED WORKS ✅ Juli 2026 (diuji live):
 *   @charlidamelio → nickname "charli d'amelio", 156.9M followers, 2861 videos
 *   Snapshot: 2025-05-13 via CDX filter=statuscode:200
 */
import "dotenv/config";
import {
  waybackTikTokProfile,
  waybackTikTokVideoStats,
  listTikTokSnapshots,
  waybackTikTokProfileAt,
  getLatestSnapshotUrl,
} from "../src/wayback/tiktok";

async function main() {
  console.log("\n📦 P12 — Wayback Machine TikTok (GRATIS, no API key, no CF block)");
  console.log("─".repeat(65));

  const USERNAME = "charlidamelio";

  // ── 1. List snapshots ──────────────────────────────────────────────────────
  console.log(`\n[1/4] listTikTokSnapshots("${USERNAME}", 5)`);
  try {
    const t = Date.now();
    const snaps = await listTikTokSnapshots(USERNAME, 5);
    console.log(`✅ OK (${Date.now() - t}ms) | snapshots: ${snaps.length}`);
    for (const s of snaps.slice(0, 3)) {
      console.log(`  ts=${s.timestamp} | status=${s.statusCode}`);
    }
  } catch (e: unknown) { console.log(`❌ ${e instanceof Error ? e.message : e}`); }

  await new Promise(r => setTimeout(r, 1000));

  // ── 2. getLatestSnapshotUrl ────────────────────────────────────────────────
  console.log(`\n[2/4] getLatestSnapshotUrl("@${USERNAME}")`);
  try {
    const t = Date.now();
    const url = await getLatestSnapshotUrl(`https://www.tiktok.com/@${USERNAME}`);
    console.log(`✅ OK (${Date.now() - t}ms)`);
    console.log(`  snapUrl: ${url?.slice(0, 80)}`);
  } catch (e: unknown) { console.log(`❌ ${e instanceof Error ? e.message : e}`); }

  await new Promise(r => setTimeout(r, 1000));

  // ── 3. waybackTikTokProfile ────────────────────────────────────────────────
  console.log(`\n[3/4] waybackTikTokProfile("${USERNAME}")`);
  try {
    const t = Date.now();
    const p = await waybackTikTokProfile(USERNAME);
    if (!p) { console.log("❌ null — no snapshot found"); }
    else {
      console.log(`✅ OK (${Date.now() - t}ms)`);
      console.log({
        uniqueId:       p.uniqueId,
        nickname:       p.nickname,
        followerCount:  p.followerCount?.toLocaleString(),
        followingCount: p.followingCount,
        videoCount:     p.videoCount,
        heartCount:     p.heartCount?.toLocaleString(),
        verified:       p.verified,
        snapshotTs:     p.snapshotTimestamp,
      });
    }
  } catch (e: unknown) { console.log(`❌ ${e instanceof Error ? e.message : e}`); }

  await new Promise(r => setTimeout(r, 1500));

  // ── 4. waybackTikTokProfileAt (timestamp spesifik) ────────────────────────
  console.log(`\n[4/4] waybackTikTokProfileAt("${USERNAME}", "20250101000000")`);
  try {
    const t = Date.now();
    const p = await waybackTikTokProfileAt(USERNAME, "20250101000000");
    if (!p) { console.log("⚠️  null — snapshot mungkin tidak ada di tanggal itu"); }
    else {
      console.log(`✅ OK (${Date.now() - t}ms) | followers: ${p.followerCount?.toLocaleString()} | snapshotTs: ${p.snapshotTimestamp}`);
    }
  } catch (e: unknown) { console.log(`❌ ${e instanceof Error ? e.message : e}`); }

  console.log("\n" + "─".repeat(65));
  console.log("Source: src/wayback/tiktok.ts");
  console.log("CDX: filter=statuscode:200&from=20240101&limit=200, ambil row terakhir (terbaru)");
}

main().catch(e => { console.error("Fatal:", e?.message); process.exit(1); });
