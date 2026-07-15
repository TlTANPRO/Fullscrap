"""
PILIHAN 9 — TikTok via TikTokApi (Python, Unofficial)

TikTokApi adalah unofficial Python wrapper yang menggunakan Playwright
untuk menjalankan browser headless dan meniru request TikTok web/mobile.

Install  : pip install TikTokApi
           python -m playwright install chromium
PyPI     : https://pypi.org/project/TikTokApi/
GitHub   : https://github.com/davidteather/TikTok-Api
Versi    : 7.3.3 (Juli 2026)

REQUIREMENTS:
- Python 3.9+
- Playwright terinstall: python -m playwright install chromium
- ms_token dari cookies TikTok (wajib untuk kebanyakan endpoint)
- Opsional: proxy untuk menghindari block

Cara dapat ms_token:
1. Buka tiktok.com di browser
2. F12 → Application/Storage → Cookies → tiktok.com
3. Cari cookie bernama "msToken"
4. Copy value-nya

CATATAN:
- Jika dapat EmptyResponseException, TikTok mendeteksi bot
- Solusi: gunakan proxy residential (webshare.io, dll)
- Lebih cocok untuk research/dev, bukan production scale
- Untuk production scale: gunakan EnsembleData atau HikerAPI
"""

from TikTokApi import TikTokApi
import asyncio
import os
import json

ms_token = os.environ.get("TIKTOK_MS_TOKEN")  # Ambil dari .env

# ─── User info ───────────────────────────────────────────────────────────

async def get_user_info(username: str) -> dict:
    """
    Ambil info profil TikTok.

    @example: await get_user_info("charlidamelio")
    """
    async with TikTokApi() as api:
        await api.create_sessions(
            ms_tokens=[ms_token],
            num_sessions=1,
            sleep_after=3,
            browser=os.getenv("TIKTOK_BROWSER", "chromium")
        )

        user = api.user(username=username)
        info = await user.info()

        return {
            "uniqueId": info.get("uniqueId", username),
            "nickname": info.get("nickname", ""),
            "verified": info.get("verified", False),
            "followerCount": info.get("stats", {}).get("followerCount", 0),
            "followingCount": info.get("stats", {}).get("followingCount", 0),
            "heartCount": info.get("stats", {}).get("heartCount", 0),
            "videoCount": info.get("stats", {}).get("videoCount", 0),
            "bio": info.get("signature", ""),
            "avatarUrl": info.get("avatarLarger", ""),
        }

# ─── User videos ─────────────────────────────────────────────────────────

async def get_user_videos(username: str, count: int = 30) -> list:
    """
    Ambil video terbaru user.

    @example: videos = await get_user_videos("charlidamelio", 30)
    """
    async with TikTokApi() as api:
        await api.create_sessions(
            ms_tokens=[ms_token],
            num_sessions=1,
            sleep_after=3,
            browser=os.getenv("TIKTOK_BROWSER", "chromium")
        )

        results = []
        user = api.user(username=username)

        async for video in user.videos(count=count):
            d = video.as_dict
            stats = d.get("stats", {})
            results.append({
                "id": d.get("id", ""),
                "description": d.get("desc", ""),
                "createTime": d.get("createTime", 0),
                "playCount": stats.get("playCount", 0),
                "diggCount": stats.get("diggCount", 0),
                "commentCount": stats.get("commentCount", 0),
                "shareCount": stats.get("shareCount", 0),
                "collectCount": stats.get("collectCount", 0),
                "duration": d.get("video", {}).get("duration", 0),
            })

        return results

# ─── Trending videos ──────────────────────────────────────────────────────

async def get_trending_videos(count: int = 30) -> list:
    """
    Ambil video trending TikTok.

    @example: trending = await get_trending_videos(30)
    """
    async with TikTokApi() as api:
        await api.create_sessions(
            ms_tokens=[ms_token],
            num_sessions=1,
            sleep_after=3,
            browser=os.getenv("TIKTOK_BROWSER", "chromium")
        )

        results = []
        async for video in api.trending.videos(count=count):
            d = video.as_dict
            stats = d.get("stats", {})
            results.append({
                "id": d.get("id", ""),
                "description": d.get("desc", ""),
                "author": d.get("author", {}).get("uniqueId", ""),
                "playCount": stats.get("playCount", 0),
                "diggCount": stats.get("diggCount", 0),
                "commentCount": stats.get("commentCount", 0),
            })

        return results

# ─── Hashtag videos ───────────────────────────────────────────────────────

async def get_hashtag_videos(hashtag: str, count: int = 30) -> list:
    """
    Ambil video berdasarkan hashtag.

    @example: videos = await get_hashtag_videos("fyp", 30)
    """
    async with TikTokApi() as api:
        await api.create_sessions(
            ms_tokens=[ms_token],
            num_sessions=1,
            sleep_after=3,
            browser=os.getenv("TIKTOK_BROWSER", "chromium")
        )

        results = []
        tag = api.hashtag(name=hashtag.lstrip("#"))

        async for video in tag.videos(count=count):
            d = video.as_dict
            stats = d.get("stats", {})
            results.append({
                "id": d.get("id", ""),
                "description": d.get("desc", ""),
                "author": d.get("author", {}).get("uniqueId", ""),
                "playCount": stats.get("playCount", 0),
                "diggCount": stats.get("diggCount", 0),
                "commentCount": stats.get("commentCount", 0),
            })

        return results

# ─── Sound/music videos ───────────────────────────────────────────────────

async def get_sound_videos(sound_id: str, count: int = 30) -> list:
    """
    Ambil video yang menggunakan sound/musik tertentu.

    @example: videos = await get_sound_videos("6728562169846977541", 30)
    """
    async with TikTokApi() as api:
        await api.create_sessions(
            ms_tokens=[ms_token],
            num_sessions=1,
            sleep_after=3,
            browser=os.getenv("TIKTOK_BROWSER", "chromium")
        )

        results = []
        sound = api.sound(id=sound_id)

        async for video in sound.videos(count=count):
            d = video.as_dict
            results.append({
                "id": d.get("id", ""),
                "description": d.get("desc", ""),
                "author": d.get("author", {}).get("uniqueId", ""),
            })

        return results

# ─── Comments ────────────────────────────────────────────────────────────

async def get_video_comments(video_id: str, count: int = 50) -> list:
    """
    Ambil komentar sebuah video.

    @example: comments = await get_video_comments("7123456789012345678", 50)
    """
    async with TikTokApi() as api:
        await api.create_sessions(
            ms_tokens=[ms_token],
            num_sessions=1,
            sleep_after=3,
            browser=os.getenv("TIKTOK_BROWSER", "chromium")
        )

        results = []
        video = api.video(id=video_id)

        async for comment in video.comments(count=count):
            d = comment.as_dict
            results.append({
                "cid": d.get("cid", ""),
                "text": d.get("text", ""),
                "diggCount": d.get("digg_count", 0),
                "replyCommentTotal": d.get("reply_comment_total", 0),
                "author": d.get("user", {}).get("unique_id", ""),
                "createTime": d.get("create_time", 0),
            })

        return results

# ─── Search users ─────────────────────────────────────────────────────────

async def search_users(query: str, count: int = 10) -> list:
    """
    Cari user berdasarkan query.

    @example: users = await search_users("charli", 10)
    """
    async with TikTokApi() as api:
        await api.create_sessions(
            ms_tokens=[ms_token],
            num_sessions=1,
            sleep_after=3,
            browser=os.getenv("TIKTOK_BROWSER", "chromium")
        )

        results = []
        async for user in api.search.users(query, count=count):
            d = user.as_dict
            results.append({
                "uniqueId": d.get("uniqueId", ""),
                "nickname": d.get("nickname", ""),
                "followerCount": d.get("stats", {}).get("followerCount", 0),
                "verified": d.get("verified", False),
            })

        return results

# ─── Main example ─────────────────────────────────────────────────────────

async def main():
    TARGET = os.environ.get("TT_USERNAME", "charlidamelio")

    print(f"\n🎵 TikTokApi (Python) — Scraping @{TARGET}")
    print(f"ms_token: {'✅ Set' if ms_token else '❌ Tidak ada (set TIKTOK_MS_TOKEN)'}")
    print("─" * 60)

    # User info
    print("\n[1] Fetching user info...")
    profile = await get_user_info(TARGET)
    print(json.dumps(profile, indent=2))

    # Videos
    print(f"\n[2] Fetching 20 videos...")
    videos = await get_user_videos(TARGET, 20)
    print(f"✅ {len(videos)} videos fetched")
    if videos:
        top = max(videos, key=lambda v: v["playCount"])
        print(f"Top: {top['id']} ({top['playCount']:,} plays)")

    # Trending
    print("\n[3] Fetching trending (10 videos)...")
    trending = await get_trending_videos(10)
    print(f"✅ {len(trending)} trending videos fetched")

    print("\n✅ TikTokApi test selesai!")

if __name__ == "__main__":
    asyncio.run(main())
