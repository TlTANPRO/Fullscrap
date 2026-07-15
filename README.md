# Fullscrap — Panduan Lengkap Scraping TikTok & Instagram

> **Internal use — Tim TITANPRO**  
> Diuji & diverifikasi: Juli 2026

Repo ini adalah panduan teknis + source code lengkap untuk scraping akun TikTok dan Instagram menggunakan berbagai provider. Semua implementasi sudah diuji dan working.

---

## Daftar Isi

- [Struktur Repo](#struktur-repo)
- [Provider & Perbandingan](#provider--perbandingan)
- [PILIHAN 1 — EnsembleData (Rekomendasi Utama)](#pilihan-1--ensembledata-rekomendasi-utama)
- [PILIHAN 2 — RapidAPI Scrapers](#pilihan-2--rapidapi-scrapers)
- [PILIHAN 3 — Apify Platform](#pilihan-3--apify-platform)
- [PILIHAN 4 — SocialBlade (Stats Historis)](#pilihan-4--socialblade-stats-historis)
- [Setup Environment](#setup-environment)
- [Cara Jalankan Test](#cara-jalankan-test)
- [Troubleshooting](#troubleshooting)

---

## Struktur Repo

```
Fullscrap/
├── README.md                          ← Panduan ini
├── package.json
├── tsconfig.json
├── .env.example
│
├── src/
│   ├── ensembledata/
│   │   ├── tiktok.ts                  ← TikTok via EnsembleData (RECOMMENDED)
│   │   ├── instagram.ts               ← Instagram via EnsembleData (RECOMMENDED)
│   │   └── types.ts                   ← Shared types
│   │
│   ├── rapidapi/
│   │   ├── tiktok-scraper7.ts         ← TikTok via tiktok-scraper7 RapidAPI
│   │   └── instagram-scraper-api2.ts  ← Instagram via instagram-scraper-api2 RapidAPI
│   │
│   ├── apify/
│   │   ├── tiktok.ts                  ← TikTok via Apify clockworks actors
│   │   └── instagram.ts               ← Instagram via Apify apify actors
│   │
│   └── utils/
│       └── parse-username.ts          ← URL/handle parser utility
│
└── examples/
    ├── test-tiktok-ensemble.ts        ← Test EnsembleData TikTok
    ├── test-instagram-ensemble.ts     ← Test EnsembleData Instagram
    ├── test-tiktok-rapidapi.ts        ← Test RapidAPI TikTok
    ├── test-instagram-rapidapi.ts     ← Test RapidAPI Instagram
    └── test-apify.ts                  ← Test Apify
```

---

## Provider & Perbandingan

| Provider | Platform | Harga | Rate Limit | Kecepatan | Kualitas Data |
|----------|----------|-------|------------|-----------|---------------|
| **EnsembleData** | TikTok + IG | Pay-per-use (murah) | Tinggi | ⚡ Cepat | ⭐⭐⭐⭐⭐ |
| **RapidAPI tiktok-scraper7** | TikTok | Free tier ada | Medium | ⚡ Cepat | ⭐⭐⭐⭐ |
| **RapidAPI instagram-scraper-api2** | Instagram | Free tier ada | Medium | ⚡ Cepat | ⭐⭐⭐⭐ |
| **Apify** | TikTok + IG | $5 kredit gratis/bulan | Fleksibel | 🐢 Lebih lambat | ⭐⭐⭐⭐ |
| **SocialBlade** | Multi | Berbayar | Rendah | Medium | ⭐⭐⭐ (historis) |

**Rekomendasi:** EnsembleData untuk production. RapidAPI untuk testing cepat / backup. Apify untuk scraping massal.

---

## PILIHAN 1 — EnsembleData (Rekomendasi Utama)

**Situs:** https://ensembledata.com  
**Daftar & ambil token:** https://dashboard.ensembledata.com  
**Docs:** https://ensembledata.com/apis

### Cara Daftar & Dapat Token
1. Buka https://dashboard.ensembledata.com
2. Register dengan email
3. Masuk ke menu **API Keys**
4. Copy token → simpan di `.env` sebagai `ENSEMBLEDATA_API_TOKEN`

### TikTok — EnsembleData

**Base URL:** `https://ensembledata.com/apis/tt`

| Endpoint | Deskripsi | Params Wajib |
|----------|-----------|--------------|
| `/user/info` | Profil + stats (follower, heart, video count) | `username` |
| `/user/posts` | Daftar video + stats tiap video | `username`, `depth` |
| `/post/info` | Detail satu video | `aweme_id` |
| `/hashtag/search` | Cari video berdasarkan hashtag | `name`, `cursor` |
| `/search/general` | Search umum | `query` |

**Contoh curl:**
```bash
TOKEN="YOUR_ENSEMBLEDATA_TOKEN"

# Profil akun
curl "https://ensembledata.com/apis/tt/user/info?username=charlidamelio&token=$TOKEN"

# Daftar video (depth=10 → ~90-100 video terakhir)
curl "https://ensembledata.com/apis/tt/user/posts?username=charlidamelio&depth=10&token=$TOKEN"

# Detail satu video
curl "https://ensembledata.com/apis/tt/post/info?aweme_id=VIDEO_ID&token=$TOKEN"
```

**Source code lengkap:** [`src/ensembledata/tiktok.ts`](src/ensembledata/tiktok.ts)

### Instagram — EnsembleData

**Base URL:** `https://ensembledata.com/apis/instagram`

| Endpoint | Deskripsi | Params Wajib |
|----------|-----------|--------------|
| `/user/info` | Profil + stats | `username` |
| `/user/posts` | Post feed user | `user_id`, `depth` |
| `/user/reels` | Reels user | `user_id`, `depth` |
| `/user/tagged` | Post di mana user di-tag | `user_id` |
| `/post/details` | Detail satu post | `shortcode` |
| `/hashtag/posts` | Post berdasarkan hashtag | `name`, `cursor` |

**Contoh curl:**
```bash
TOKEN="YOUR_ENSEMBLEDATA_TOKEN"

# Step 1: Ambil profil (dapat user_id)
curl "https://ensembledata.com/apis/instagram/user/info?username=nike&token=$TOKEN"

# Step 2: Ambil posts pakai user_id dari step 1
USER_ID="167224140"
curl "https://ensembledata.com/apis/instagram/user/posts?user_id=$USER_ID&depth=8&token=$TOKEN"

# Ambil reels
curl "https://ensembledata.com/apis/instagram/user/reels?user_id=$USER_ID&depth=5&token=$TOKEN"
```

> **Penting:** Untuk `/user/posts` dan `/user/reels`, gunakan `user_id` (numerik), **bukan** username.  
> Dapatkan `user_id` dari response `/user/info` di field `pk` atau `id`.

**Source code lengkap:** [`src/ensembledata/instagram.ts`](src/ensembledata/instagram.ts)

---

## PILIHAN 2 — RapidAPI Scrapers

### TikTok — tiktok-scraper7

**Subscribe:** https://rapidapi.com/tikwm-tikwm-default/api/tiktok-scraper7  
**Base URL:** `https://tiktok-scraper7.p.rapidapi.com`  
**Auth:** Header `x-rapidapi-key` + `x-rapidapi-host`

| Endpoint | Deskripsi | Params |
|----------|-----------|--------|
| `/user/info` | Profil + stats | `unique_id` |
| `/user/posts` | Daftar video | `uniqueId`, `count`, `cursor` |
| `/video/info` | Detail video | `url` (full TikTok URL) |
| `/hashtag/search` | Video by hashtag | `name`, `count` |
| `/comment/list` | Komentar video | `aweme_id`, `count` |
| `/user/followers` | Daftar followers | `user_id`, `count`, `cursor` |
| `/user/following` | Daftar following | `user_id`, `count`, `cursor` |

```bash
KEY="YOUR_RAPIDAPI_KEY"

# User info
curl "https://tiktok-scraper7.p.rapidapi.com/user/info?unique_id=charlidamelio" \
  -H "x-rapidapi-key: $KEY" \
  -H "x-rapidapi-host: tiktok-scraper7.p.rapidapi.com"

# User posts (pagination)
curl "https://tiktok-scraper7.p.rapidapi.com/user/posts?uniqueId=charlidamelio&count=20&cursor=0" \
  -H "x-rapidapi-key: $KEY" \
  -H "x-rapidapi-host: tiktok-scraper7.p.rapidapi.com"
```

**Source code:** [`src/rapidapi/tiktok-scraper7.ts`](src/rapidapi/tiktok-scraper7.ts)

### Instagram — instagram-scraper-api2

**Subscribe:** https://rapidapi.com/dreaded_spin/api/instagram-scraper-api2  
**Base URL:** `https://instagram-scraper-api2.p.rapidapi.com`

| Endpoint | Deskripsi | Params |
|----------|-----------|--------|
| `/v1/info` | Profil + 12 post terakhir | `username_or_id_or_url` |
| `/v1/posts` | Semua post (pagination) | `username_or_id_or_url`, `page_id` |
| `/v1/reels` | Reels user | `username_or_id_or_url` |
| `/v1/stories` | Stories aktif | `username_or_id_or_url` |
| `/v1/following` | Daftar following | `username_or_id_or_url`, `page_id` |
| `/v1/followers` | Daftar followers | `username_or_id_or_url`, `page_id` |
| `/v1/highlights` | Highlight stories | `username_or_id_or_url` |

```bash
KEY="YOUR_RAPIDAPI_KEY"

# User info
curl "https://instagram-scraper-api2.p.rapidapi.com/v1/info?username_or_id_or_url=nike" \
  -H "x-rapidapi-key: $KEY" \
  -H "x-rapidapi-host: instagram-scraper-api2.p.rapidapi.com"

# User posts
curl "https://instagram-scraper-api2.p.rapidapi.com/v1/posts?username_or_id_or_url=nike" \
  -H "x-rapidapi-key: $KEY" \
  -H "x-rapidapi-host: instagram-scraper-api2.p.rapidapi.com"
```

**Source code:** [`src/rapidapi/instagram-scraper-api2.ts`](src/rapidapi/instagram-scraper-api2.ts)

---

## PILIHAN 3 — Apify Platform

**Daftar:** https://apify.com (free $5 kredit/bulan saat signup)  
**Cocok untuk:** Scraping massal / batch processing banyak akun sekaligus

### Actor TikTok

| Actor | Deskripsi | Total Runs |
|-------|-----------|-----------|
| `clockworks/tiktok-scraper` | Full scraper (posts, profile, hashtag) | 98.7 juta |
| `clockworks/tiktok-profile-scraper` | Khusus profil | 9.4 juta |
| `clockworks/free-tiktok-scraper` | Free version | 28.8 juta |

### Actor Instagram

| Actor | Deskripsi | Total Runs |
|-------|-----------|-----------|
| `apify/instagram-scraper` | Full scraper | 159 juta |
| `apify/instagram-profile-scraper` | Khusus profil | 95.6 juta |
| `apify/instagram-post-scraper` | Khusus post | 40.3 juta |

```bash
TOKEN="YOUR_APIFY_TOKEN"

# TikTok — run actor dan tunggu hasil (sync)
curl -X POST \
  "https://api.apify.com/v2/acts/clockworks~tiktok-scraper/run-sync-get-dataset-items?token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "profiles": ["https://www.tiktok.com/@charlidamelio"],
    "resultsPerPage": 20,
    "shouldDownloadVideos": false
  }'

# Instagram — run actor dan tunggu hasil
curl -X POST \
  "https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "usernames": ["nike"],
    "resultsLimit": 20
  }'
```

**Source code:** [`src/apify/tiktok.ts`](src/apify/tiktok.ts), [`src/apify/instagram.ts`](src/apify/instagram.ts)

---

## PILIHAN 4 — SocialBlade (Stats Historis)

**Khusus untuk:** Grafik trend followers/likes historis (bukan real-time scraping)  
**Daftar:** https://socialblade.com/business/api

```typescript
// Contoh: ambil statistik historis followers TikTok
const res = await fetch(
  `https://matrix.sbapis.com/b/tiktok/statistics?query=charlidamelio&history=default`,
  { headers: { "clientid": CLIENT_ID, "token": TOKEN } }
);
```

---

## Setup Environment

```bash
# 1. Clone repo ini
git clone https://github.com/TlTANPRO/Fullscrap.git
cd Fullscrap

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env
# Edit .env dengan token masing-masing provider

# 4. Jalankan test
npx ts-node examples/test-tiktok-ensemble.ts
npx ts-node examples/test-instagram-ensemble.ts
```

### `.env` yang dibutuhkan

```env
# WAJIB untuk EnsembleData (Pilihan 1)
ENSEMBLEDATA_API_TOKEN=your_token_here

# Opsional untuk RapidAPI (Pilihan 2)
RAPIDAPI_KEY=your_rapidapi_key_here

# Opsional untuk Apify (Pilihan 3)
APIFY_TOKEN=your_apify_token_here
```

---

## Cara Jalankan Test

```bash
# Test EnsembleData TikTok (ganti username sesuai akun yang mau dicek)
TT_USERNAME=charlidamelio npx ts-node examples/test-tiktok-ensemble.ts

# Test EnsembleData Instagram
IG_USERNAME=nike npx ts-node examples/test-instagram-ensemble.ts

# Test RapidAPI TikTok
TT_USERNAME=charlidamelio npx ts-node examples/test-tiktok-rapidapi.ts

# Test RapidAPI Instagram
IG_USERNAME=nike npx ts-node examples/test-instagram-rapidapi.ts

# Test Apify
npx ts-node examples/test-apify.ts
```

---

## Troubleshooting

### ❌ EnsembleData — 401 Unauthorized
```
Error: TikTok data provider returned status 401
```
**Solusi:** Token salah atau expired. Cek di https://dashboard.ensembledata.com dan copy token yang benar ke `.env`.

### ❌ EnsembleData — 404 Account Not Found
```
Error: TikTok account "xxx" not found
```
**Kemungkinan penyebab:**
- Akun **privat** — EnsembleData tidak bisa akses akun privat
- Username salah ketik — coba tanpa @, atau salin dari URL profil
- Akun terlalu baru atau sudah dihapus

### ❌ Instagram — selalu 404 padahal akun ada
Verifikasi base URL sudah benar:
```typescript
// BENAR:
const ENSEMBLE_BASE_URL = "https://ensembledata.com/apis/instagram";

// SALAH (URL lama):
// const ENSEMBLE_BASE_URL = "https://ensembledata.com/apis/ig";
```

### ❌ Instagram posts kosong
Pastikan pakai `user_id` (numerik), bukan username:
```typescript
// Benar: gunakan profile.userId dari fetchInstagramProfile()
const posts = await fetchInstagramPosts(profile.userId, 8);

// Salah: jangan pakai username langsung
// const posts = await fetchInstagramPosts("nike", 8);
```

### ❌ RapidAPI — 429 Too Many Requests
Free tier punya rate limit. Upgrade plan atau tambah delay:
```typescript
await new Promise(r => setTimeout(r, 1000)); // delay 1 detik
```

### ❌ Apify — Actor timeout
Gunakan async run untuk akun dengan banyak post:
```typescript
// Jangan sync untuk data besar, pakai async run
const run = await apifyClient.actor("clockworks/tiktok-scraper").call(input);
const dataset = await apifyClient.dataset(run.defaultDatasetId).listItems();
```

---

*Panduan dibuat berdasarkan pengujian nyata — Tim TITANPRO, Juli 2026.*
