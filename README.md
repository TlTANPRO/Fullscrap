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
│   │   ├── tiktok.ts         ← Provider 1: TikTok via EnsembleData (berbayar)
│   │   ├── instagram.ts      ← Provider 1: Instagram via EnsembleData (berbayar)
│   │   └── types.ts          ← TypeScript types & error classes
│   │
│   ├── tikwm/
│   │   └── tiktok.ts         ← Provider 2: TikTok via TikWM (GRATIS)
│   │
│   ├── instagram-web/
│   │   └── instagram.ts      ← Provider 3: Instagram Web API (GRATIS)
│   │
│   ├── python/
│   │   └── ytdlp_instagram.py ← Provider 4: Instagram via yt-dlp (GRATIS)
│   │
│   └── utils/
│       └── parse-username.ts ← URL/handle parser (handle @user, URL, bare)
│
└── examples/
    ├── test-tiktok-ensemble.ts    ← Test Provider 1 TikTok
    ├── test-instagram-ensemble.ts ← Test Provider 1 Instagram
    ├── test-tikwm.ts              ← Test Provider 2 (TikWM)
    └── test-instagram-web.ts      ← Test Provider 3 (Instagram Web API)
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

### Endpoint Yang Cloudflare-Protected

| Endpoint | Status | Keterangan |
|----------|--------|------------|
| `/api/user/posts` | ⚠️ CF Block | Works dari browser/residential IP, block dari datacenter |

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
} from "./src/tikwm/tiktok";

// 1. Profil user
const { user, stats } = await tikwmUserInfo("charlidamelio");
console.log(user.nickname, stats.followerCount);  // charli d'amelio  159199303

// 2. Info + video hashtag (2 langkah)
const tag    = await tikwmHashtagInfo("fyp");       // { id: "229207", view_count: ... }
const page1  = await tikwmHashtagPosts(tag.id, 20, 0);    // { videos: [...], hasMore, cursor }
const page2  = await tikwmHashtagPosts(tag.id, 20, page1.cursor); // halaman berikutnya

// 3. Search video
const result = await tikwmSearchVideos("indonesia viral", 20, 0);
console.log(result.videos.length, "videos found");

// 4. Auto-pagination (semua video hashtag)
const allVideos = await tikwmGetAllHashtagVideos(tag.id, 100); // max 100
```

```bash
# Test
TT_USERNAME=charlidamelio npx ts-node examples/test-tikwm.ts
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
TT_USERNAME=charlidamelio npx ts-node examples/test-tiktok-ensemble.ts
IG_USERNAME=nike npx ts-node examples/test-instagram-ensemble.ts

# Provider 2 — TikWM (gratis, langsung jalan)
TT_USERNAME=charlidamelio npx ts-node examples/test-tikwm.ts

# Provider 3 — Instagram Web API (gratis, langsung jalan)
IG_USERNAME=nike npx ts-node examples/test-instagram-web.ts

# Provider 4 — yt-dlp (install pip dulu)
pip install yt-dlp
python src/python/ytdlp_instagram.py
```

---

## Perbandingan Kemampuan

| Fitur | EnsembleData | TikWM | IG Web API | yt-dlp |
|-------|:---:|:---:|:---:|:---:|
| **TikTok** | | | | |
| User profil | ✅ | ✅ | — | — |
| User video list | ✅ | ⚠️ CF* | — | — |
| Video detail | ✅ | — | — | — |
| Hashtag info | ✅ | ✅ | — | — |
| Hashtag video | ✅ | ✅ | — | — |
| Search video | ✅ | ✅ | — | — |
| **Instagram** | | | | |
| User profil | ✅ | — | ✅ | — |
| Post list | ✅ | — | ✅ | — |
| Post detail | ✅ | — | — | ✅ |
| Reels | ✅ | — | ✅ | — |
| Stories | ✅ | — | ❌ login | — |
| Followers | ✅ | — | ❌ login | — |
| Hashtag posts | ✅ | — | ❌ login | — |
| Search user | ✅ | — | ✅ | — |

> ⚠️ CF* = TikWM `/api/user/posts` diproteksi Cloudflare dari datacenter IP.  
> Works dari browser atau residential IP/VPS.

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

---

*Semua endpoint di README ini diuji langsung dan confirmed works — Juli 2026, Tim TITANPRO.*
