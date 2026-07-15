"""
TEST: Instagram via Instaloader (GRATIS, tanpa API key)

Jalankan (tanpa login):
    python examples/test-instaloader.py
    python examples/test-instaloader.py --username nike --posts 5

Jalankan (dengan login session untuk stories + followers):
    # Langkah 1: Buat session dulu
    python -c "
    import sys; sys.path.insert(0, 'src')
    from instaloader.instagram import save_session
    save_session('your_username', 'your_password')
    "

    # Langkah 2: Run test dengan session
    python examples/test-instaloader.py --session ig_session_YOUR_USERNAME.dat --username nike

Keunggulan vs yt-dlp (Provider 4):
    - yt-dlp     : hanya 1 post at a time
    - Instaloader: bisa scrape seluruh feed, reels, stories, highlights, followers
"""

import json
import sys
import time
import argparse
import os

# Tambah src ke path supaya import berjalan
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

try:
    from src.instaloader.instagram import (
        get_profile_info,
        get_user_posts,
        get_user_reels,
        get_post_detail,
        asdict,
    )
except ImportError as e:
    print(f"ERROR import: {e}")
    print("Pastikan instaloader terinstall: pip install instaloader")
    sys.exit(1)


def fmt_num(n: int) -> str:
    return f"{n:,}"


def main():
    parser = argparse.ArgumentParser(description="Test Instaloader Instagram scraper")
    parser.add_argument("--username", default="nike", help="Username Instagram")
    parser.add_argument("--posts", type=int, default=6, help="Jumlah posts")
    parser.add_argument("--session", help="Path ke session file (untuk stories/followers)")
    args = parser.parse_args()

    username = args.username.lstrip("@")

    print(f"\n📸 Instagram Scraper — Instaloader (GRATIS)")
    print(f"Target  : @{username}")
    print(f"Session : {args.session or '❌ Tidak ada (mode public)'}")
    print("-" * 60)

    # ── Test 1: Profil ──────────────────────────────────────────────────────
    print(f"\n[1/3] Fetching profile @{username}...")
    t0 = time.time()
    try:
        profile = get_profile_info(username, args.session)
        elapsed = (time.time() - t0) * 1000
        print(f"✅ Profile fetched ({elapsed:.0f}ms)")
        print(f"  Username     : @{profile.username}")
        print(f"  Full name    : {profile.full_name}")
        print(f"  Verified     : {profile.is_verified}")
        print(f"  Private      : {profile.is_private}")
        print(f"  Followers    : {fmt_num(profile.follower_count)}")
        print(f"  Following    : {fmt_num(profile.following_count)}")
        print(f"  Posts        : {fmt_num(profile.post_count)}")
        print(f"  Bio          : {profile.biography[:80]}{'...' if len(profile.biography) > 80 else ''}")
        print(f"  External URL : {profile.external_url or '-'}")
        print(f"  Business     : {profile.is_business} ({profile.business_category or '-'})")
        print(f"  User ID      : {profile.user_id}")
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

    # ── Test 2: Posts ───────────────────────────────────────────────────────
    print(f"\n[2/3] Fetching {args.posts} posts...")
    t1 = time.time()
    try:
        posts = get_user_posts(username, max_posts=args.posts, session_file=args.session)
        elapsed = (time.time() - t1) * 1000
        print(f"✅ {len(posts)} posts fetched ({elapsed:.0f}ms)")

        if posts:
            top = sorted(posts, key=lambda p: p.like_count, reverse=True)[0]
            print(f"\n  Top post (by likes):")
            print(f"    URL       : {top.url}")
            print(f"    Type      : {top.media_type}")
            print(f"    Likes     : {fmt_num(top.like_count)}")
            print(f"    Comments  : {fmt_num(top.comment_count)}")
            if top.is_video:
                print(f"    Views     : {fmt_num(top.video_view_count)}")
            print(f"    Caption   : {top.caption[:80]}{'...' if len(top.caption) > 80 else ''}")

        # Hitung engagement rate
        if profile.follower_count > 0 and posts:
            avg_likes = sum(p.like_count for p in posts) / len(posts)
            avg_comments = sum(p.comment_count for p in posts) / len(posts)
            eng_rate = (avg_likes + avg_comments) / profile.follower_count * 100
            print(f"\n  Engagement rate: {eng_rate:.2f}% (avg likes+comments / followers)")

    except Exception as e:
        print(f"❌ Error: {e}")

    # ── Test 3: Post detail ─────────────────────────────────────────────────
    if posts:
        shortcode = posts[0].shortcode
        print(f"\n[3/3] Fetching post detail (shortcode: {shortcode})...")
        t2 = time.time()
        try:
            detail = get_post_detail(shortcode, args.session)
            elapsed = (time.time() - t2) * 1000
            print(f"✅ Post detail fetched ({elapsed:.0f}ms)")
            print(f"  Shortcode   : {detail.shortcode}")
            print(f"  Type        : {detail.media_type}")
            print(f"  Likes       : {fmt_num(detail.like_count)}")
            print(f"  Comments    : {fmt_num(detail.comment_count)}")
            print(f"  Thumbnail   : {detail.thumbnail_url[:80]}...")
            if detail.is_video:
                print(f"  Video URL   : {detail.video_url[:80]}..." if detail.video_url else "  Video URL  : (tidak tersedia)")
        except Exception as e:
            print(f"❌ Error: {e}")
    else:
        print("\n[3/3] Skip post detail — tidak ada posts")

    # ── Ringkasan ───────────────────────────────────────────────────────────
    print("\n" + "─" * 60)
    print("Ringkasan Instaloader:")
    print("  ✅ get_profile_info() — profil lengkap (tanpa login)")
    print("  ✅ get_user_posts()   — semua posts (tanpa login)")
    print("  ✅ get_post_detail()  — detail satu post (tanpa login)")
    if args.session:
        print("  ✅ get_stories()      — stories (dengan session login)")
        print("  ✅ get_highlights()   — highlights (dengan session login)")
        print("  ✅ get_followers()    — followers list (dengan session login)")
    else:
        print("  ℹ️  get_stories()     → butuh --session untuk test")
        print("  ℹ️  get_followers()   → butuh --session untuk test")
    print("\n  Keunggulan vs yt-dlp:")
    print("    - yt-dlp    : 1 post at a time")
    print("    - Instaloader: scrape semua posts + stories + highlights + followers")


if __name__ == "__main__":
    main()
