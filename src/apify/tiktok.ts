/**
 * PILIHAN 3 — TikTok via Apify
 *
 * Apify adalah platform scraping berbasis cloud (usage-based).
 * Free: $5 kredit/bulan saat signup.
 *
 * Docs    : https://apify.com/clockworks/tiktok-scraper
 * Dashboard: https://console.apify.com
 *
 * Env wajib : APIFY_TOKEN
 *
 * Actors yang digunakan:
 *   - clockworks/tiktok-scraper          (full scraper, 98.7 juta runs)
 *   - clockworks/tiktok-profile-scraper  (profil saja, 9.4 juta runs)
 *   - clockworks/free-tiktok-scraper     (free version, 28.8 juta runs)
 */

import { ProviderUpstreamError } from "../ensembledata/types";

const APIFY_BASE = "https://api.apify.com/v2";

function getToken(): string {
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new ProviderUpstreamError("APIFY_TOKEN tidak di-set di environment variables");
  return token;
}

// ─── Generic Apify helpers ──────────────────────────────────────────────────

/**
 * Jalankan Apify actor secara synchronous dan tunggu hasilnya langsung.
 * Cocok untuk scraping cepat dengan jumlah data kecil-medium.
 * Timeout bawaan Apify: 5 menit.
 */
async function runActorSync(
  actorId: string,
  input: Record<string, unknown>
): Promise<unknown[]> {
  const token = getToken();
  const actorSlug = actorId.replace("/", "~");
  const url = `${APIFY_BASE}/acts/${actorSlug}/run-sync-get-dataset-items?token=${token}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    let errBody = "";
    try { errBody = await res.text(); } catch { /* noop */ }
    throw new ProviderUpstreamError(
      `Apify actor ${actorId} error ${res.status}: ${errBody.slice(0, 300)}`
    );
  }

  return res.json() as Promise<unknown[]>;
}

/**
 * Jalankan Apify actor secara asynchronous (tidak menunggu selesai).
 * Lebih cocok untuk scraping besar / batch.
 * Returns runId yang bisa digunakan untuk cek status dan ambil dataset.
 */
async function startActorAsync(
  actorId: string,
  input: Record<string, unknown>
): Promise<{ runId: string; datasetId: string }> {
  const token = getToken();
  const actorSlug = actorId.replace("/", "~");
  const url = `${APIFY_BASE}/acts/${actorSlug}/runs?token=${token}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    let errBody = "";
    try { errBody = await res.text(); } catch { /* noop */ }
    throw new ProviderUpstreamError(
      `Apify start actor ${actorId} error ${res.status}: ${errBody.slice(0, 300)}`
    );
  }

  const data = (await res.json()) as { data?: { id?: string; defaultDatasetId?: string } };
  return {
    runId: String(data.data?.id ?? ""),
    datasetId: String(data.data?.defaultDatasetId ?? ""),
  };
}

/**
 * Cek status Apify run.
 * Possible statuses: READY, RUNNING, SUCCEEDED, FAILED, ABORTING, ABORTED, TIMED-OUT
 */
async function getRunStatus(runId: string): Promise<string> {
  const token = getToken();
  const res = await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${token}`);
  const data = (await res.json()) as { data?: { status?: string } };
  return String(data.data?.status ?? "UNKNOWN");
}

/**
 * Ambil hasil dataset dari Apify run yang sudah selesai.
 */
async function getDatasetItems(datasetId: string): Promise<unknown[]> {
  const token = getToken();
  const res = await fetch(
    `${APIFY_BASE}/datasets/${datasetId}/items?token=${token}&format=json`
  );
  if (!res.ok) throw new ProviderUpstreamError(`Gagal ambil dataset ${datasetId}: ${res.status}`);
  return res.json() as Promise<unknown[]>;
}

/**
 * Poll sampai run selesai, dengan timeout.
 */
async function waitForRun(
  runId: string,
  datasetId: string,
  timeoutMs = 300_000
): Promise<unknown[]> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const status = await getRunStatus(runId);
    if (status === "SUCCEEDED") return getDatasetItems(datasetId);
    if (["FAILED", "ABORTED", "TIMED-OUT"].includes(status)) {
      throw new ProviderUpstreamError(`Apify run ${runId} ended with status: ${status}`);
    }
    await new Promise(r => setTimeout(r, 5000)); // poll tiap 5 detik
  }
  throw new ProviderUpstreamError(`Apify run ${runId} timed out after ${timeoutMs}ms`);
}

// ─── TikTok Public API ──────────────────────────────────────────────────────

/**
 * Scrape profil TikTok menggunakan clockworks/tiktok-profile-scraper.
 *
 * @example
 * const profiles = await scrapeTikTokProfiles(["charlidamelio", "khaby.lame"]);
 */
export async function scrapeTikTokProfiles(usernames: string[]): Promise<unknown[]> {
  return runActorSync("clockworks/tiktok-profile-scraper", {
    profiles: usernames.map(u => `https://www.tiktok.com/@${u.replace(/^@/, "")}`),
  });
}

/**
 * Scrape video TikTok dari satu atau beberapa profil.
 *
 * @param usernames       - Array username TikTok
 * @param resultsPerPage  - Jumlah video per profil (default 20)
 * @param download        - Download video files? (default false, hemat kredit)
 *
 * @example
 * const videos = await scrapeTikTokVideos(["charlidamelio"], 20);
 */
export async function scrapeTikTokVideos(
  usernames: string[],
  resultsPerPage = 20,
  download = false
): Promise<unknown[]> {
  return runActorSync("clockworks/tiktok-scraper", {
    profiles: usernames.map(u => `https://www.tiktok.com/@${u.replace(/^@/, "")}`),
    resultsPerPage,
    shouldDownloadVideos: download,
  });
}

/**
 * Scrape video TikTok berdasarkan hashtag.
 *
 * @example
 * const videos = await scrapeTikTokHashtag(["fyp", "viral"], 30);
 */
export async function scrapeTikTokHashtag(
  hashtags: string[],
  resultsPerPage = 30
): Promise<unknown[]> {
  return runActorSync("clockworks/tiktok-scraper", {
    hashtags: hashtags.map(h => h.replace(/^#/, "")),
    resultsPerPage,
    shouldDownloadVideos: false,
  });
}

/**
 * Scrape video TikTok berdasarkan keyword search.
 *
 * @example
 * const videos = await scrapeTikTokSearch(["indonesia viral"], 20);
 */
export async function scrapeTikTokSearch(
  keywords: string[],
  resultsPerPage = 20
): Promise<unknown[]> {
  return runActorSync("clockworks/tiktok-scraper", {
    searchQueries: keywords,
    resultsPerPage,
    shouldDownloadVideos: false,
  });
}

/**
 * Scrape banyak profil TikTok secara batch menggunakan async run.
 * Cocok untuk scraping 10+ akun sekaligus.
 *
 * @example
 * const { runId, datasetId } = await batchScrapeTikTok(usernames);
 * // ... tunggu beberapa menit ...
 * const results = await waitForApifyRun(runId, datasetId);
 */
export async function batchScrapeTikTok(
  usernames: string[],
  resultsPerPage = 20
): Promise<{ runId: string; datasetId: string }> {
  return startActorAsync("clockworks/tiktok-scraper", {
    profiles: usernames.map(u => `https://www.tiktok.com/@${u.replace(/^@/, "")}`),
    resultsPerPage,
    shouldDownloadVideos: false,
  });
}

export { waitForRun as waitForApifyRun, getDatasetItems };
