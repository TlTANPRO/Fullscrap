"""
TEST: Instagram via instagrapi Python (butuh login + pip install)

STATUS: ⚠️ Butuh pip install instagrapi + akun Instagram
Diuji: Juli 2026 — library confirmed aktif (v2.18.8)

Setup:
  pip install instagrapi python-dotenv
  export IG_USERNAME=your_username
  export IG_PASSWORD=your_password

Jalankan:
  IG_USERNAME=xxx IG_PASSWORD=yyy IG_USERNAME_TARGET=instagram python3 examples/test-instagrapi.py

FITUR EKSKLUSIF (tidak ada di provider gratis lain):
  - Stories user aktif
  - Followers & following list
  - Direct Messages
  - Highlights & isi stories highlight
  - Download foto/video langsung
"""

import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from src.instagrapi.instagram import (
    ig_user_info,
    ig_user_posts,
    ig_user_reels,
    ig_user_stories,
    ig_user_followers,
    ig_user_following,
    ig_user_highlights,
    INSTAGRAPI_AVAILABLE,
)

def main():
    username = os.environ.get("IG_USERNAME_TARGET") or (sys.argv[1] if len(sys.argv) > 1 else "instagram")

    print(f"\n📸 Instagram Scraper — instagrapi (Python, butuh login)")
    print(f"Target  : @{username}")
    print(f"Auth    : ✅ Login required (IG_USERNAME + IG_PASSWORD)")
    print(f"Install : pip install instagrapi")
    print(f"Harga   : GRATIS")
    print("─" * 60)

    if not INSTAGRAPI_AVAILABLE:
        print("❌ instagrapi tidak terinstall")
        print("   Jalankan: pip install instagrapi")
        sys.exit(1)

    if not os.environ.get("IG_USERNAME") or not os.environ.get("IG_PASSWORD"):
        print("❌ Set IG_USERNAME dan IG_PASSWORD di environment")
        sys.exit(1)

    # ── Test 1: User info ────────────────────────────────────────────────────
    print(f"\n[1/5] User info @{username}...")
    t0 = time.time()
    try:
        info = ig_user_info(username)
        print(f"✅ Berhasil ({(time.time()-t0)*1000:.0f}ms)")
        print(f"   followers : {info.get('follower_count', 0):,}")
        print(f"   following : {info.get('following_count', 0):,}")
        print(f"   posts     : {info.get('media_count', 0):,}")
        print(f"   private   : {info.get('is_private', False)}")
        print(f"   bio       : {str(info.get('biography', ''))[:60]}")
    except Exception as e:
        print(f"❌ Gagal: {e}")

    # ── Test 2: Stories (EKSKLUSIF) ─────────────────────────────────────────
    print(f"\n[2/5] Stories user @{username} (EKSKLUSIF)...")
    t1 = time.time()
    try:
        stories = ig_user_stories(username)
        print(f"✅ {len(stories)} stories aktif ({(time.time()-t1)*1000:.0f}ms)")
        for s in stories[:2]:
            media_type = "foto" if s.get("media_type") == 1 else "video"
            print(f"   [{media_type}] expires: {s.get('expiring_at')}")
    except Exception as e:
        print(f"❌ Gagal: {e}")

    # ── Test 3: Posts ───────────────────────────────────────────────────────
    print(f"\n[3/5] 5 posts terakhir @{username}...")
    t2 = time.time()
    try:
        posts = ig_user_posts(username, amount=5)
        print(f"✅ {len(posts)} posts ({(time.time()-t2)*1000:.0f}ms)")
        for p in posts[:3]:
            mtype = {1: "foto", 2: "video", 8: "album"}.get(p.get("media_type", 0), "?")
            print(f"   [{mtype}] {p.get('like_count', 0):,} likes — {p.get('taken_at')}")
    except Exception as e:
        print(f"❌ Gagal: {e}")

    # ── Test 4: Followers (EKSKLUSIF) ──────────────────────────────────────
    print(f"\n[4/5] Followers list @{username} (EKSKLUSIF, 10 saja)...")
    t3 = time.time()
    try:
        followers = ig_user_followers(username, amount=10)
        print(f"✅ {len(followers)} followers (sample) ({(time.time()-t3)*1000:.0f}ms)")
        for f in followers[:3]:
            print(f"   @{f.get('username')} — {f.get('full_name')}")
    except Exception as e:
        print(f"❌ Gagal: {e}")

    # ── Test 5: Highlights ──────────────────────────────────────────────────
    print(f"\n[5/5] Highlights @{username}...")
    t4 = time.time()
    try:
        highlights = ig_user_highlights(username)
        print(f"✅ {len(highlights)} highlights ({(time.time()-t4)*1000:.0f}ms)")
        for h in highlights[:3]:
            print(f"   [{h.get('id')}] {h.get('title')} — {h.get('media_count')} items")
    except Exception as e:
        print(f"❌ Gagal: {e}")

    print("\n" + "─" * 60)
    print("📖 Lihat src/instagrapi/instagram.py untuk fungsi lengkap")
    print("   (termasuk DM, upload, download, dll)")

if __name__ == "__main__":
    main()
