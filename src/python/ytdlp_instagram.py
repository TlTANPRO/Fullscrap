"""
GRATIS — Instagram Post Detail via yt-dlp

yt-dlp adalah free & open-source downloader yang mendukung Instagram.
Tidak perlu signup, tidak perlu API key.
Diuji langsung: Juli 2026 — CONFIRMED WORKS.

Install  : pip install yt-dlp
PyPI     : https://pypi.org/project/yt-dlp/
GitHub   : https://github.com/yt-dlp/yt-dlp
Versi    : 2026.07.04 (tested)

KEGUNAAN:
- Ambil metadata post Instagram (likes, comments, uploader, caption)
- Download video/gambar Instagram (opsional)
- Tidak perlu login untuk post publik

TIDAK WORKS (perlu login):
- Akun privat
- Stories
- Highlights
- TikTok dari server (Cloudflare block) — Instagram works!

Install:
  pip install yt-dlp
"""

import yt_dlp
import json
from typing import Optional

# ─── Fungsi utama ─────────────────────────────────────────────────────────

def get_instagram_post_info(post_url: str) -> dict:
    """
    Ambil metadata post Instagram tanpa download.
    CONFIRMED WORKS — diuji: nike post DZK3iOsRlWX

    Args:
        post_url: URL post Instagram
                  Contoh: https://www.instagram.com/p/DZK3iOsRlWX/
                  Juga support reel: https://www.instagram.com/reel/DZK3iOsRlWX/

    Returns:
        dict dengan field: id, uploader, like_count, comment_count,
        description, upload_date, duration, thumbnail, formats

    @example:
        post = get_instagram_post_info("https://www.instagram.com/p/DZK3iOsRlWX/")
        print(post["uploader"], post["like_count"], post["comment_count"])
    """
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,  # Metadata only, no actual download
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(post_url, download=False)

    return {
        "id": info.get("id"),
        "shortcode": info.get("id"),  # Same as ID for Instagram
        "url": post_url,
        "uploader": info.get("uploader"),
        "uploader_id": info.get("uploader_id"),
        "uploader_url": info.get("uploader_url"),
        "like_count": info.get("like_count"),
        "comment_count": info.get("comment_count"),
        "description": info.get("description") or info.get("title") or "",
        "upload_date": info.get("upload_date"),  # Format: YYYYMMDD
        "timestamp": info.get("timestamp"),  # Unix timestamp
        "duration": info.get("duration"),  # None untuk foto
        "thumbnail": info.get("thumbnail"),
        "is_video": bool(info.get("duration")),
        # URL file (jika mau download manual)
        "video_url": info.get("url"),
        # Semua format tersedia (berbagai resolusi)
        "formats_count": len(info.get("formats") or []),
    }


def download_instagram_post(post_url: str, output_dir: str = ".") -> str:
    """
    Download post Instagram (video atau gambar).

    Args:
        post_url: URL post Instagram
        output_dir: Direktori output (default: current dir)

    Returns:
        Path file yang didownload

    @example:
        path = download_instagram_post(
            "https://www.instagram.com/p/DZK3iOsRlWX/",
            output_dir="/tmp/downloads"
        )
    """
    ydl_opts = {
        "quiet": True,
        "outtmpl": f"{output_dir}/%(uploader)s_%(id)s.%(ext)s",
        "format": "best",
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(post_url, download=True)
        filename = ydl.prepare_filename(info)

    return filename


def batch_get_post_info(post_urls: list[str], delay_seconds: float = 1.0) -> list[dict]:
    """
    Ambil info beberapa post sekaligus.

    Args:
        post_urls: List URL post Instagram
        delay_seconds: Jeda antar request (default 1 detik)

    @example:
        urls = [
            "https://www.instagram.com/p/DZK3iOsRlWX/",
            "https://www.instagram.com/p/CxYZ123abc/",
        ]
        results = batch_get_post_info(urls)
        for r in results:
            print(r["uploader"], r["like_count"])
    """
    import time

    results = []
    for i, url in enumerate(post_urls):
        try:
            info = get_instagram_post_info(url)
            results.append({"status": "ok", **info})
        except Exception as e:
            results.append({"status": "error", "url": url, "error": str(e)})

        if i < len(post_urls) - 1 and delay_seconds > 0:
            time.sleep(delay_seconds)

    return results


# ─── Contoh penggunaan ────────────────────────────────────────────────────

if __name__ == "__main__":
    # Contoh URL — ganti dengan URL post yang ingin dicek
    TEST_URL = "https://www.instagram.com/p/DZK3iOsRlWX/"

    print("📸 yt-dlp Instagram Post Info")
    print(f"URL: {TEST_URL}")
    print("-" * 60)

    try:
        post = get_instagram_post_info(TEST_URL)
        print("STATUS: ✅ WORKS")
        print(json.dumps(post, indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"ERROR: {e}")
        print("\nTips:")
        print("1. Pastikan yt-dlp versi terbaru: pip install -U yt-dlp")
        print("2. Post harus public (bukan privat)")
        print("3. URL harus format: https://www.instagram.com/p/SHORTCODE/")
