/**
 * TEST: TikTok via Jina AI Reader (P19) — GRATIS, NO API KEY
 *
 * Menguji endpoint baru Batch 7 — Juli 2026:
 *   - jinaTikTokProfile()   → profil user: follower, following, likes, bio ✅
 *   - jinaTikTokHashtag()   → info hashtag: post count ✅
 *   - jinaTikTokVideoMeta() → metadata video: judul/caption ✅
 *
 * Jalankan: npx ts-node examples/test-jina-tiktok.ts
 * Tidak perlu API key atau setup apapun.
 *
 * CATATAN:
 * - Jina rate limit: ~200 req/hari tanpa API key
 * - Ada delay 1.5 detik antar request untuk menghindari rate limit
 * - Angka follower dibulatkan (e.g. 159.3M = 159_300_000)
 */

import "dotenv/config";
import {
  jinaTikTokProfile,
  jinaTikTokHashtag,
  jinaTikTokVideoMeta,
  jinaTikTokBatch,
} from "../src/jina/tiktok";

async function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log(`\n🔍 TikTok Scraper — Jina AI Reader (P19) — GRATIS`);
  console.log(`Auth    : ❌ Tidak perlu (no API key, no signup)`);
  console.log(`Status  : Confirmed Works Juli 2026 dari Replit/datacenter`);
  console.log(`Limit   : ~200 req/hari (gratis), tambah JINA_API_KEY untuk lebih`);
  console.log("─".repeat(65));

  // ── Test 1: Profil user TikTok ────────────────────────────────────────────
  console.log("\n[1/4] jinaTikTokProfile() — ambil profil user TikTok...");
  const t0 = Date.now();

  const profile = await jinaTikTokProfile("charlidamelio");
  console.log(`✅ Berhasil (${Date.now() - t0}ms)`);
  console.log({
    username: profile.username,
    displayName: profile.displayName,
    followerCount: profile.followerCount.toLocaleString(),
    followingCount: profile.followingCount.toLocaleString(),
    totalLikes: profile.totalLikes.toLocaleString(),
    bio: profile.bio.slice(0, 80),
    avatarUrl: profile.avatarUrl.slice(0, 60) + "...",
  });

  await delay(1500);

  // ── Test 2: Profil akun brand ─────────────────────────────────────────────
  console.log("\n[2/4] jinaTikTokProfile() — profil akun brand (@nike)...");
  const t1 = Date.now();

  const nikeProfile = await jinaTikTokProfile("nike");
  console.log(`✅ Berhasil (${Date.now() - t1}ms)`);
  console.log({
    username: nikeProfile.username,
    displayName: nikeProfile.displayName,
    followerCount: nikeProfile.followerCount.toLocaleString(),
    followingCount: nikeProfile.followingCount.toLocaleString(),
    totalLikes: nikeProfile.totalLikes.toLocaleString(),
    bio: nikeProfile.bio.slice(0, 80),
  });

  await delay(1500);

  // ── Test 3: Info hashtag ──────────────────────────────────────────────────
  console.log("\n[3/4] jinaTikTokHashtag() — info hashtag #fyp...");
  const t2 = Date.now();

  const fypHashtag = await jinaTikTokHashtag("fyp");
  console.log(`✅ Berhasil (${Date.now() - t2}ms)`);
  console.log({
    name: fypHashtag.name,
    postCount: fypHashtag.postCount.toLocaleString(),
    hashtagUrl: fypHashtag.hashtagUrl,
  });

  await delay(1500);

  // ── Test 4: Metadata video ────────────────────────────────────────────────
  // Video ESPN dari test sebelumnya (confirmed works)
  console.log("\n[4/4] jinaTikTokVideoMeta() — metadata video publik...");
  const t3 = Date.now();

  const videoMeta = await jinaTikTokVideoMeta("espn", "7664344969548713246");
  console.log(`✅ Berhasil (${Date.now() - t3}ms)`);
  if (videoMeta) {
    console.log({
      videoId: videoMeta.videoId,
      username: videoMeta.username,
      title: videoMeta.title,
      description: videoMeta.description.slice(0, 100),
    });
  } else {
    console.log("  → Video tidak tersedia (null dikembalikan)");
  }

  // ── Ringkasan ─────────────────────────────────────────────────────────────
  console.log("\n" + "─".repeat(65));
  console.log("✅ Semua test P19 Jina AI TikTok selesai");
  console.log("\nCapability summary:");
  console.log("  jinaTikTokProfile(username) → follower, following, likes, bio, avatar");
  console.log("  jinaTikTokHashtag(hashtag)  → post count");
  console.log("  jinaTikTokVideoMeta(u, id)  → title, description");
  console.log("  jinaTikTokBatch(usernames)  → batch profil dengan auto-delay");
  console.log("\nLimitation:");
  console.log("  ⚠️  Angka follower dibulatkan (159.3M, bukan exact)");
  console.log("  ⚠️  Tidak ada per-video stats (like, comment, play count)");
  console.log("       → Gunakan tikwmVideoByUrl() (P2) untuk data video lengkap");
  console.log("  ⚠️  Instagram TIDAK WORKS via Jina (block login wall)");
  console.log("  ⚠️  Rate limit ~200 req/hari (gratis)");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
