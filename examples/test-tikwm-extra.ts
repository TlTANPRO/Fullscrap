/**
 * TEST — P11: TikWM User Reposts (tikwmUserReposts)
 * Jalankan: npx ts-node examples/test-tikwm-extra.ts
 *
 * CONFIRMED WORKS ✅ Juli 2026 (diuji live):
 *   @charlidamelio → code 0, 20 repost videos, hasMore: true ✅
 */
import "dotenv/config";
import { tikwmUserReposts } from "../src/tikwm/tiktok-extra";

async function main() {
  console.log("\n🔁 P11 — TikWM User Reposts (GRATIS, no API key)");
  console.log("─".repeat(55));

  const TEST_ACCOUNTS = ["charlidamelio", "khaby.lame"];

  for (const account of TEST_ACCOUNTS) {
    console.log(`\n[@${account}] tikwmUserReposts(count=5)`);
    const t = Date.now();
    try {
      const { videos, hasMore, cursor } = await tikwmUserReposts(account, 5);
      console.log(`✅ OK (${Date.now() - t}ms)`);
      console.log(`   videos: ${videos.length} | hasMore: ${hasMore} | cursor: ${cursor}`);
      for (const v of videos.slice(0, 3)) {
        console.log(`   - [@${v.author.unique_id}] ${v.title.slice(0, 50)}`);
        console.log(`     plays: ${v.play_count.toLocaleString()} | likes: ${v.digg_count.toLocaleString()}`);
      }

      if (hasMore && videos.length > 0) {
        console.log(`\n   [pagination] halaman 2 (cursor=${cursor})`);
        const page2 = await tikwmUserReposts(account, 3, cursor);
        console.log(`   page2 videos: ${page2.videos.length}`);
      }
    } catch (e: unknown) {
      console.log(`❌ ${e instanceof Error ? e.message : e}`);
    }
    await new Promise(r => setTimeout(r, 500));
  }

  console.log("\n" + "─".repeat(55));
  console.log("Source: src/tikwm/tiktok-extra.ts");
  console.log("Endpoint: POST tikwm.com/api/user/reposts");
}

main().catch(e => { console.error("Fatal:", e?.message); process.exit(1); });
