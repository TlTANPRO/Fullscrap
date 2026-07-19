"""
PYTHON — Instagram via instagrapi (butuh login)

instagrapi adalah Instagram Private API wrapper Python paling powerful.
Library ini simulate Instagram Android app — butuh akun Instagram aktif.

Library  : https://github.com/subzeroid/instagrapi
Versi    : 2.18.8 (Juli 2026, aktif dikembangkan)
Install  : pip install instagrapi
Auth     : Login username + password (session disimpan ke file)
Harga    : GRATIS
Env      : IG_USERNAME, IG_PASSWORD

─────────────────────────────────────────────────────────────
KEUNGGULAN vs provider gratis lain:
  - Stories user ✅ (semua provider gratis tidak bisa)
  - Followers & following list ✅
  - Direct Messages (DM) ✅
  - Upload foto/video/reels ✅
  - Post komentar, like ✅
  - Akun private (kalau sudah follow) ✅
  - Pagination tak terbatas ✅

RISIKO:
  - Akun bisa kena challenge / rate-limit jika terlalu agresif
  - Gunakan delay antar request (sudah built-in di instagrapi)
  - Simpan session (login 1x, reuse session)
  - Pakai residential proxy jika dari datacenter
─────────────────────────────────────────────────────────────
"""

import os
import json
from pathlib import Path

try:
    from instagrapi import Client
    from instagrapi.types import UserShort, Media, Story
    INSTAGRAPI_AVAILABLE = True
except ImportError:
    INSTAGRAPI_AVAILABLE = False
    print("⚠️  instagrapi tidak terinstall. Jalankan: pip install instagrapi")


SESSION_FILE = Path("session.json")


def get_client() -> "Client":
    """
    Buat / restore client instagrapi.
    Login sekali, session disimpan ke session.json untuk reuse.
    """
    if not INSTAGRAPI_AVAILABLE:
        raise RuntimeError("Install instagrapi dulu: pip install instagrapi")

    cl = Client()
    cl.delay_range = [1, 3]  # delay 1-3 detik antar request (wajib!)

    if SESSION_FILE.exists():
        cl.load_settings(SESSION_FILE)
        print(f"✅ Session restored dari {SESSION_FILE}")
    else:
        username = os.environ.get("IG_USERNAME")
        password = os.environ.get("IG_PASSWORD")
        if not username or not password:
            raise ValueError("Set IG_USERNAME dan IG_PASSWORD di environment")

        print(f"🔑 Login sebagai @{username}...")
        cl.login(username, password)
        cl.dump_settings(SESSION_FILE)
        print(f"✅ Login berhasil, session disimpan ke {SESSION_FILE}")

    return cl


# ── Profil user ──────────────────────────────────────────────────────────────

def ig_user_info(username: str) -> dict:
    """
    Profil lengkap user Instagram.
    Returns: user_id, full_name, biography, follower_count, following_count,
             media_count, is_private, is_verified, profile_pic_url, dll.
    """
    cl = get_client()
    user_id = cl.user_id_from_username(username)
    user = cl.user_info(user_id)
    return user.dict()


# ── Posts ─────────────────────────────────────────────────────────────────────

def ig_user_posts(username: str, amount: int = 20) -> list[dict]:
    """
    Daftar post user (foto + video).
    @param amount  jumlah post yang diambil (0 = semua)
    """
    cl = get_client()
    user_id = cl.user_id_from_username(username)
    medias = cl.user_medias(user_id, amount=amount)
    return [m.dict() for m in medias]


def ig_user_reels(username: str, amount: int = 20) -> list[dict]:
    """Daftar reels user."""
    cl = get_client()
    user_id = cl.user_id_from_username(username)
    reels = cl.user_clips(user_id, amount=amount)
    return [r.dict() for r in reels]


# ── Stories ───────────────────────────────────────────────────────────────────

def ig_user_stories(username: str) -> list[dict]:
    """
    Stories aktif user (hilang setelah 24 jam).
    FITUR EKSKLUSIF — tidak ada provider gratis yang bisa tanpa login.
    """
    cl = get_client()
    user_id = cl.user_id_from_username(username)
    stories = cl.user_stories(user_id)
    return [s.dict() for s in stories]


# ── Followers / Following ─────────────────────────────────────────────────────

def ig_user_followers(username: str, amount: int = 100) -> list[dict]:
    """
    Daftar followers user.
    FITUR EKSKLUSIF — tidak ada provider gratis tanpa login.
    @param amount  0 = semua (hati-hati rate limit untuk akun besar)
    """
    cl = get_client()
    user_id = cl.user_id_from_username(username)
    followers = cl.user_followers(user_id, amount=amount)
    return [u.dict() for u in followers.values()]


def ig_user_following(username: str, amount: int = 100) -> list[dict]:
    """Daftar akun yang di-follow user."""
    cl = get_client()
    user_id = cl.user_id_from_username(username)
    following = cl.user_following(user_id, amount=amount)
    return [u.dict() for u in following.values()]


# ── Highlights ────────────────────────────────────────────────────────────────

def ig_user_highlights(username: str) -> list[dict]:
    """Daftar highlights (story archive) user."""
    cl = get_client()
    user_id = cl.user_id_from_username(username)
    highlights = cl.user_highlights(user_id)
    return [h.dict() for h in highlights]


def ig_highlight_stories(highlight_id: str) -> list[dict]:
    """Isi stories dari 1 highlight."""
    cl = get_client()
    stories = cl.highlight_info(highlight_id).items
    return [s.dict() for s in stories]


# ── Post detail + download ────────────────────────────────────────────────────

def ig_post_info(post_url: str) -> dict:
    """Detail post dari URL instagram.com/p/<shortcode>/"""
    cl = get_client()
    media_pk = cl.media_pk_from_url(post_url)
    media = cl.media_info(media_pk)
    return media.dict()


def ig_download_post(post_url: str, folder: str = "/tmp") -> str:
    """
    Download foto/video dari URL post.
    Returns: path file yang didownload
    """
    cl = get_client()
    media_pk = cl.media_pk_from_url(post_url)
    media = cl.media_info(media_pk)
    if media.media_type == 1:  # foto
        path = cl.photo_download(media_pk, folder=Path(folder))
    elif media.media_type == 2:  # video
        path = cl.video_download(media_pk, folder=Path(folder))
    else:
        path = cl.album_download(media_pk, folder=Path(folder))
    return str(path)


# ── Direct Messages ───────────────────────────────────────────────────────────

def ig_get_threads(amount: int = 20) -> list[dict]:
    """Daftar thread DM (inbox)."""
    cl = get_client()
    threads = cl.direct_threads(amount=amount)
    return [t.dict() for t in threads]


# ── Main untuk testing ────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    username = os.environ.get("IG_USERNAME_TARGET") or (sys.argv[1] if len(sys.argv) > 1 else "instagram")

    print(f"\n📸 Instagram Scraper — instagrapi (butuh login)")
    print(f"Target  : @{username}")
    print(f"Auth    : ✅ Login required (session file)")
    print(f"Status  : Butuh pip install instagrapi + akun IG")
    print("─" * 60)

    if not INSTAGRAPI_AVAILABLE:
        print("❌ instagrapi tidak terinstall")
        print("   Jalankan: pip install instagrapi")
        sys.exit(1)

    try:
        print(f"\n[1/3] User info @{username}...")
        info = ig_user_info(username)
        print(f"✅ Berhasil")
        print(f"   followers : {info.get('follower_count', 0):,}")
        print(f"   following : {info.get('following_count', 0):,}")
        print(f"   posts     : {info.get('media_count', 0):,}")
        print(f"   private   : {info.get('is_private', False)}")

        print(f"\n[2/3] Stories @{username}...")
        stories = ig_user_stories(username)
        print(f"✅ {len(stories)} stories ditemukan")
        if stories:
            print(f"   Type    : {stories[0].get('media_type')}")
            print(f"   Expires : {stories[0].get('expiring_at')}")

        print(f"\n[3/3] 5 posts terakhir @{username}...")
        posts = ig_user_posts(username, amount=5)
        print(f"✅ {len(posts)} posts")
        for p in posts[:3]:
            print(f"   [{p.get('media_type')}] {p.get('like_count', 0):,} likes — {p.get('taken_at')}")

    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
