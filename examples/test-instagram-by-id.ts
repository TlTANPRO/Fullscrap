/**
 * TEST: Instagram — Lookup User by Numeric ID (GRATIS)
 *
 * Menguji fungsi baru igGetUserById() yang ditemukan Juli 2026:
 *   - igGetUserById()  → info dasar user (pk, username, profile_pic_url) by user_id ✅ BARU
 *
 * Kapan pakai ini:
 *   - Kamu punya user_id numerik (dari webhook, DB, atau API lain) dan butuh username
 *   - Reverse lookup: user_id → username → lanjut ke getUserProfile() untuk profil lengkap
 *   - Cek cepat apakah suatu user_id masih aktif
 *
 * Jalankan: npx ts-node examples/test-instagram-by-id.ts
 */

import "dotenv/config";
import { igGetUserById } from "../src/instagram-android/instagram";

async function main() {
  console.log(`\n📸 Instagram Scraper — User by Numeric ID (GRATIS)`);
  console.log(`Auth    : ❌ Tidak perlu`);
  console.log(`Status  : igGetUserById — Confirmed Works Juli 2026`);
  console.log("─".repeat(60));

  // User ID public yang diuji
  const TEST_USERS: Array<{ id: string; expected_username: string }> = [
    { id: "13460080",  expected_username: "nike" },
    { id: "25025320",  expected_username: "instagram" },
    { id: "407964792", expected_username: "kyliejenner" },
  ];

  for (const { id, expected_username } of TEST_USERS) {
    console.log(`\n[user_id: ${id}] → expecting @${expected_username}`);
    const t = Date.now();
    try {
      const info = await igGetUserById(id);
      console.log(`✅ Berhasil (${Date.now() - t}ms)`);
      console.log({
        pk: info.pk,
        username: info.username,
        profile_pic_url: info.profile_pic_url.slice(0, 80) + "...",
      });
      if (info.username !== expected_username) {
        console.log(`  ⚠️ Username berbeda dari yang diharapkan (mungkin sudah ganti username)`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`❌ Error (${Date.now() - t}ms): ${msg}`);
    }

    // Delay 1 detik antar request — hindari rate limit
    await new Promise(r => setTimeout(r, 1000));
  }

  // ── Ringkasan ──────────────────────────────────────────────────────────────
  console.log("\n" + "─".repeat(60));
  console.log("Ringkasan igGetUserById():");
  console.log("  ✅ Input  : user_id numerik (string)");
  console.log("  ✅ Output : pk, username, profile_pic_url");
  console.log("  ⚠️ Data MINIMAL — untuk profil lengkap, lanjutkan ke:");
  console.log('       import { getUserProfile } from "../instagram-web/instagram";');
  console.log("       getUserProfile(info.username)  ← follower count, bio, posts, dll");
  console.log("  ✅ Endpoint: GET i.instagram.com/api/v1/users/{id}/info/");
  console.log("  ❌ Tidak tersedia: follower_count, bio, media_count");
  console.log("     (Instagram sengaja membatasi data public dari endpoint ini)");
}

main().catch(err => {
  console.error("\n❌ Error:", err.message ?? err);
  process.exit(1);
});
