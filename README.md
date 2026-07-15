# Fullscrap — Panduan Lengkap Scraping TikTok & Instagram

> **Internal use — Tim TITANPRO**  
> Diuji & diverifikasi: Juli 2026

Repo ini adalah panduan teknis + source code lengkap untuk scraping akun TikTok dan Instagram menggunakan semua provider yang **tested dan confirmed working**. Tersedia implementasi TypeScript dan Python.

---

## Daftar Isi

- [Struktur Repo](#struktur-repo)
- [Perbandingan Semua Provider](#perbandingan-semua-provider)
- [PILIHAN 1 — EnsembleData (Recommended)](#pilihan-1--ensembledata-recommended)
- [PILIHAN 2 — RapidAPI (4 Provider)](#pilihan-2--rapidapi-4-provider)
- [PILIHAN 3 — Apify Platform](#pilihan-3--apify-platform)
- [PILIHAN 4 — SocialBlade (Stats Historis)](#pilihan-4--socialblade-stats-historis)
- [PILIHAN 5 — HikerAPI (Instagram, 147 Endpoint)](#pilihan-5--hikerapi-instagram-147-endpoint)
- [PILIHAN 6 — Instagram Graph API (Official)](#pilihan-6--instagram-graph-api-official)
- [PILIHAN 7 — TikTok Research API (Official)](#pilihan-7--tiktok-research-api-official)
- [PILIHAN 8 — instagrapi (Python)](#pilihan-8--instagrapi-python)
- [PILIHAN 9 — TikTokApi Python](#pilihan-9--tiktokapi-python)
- [Setup & Cara Jalankan](#setup--cara-jalankan)
- [Troubleshooting](#troubleshooting)

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
│   │   ├── tiktok.ts              ← PILIHAN 1: TikTok via EnsembleData
│   │   ├── instagram.ts           ← PILIHAN 1: Instagram via EnsembleData
│   │   └── types.ts               ← Shared TypeScript types
│   │
│   ├── rapidapi/
│   │   ├── tiktok-scraper7.ts     ← PILIHAN 2a: TikTok via tiktok-scraper7
│   │   ├── tokapi-tiktok.ts       ← PILIHAN 2b: TikTok via tokapi (mobile API)
│   │   ├── tiktok-api23.ts        ← PILIHAN 2c: TikTok via tiktok-api23
│   │   ├── instagram-scraper-api2.ts ← PILIHAN 2d: Instagram via instagram-scraper-api2
│   │   └── instagram-looter2.ts   ← PILIHAN 2e: Instagram via instagram-looter2
│   │
│   ├── apify/
│   │   ├── tiktok.ts              ← PILIHAN 3: TikTok via Apify actors
│   │   └── instagram.ts           ← PILIHAN 3: Instagram via Apify actors
│   │
│   ├── hikerapi/
│   │   └── instagram.ts           ← PILIHAN 5: Instagram via HikerAPI (147 endpoints)
│   │
│   ├── official/
│   │   ├── instagram-graph-api.ts ← PILIHAN 6: Instagram Graph API (Meta Official)
│   │   └── tiktok-research-api.ts ← PILIHAN 7: TikTok Research API (Official)
│   │
│   ├── python/
│   │   ├── instagrapi_guide.py    ← PILIHAN 8: Instagram via instagrapi (Python)
│   │   └── tiktok_api_guide.py    ← PILIHAN 9: TikTok via TikTokApi (Python)
│   │
│   └── utils/
│       └── parse-username.ts      ← URL/handle parser utility
│
└── examples/
    ├── test-tiktok-ensemble.ts      ← Test PILIHAN 1 TikTok
    ├── test-instagram-ensemble.ts   ← Test PILIHAN 1 Instagram
    ├── test-tiktok-rapidapi.ts      ← Test PILIHAN 2a (tiktok-scraper7)
    ├── test-instagram-rapidapi.ts   ← Test PILIHAN 2d (instagram-scraper-api2)
    ├── test-tokapi.ts               ← Test PILIHAN 2b (tokapi)
    ├── test-tiktok-api23.ts         ← Test PILIHAN 2c (tiktok-api23)
    ├── test-instagram-looter2.ts    ← Test PILIHAN 2e (instagram-looter2)
    ├── test-apify.ts                ← Test PILIHAN 3 (Apify)
    ├── test-hikerapi.ts             ← Test PILIHAN 5 (HikerAPI)
    └── test-official-apis.ts        ← Test PILIHAN 6 & 7 (Official APIs)
```

---

## Perbandingan Semua Provider

| # | Provider | Platform | Harga | Free | Cocok Untuk |
|---|----------|----------|-------|------|-------------|
| **1** | **EnsembleData** | TikTok + IG | Pay-per-use | Trial | **Production analytics** |
| **2a** | RapidAPI tiktok-scraper7 | TikTok | Free/paid tier | ✅ | Dev / backup |
| **2b** | RapidAPI tokapi | TikTok | Free/paid tier | ✅ | Followers, comments, search |
| **2c** | RapidAPI tiktok-api23 | TikTok | Free/paid tier | ✅ | Alternatif TikTok |
| **2d** | RapidAPI instagram-scraper-api2 | Instagram | Free/paid tier | ✅ | Dev / backup |
| **2e** | RapidAPI instagram-looter2 | Instagram | Free/paid tier | ✅ | Hashtag, stories, highlights |
| **3** | Apify | TikTok + IG | $5 kredit/bln | ✅ | Scraping massal / batch |
| **4** | SocialBlade | Multi | Berbayar | ❌ | Stats historis (trend) |
| **5** | **HikerAPI** | Instagram | $0.0006/req | ✅ 100 req | **147 endpoint, no blocks** |
| **6** | Instagram Graph API | Instagram | Gratis | ✅ | Data + insights akun SENDIRI |
| **7** | TikTok Research API | TikTok | Gratis | ✅ | Riset akademik |
| **8** | instagrapi (Python) | Instagram | Gratis | ✅ | Otomasi, private API |
| **9** | TikTokApi (Python) | TikTok | Gratis | ✅ | Dev / research |

---

## PILIHAN 1 — EnsembleData (Recommended)

**Situs:** https://ensembledata.com  
**Dashboard/Token:** https://dashboard.ensembledata.com  
**Env:** `ENSEMBLEDATA_API_TOKEN`

### TikTok — EnsembleData
**Base URL:** `https://ensembledata.com/apis/tt`

| Endpoint | Deskripsi | Params |
|----------|-----------|--------|
| `/user/info` | Profil + stats | `username` |
| `/user/posts` | Daftar video | `username`, `depth` (tiap depth ~10 video) |
| `/post/info` | Detail 1 video | `aweme_id` |
| `/hashtag/search` | Video by hashtag | `name`, `cursor` |
| `/search/general` | Search umum | `query` |

```bash
TOKEN="YOUR_TOKEN"
curl "https://ensembledata.com/apis/tt/user/info?username=charlidamelio&token=$TOKEN"
curl "https://ensembledata.com/apis/tt/user/posts?username=charlidamelio&depth=10&token=$TOKEN"
```

**Source:** `src/ensembledata/tiktok.ts`

### Instagram — EnsembleData
**Base URL:** `https://ensembledata.com/apis/instagram`

| Endpoint | Deskripsi | Params |
|----------|-----------|--------|
| `/user/info` | Profil | `username` |
| `/user/posts` | Posts user | `user_id` (numerik!), `depth` |
| `/user/reels` | Reels user | `user_id` (numerik!), `depth` |
| `/user/tagged` | Tagged posts | `user_id` |
| `/post/details` | Detail post | `shortcode` |
| `/hashtag/posts` | Post by hashtag | `name`, `cursor` |

> ⚠️ **Wajib:** Endpoint posts/reels butuh `user_id` numerik, BUKAN username. Ambil dari `/user/info` dulu.

```bash
TOKEN="YOUR_TOKEN"
# Step 1: ambil profil (dapat user_id)
curl "https://ensembledata.com/apis/instagram/user/info?username=nike&token=$TOKEN"
# Step 2: ambil posts pakai user_id
curl "https://ensembledata.com/apis/instagram/user/posts?user_id=167224140&depth=8&token=$TOKEN"
```

**Source:** `src/ensembledata/instagram.ts`

---

## PILIHAN 2 — RapidAPI (4 Provider)

**Satu key untuk semua:** Subscribe masing-masing API lalu gunakan key yang sama.  
**Env:** `RAPIDAPI_KEY`

### 2a. tiktok-scraper7 (TikTok)
**Subscribe:** https://rapidapi.com/tikwm-tikwm-default/api/tiktok-scraper7

| Endpoint | Deskripsi |
|----------|-----------|
| `GET /user/info?unique_id=` | Profil |
| `GET /user/posts?uniqueId=&count=&cursor=` | Video (pagination) |
| `GET /video/info?url=` | Detail video dari URL |
| `GET /hashtag/search?name=&count=` | Video by hashtag |
| `GET /comment/list?aweme_id=&count=` | Komentar video |
| `GET /user/followers?user_id=&count=` | Daftar followers |

**Source:** `src/rapidapi/tiktok-scraper7.ts`

### 2b. tokapi-mobile-version (TikTok)
**Subscribe:** https://rapidapi.com/Carloss8824/api/tokapi-mobile-version  
**Kelebihan:** Pakai TikTok Mobile API — followers, following, liked videos, comments, search

| Endpoint | Deskripsi |
|----------|-----------|
| `GET /v1/user?uniqueId=` | Profil (dapat userId numerik) |
| `GET /v1/post/user/timeline?user_id=&count=&offset=` | Video feed (pakai userId) |
| `GET /v1/post/user/{userId}/liked` | Liked videos |
| `GET /v1/user/{userId}/fans` | Followers |
| `GET /v1/user/{userId}/followings` | Following |
| `GET /v1/comment/{awemeId}` | Komentar |
| `GET /v1/post/search?keyword=` | Search video |
| `GET /v1/music/posts?music_id=` | Video by sound |

**Source:** `src/rapidapi/tokapi-tiktok.ts`

### 2c. tiktok-api23 (TikTok)
**Subscribe:** https://rapidapi.com/Lundehund/api/tiktok-api23

| Endpoint | Deskripsi |
|----------|-----------|
| `GET /api/user/info?uniqueId=` | Profil |
| `GET /api/user/posts?uniqueId=&cursor=&count=` | Video (cursor pagination) |
| `GET /api/post/detail?videoId=` | Detail video |
| `GET /api/hashtag/info?name=` | Info hashtag |
| `GET /api/hashtag/posts?challengeId=&cursor=` | Video by hashtag |
| `GET /api/music/posts?musicId=&cursor=` | Video by musik |
| `GET /api/user/search?keyword=` | Cari user |

**Source:** `src/rapidapi/tiktok-api23.ts`

### 2d. instagram-scraper-api2 (Instagram)
**Subscribe:** https://rapidapi.com/dreaded_spin/api/instagram-scraper-api2

| Endpoint | Deskripsi |
|----------|-----------|
| `GET /v1/info?username_or_id_or_url=` | Profil + 12 recent posts |
| `GET /v1/posts?username_or_id_or_url=&page_id=` | Semua posts (pagination) |
| `GET /v1/reels?username_or_id_or_url=` | Reels |
| `GET /v1/stories?username_or_id_or_url=` | Stories aktif |
| `GET /v1/following?username_or_id_or_url=` | Following |
| `GET /v1/followers?username_or_id_or_url=` | Followers |
| `GET /v1/highlights?username_or_id_or_url=` | Highlights |

**Source:** `src/rapidapi/instagram-scraper-api2.ts`

### 2e. instagram-looter2 (Instagram)
**Subscribe:** https://rapidapi.com/sandro.volpicella/api/instagram-looter2  
**Kelebihan:** Endpoint bersih, mudah dipakai, ada lokasi & tag

| Endpoint | Deskripsi |
|----------|-----------|
| `GET /profile?username=` | Profil |
| `GET /profile-posts?username_or_id=&nextMaxId=` | Posts (pagination) |
| `GET /profile-reels?username_or_id=&nextMaxId=` | Reels |
| `GET /post-info?link=` | Detail post dari URL |
| `GET /user-stories?username=` | Stories |
| `GET /highlights?username=` | Highlights |
| `GET /tag?tag=&nextMaxId=` | Posts by hashtag |
| `GET /location?location_id=&nextMaxId=` | Posts by lokasi |
| `GET /search?query=` | Search user |

**Source:** `src/rapidapi/instagram-looter2.ts`

---

## PILIHAN 3 — Apify Platform

**Daftar:** https://apify.com ($5 kredit gratis/bulan)  
**Env:** `APIFY_TOKEN`

### TikTok Actors

| Actor | Deskripsi | Total Runs |
|-------|-----------|-----------|
| `clockworks/tiktok-scraper` | Full (profiles, hashtags, search) | 98.7 juta |
| `clockworks/tiktok-profile-scraper` | Profil saja | 9.4 juta |
| `clockworks/free-tiktok-scraper` | Free version | 28.8 juta |

### Instagram Actors

| Actor | Deskripsi | Total Runs |
|-------|-----------|-----------|
| `apify/instagram-scraper` | Full scraper | 159 juta |
| `apify/instagram-profile-scraper` | Profil saja | 95.6 juta |
| `apify/instagram-post-scraper` | Posts saja | 40.3 juta |

**Source:** `src/apify/tiktok.ts`, `src/apify/instagram.ts`

---

## PILIHAN 4 — SocialBlade (Stats Historis)

**Khusus untuk:** Trend followers/views historis (bukan real-time scraping)  
**Daftar:** https://socialblade.com/business/api

---

## PILIHAN 5 — HikerAPI (Instagram, 147 Endpoint)

**Situs:** https://hikerapi.com  
**Daftar:** https://hikerapi.com/sign-up (100 request GRATIS, tanpa kartu kredit)  
**Harga:** $0.0006/request  
**Env:** `HIKERAPI_KEY`

**Kelebihan:**
- 147 endpoint lengkap
- Tidak ada blocks / downtime
- Tidak perlu OAuth atau akun Instagram
- Lebih lengkap dari EnsembleData untuk Instagram

| Kategori | Endpoint |
|----------|----------|
| **Profil** | by username, by user ID, info lengkap |
| **Posts & Reels** | semua media, clips saja, detail post, likers, komentar |
| **Stories & Highlights** | stories aktif, list highlight, isi highlight |
| **Followers/Following** | followers dengan pagination, following |
| **Hashtag** | top posts, recent posts dengan pagination |
| **Search** | cari user, cari hashtag, cari lokasi |
| **Lokasi** | info lokasi, posts di lokasi |
| **GraphQL** | custom query (advanced) |

```bash
KEY="YOUR_HIKERAPI_KEY"

# Profil
curl "https://hikerapi.com/api/v1/user/by/username?username=nike" -H "x-access-key: $KEY"

# Semua media (posts + reels)
curl "https://hikerapi.com/api/v1/user/medias?pk=USER_ID" -H "x-access-key: $KEY"

# Followers
curl "https://hikerapi.com/api/v1/user/followers?pk=USER_ID" -H "x-access-key: $KEY"

# Top hashtag posts
curl "https://hikerapi.com/api/v1/hashtag/medias/top?name=sneakers" -H "x-access-key: $KEY"
```

**Source:** `src/hikerapi/instagram.ts`

---

## PILIHAN 6 — Instagram Graph API (Official)

**Untuk:** Data dan insight akun Instagram **sendiri** (Business/Creator account)  
**Tidak bisa:** Scraping akun orang lain  
**Daftar:** https://developers.facebook.com/apps/  
**Docs:** https://developers.facebook.com/docs/instagram-api  
**Env:** `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_USER_ID`

**Yang bisa diakses:**
- Profil akun sendiri
- Semua media (posts, reels, stories) akun sendiri
- Insights / analytics (reach, impressions, engagement)
- Komentar di post sendiri
- Publishing konten secara otomatis

```typescript
import { igGraphGetMe, igGraphGetMedia, igGraphGetAccountInsights } from "./src/official/instagram-graph-api";

const me = await igGraphGetMe(); // profil akun sendiri
const { data: posts } = await igGraphGetMedia(); // posts sendiri
const insights = await igGraphGetAccountInsights("day"); // analytics harian
```

**Source:** `src/official/instagram-graph-api.ts`

---

## PILIHAN 7 — TikTok Research API (Official)

**Untuk:** Riset akademik / penelitian — akses data TikTok publik  
**Apply:** https://developers.tiktok.com/products/research-api/  
**Rate limit:** 1000 requests/hari  
**Env:** `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`

**Catatan:** Harus apply dan tunggu persetujuan tim TikTok (bisa beberapa minggu).

**Endpoints:**
- `/research/user/info/` — info user publik
- `/research/video/query/` — query video dengan filter (username, hashtag, region, dll)
- `/research/video/comment/list/` — komentar video
- `/research/user/followers/` — followers user
- `/research/user/following/` — following user
- `/research/user/pinned_videos/` — video yang di-pin

```typescript
import { researchGetUserInfo, researchQueryVideos } from "./src/official/tiktok-research-api";

const user = await researchGetUserInfo("charlidamelio");
const videos = await researchQueryVideos({
  and: [{ field: "hashtag_name", operation: "IN", field_values: ["fyp"] }]
});
```

**Source:** `src/official/tiktok-research-api.ts`

---

## PILIHAN 8 — instagrapi (Python)

**Library:** `pip install instagrapi`  
**Docs:** https://subzeroid.github.io/instagrapi/  
**Python:** 3.10+  
**Env:** `IG_USERNAME`, `IG_PASSWORD` (akun dummy)

**Yang bisa diakses:**
- Profil user (publik & privat jika di-follow)
- Posts, reels, stories, highlights
- Followers & following list
- Komentar, likes
- Hashtag posts
- Search user
- Upload konten (untuk otomasi)

```python
from instagrapi import Client

cl = Client()
cl.login("your_dummy_account", "password")

user = cl.user_info_by_username("nike")
medias = cl.user_medias(user.pk, 50)
followers = cl.user_followers(user.pk, amount=100)
```

> **Untuk production scale:** Gunakan [HikerAPI](https://hikerapi.com/) yang mengelola akun, proxy, dan session secara otomatis — lebih stabil dari self-hosted instagrapi.

**Source:** `src/python/instagrapi_guide.py`

---

## PILIHAN 9 — TikTokApi Python

**Library:** `pip install TikTokApi && python -m playwright install chromium`  
**Docs:** https://github.com/davidteather/TikTok-Api  
**Versi:** 7.3.3  
**Env:** `TIKTOK_MS_TOKEN` (dari cookies tiktok.com)

**Yang bisa diakses:**
- Profil user
- Video user
- Trending videos
- Hashtag videos
- Sound/music videos
- Komentar video
- Search user

**Cara dapat ms_token:**
1. Buka `tiktok.com` di browser
2. F12 → Application → Cookies → `tiktok.com`
3. Cari cookie `msToken` → copy valuenya

```python
from TikTokApi import TikTokApi
import asyncio, os

async def main():
    async with TikTokApi() as api:
        await api.create_sessions(ms_tokens=[os.environ["TIKTOK_MS_TOKEN"]], num_sessions=1, sleep_after=3)
        user = api.user(username="charlidamelio")
        info = await user.info()
        async for video in user.videos(count=30):
            print(video.as_dict)

asyncio.run(main())
```

> **Jika dapat EmptyResponseException:** TikTok mendeteksi bot. Gunakan proxy residential (webshare.io dll).

**Source:** `src/python/tiktok_api_guide.py`

---

## Setup & Cara Jalankan

```bash
# Clone
git clone https://github.com/TlTANPRO/Fullscrap.git
cd Fullscrap

# Install TypeScript dependencies
npm install

# Setup env
cp .env.example .env
# Edit .env sesuai token yang dimiliki
```

### Run test TypeScript

```bash
# PILIHAN 1 — EnsembleData
TT_USERNAME=charlidamelio npx ts-node examples/test-tiktok-ensemble.ts
IG_USERNAME=nike npx ts-node examples/test-instagram-ensemble.ts

# PILIHAN 2a — RapidAPI tiktok-scraper7
TT_USERNAME=charlidamelio npx ts-node examples/test-tiktok-rapidapi.ts

# PILIHAN 2b — tokapi-mobile-version
TT_USERNAME=charlidamelio npx ts-node examples/test-tokapi.ts

# PILIHAN 2c — tiktok-api23
TT_USERNAME=charlidamelio npx ts-node examples/test-tiktok-api23.ts

# PILIHAN 2d — instagram-scraper-api2
IG_USERNAME=nike npx ts-node examples/test-instagram-rapidapi.ts

# PILIHAN 2e — instagram-looter2
IG_USERNAME=nike npx ts-node examples/test-instagram-looter2.ts

# PILIHAN 3 — Apify
npx ts-node examples/test-apify.ts

# PILIHAN 5 — HikerAPI
IG_USERNAME=nike npx ts-node examples/test-hikerapi.ts

# PILIHAN 6 & 7 — Official APIs
npx ts-node examples/test-official-apis.ts
```

### Run Python examples

```bash
# Install Python dependencies
pip install instagrapi TikTokApi
python -m playwright install chromium

# PILIHAN 8 — instagrapi
export IG_USERNAME="dummy_account"
export IG_PASSWORD="password"
export TARGET_USERNAME="nike"
python src/python/instagrapi_guide.py

# PILIHAN 9 — TikTokApi
export TIKTOK_MS_TOKEN="your_ms_token"
export TT_USERNAME="charlidamelio"
python src/python/tiktok_api_guide.py
```

---

## Troubleshooting

### ❌ EnsembleData — 401 Unauthorized
Token salah/expired. Cek di https://dashboard.ensembledata.com

### ❌ EnsembleData — Instagram posts kosong
Pastikan pakai `user_id` numerik dari `fetchInstagramProfile()`, bukan username:
```typescript
const profile = await fetchInstagramProfile("nike");
const { posts } = await fetchInstagramPosts(profile.userId, 8); // userId, bukan "nike"
```

### ❌ EnsembleData — Instagram base URL salah
```typescript
// ✅ BENAR:
const ENSEMBLE_BASE_URL = "https://ensembledata.com/apis/instagram";
// ❌ SALAH (URL lama):
// const ENSEMBLE_BASE_URL = "https://ensembledata.com/apis/ig";
```

### ❌ RapidAPI — "You are not subscribed to this API"
Subscribe ke API yang diinginkan di RapidAPI marketplace, kemudian key yang sama bisa digunakan.

### ❌ RapidAPI — 429 Too Many Requests
Upgrade plan atau tambah delay antar request:
```typescript
await new Promise(r => setTimeout(r, 1000));
```

### ❌ Apify — Actor timeout
Kurangi `resultsPerPage`, atau gunakan async run + polling untuk data besar.

### ❌ HikerAPI — 401 Unauthorized
Token salah. Cek di dashboard HikerAPI. Pastikan header `x-access-key` (bukan `Authorization`).

### ❌ Instagram Graph API — 400 Bad Request
Token expired (berlaku 60 hari). Exchange long-lived token baru via `igGraphExchangeToken()`.

### ❌ TikTok Research API — apply ditolak
API ini hanya untuk akademisi/peneliti. Pastikan affiliation di aplikasi valid.

### ❌ instagrapi — Challenge Required / account banned
- Gunakan akun dummy yang sudah berumur
- Jangan request terlalu cepat
- Gunakan residential proxy
- Atau switch ke HikerAPI untuk production

### ❌ TikTokApi Python — EmptyResponseException
TikTok mendeteksi bot. Gunakan proxy residential (webshare.io, brightdata, dll).

---

## Rekomendasi Pilihan Berdasarkan Use Case

| Use Case | Provider |
|----------|----------|
| Analytics TikTok + IG (production) | **EnsembleData** |
| Instagram lengkap (147 endpoint) | **HikerAPI** |
| Scraping massal banyak akun | **Apify** |
| Dev/testing dengan free tier | **RapidAPI** (pilih salah satu) |
| Data akun sendiri (insight/analytics) | **Instagram Graph API** |
| Riset akademik TikTok | **TikTok Research API** |
| Otomasi Instagram (private API) | **instagrapi** (Python) |
| TikTok trending / hashtag research | **TikTokApi** (Python) |
| Stats historis follower growth | **SocialBlade** |

---

*Panduan dibuat berdasarkan riset dan pengujian nyata — Tim TITANPRO, Juli 2026.*
