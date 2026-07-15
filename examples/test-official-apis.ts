/**
 * TEST: Official APIs — Instagram Graph API + TikTok Research API
 *
 * Jalankan:
 *   npx ts-node examples/test-official-apis.ts
 *
 * INSTAGRAM GRAPH API:
 *   - Daftar app: https://developers.facebook.com/apps/
 *   - Generate token: https://developers.facebook.com/tools/explorer/
 *   - Set di .env:
 *       INSTAGRAM_ACCESS_TOKEN=your_long_lived_token
 *       INSTAGRAM_USER_ID=your_instagram_user_id
 *
 * TIKTOK RESEARCH API:
 *   - Apply: https://developers.tiktok.com/products/research-api/
 *   - Set di .env:
 *       TIKTOK_CLIENT_KEY=your_client_key
 *       TIKTOK_CLIENT_SECRET=your_client_secret
 *
 * CATATAN: Kedua API ini untuk akses data AKUN SENDIRI / riset akademik.
 *          Bukan untuk scraping akun orang lain.
 */

import "dotenv/config";
import {
  igGraphGetMe,
  igGraphGetMedia,
  igGraphGetAccountInsights,
} from "../src/official/instagram-graph-api";
import {
  getResearchToken,
  researchGetUserInfo,
  researchQueryVideos,
} from "../src/official/tiktok-research-api";

async function testInstagramGraphAPI() {
  console.log("\n━━━ Instagram Graph API (Official) ━━━");
  console.log(`Token: ${process.env.INSTAGRAM_ACCESS_TOKEN ? "✅ Set" : "❌ Tidak ada"}`);
  console.log(`UserID: ${process.env.INSTAGRAM_USER_ID ? "✅ Set" : "❌ Tidak ada"}`);

  if (!process.env.INSTAGRAM_ACCESS_TOKEN || !process.env.INSTAGRAM_USER_ID) {
    console.log("⏭️  Skipped (token/userId tidak di-set)\n");
    return;
  }

  // Profil akun sendiri
  console.log("\n[IG] Fetching own account info...");
  const t0 = Date.now();
  const me = await igGraphGetMe();
  console.log(`✅ (${Date.now() - t0}ms)`);
  console.log({
    id: me.id,
    username: me.username,
    followers_count: me.followers_count?.toLocaleString(),
    media_count: me.media_count?.toLocaleString(),
  });

  // Media akun sendiri
  console.log("\n[IG] Fetching own media...");
  const t1 = Date.now();
  const { data: media } = await igGraphGetMedia(
    "id,caption,media_type,timestamp,like_count,comments_count,permalink",
    10
  );
  console.log(`✅ ${media.length} media fetched (${Date.now() - t1}ms)`);

  if (media.length > 0) {
    const top = (media as Array<Record<string, unknown>>).sort(
      (a, b) => Number(b.like_count ?? 0) - Number(a.like_count ?? 0)
    )[0];
    console.log("Top post:", {
      id: top.id,
      like_count: top.like_count,
      comments_count: top.comments_count,
      permalink: top.permalink,
    });
  }

  // Account insights
  console.log("\n[IG] Fetching account insights (daily)...");
  const t2 = Date.now();
  const insights = await igGraphGetAccountInsights("day", "reach,impressions,profile_views");
  console.log(`✅ Insights fetched (${Date.now() - t2}ms)`);
  console.log(JSON.stringify(insights, null, 2));
}

async function testTikTokResearchAPI() {
  console.log("\n━━━ TikTok Research API (Official) ━━━");
  console.log(`ClientKey   : ${process.env.TIKTOK_CLIENT_KEY ? "✅ Set" : "❌ Tidak ada"}`);
  console.log(`ClientSecret: ${process.env.TIKTOK_CLIENT_SECRET ? "✅ Set" : "❌ Tidak ada"}`);

  if (!process.env.TIKTOK_CLIENT_KEY || !process.env.TIKTOK_CLIENT_SECRET) {
    console.log("⏭️  Skipped (credentials tidak di-set)\n");
    return;
  }

  // Get token
  console.log("\n[TT] Getting research access token...");
  const t0 = Date.now();
  const token = await getResearchToken();
  console.log(`✅ Token obtained (${Date.now() - t0}ms): ${token.slice(0, 20)}...`);

  // User info
  const TARGET = process.env.TT_USERNAME ?? "charlidamelio";
  console.log(`\n[TT] Fetching user info for @${TARGET}...`);
  const t1 = Date.now();
  const userResult = await researchGetUserInfo(TARGET);
  console.log(`✅ (${Date.now() - t1}ms)`);
  console.log(JSON.stringify(userResult.data?.user, null, 2));

  // Query videos by username
  console.log(`\n[TT] Querying videos by username @${TARGET} (last 10)...`);
  const t2 = Date.now();
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const startDate = thirtyDaysAgo.toISOString().slice(0, 10).replace(/-/g, "");
  const endDate = today.toISOString().slice(0, 10).replace(/-/g, "");

  const videosResult = await researchQueryVideos(
    { and: [{ field: "username", operation: "EQ", field_values: [TARGET] }] },
    "id,video_description,create_time,like_count,comment_count,share_count,view_count",
    0, 10,
    startDate, endDate
  );
  console.log(`✅ ${videosResult.data?.videos?.length ?? 0} videos (${Date.now() - t2}ms)`);
  console.log(`Has more: ${videosResult.data?.has_more}`);
}

async function main() {
  console.log("🏛️  Official APIs Test");
  console.log("=" .repeat(60));

  await testInstagramGraphAPI();
  await testTikTokResearchAPI();

  console.log("\n✅ Official APIs test selesai!");
}

main().catch(err => {
  console.error("\n❌ Error:", err.message ?? err);
  process.exit(1);
});
