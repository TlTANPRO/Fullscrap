"""
GRATIS — Instagram via Instaloader (Python library)

Instaloader adalah library Python yang aktif di-maintain untuk scraping
Instagram public posts, profil, stories, dan highlights.

Install : pip install instaloader
Docs    : https://instaloader.github.io/
Auth    : Opsional (tanpa login: public data; dengan login: stories + followers)
Harga   : Gratis

──────────────────────────────────────────────────────────────────
CONFIRMED WORKS (diuji langsung Juli 2026):
  get_profile_info()    → profil public (tanpa login) ✅
  get_user_posts()      → semua posts public dengan pagination ✅
  get_user_reels()      → reels public ✅
  get_post_detail()     → detail satu post by shortcode ✅
  save_session()        → simpan session login ke file ✅
  load_session()        → load session dari file ✅

DENGAN LOGIN (opsional, lebih lengkap):
  get_stories()         → stories user ✅ (butuh login)
  get_highlights()      → highlights user ✅ (butuh login)
  get_followers()       → followers user ✅ (butuh login)
  get_following()       → following user ✅ (butuh login)

TIDAK WORKS (private accounts tanpa follow):
  - Posts, stories, followers akun private yang kamu tidak follow
──────────────────────────────────────────────────────────────────

KEUNGGULAN vs Provider 3 (instagram-web):
  ✅ Jauh lebih stabil — Instaloader aktif di-maintain vs raw HTTP
  ✅ Stories & highlights (dengan login)
  ✅ Download media file otomatis jika mau
  ✅ Built-in rate limit handling
  ✅ Bisa simpan session login (tidak perlu login ulang tiap run)

INSTALL:
  pip install instaloader

RATE LIMITING:
  Instaloader otomatis handle rate limit dengan sleep antar request.
  Default sleep sudah di-set aman. Jangan kurangi sleep terlalu agresif.
"""

import json
import os
import sys
from dataclasses import dataclass, field, asdict
from typing import Optional

try:
    import instaloader
except ImportError:
    print("ERROR: instaloader belum terinstall.")
    print("Jalankan: pip install instaloader")
    sys.exit(1)


# ─── Types / Dataclasses ─────────────────────────────────────────────────────

@dataclass
class IGProfile:
    username: str
    user_id: str
    full_name: str
    biography: str
    profile_pic_url: str
    is_verified: bool
    is_private: bool
    follower_count: int
    following_count: int
    post_count: int
    external_url: str
    is_business: bool
    business_category: str


@dataclass
class IGPost:
    shortcode: str
    url: str
    is_video: bool
    like_count: int
    comment_count: int
    video_view_count: int
    timestamp: int      # unix timestamp
    caption: str
    location: str
    media_type: str     # "image" | "video" | "sidecar"
    thumbnail_url: str
    video_url: str      # kosong jika bukan video


@dataclass
class IGStory:
    item_id: str
    is_video: bool
    url: str            # URL media (image atau video)
    timestamp: int
    expiring_at: int
    duration_seconds: float


@dataclass
class IGHighlight:
    highlight_id: str
    title: str
    cover_url: str
    item_count: int


# ─── Loader init ─────────────────────────────────────────────────────────────

def make_loader(session_file: Optional[str] = None) -> instaloader.Instaloader:
    """
    Buat instance Instaloader.

    Args:
        session_file: Path ke file session (opsional). Jika ada, otomatis login.
                      Buat session file dengan save_session().

    Returns:
        Instaloader instance (sudah login jika session_file diberikan)
    """
    loader = instaloader.Instaloader(
        quiet=True,
        download_pictures=False,
        download_videos=False,
        download_video_thumbnails=False,
        download_geotags=False,
        download_comments=False,
        save_metadata=False,
        compress_json=False,
        post_metadata_txt_pattern="",
        max_connection_attempts=3,
    )

    if session_file and os.path.exists(session_file):
        try:
            loader.load_session_from_file(
                username=_get_username_from_session(session_file),
                filename=session_file,
            )
        except Exception as e:
            print(f"⚠️  Gagal load session dari {session_file}: {e}")

    return loader


def _get_username_from_session(session_file: str) -> str:
    """Baca username dari nama file session (format: ig_session_USERNAME.dat)"""
    basename = os.path.basename(session_file)
    if basename.startswith("ig_session_"):
        return basename.replace("ig_session_", "").replace(".dat", "")
    return ""


# ─── Session management ──────────────────────────────────────────────────────

def save_session(username: str, password: str, session_file: Optional[str] = None) -> str:
    """
    Login ke Instagram dan simpan session ke file.
    Session bisa dipakai ulang tanpa login ulang.

    CATATAN KEAMANAN: Simpan session file di tempat aman, jangan di-commit ke git.

    Args:
        username: Username Instagram
        password: Password Instagram
        session_file: Path output file (default: ig_session_USERNAME.dat)

    Returns:
        Path ke file session yang tersimpan

    @example:
        session_path = save_session("myusername", "mypassword")
        # "ig_session_myusername.dat"
    """
    if not session_file:
        session_file = f"ig_session_{username}.dat"

    loader = instaloader.Instaloader()
    loader.login(username, password)
    loader.save_session_to_file(session_file)

    print(f"✅ Session tersimpan: {session_file}")
    return session_file


def load_session(session_file: str) -> instaloader.Instaloader:
    """
    Load session dari file (tanpa input password).

    Args:
        session_file: Path ke file session dari save_session()

    Returns:
        Instaloader instance yang sudah login

    @example:
        loader = load_session("ig_session_myusername.dat")
        # Sekarang bisa akses stories/followers
    """
    return make_loader(session_file=session_file)


# ─── Public API ───────────────────────────────────────────────────────────────

def get_profile_info(username: str, session_file: Optional[str] = None) -> IGProfile:
    """
    Ambil profil Instagram (bekerja TANPA login untuk akun public).

    Args:
        username: Username Instagram (tanpa @)
        session_file: Path session file (opsional, untuk akun private yang kamu follow)

    Returns:
        IGProfile dataclass

    @example:
        profile = get_profile_info("nike")
        print(profile.follower_count, profile.post_count)
    """
    loader = make_loader(session_file)

    try:
        p = instaloader.Profile.from_username(loader.context, username)
    except instaloader.exceptions.ProfileNotExistsException:
        raise ValueError(f"Akun @{username} tidak ditemukan")
    except instaloader.exceptions.PrivateProfileNotFollowedException:
        raise ValueError(f"Akun @{username} privat dan kamu tidak follow-nya")

    return IGProfile(
        username=p.username,
        user_id=str(p.userid),
        full_name=p.full_name,
        biography=p.biography,
        profile_pic_url=p.profile_pic_url,
        is_verified=p.is_verified,
        is_private=p.is_private,
        follower_count=p.followers,
        following_count=p.followees,
        post_count=p.mediacount,
        external_url=p.external_url or "",
        is_business=p.is_business_account,
        business_category=p.business_category_name or "",
    )


def get_user_posts(
    username: str,
    max_posts: int = 50,
    session_file: Optional[str] = None,
) -> list[IGPost]:
    """
    Ambil posts user Instagram (bekerja TANPA login untuk akun public).

    Args:
        username:     Username Instagram
        max_posts:    Batas maksimal posts (default 50, None = semua)
        session_file: Path session file (opsional)

    Returns:
        List IGPost

    @example:
        posts = get_user_posts("nike", max_posts=30)
        for p in posts:
            print(p.shortcode, p.like_count, p.caption[:50])
    """
    loader = make_loader(session_file)
    p = instaloader.Profile.from_username(loader.context, username)

    posts = []
    for post in p.get_posts():
        if max_posts and len(posts) >= max_posts:
            break
        posts.append(_parse_post(post))

    return posts


def get_user_reels(
    username: str,
    max_reels: int = 50,
    session_file: Optional[str] = None,
) -> list[IGPost]:
    """
    Ambil reels user Instagram.
    Reels adalah posts video — sama dengan get_user_posts() tapi difilter is_video=True.

    @example:
        reels = get_user_reels("nike", max_reels=20)
    """
    posts = get_user_posts(username, max_posts=max_reels * 3, session_file=session_file)
    reels = [p for p in posts if p.is_video]
    return reels[:max_reels]


def get_post_detail(shortcode: str, session_file: Optional[str] = None) -> IGPost:
    """
    Ambil detail satu post berdasarkan shortcode.
    Shortcode = bagian setelah /p/ di URL Instagram.

    Args:
        shortcode: Contoh "DZK3iOsRlWX" dari URL https://www.instagram.com/p/DZK3iOsRlWX/

    @example:
        post = get_post_detail("DZK3iOsRlWX")
        print(post.like_count, post.caption[:80])
    """
    loader = make_loader(session_file)
    post = instaloader.Post.from_shortcode(loader.context, shortcode)
    return _parse_post(post)


def get_stories(
    username: str,
    session_file: str,
) -> list[IGStory]:
    """
    Ambil stories user. MEMERLUKAN LOGIN (session_file wajib).

    Args:
        username:     Username Instagram
        session_file: Path session file dari save_session() — WAJIB

    Returns:
        List IGStory (kosong jika tidak ada stories aktif)

    @example:
        stories = get_stories("nike", "ig_session_myusername.dat")
        print(f"{len(stories)} stories aktif")
    """
    loader = make_loader(session_file)
    p = instaloader.Profile.from_username(loader.context, username)

    stories = []
    for story in loader.get_stories(userids=[p.userid]):
        for item in story.get_items():
            stories.append(IGStory(
                item_id=str(item.mediaid),
                is_video=item.is_video,
                url=item.video_url if item.is_video else item.url,
                timestamp=int(item.date_utc.timestamp()),
                expiring_at=int(item.expiring_date_utc.timestamp()),
                duration_seconds=item.video_duration or 0.0,
            ))

    return stories


def get_highlights(
    username: str,
    session_file: str,
) -> list[IGHighlight]:
    """
    Ambil daftar highlights user. MEMERLUKAN LOGIN (session_file wajib).

    @example:
        highlights = get_highlights("nike", "ig_session_myusername.dat")
        for h in highlights:
            print(h.title, h.item_count)
    """
    loader = make_loader(session_file)
    p = instaloader.Profile.from_username(loader.context, username)

    result = []
    for highlight in loader.get_highlights(p):
        result.append(IGHighlight(
            highlight_id=str(highlight.unique_id),
            title=highlight.title,
            cover_url=highlight.cover_url,
            item_count=highlight.itemcount,
        ))

    return result


def get_followers(
    username: str,
    session_file: str,
    max_count: int = 1000,
) -> list[dict]:
    """
    Ambil daftar followers user. MEMERLUKAN LOGIN (session_file wajib).

    Args:
        username:   Target username
        session_file: Path session file — WAJIB
        max_count:  Batas maksimal followers (default 1000)

    Returns:
        List dict dengan keys: username, user_id, full_name, is_verified, is_private

    @example:
        followers = get_followers("brand_kecil", "ig_session_myusername.dat", max_count=500)
    """
    loader = make_loader(session_file)
    p = instaloader.Profile.from_username(loader.context, username)

    result = []
    for follower in p.get_followers():
        if len(result) >= max_count:
            break
        result.append({
            "username": follower.username,
            "user_id": str(follower.userid),
            "full_name": follower.full_name,
            "is_verified": follower.is_verified,
            "is_private": follower.is_private,
        })

    return result


def get_following(
    username: str,
    session_file: str,
    max_count: int = 1000,
) -> list[dict]:
    """
    Ambil daftar akun yang di-follow. MEMERLUKAN LOGIN (session_file wajib).

    @example:
        following = get_following("brand_kecil", "ig_session_myusername.dat")
    """
    loader = make_loader(session_file)
    p = instaloader.Profile.from_username(loader.context, username)

    result = []
    for followee in p.get_followees():
        if len(result) >= max_count:
            break
        result.append({
            "username": followee.username,
            "user_id": str(followee.userid),
            "full_name": followee.full_name,
            "is_verified": followee.is_verified,
            "is_private": followee.is_private,
        })

    return result


# ─── Internal helpers ─────────────────────────────────────────────────────────

def _parse_post(post: "instaloader.Post") -> IGPost:
    """Convert Instaloader Post ke IGPost dataclass."""
    if post.typename == "GraphSidecar":
        media_type = "sidecar"
    elif post.is_video:
        media_type = "video"
    else:
        media_type = "image"

    return IGPost(
        shortcode=post.shortcode,
        url=f"https://www.instagram.com/p/{post.shortcode}/",
        is_video=post.is_video,
        like_count=post.likes,
        comment_count=post.comments,
        video_view_count=post.video_view_count or 0,
        timestamp=int(post.date_utc.timestamp()),
        caption=post.caption or "",
        location=str(post.location.name) if post.location else "",
        media_type=media_type,
        thumbnail_url=post.url,
        video_url=post.video_url or "",
    )


# ─── Contoh penggunaan ────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Instagram scraper via Instaloader")
    parser.add_argument("username", nargs="?", default="nike", help="Username Instagram")
    parser.add_argument("--session", help="Path ke session file (untuk stories/followers)")
    parser.add_argument("--posts", type=int, default=12, help="Jumlah posts")
    args = parser.parse_args()

    username = args.username.lstrip("@")
    print(f"\n📸 Instaloader Instagram Scraper")
    print(f"Target : @{username}")
    print(f"Session: {args.session or '❌ Tidak ada (mode publik)'}")
    print("─" * 60)

    # Test 1: Profil
    print("\n[1] Fetching profile...")
    try:
        profile = get_profile_info(username, args.session)
        print("✅ Profile fetched:")
        print(json.dumps(asdict(profile), indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

    # Test 2: Posts
    print(f"\n[2] Fetching {args.posts} posts...")
    try:
        posts = get_user_posts(username, max_posts=args.posts, session_file=args.session)
        print(f"✅ {len(posts)} posts fetched")
        if posts:
            top = sorted(posts, key=lambda p: p.like_count, reverse=True)[0]
            print(f"  Top post: {top.url} ({top.like_count:,} likes)")
    except Exception as e:
        print(f"❌ Error: {e}")

    # Test 3: Stories (butuh login)
    if args.session:
        print("\n[3] Fetching stories (requires session)...")
        try:
            stories = get_stories(username, args.session)
            print(f"✅ {len(stories)} stories aktif")
        except Exception as e:
            print(f"❌ Error: {e}")

        print("\n[4] Fetching highlights (requires session)...")
        try:
            highlights = get_highlights(username, args.session)
            print(f"✅ {len(highlights)} highlights")
            for h in highlights:
                print(f"  - {h.title} ({h.item_count} items)")
        except Exception as e:
            print(f"❌ Error: {e}")
    else:
        print("\n💡 Tips: Tambah --session ig_session_USERNAME.dat untuk stories & highlights")
        print("   Buat session: python -c \"")
        print('   from instaloader_instagram import save_session')
        print('   save_session(\"username\", \"password\")')
        print("   \"")
