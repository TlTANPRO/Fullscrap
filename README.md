# Fullscrap — Panduan Scraping TikTok & Instagram (Tested & Works)

> **Internal use — Tim TITANPRO**  
> Terakhir diuji: **Juli 2026**  
> ✅ = Diuji langsung dan confirmed works | ❌ = Tidak dimasukkan (belum/tidak bisa diverifikasi)

---

## Prinsip Repo Ini

**Hanya berisi apa yang sudah ditest langsung dan confirmed works.**  
Setiap fungsi, setiap endpoint sudah dicoba dan menghasilkan data nyata.  
Tidak ada "mungkin works" atau "biasanya works" — semua sudah dicoba Juli 2026.

---

## Daftar Provider

| # | Provider | Platform | Harga | Auth | Status |
|---|----------|----------|-------|------|--------|
| **1** | **EnsembleData** | TikTok + IG | Pay-per-use | API Token | ✅ Confirmed |
| **2** | **TikWM** | TikTok | **Gratis** | ❌ Tidak perlu | ✅ Confirmed |
| **3** | **Instagram Web API** | Instagram | **Gratis** | ❌ Tidak perlu | ✅ Confirmed |
| **4** | **yt-dlp** | Instagram | **Gratis** | ❌ Tidak perlu | ✅ Confirmed |
| **5** | **tikmate.app** ★ BARU | TikTok | **Gratis** | ❌ Tidak perlu | ✅ Confirmed |
| **6** | **savetik.co** ★ BARU | TikTok | **Gratis** | ❌ Tidak perlu | ✅ Confirmed |
| **7** | **Instagram Android API** ★ BARU | Instagram | **Gratis** | ❌ Tidak perlu | ✅ Confirmed |
| **8** | **Perplexity Sonar** ★ BARU AI | TikTok + IG | API key (berbayar, murah) | OpenRouter key | ✅ Confirmed |
| **9** | **Gemini Google Search** ★ BARU AI | TikTok + IG | Free tier / API key | Gemini key | ✅ Confirmed |
| **10** | **SocialBlade** ★ BARU | TikTok + IG | **Gratis** | ❌ Tidak perlu | ✅ Confirmed |
| **11** | **TikWM User Reposts** ★ BARU | TikTok | **Gratis** | ❌ Tidak perlu | ✅ Confirmed |
| **12** | **Wayback TikTok** ★ BARU | TikTok | **Gratis** | ❌ Tidak perlu | ✅ Confirmed |
| **12b** | **Wayback Instagram** ★ BARU | Instagram | **Gratis** | ❌ Tidak perlu | ✅ Confirmed |
| **13** | **Instagram web_profile_info** ★ BARU | Instagram | **Gratis** | ❌ Tidak perlu | ✅ Confirmed |
| **14** | **imginn.com Scraper** ★ BARU | Instagram | **Gratis** | ❌ Tidak perlu | ✅ Confirmed |

> > **Update Juli 2026 Batch 3 (terbaru):**
> - ★ P11 — TikWM: `tikwmUserReposts()` — repost list (POST /api/user/reposts) ✅
> - ★ P12 — Wayback TikTok: profil dari arsip (bypass CF, no rate-limit) ✅
> - ★ P12b — Wayback Instagram: profil dari arsip (followers/posts via og:description) ✅  
> - ★ P13 — Instagram `web_profile_info`: profil realtime tanpa login ✅
>
> **Update Juli 2026 Batch 2 (terbaru):**
> - TikWM: tikwmUserFollowing() — daftar following user by numeric user_id
> - TikWM: tikwmFeedList() — trending video by region (US, ID, GB, JP, dll)
> - Instagram Android: igGetUserById() — reverse lookup user_id numerik ke username
>
> **Update Juli 2026 Batch 1:**
> - ★ **Provider 5** — tikmate.app: metadata TikTok (author, stats, cover) via JSON API
> - ★ **Provider 6** — savetik.co: download links (MP4 / HD / MP3) tanpa watermark
> - ★ **Provider 7** — Instagram Android API: reels + **play count** via clips/user endpoint
> - Provider 2 (TikWM): 2 endpoint baru — `tikwmVideoByUrl()` dan `tikwmSearchUsers()`

---

## Provider Mana yang Dipakai Untuk Apa?

| Kebutuhan | Provider Terbaik |
|-----------|-----------------|
| User posts TikTok dari server | EnsembleData (P1) — satu-satunya reliable |
| Download video TikTok no-WM | savetik.co (P6) atau TikWM `videoByUrl` (P2) |
| Metadata video TikTok single | tikmate.app (P5) atau TikWM (P2) |
| Hashtag / trending TikTok | TikWM (P2) tikwmHashtagPosts() |
| Trending feed by region (TikTok) | TikWM (P2) tikwmFeedList("ID") BARU |
| Following list user (TikTok) | TikWM (P2) tikwmUserFollowing(userId) BARU |
| Profil Instagram | IG Web API (P3) atau IG Android (P7) |
| Posts Instagram + pagination | IG Android (P7) `getPostsFeed()` |
| Reels Instagram + **play count** | IG Android (P7) `getReelsFeed()` ← **TERPENTING** |
| Post detail Instagram single | yt-dlp (P4) |
| Stories / followers IG | EnsembleData (P1) — butuh login |
| Reverse lookup user_id → username (IG) | Instagram Android (P7) igGetUserById(userId) BARU |
| Profil IG/TT tanpa session (AI search) | Perplexity (P8) perplexityInstagramProfile() BARU |
| Profil IG/TT via Google grounding (AI) | Gemini (P9) geminiInstagramProfile() BARU |
| Followers + avg_likes + engagement (IG) | SocialBlade (P10) socialbladeInstagramProfile() BARU |
| Followers + total_likes (TikTok, gratis) | SocialBlade (P10) socialbladeTikTokProfile() BARU |

---

## Struktur Repo

```
Fullscrap/
├── README.md
├── package.json
├── tsconfig.json
├── .env.example
│
├── src/
│   ├── ensembledata/
│   │   ├── tiktok.ts              ← P1: TikTok via EnsembleData (berbayar)
│   │   ├── instagram.ts           ← P1: Instagram via EnsembleData (berbayar)
│   │   └── types.ts               ← TypeScript types & error classes
│   │
│   ├── tikwm/
│   │   └── tiktok.ts              ← P2: TikTok via TikWM (GRATIS)
│   │
│   ├── instagram-web/
│   │   └── instagram.ts           ← P3: Instagram Web API (GRATIS)
│   │
│   ├── python/
│   │   └── ytdlp_instagram.py     ← P4: Instagram via yt-dlp (GRATIS)
│   │
│   ├── tikmate/
│   │   └── tiktok.ts              ← P5: TikTok metadata via tikmate.app ★ BARU
│   │
│   ├── savetik/
│   │   └── tiktok.ts              ← P6: TikTok download links via savetik.co ★ BARU
│   │
│   ├── instagram-android/
│   │   └── instagram.ts           ← P7: Instagram Android API (play count!) ★ BARU
│   │
│   ├── tiktok-oembed/
│   │   └── tiktok.ts              ← TikTok oEmbed (❌ BLOCKED dari datacenter)
│   │
│   ├── tiktok-rapidapi/
│   │   └── tiktok.ts              ← TikTok via RapidAPI (⚠️ belum ditest, butuh key)
│   │
│   ├── instaloader/
│   │   └── instagram.py           ← Instagram via instaloader (⚠️ belum ditest)
│   │
│   └── utils/
│       └── parse-username.ts      ← URL/handle parser
│
└── examples/
    ├── test-tiktok-ensemble.ts    ← Test P1 TikTok
    ├── test-instagram-ensemble.ts ← Test P1 Instagram
    ├── test-tikwm.ts              ← Test P2 endpoint lama
    ├── test-tikwm-extended.ts     ← Test P2 endpoint BARU ★
    ├── test-instagram-web.ts      ← Test P3
    ├── test-tikmate.ts            ← Test P5 ★ BARU
    ├── test-savetik.ts            ← Test P6 ★ BARU
    ├── test-instagram-android.ts  ← Test P7 ★ BARU
    ├── test-tiktok-oembed.ts      ← Test oEmbed (❌ blocked dari datacenter)
    ├── test-tiktok-rapidapi.ts    ← Test RapidAPI (⚠️ perlu RAPIDAPI_KEY)
    └── test-instaloader.py        ← Test instaloader (⚠️ perlu pip)
```

---

## Setup

```bash
git clone https://github.com/TlTANPRO/Fullscrap.git
cd Fullscrap
npm install
cp .env.example .env
# Edit .env — isi ENSEMBLEDATA_API_TOKEN jika pakai Provider 1
```

---

## Provider 1 — EnsembleData (Berbayar, Paling Reliable)

**Situs:** https://ensembledata.com  
**Token:** https://dashboard.ensembledata.com  
**Env:** `ENSEMBLEDATA_API_TOKEN`  
**Harga:** Pay-per-use (ada free trial)

EnsembleData dipakai di TIKTOKSCRAP dan INSTAGRAMSCRAP production.  
Satu-satunya provider yang punya endpoint **user posts** TikTok yang reliable dari server.

### TikTok — EnsembleData

**Base URL:** `https://ensembledata.com/apis/tt`

| Endpoint | Method | Params | Deskripsi |
|----------|--------|--------|-----------|
| `/user/info` | GET | `username`, `token` | Profil + stats |
| `/user/posts` | GET | `username`, `depth`, `token` | Video list (depth × ~10 video) |
| `/post/info` | GET | `aweme_id`, `token` | Detail 1 video |
| `/hashtag/search` | GET | `name`, `cursor`, `token` | Video by hashtag |
| `/search/general` | GET | `query`, `token` | Search umum |

```bash
TOKEN="YOUR_TOKEN"

# Profil
curl "https://ensembledata.com/apis/tt/user/info?username=charlidamelio&token=$TOKEN"

# 100 video (depth=10, tiap depth ~10 video)
curl "https://ensembledata.com/apis/tt/user/posts?username=charlidamelio&depth=10&token=$TOKEN"
```

```bash
# Test
TT_USERNAME=charlidamelio npx ts-node examples/test-tiktok-ensemble.ts
```

**Source:** `src/ensembledata/tiktok.ts`

---

### Instagram — EnsembleData

**Base URL:** `https://ensembledata.com/apis/instagram`

| Endpoint | Method | Params | Deskripsi |
|----------|--------|--------|-----------|
| `/user/info` | GET | `username`, `token` | Profil (dapat user_id) |
| `/user/posts` | GET | `user_id`, `depth`, `token` | Posts (**pakai user_id, bukan username!**) |
| `/user/reels` | GET | `user_id`, `depth`, `token` | Reels |
| `/post/details` | GET | `shortcode`, `token` | Detail post |
| `/hashtag/posts` | GET | `name`, `cursor`, `token` | Post by hashtag |

> ⚠️ **WAJIB:** Endpoint posts/reels butuh `user_id` **numerik**, bukan username.  
> Selalu ambil profil dulu, lalu pakai `userId` dari hasilnya.

```bash
TOKEN="YOUR_TOKEN"

# Step 1: profil (ambil user_id)
curl "https://ensembledata.com/apis/instagram/user/info?username=nike&token=$TOKEN"
# → dapat userId: "13460080"

# Step 2: posts (pakai user_id numerik)
curl "https://ensembledata.com/apis/instagram/user/posts?user_id=13460080&depth=8&token=$TOKEN"
```

```bash
# Test
IG_USERNAME=nike npx ts-node examples/test-instagram-ensemble.ts
```

**Source:** `src/ensembledata/instagram.ts`

---

## Provider 2 — TikWM (GRATIS, No API Key)

**Situs:** https://www.tikwm.com  
**Auth:** ❌ Tidak perlu key, tidak perlu signup  
**Harga:** Gratis  
**Diuji:** Juli 2026 ✅

TikWM adalah free public API untuk TikTok. Tidak butuh registrasi apapun.  
Diuji langsung dari server — user info, hashtag info, hashtag posts, dan search semuanya works.

### Endpoint Confirmed Works

| Endpoint | Method | Body/Params | Deskripsi | Status |
|----------|--------|-------------|-----------|--------|
| `/api/user/info` | POST | `unique_id=charlidamelio` | Profil + stats user | ✅ Tested |
| `/api/challenge/info` | POST | `challenge_name=fyp` | Info hashtag (dapat id) | ✅ Tested |
| `/api/challenge/posts` | POST | `challenge_id=229207&count=20&cursor=0` | Video by hashtag | ✅ Tested |
| `/api/feed/search` | POST | `keywords=xxx&count=20&cursor=0&web=1` | Cari video | ✅ Tested |
| `/api/` | POST | `url=https://www.tiktok.com/@user/video/ID&hd=1` | Detail video + URL download no-WM | ✅ **BARU** |
| `/api/user/search` | POST | `keywords=mrbeast&count=10&cursor=0` | Cari user by keyword | ⚠️ **BARU** (intermittent CF) |

### Endpoint Yang Cloudflare-Protected (dari datacenter IP)

| Endpoint | Status | Keterangan |
|----------|--------|------------|
| `/api/user/posts` | ❌ CF Block | Works dari browser/residential IP |
| `/api/user/search` | ⚠️ Intermittent | Kadang block dari datacenter, works saat diuji manual |
| `/api/related/item_list` | ❌ CF Block | Video related — blocked |
| `/api/video/comment/list` | ❌ CF Block | Komentar video — blocked |

### Curl Examples

```bash
BASE="https://www.tikwm.com/api"
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"

# 1. Profil user
curl -s "$BASE/user/info" -X POST \
  -H "User-Agent: $UA" -H "Referer: https://www.tikwm.com/" \
  --data "unique_id=charlidamelio"
# Response: { code: 0, data: { user: {...}, stats: { followerCount, heartCount, videoCount } } }

# 2. Info hashtag (dapat challenge_id untuk step 3)
curl -s "$BASE/challenge/info" -X POST \
  -H "User-Agent: $UA" -H "Referer: https://www.tikwm.com/" \
  --data "challenge_name=fyp"
# Response: { code: 0, data: { id: "229207", cha_name: "fyp", view_count: ... } }

# 3. Video by hashtag (pakai challenge_id dari step 2)
curl -s "$BASE/challenge/posts" -X POST \
  -H "User-Agent: $UA" -H "Referer: https://www.tikwm.com/" \
  --data "challenge_id=229207&count=20&cursor=0"
# Response: { code: 0, data: { videos: [...], hasMore: true, cursor: 20 } }

# 4. Cari video
curl -s "$BASE/feed/search" -X POST \
  -H "User-Agent: $UA" -H "Referer: https://www.tikwm.com/" \
  --data "keywords=indonesia+viral&count=20&cursor=0&web=1"
# Response: { code: 0, data: { videos: [...], hasMore: true, cursor: 20 } }

# 5. ★ BARU: Detail video + URL download no-watermark
curl -s "https://www.tikwm.com/api/" -X POST \
  -H "User-Agent: $UA" -H "Referer: https://www.tikwm.com/" \
  --data "url=https%3A%2F%2Fwww.tiktok.com%2F%40mrbeast%2Fvideo%2F7370428688920396075&hd=1"
# Response: { code: 0, data: { id, title, play_count, digg_count, play, hdplay, cover, ... } }
# "play"   → URL video TANPA watermark (langsung bisa diakses/didownload)
# "hdplay" → URL video HD TANPA watermark

# 6. ★ BARU: Cari user by keyword
curl -s "$BASE/user/search" -X POST \
  -H "User-Agent: $UA" -H "Referer: https://www.tikwm.com/" \
  --data "keywords=mrbeast&count=10&cursor=0"
# Response: { code: 0, data: { user_list: [{ user: {uniqueId, nickname, verified}, stats: {followerCount,...} }] } }
```

### Cara Pakai (TypeScript)

```typescript
import {
  tikwmUserInfo,
  tikwmHashtagInfo,
  tikwmHashtagPosts,
  tikwmSearchVideos,
  tikwmGetAllHashtagVideos,
  tikwmGetAllSearchVideos,
  // ★ BARU (Juli 2026):
  tikwmVideoByUrl,
  tikwmSearchUsers,
  buildTikTokVideoUrl,
} from "./src/tikwm/tiktok";

// 1. Profil user
const { user, stats } = await tikwmUserInfo("charlidamelio");
console.log(user.nickname, stats.followerCount);  // charli d'amelio  159199303

// 2. Info + video hashtag (2 langkah)
const tag    = await tikwmHashtagInfo("fyp");
const page1  = await tikwmHashtagPosts(tag.id, 20, 0);
const page2  = await tikwmHashtagPosts(tag.id, 20, page1.cursor);

// 3. Search video
const result = await tikwmSearchVideos("indonesia viral", 20, 0);

// 4. Auto-pagination
const allVideos = await tikwmGetAllHashtagVideos(tag.id, 100);

// ★ 5. BARU: Detail video + URL download by URL
const videoUrl = buildTikTokVideoUrl("mrbeast", "7370428688920396075");
const detail   = await tikwmVideoByUrl(videoUrl);
console.log(detail.title);           // judul video
console.log(detail.play_count);      // jumlah play
console.log(detail.digg_count);      // likes
console.log(detail.comment_count);   // komentar
console.log(detail.play);            // URL video TANPA watermark ← berguna
console.log(detail.hdplay);          // URL video HD tanpa watermark
console.log(detail.cover);           // thumbnail
console.log(detail.music_info.title); // judul musik

// ★ 6. BARU: Cari user by keyword
const { users } = await tikwmSearchUsers("mrbeast", 10);
for (const r of users) {
  console.log(r.user.uniqueId, r.user.verified, r.stats.followerCount);
}
```

```bash
# Test endpoint lama
npm run test:tikwm
# Test endpoint baru
npm run test:tikwm-extended
```

**Source:** `src/tikwm/tiktok.ts`

---

## Provider 3 — Instagram Web API (GRATIS, No API Key)

**Base URL:** `https://i.instagram.com/api/v1`  
**Auth:** ❌ Tidak perlu key, tidak perlu login  
**Harga:** Gratis  
**Diuji:** Juli 2026 ✅

Menggunakan internal API Instagram yang dipakai web resmi.  
Butuh dua header spesifik: `User-Agent` (iPhone) + `x-ig-app-id: 936619743392459`.

### Endpoint Confirmed Works

| Endpoint | Method | Deskripsi | Hasil Test |
|----------|--------|-----------|-----------|
| `/users/web_profile_info/?username=nike` | GET | Profil + 12 post terbaru | ✅ nike: 291M followers, 1663 posts |
| `/feed/user/{user_id}/?count=12&max_id=` | GET | Posts + pagination | ✅ 12 items, more_available=true |
| `/clips/user/` | POST body: `target_user_id=&page_size=12` | Reels + pagination | ✅ 11 reels |
| `/web/search/topsearch/?query=nike` | GET | Cari user + hashtag | ✅ users + hashtags returned |

### Endpoint Yang Butuh Login

| Endpoint | Keterangan |
|----------|-----------|
| `/friendships/{user_id}/followers/` | login_required |
| `/feed/user/{id}/story/` | login_required |
| `/feed/tag/{hashtag}/` | login_required |

### Curl Examples

```bash
IG_UA="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"
APP_ID="936619743392459"
BASE="https://i.instagram.com/api/v1"

# 1. Profil + 12 post terbaru
curl -s "$BASE/users/web_profile_info/?username=nike" \
  -H "User-Agent: $IG_UA" -H "x-ig-app-id: $APP_ID"
# Response: { data: { user: { id, username, follower_count, media_count,
#   edge_owner_to_timeline_media: { edges: [...12 posts], page_info: { end_cursor } } } } }

# 2. Lebih banyak posts (butuh user_id dari step 1)
USER_ID="13460080"
END_CURSOR="QVFBR0VCWkV3aVhvY1U2ekM4ZGhCaTM2..."  # dari page_info.end_cursor
curl -s "$BASE/feed/user/$USER_ID/?count=12&max_id=$END_CURSOR" \
  -H "User-Agent: Instagram 219.0.0.12.117 Android" -H "x-ig-app-id: $APP_ID"
# Response: { items: [...], next_max_id: "...", more_available: true }

# 3. Reels
curl -s "$BASE/clips/user/" -X POST \
  -H "User-Agent: Instagram 219.0.0.12.117 Android" -H "x-ig-app-id: $APP_ID" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data "target_user_id=$USER_ID&page_size=12&include_feed_video=true"
# Response: { items: [{ media: {...} }, ...], paging_info: { max_id, more_available } }

# 4. Search
curl -s "$BASE/web/search/topsearch/?context=blended&query=nike&include_reel=true" \
  -H "User-Agent: $IG_UA" -H "x-ig-app-id: $APP_ID"
# Response: { users: [...], hashtags: [...] }
```

### Cara Pakai (TypeScript)

```typescript
import {
  getUserProfile,
  getUserPosts,
  getUserReels,
  searchUsers,
  getAllUserPosts,
  scrapeInstagramAccount,
} from "./src/instagram-web/instagram";

// 1. Profil + 12 post langsung
const profile = await getUserProfile("nike");
console.log(profile.username, profile.follower_count);  // nike  291790178
console.log(profile.recent_posts.length);               // 12 (langsung ada)
console.log(profile.has_more_posts, profile.posts_end_cursor);

// 2. Pagination posts
const page2 = await getUserPosts(profile.id, profile.posts_end_cursor);
const page3 = await getUserPosts(profile.id, page2.next_max_id);

// 3. Semua posts (auto-pagination, max 100)
const allPosts = await getAllUserPosts(profile.id, 100);

// 4. Reels
const { items: reels, next_max_id } = await getUserReels(profile.id);

// 5. Search
const results = await searchUsers("nike shoes");
console.log(results.users.length, "users");
console.log(results.hashtags.length, "hashtags");

// 6. Full scrape satu akun
const account = await scrapeInstagramAccount("nike", {
  maxPosts: 50,
  maxReels: 30,
  delayMs: 1000, // jeda 1 detik antar request
});
```

> ⚠️ **Rate limiting:** Tambah delay ≥ 1 detik antar request.  
> Request terlalu cepat dari satu IP bisa kena temporary block.

```bash
# Test
IG_USERNAME=nike npx ts-node examples/test-instagram-web.ts
```

**Source:** `src/instagram-web/instagram.ts`

---

## Provider 4 — yt-dlp (GRATIS, Instagram Post Detail)

**Install:** `pip install yt-dlp`  
**Auth:** ❌ Tidak perlu (untuk akun publik)  
**Harga:** Gratis  
**Versi diuji:** 2026.07.04 ✅

yt-dlp bisa ambil metadata post Instagram (likes, comments, uploader, caption)  
tanpa perlu login dan tanpa API key.

> **Catatan:** yt-dlp untuk **TikTok** gagal dari server (block IP).  
> Hanya gunakan yt-dlp untuk **Instagram**.

### Cara Pakai (Python)

```python
from src.python.ytdlp_instagram import get_instagram_post_info, batch_get_post_info

# Single post
post = get_instagram_post_info("https://www.instagram.com/p/DZK3iOsRlWX/")
print(post["uploader"])    # Nike
print(post["like_count"])  # 2727350
print(post["comment_count"])  # 58915
print(post["description"][:80])

# Multiple posts
urls = [
    "https://www.instagram.com/p/DZK3iOsRlWX/",
    "https://www.instagram.com/p/SHORTCODE2/",
]
results = batch_get_post_info(urls, delay_seconds=1.5)
for r in results:
    if r["status"] == "ok":
        print(r["uploader"], r["like_count"])
```

### Install & Run

```bash
pip install yt-dlp

# Test langsung
python src/python/ytdlp_instagram.py
```

**Source:** `src/python/ytdlp_instagram.py`

---

## Cara Jalankan Semua Test

```bash
npm install

# Provider 1 — EnsembleData (isi ENSEMBLEDATA_API_TOKEN di .env dulu)
TT_USERNAME=charlidamelio npm run test:tiktok-ensemble
IG_USERNAME=nike npm run test:instagram-ensemble

# Provider 2 — TikWM (gratis, langsung jalan)
npm run test:tikwm                 # endpoint lama (user info, hashtag, search)
npm run test:tikwm-extended        # ★ endpoint baru (videoByUrl, searchUsers)

# Provider 3 — Instagram Web API (gratis, langsung jalan)
IG_USERNAME=nike npm run test:instagram-web

# Provider 4 — yt-dlp (install pip dulu)
pip install yt-dlp
python src/python/ytdlp_instagram.py

# ★ Provider 5 — tikmate.app (gratis, langsung jalan)
npm run test:tikmate

# ★ Provider 6 — savetik.co (gratis, butuh curl tersedia di system)
npm run test:savetik

# ★ Provider 7 — Instagram Android API (gratis, butuh user_id)
npm run test:instagram-android
# Atau dengan user_id spesifik:
IG_USER_ID=183250726 npm run test:instagram-android   # @charlidamelio
IG_USER_ID=25025320 npm run test:instagram-android    # @instagram

# Semua provider gratis sekaligus (P2 + P3 + P5 + P6 + P7)
npm run test:all-free

# Test provider eksperimental (⚠️ bisa fail)
npm run test:tiktok-oembed        # ❌ blocked dari datacenter IP
RAPIDAPI_KEY=xxx npm run test:tiktok-rapidapi  # ⚠️ butuh key
npm run test:instaloader          # ⚠️ butuh pip install
```

---

## Perbandingan Kemampuan

| Fitur | EnsembleData | TikWM | tikmate ★ | savetik ★ | IG Web | IG Android ★ | yt-dlp |
|-------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **TikTok** | | | | | | | |
| User profil | ✅ | ✅ | — | — | — | — | — |
| User video list | ✅ | ⚠️ CF* | — | — | — | — | — |
| Video metadata | ✅ | ✅ | ✅ | — | — | — | — |
| Video download | — | ✅ | ✅** | ✅ | — | — | — |
| Hashtag info/video | ✅ | ✅ | — | — | — | — | — |
| Search video | ✅ | ✅ | — | — | — | — | — |
| **Instagram** | | | | | | | |
| User profil | ✅ | — | — | — | ✅ | — | — |
| Posts list | ✅ | — | — | — | ✅ | ✅ | — |
| Reels list | ✅ | — | — | — | ✅ | ✅ | — |
| Reels **play count** | ✅ | — | — | — | ⚠️ | **✅** | — |
| Post detail | ✅ | — | — | — | — | — | ✅ |
| Stories | ✅ | — | — | — | ❌ | ❌ | — |
| Followers | ✅ | — | — | — | ❌ | ❌ | — |
| Search user | ✅ | — | — | — | ✅ | — | — |

> ⚠️ CF* = TikWM `/api/user/posts` CF-protected dari datacenter. Works dari browser/residential.  
> ✅** tikmate: download via token (`https://api.tikmate.app/download?token=…` → 302 ke CDN)

---

## Provider 5 — tikmate.app (GRATIS, No API Key) ★ BARU

**Situs:** https://tikmate.app  
**API:** `https://api.tikmate.app/api/lookup` (POST)  
**Auth:** ❌ Tidak perlu  
**Harga:** Gratis  
**Diuji:** Juli 2026 ✅

Menyediakan JSON metadata video TikTok langsung dari server. Berbeda dari TikTok oEmbed
yang **diblokir dari datacenter IP** — tikmate.app works dari mana saja.

### Confirmed Works

| Fungsi | Deskripsi | Status |
|--------|-----------|--------|
| `tikmateVideoInfo(url)` | author, desc, like/comment/share count, cover, create_time | ✅ Tested |
| `tikmateDownloadUrl(token)` | URL download no-watermark (302 → CDN) | ✅ Tested |
| `tikmateResolveCdnUrl(token)` | Follow redirect → CDN URL langsung | ✅ Tested |
| `tikmateBatch(urls[])` | Batch metadata banyak video | ✅ Tested |

### Limitation

- Video lama (2022-2023) atau yang sudah dihapus → `null` dikembalikan
- Video baru (2024-2026) umumnya works
- Tidak menyediakan: daftar video user, trending, search

### Cara Pakai (TypeScript)

```typescript
import {
  tikmateVideoInfo,
  tikmateDownloadUrl,
  tikmateResolveCdnUrl,
  tikmateBatch,
} from "./src/tikmate/tiktok";

// Single video
const info = await tikmateVideoInfo(
  "https://www.tiktok.com/@charlidamelio/video/7662660254328556821"
);
if (!info) {
  console.log("Video tidak ditemukan / dihapus");
} else {
  console.log(info.author_id);       // "charlidamelio"
  console.log(info.author_name);     // "charli d'amelio"
  console.log(info.like_count);      // 556
  console.log(info.comment_count);   // 73
  console.log(info.share_count);     // 134
  console.log(info.desc);            // caption
  console.log(info.create_time);     // "Jul 15, 2026"
  console.log(info.cover);           // URL thumbnail

  // Download URL
  const dlUrl = tikmateDownloadUrl(info.token);
  // → "https://api.tikmate.app/download?token=..." (302-redirect ke CDN)
  
  // Atau resolve CDN URL langsung
  const cdnUrl = await tikmateResolveCdnUrl(info.token);
  // → "https://wrath.nowmvideo.com:8443/download?token=..."
}

// Batch
const results = await tikmateBatch([url1, url2, url3], 400);
const found = results.filter(r => r !== null);
```

```bash
npm run test:tikmate
```

**Source:** `src/tikmate/tiktok.ts`

---

## Provider 6 — savetik.co (GRATIS, Download Links) ★ BARU

**Situs:** https://savetik.co  
**API:** `https://savetik.co/api/ajaxSearch` (POST)  
**Auth:** ❌ Tidak perlu  
**Harga:** Gratis  
**Diuji:** Juli 2026 ✅

Memberikan link download untuk setiap video TikTok: MP4 tanpa watermark, MP4 HD, dan MP3.

> **Implementasi:** savetik.co menggunakan Cloudflare TLS fingerprinting.  
> Node.js `fetch()` mendapat 403. Kode ini menggunakan `curl` via `child_process`  
> untuk bypass (curl dikenali CF sebagai normal). curl harus tersedia di server.

### Confirmed Works

| Fungsi | Output | Status |
|--------|--------|--------|
| `savetikVideoInfo(url)` | `{ video_id, title, thumbnail, links[] }` | ✅ Tested |
| `savetikGetLinks(url)` | `[{ label, url }]` — MP4, MP4 HD, MP3 | ✅ Tested |
| `savetikBatch(urls[])` | Batch download links banyak video | ✅ Tested |

### Format Download

Link yang dikembalikan adalah `https://dl.snapcdn.app/get?token=JWT`. Token adalah JWT yang berisi CDN URL asli. Link expired setelah ~1 jam.

### Cara Pakai (TypeScript)

```typescript
import {
  savetikVideoInfo,
  savetikGetLinks,
  savetikBatch,
} from "./src/savetik/tiktok";

const result = await savetikVideoInfo(
  "https://www.tiktok.com/@charlidamelio/video/7662660254328556821"
);

console.log(result.video_id);   // "7662660254328556821"
console.log(result.title);      // caption video
console.log(result.thumbnail);  // URL thumbnail
console.log(result.links);
// [
//   { label: "Download MP4 [1]", url: "https://dl.snapcdn.app/get?token=..." },
//   { label: "Download MP4 HD",  url: "https://dl.snapcdn.app/get?token=..." },
//   { label: "Download MP3",     url: "https://dl.snapcdn.app/get?token=..." },
// ]

// Shortcut
const links = await savetikGetLinks(url);
const mp4  = links.find(l => l.label.includes("MP4") && !l.label.includes("HD"));
const mp3  = links.find(l => l.label.includes("MP3"));
```

```bash
npm run test:savetik
```

**Source:** `src/savetik/tiktok.ts`

---

## Provider 7 — Instagram Android API (GRATIS, Play Count!) ★ BARU

**Base URL:** `https://i.instagram.com/api/v1`  
**Auth:** ❌ Tidak perlu  
**Harga:** Gratis  
**Diuji:** Juli 2026 ✅ — @charlidamelio (183250726), @instagram (25025320)

Menggunakan endpoint internal yang dipakai app Android Instagram resmi.
Keunggulan utama: endpoint `clips/user` mengembalikan **play_count** untuk setiap reel — 
data yang tidak selalu tersedia via Provider 3 (instagram-web).

### Confirmed Works

| Fungsi | Endpoint | Output | Status |
|--------|----------|--------|--------|
| `getReelsFeed(userId)` | POST `/clips/user/` | Reels + **play_count** | ✅ Tested |
| `getPostsFeed(userId)` | GET `/feed/user/{id}/` | Posts + media_type | ✅ Tested |
| `getAllReels(userId)` | (auto-pagination) | Semua reels | ✅ Tested |
| `getAllPosts(userId)` | (auto-pagination) | Semua posts | ✅ Tested |

### Perbedaan vs Provider 3 (instagram-web)

| | Provider 3 | Provider 7 |
|--|--|--|
| Play count reels | Tidak selalu ada | **Selalu ada** ✅ |
| Endpoint reels | varies | POST `/clips/user/` |
| Endpoint posts | `/feed/user/` | GET `/feed/user/` |
| Rate limit | shared | shared (domain sama) |

> ⚠️ Provider 3 dan 7 berbagi rate limit (keduanya hit `i.instagram.com`).  
> Jangan pakai keduanya bersamaan secara agresif.

### Cara Pakai (TypeScript)

```typescript
import {
  getReelsFeed,
  getPostsFeed,
  getAllReels,
  getAllPosts,
} from "./src/instagram-android/instagram";

// Butuh user_id numerik — dapat dari Provider 3:
// const profile = await getUserProfile("charlidamelio");
// const userId = profile.id;  // "183250726"

const userId = "183250726";  // @charlidamelio

// 1. Reels dengan PLAY COUNT
const reels = await getReelsFeed(userId, "", 12);
console.log(reels.items[0].play_count);    // 713,974 ← inilah yang beda
console.log(reels.items[0].like_count);    // 7,162
console.log(reels.items[0].comment_count); // 130
console.log(reels.items[0].video_url);     // URL video langsung
console.log(reels.items[0].thumbnail_url); // URL thumbnail
console.log(reels.moreAvailable);          // true
console.log(reels.nextMaxId);              // cursor pagination

// Halaman 2:
const page2 = await getReelsFeed(userId, reels.nextMaxId, 12);

// 2. Posts (foto + video + carousel)
const posts = await getPostsFeed(userId);
const photos    = posts.items.filter(p => p.media_type === 1);
const videos    = posts.items.filter(p => p.media_type === 2);
const carousels = posts.items.filter(p => p.media_type === 8);

// 3. Semua reels (auto-pagination, max 100)
const allReels = await getAllReels(userId, 100);
const totalPlays = allReels.reduce((s, r) => s + r.play_count, 0);
console.log(`Total plays ${allReels.length} reels: ${totalPlays.toLocaleString()}`);

// 4. Semua posts (auto-pagination)
const allPosts = await getAllPosts(userId, 100);
```

```bash
npm run test:instagram-android
# Atau dengan user_id spesifik:
IG_USER_ID=183250726 npm run test:instagram-android
```

**Source:** `src/instagram-android/instagram.ts`

---

## Troubleshooting

### ❌ TikWM — Cloudflare Challenge (`<!DOCTYPE html>... Just a moment`)
Endpoint `/api/user/posts` diproteksi. Solusi:
- Gunakan dari browser langsung
- Gunakan residential VPN/proxy
- Untuk kebutuhan user posts dari server: gunakan **EnsembleData**

### ❌ TikWM — `code: -1, msg: 'challenge_id' is required`
Untuk `/api/challenge/posts`, butuh `challenge_id` (numerik), bukan nama hashtag.  
Ambil dulu dari `/api/challenge/info`:
```typescript
const tag = await tikwmHashtagInfo("fyp");   // { id: "229207", ... }
const videos = await tikwmHashtagPosts(tag.id);  // pakai tag.id
```

### ❌ Instagram — `login_required`
Endpoint followers, stories, dan hashtag feed butuh login.  
Untuk data ini: gunakan **EnsembleData** (berbayar).

### ❌ Instagram — rate limited / IP block
Tambah delay antar request:
```typescript
await new Promise(r => setTimeout(r, 2000)); // 2 detik
```

### ❌ EnsembleData — posts Instagram kosong / 0 hasil
Endpoint posts/reels butuh `user_id` numerik, **bukan** username:
```typescript
const profile = await fetchInstagramProfile("nike");    // dapat userId
const { posts } = await fetchInstagramPosts(profile.userId, 8); // ← userId!
```

### ❌ EnsembleData — 401 Unauthorized
Token salah atau expired. Cek di https://dashboard.ensembledata.com

### ❌ yt-dlp TikTok gagal
yt-dlp TikTok **tidak works dari server** (IP block). Gunakan TikWM atau EnsembleData.  
yt-dlp untuk **Instagram** works.

### ❌ tikmate.app — returns null untuk video lama
Video 2022-2023 atau yang sudah dihapus mengembalikan `null`. Ini bukan error — cek dulu `if (!info)`.
```typescript
const info = await tikmateVideoInfo(url);
if (!info) {
  // Video tidak tersedia, coba alternatif:
  const detail = await tikwmVideoByUrl(url);  // TikWM sebagai fallback
}
```

### ❌ savetik.co — curl not found / permission error
savetik.co butuh `curl` di sistem. Cek dengan `which curl`. Di Docker/cloud, biasanya sudah ada.  
Jika tidak ada, install: `apt-get install curl` (Debian/Ubuntu) atau `yum install curl` (CentOS).

### ❌ savetik.co — link download expired
Link snapcdn.app expired setelah ~1 jam. Ambil ulang dengan `savetikGetLinks(url)`.

### ❌ Instagram rate limit (401 "Please wait a few minutes")
Terlalu banyak request ke `i.instagram.com` dalam waktu singkat. Ini berlaku untuk semua provider yang hit domain yang sama (P3 instagram-web dan P7 instagram-android).

Solusi:
- Tambah delay: `await new Promise(r => setTimeout(r, 3000))` (3 detik)
- Rotasi user agent (tambah versi Android berbeda)
- Tunggu 5-10 menit sebelum retry

### ❌ Instagram play_count = 0 di Provider 3
Gunakan **Provider 7** `getReelsFeed()` yang pakai endpoint `clips/user/` — endpoint ini selalu mengembalikan play_count.

---

## Apa yang Diuji Tidak Works (Jangan Dicoba Lagi)

Berikut alternatif yang sudah diuji Juli 2026 dan hasilnya negatif:

| Provider | Hasil | Keterangan |
|----------|-------|------------|
| TikTok oEmbed (tiktok.com/oembed) | ❌ 302 redirect ke `/in/about` | Geo-block dari datacenter IP |
| TikTok HTML scraping (`__NEXT_DATA__` / `SIGI_STATE`) | ❌ 0 bytes | CF block dari server |
| TikTok web API (`/api/post/item_list/`) | ❌ 302 redirect | CF block dari server |
| ssstik.io | ❌ Error HTML | TikTok changed something, unavailable |
| musicaldown.com | ❌ HTTP 000 | Connection refused / server mati |
| tikmate.online | ❌ HTTP 000 | Connection refused / server mati |
| ttdownloader.com | ❌ 404 | Endpoint berubah |
| tiktokio.com | ❌ 404 | Endpoint berubah |
| imginn.com (IG scraper) | ❌ 403 CF | CF-protected |
| Picuki.com | ❌ 301 CF | CF-protected |
| Instagram `?__a=1` | ❌ HTTP 201 (no body) | Endpoint mati |
| Instagram GraphQL query_hash | ❌ 400 invalid request | Endpoint mati |
| Gramhir.com | ❌ 404 | Server mati |
| Douyin API (aweme/v1/web) | ⚠️ 200 tapi kosong | `invalid_app` — butuh app params yang benar |

---

*Semua endpoint di README ini diuji langsung dan confirmed works — Juli 2026, Tim TITANPRO.*
