/**
 * Test runner: P18 Douyin (TikTok China) API
 *
 * Run: pnpm test:douyin
 *
 * Endpoint yang WORKS tanpa login (dari server):
 * ✅ douyinHotSearch() — 50 trending topics real-time
 * ✅ douyinHotSearchByType(type) — filter trending by type
 * ⚠️ douyinVideoDetail(id) — perlu aweme_id Douyin yang valid
 * ⚠️ douyinChallengeDetail(id) — perlu ch_id Douyin yang valid
 * ⚠️ douyinMusicDetail(id) — perlu music_id Douyin yang valid
 */

import {
  douyinHotSearch,
  douyinHotSearchByType,
  douyinVideoDetail,
  douyinChallengeDetail,
  douyinMusicDetail,
} from "../src/douyin/tiktok";

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log("=".repeat(60));
  console.log("P18: Douyin API Test Runner");
  console.log("=".repeat(60));

  // ── Test 1: Hot Search (CONFIRMED WORKS) ──────────────────────
  console.log("\n[TEST 1] douyinHotSearch() — 50 trending topics");
  try {
    const result = await douyinHotSearch();
    console.log(`✅ Status: ${result.status} | Items: ${result.items.length}`);
    console.log(`   Logid: ${result.logid}`);
    console.log("\n   Top 5 Trending Topics:");
    result.items.slice(0, 5).forEach((item, i) => {
      console.log(
        `   ${String(i + 1).padStart(2)}. [pos:${item.position}] ${item.word}`
      );
      console.log(
        `       hot_value: ${item.hot_value.toLocaleString()} | type: ${item.word_type} | id: ${item.sentence_id}`
      );
      if (item.word_cover_url) {
        console.log(`       cover: ${item.word_cover_url.slice(0, 80)}...`);
      }
    });
  } catch (err) {
    console.error("❌ Error:", err instanceof Error ? err.message : err);
  }

  await sleep(1000);

  // ── Test 2: Hot Search by Type ────────────────────────────────
  console.log("\n[TEST 2] douyinHotSearchByType(1) — type=1 trending");
  try {
    const result = await douyinHotSearchByType(1);
    console.log(`✅ Status: ${result.status} | Items: ${result.items.length}`);
    if (result.items.length > 0) {
      const top = result.items[0];
      console.log(
        `   #1: "${top.word}" (hot_value: ${top.hot_value.toLocaleString()})`
      );
    }
  } catch (err) {
    console.error("❌ Error:", err instanceof Error ? err.message : err);
  }

  await sleep(1000);

  // ── Test 3: Video Detail (needs valid aweme_id) ───────────────
  console.log(
    "\n[TEST 3] douyinVideoDetail() — video detail by aweme_id"
  );
  // Aweme ID ini adalah video Douyin populer (mungkin sudah dihapus)
  // Ganti dengan aweme_id yang valid dari URL: douyin.com/video/{ID}
  const testAwemeId = "7370217222098745607";
  try {
    const result = await douyinVideoDetail(testAwemeId);
    if (result.desc || result.author_nickname) {
      console.log(`✅ Status: ${result.status}`);
      console.log(`   Desc: ${result.desc}`);
      console.log(`   Author: ${result.author_nickname} (uid: ${result.author_uid})`);
      console.log(`   Plays: ${result.play_count?.toLocaleString()}`);
      console.log(`   Likes: ${result.like_count?.toLocaleString()}`);
      if (result.play_url) {
        console.log(`   Play URL: ${result.play_url.slice(0, 80)}...`);
      }
    } else {
      console.log(`⚠️ Status: ${result.status} — video tidak ditemukan atau tidak accessible`);
      console.log(
        "   Hint: Ganti testAwemeId dengan ID yang valid dari douyin.com/video/{ID}"
      );
    }
  } catch (err) {
    console.error("❌ Error:", err instanceof Error ? err.message : err);
  }

  await sleep(1000);

  // ── Test 4: Challenge Detail ──────────────────────────────────
  console.log(
    "\n[TEST 4] douyinChallengeDetail() — hashtag detail by ch_id"
  );
  // Ganti dengan ch_id yang valid dari URL: douyin.com/hashtag/{ch_id}
  const testChId = "1634521959579650";
  try {
    const result = await douyinChallengeDetail(testChId);
    if (result.ch_name || result.view_count) {
      console.log(`✅ Status: ${result.status}`);
      console.log(`   Name: ${result.ch_name}`);
      console.log(`   Views: ${result.view_count?.toLocaleString()}`);
      console.log(`   Videos: ${result.video_count?.toLocaleString()}`);
    } else {
      console.log(`⚠️ Status: ${result.status} — ch_id tidak valid atau challenge tidak ditemukan`);
      console.log(
        "   Hint: Ambil ch_id dari URL douyin.com/hashtag/{ch_id}"
      );
    }
  } catch (err) {
    console.error("❌ Error:", err instanceof Error ? err.message : err);
  }

  await sleep(1000);

  // ── Test 5: Music Detail ──────────────────────────────────────
  console.log(
    "\n[TEST 5] douyinMusicDetail() — music detail by music_id"
  );
  // Ganti dengan music_id yang valid dari Douyin
  const testMusicId = "7389657555880023296";
  try {
    const result = await douyinMusicDetail(testMusicId);
    if (result.title || result.author) {
      console.log(`✅ Status: ${result.status}`);
      console.log(`   Title: ${result.title}`);
      console.log(`   Author: ${result.author}`);
      console.log(`   Duration: ${result.duration}ms`);
      if (result.play_url) {
        console.log(`   Play URL: ${result.play_url.slice(0, 80)}...`);
      }
    } else {
      console.log(`⚠️ Status: ${result.status} — music_id tidak valid atau tidak ditemukan`);
      console.log(
        "   Hint: Ambil music_id dari URL douyin.com/music/{music_id}"
      );
    }
  } catch (err) {
    console.error("❌ Error:", err instanceof Error ? err.message : err);
  }

  console.log("\n" + "=".repeat(60));
  console.log("Done. Hot search (Test 1 & 2) seharusnya WORKS.");
  console.log("Test 3-5 perlu ID valid dari platform Douyin.");
  console.log("=".repeat(60));
}

main().catch(console.error);
