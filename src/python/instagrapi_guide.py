"""
PILIHAN 8 — Instagram via instagrapi (Python)

instagrapi adalah unofficial Python wrapper untuk Instagram Private API.
Sangat powerful — bisa akses hampir semua fitur Instagram.

Install  : pip install instagrapi
PyPI     : https://pypi.org/project/instagrapi/
Docs     : https://subzeroid.github.io/instagrapi/
GitHub   : https://github.com/subzeroid/instagrapi
Versi    : 2.x (Python 3.10+)

CATATAN PENTING:
- Butuh akun Instagram untuk login (gunakan akun dummy/test)
- Akun bisa kena challenge/ban jika terlalu agresif
- Untuk production, gunakan HikerAPI (lihat src/hikerapi/instagram.ts)
  yang sudah mengelola akun, proxy, dan session secara otomatis
- Rate limit: jeda antar request, jangan terlalu cepat

Setup:
  pip install instagrapi
  # Untuk TLS impersonation (lebih aman):
  pip install "instagrapi[curl]"
"""

from instagrapi import Client
from instagrapi.exceptions import LoginRequired, UserNotFound, PleaseWaitFewMinutes
import os
import json
import time

# ─── Setup client ────────────────────────────────────────────────────────

def create_client(session_file: str = "session.json") -> Client:
    """
    Buat client instagrapi dengan session persistence.
    Session disimpan ke file supaya tidak perlu login ulang setiap run.
    """
    cl = Client()

    if os.path.exists(session_file):
        # Load session yang sudah ada
        cl.load_settings(session_file)
        cl.login(
            os.environ["IG_USERNAME"],
            os.environ["IG_PASSWORD"]
        )
    else:
        # Login pertama kali
        cl.login(
            os.environ["IG_USERNAME"],
            os.environ["IG_PASSWORD"]
        )
        cl.dump_settings(session_file)

    return cl

# ─── User info ───────────────────────────────────────────────────────────

def get_user_info(cl: Client, username: str) -> dict:
    """
    Ambil info profil user berdasarkan username.

    Return: dict dengan field:
    - pk (user ID numerik)
    - username
    - full_name
    - biography
    - follower_count
    - following_count
    - media_count
    - profile_pic_url
    - is_verified
    - external_url
    """
    user = cl.user_info_by_username(username)
    return {
        "pk": str(user.pk),
        "username": user.username,
        "full_name": user.full_name,
        "biography": user.biography,
        "follower_count": user.follower_count,
        "following_count": user.following_count,
        "media_count": user.media_count,
        "profile_pic_url": str(user.profile_pic_url),
        "is_verified": user.is_verified,
        "external_url": str(user.external_url) if user.external_url else "",
    }

# ─── User media (posts) ──────────────────────────────────────────────────

def get_user_medias(cl: Client, username: str, amount: int = 50) -> list:
    """
    Ambil media (post + reel) milik user.
    amount = jumlah post yang diambil.

    Return: list of dict dengan field:
    - pk (media ID)
    - code (shortcode)
    - url (full URL post)
    - caption
    - like_count
    - comment_count
    - view_count (reels/video)
    - play_count (reels)
    - timestamp
    - media_type (1=image, 2=video, 8=carousel)
    """
    user_id = cl.user_id_from_username(username)
    medias = cl.user_medias(user_id, amount)

    result = []
    for m in medias:
        result.append({
            "pk": str(m.pk),
            "code": m.code,
            "url": f"https://www.instagram.com/p/{m.code}/",
            "caption": m.caption_text or "",
            "like_count": m.like_count,
            "comment_count": m.comment_count,
            "view_count": m.view_count or 0,
            "play_count": m.play_count or 0,
            "timestamp": m.taken_at.isoformat() if m.taken_at else "",
            "media_type": m.media_type,  # 1=IMAGE, 2=VIDEO, 8=ALBUM
        })

    return result

# ─── Reels ───────────────────────────────────────────────────────────────

def get_user_reels(cl: Client, username: str, amount: int = 50) -> list:
    """
    Ambil reels milik user.
    """
    user_id = cl.user_id_from_username(username)
    clips = cl.user_clips(user_id, amount)

    return [
        {
            "pk": str(c.pk),
            "code": c.code,
            "url": f"https://www.instagram.com/reel/{c.code}/",
            "caption": c.caption_text or "",
            "like_count": c.like_count,
            "comment_count": c.comment_count,
            "view_count": c.view_count or 0,
            "play_count": c.play_count or 0,
            "video_duration": c.video_duration or 0,
            "timestamp": c.taken_at.isoformat() if c.taken_at else "",
        }
        for c in clips
    ]

# ─── Stories ─────────────────────────────────────────────────────────────

def get_user_stories(cl: Client, username: str) -> list:
    """
    Ambil stories aktif user.
    CATATAN: Hanya bisa ambil stories akun yang di-follow, atau akun publik.
    """
    user_id = cl.user_id_from_username(username)
    stories = cl.user_stories(user_id)

    return [
        {
            "pk": str(s.pk),
            "media_type": s.media_type,
            "timestamp": s.taken_at.isoformat() if s.taken_at else "",
            "url": str(s.video_url or s.thumbnail_url or ""),
            "expires_at": s.expiring_at.isoformat() if s.expiring_at else "",
        }
        for s in stories
    ]

# ─── Followers / Following ────────────────────────────────────────────────

def get_user_followers(cl: Client, username: str, amount: int = 100) -> list:
    """
    Ambil daftar followers user.
    PERINGATAN: Endpoint ini lambat dan bisa trigger rate limit.
    Jangan panggil terlalu sering.
    """
    user_id = cl.user_id_from_username(username)
    followers = cl.user_followers(user_id, use_cache=False, amount=amount)

    return [
        {
            "pk": str(u.pk),
            "username": u.username,
            "full_name": u.full_name,
            "is_verified": u.is_verified,
            "follower_count": u.follower_count,
        }
        for u in followers.values()
    ]

def get_user_following(cl: Client, username: str, amount: int = 100) -> list:
    """
    Ambil daftar akun yang di-follow user.
    """
    user_id = cl.user_id_from_username(username)
    following = cl.user_following(user_id, use_cache=False, amount=amount)

    return [
        {
            "pk": str(u.pk),
            "username": u.username,
            "full_name": u.full_name,
            "is_verified": u.is_verified,
        }
        for u in following.values()
    ]

# ─── Comments ────────────────────────────────────────────────────────────

def get_media_comments(cl: Client, shortcode: str, amount: int = 50) -> list:
    """
    Ambil komentar sebuah post berdasarkan shortcode.
    Shortcode = bagian setelah /p/ di URL post.

    @example: get_media_comments(cl, "CxYZ123abc")
    """
    media_id = cl.media_id(cl.media_pk_from_code(shortcode))
    comments = cl.media_comments(media_id, amount)

    return [
        {
            "pk": str(c.pk),
            "text": c.text,
            "user": c.user.username if c.user else "",
            "like_count": c.like_count,
            "timestamp": c.created_at_utc.isoformat() if c.created_at_utc else "",
        }
        for c in comments
    ]

# ─── Hashtag ─────────────────────────────────────────────────────────────

def get_hashtag_medias(cl: Client, hashtag: str, amount: int = 50) -> list:
    """
    Ambil post berdasarkan hashtag.

    @example: get_hashtag_medias(cl, "sneakers", 30)
    """
    medias = cl.hashtag_medias_recent(hashtag.lstrip("#"), amount)

    return [
        {
            "pk": str(m.pk),
            "code": m.code,
            "url": f"https://www.instagram.com/p/{m.code}/",
            "caption": m.caption_text or "",
            "like_count": m.like_count,
            "comment_count": m.comment_count,
            "user": m.user.username if m.user else "",
        }
        for m in medias
    ]

# ─── Search ──────────────────────────────────────────────────────────────

def search_users(cl: Client, query: str) -> list:
    """
    Cari user berdasarkan query.

    @example: search_users(cl, "nike shoes")
    """
    users = cl.search_users(query)
    return [
        {
            "pk": str(u.pk),
            "username": u.username,
            "full_name": u.full_name,
            "is_verified": u.is_verified,
            "follower_count": u.follower_count,
        }
        for u in users
    ]

# ─── Main example ─────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    # Set environment variables dulu:
    # export IG_USERNAME="your_dummy_account"
    # export IG_PASSWORD="your_password"
    # export TARGET_USERNAME="nike"

    TARGET = os.environ.get("TARGET_USERNAME", "nike")

    print(f"\n📸 instagrapi — Scraping @{TARGET}")
    print("─" * 60)

    cl = create_client()

    # Profil
    print("\n[1] Fetching profile...")
    profile = get_user_info(cl, TARGET)
    print(json.dumps(profile, indent=2))

    # Posts
    print(f"\n[2] Fetching last 20 posts...")
    time.sleep(2)  # Jeda antar request
    medias = get_user_medias(cl, TARGET, 20)
    print(f"✅ {len(medias)} posts fetched")
    if medias:
        top = max(medias, key=lambda m: m["like_count"])
        print(f"Top post: {top['url']} ({top['like_count']:,} likes)")

    # Reels
    print(f"\n[3] Fetching last 10 reels...")
    time.sleep(2)
    reels = get_user_reels(cl, TARGET, 10)
    print(f"✅ {len(reels)} reels fetched")

    print("\n✅ instagrapi test selesai!")
