/**
 * PILIHAN 3 — Instagram via Apify
 *
 * Apify adalah platform scraping berbasis cloud (usage-based).
 * Free: $5 kredit/bulan saat signup.
 *
 * Docs    : https://apify.com/apify/instagram-scraper
 * Dashboard: https://console.apify.com
 *
 * Env wajib : APIFY_TOKEN
 *
 * Actors yang digunakan:
 *   - apify/instagram-scraper          (full scraper, 159 juta runs)
 *   - apify/instagram-profile-scraper  (profil saja, 95.6 juta runs)
 *   - apify/instagram-post-scraper     (post saja, 40.3 juta runs)
 */

import { ProviderUpstreamError } from "../ensembledata/types";

const APIFY_BASE = "https://api.apify.com/v2";

function getToken(): string {
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new ProviderUpstreamError("APIFY_TOKEN tidak di-set di environment variables");
  return token;
}

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

async function startActorAsync(
  actorId: string,
  input: Record<string, unknown>
): Promise<{ runId: string; datasetId: string }> {
  const token = getToken();
  const actorSlug = actorId.replace("/", "~");

  const res = await fetch(`${APIFY_BASE}/acts/${actorSlug}/runs?token=${token}`, {
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

// ─── Instagram Public API ────────────────────────────────────────────────────

/**
 * Scrape profil Instagram.
 *
 * @example
 * const profiles = await scrapeInstagramProfiles(["nike", "adidas"]);
 * profiles.forEach(p => console.log(p.username, p.followersCount));
 */
export async function scrapeInstagramProfiles(
  usernames: string[]
): Promise<unknown[]> {
  return runActorSync("apify/instagram-profile-scraper", {
    usernames,
    resultsLimit: 1,
  });
}

/**
 * Scrape post Instagram dari satu atau beberapa profil.
 *
 * @param usernames    - Array username Instagram
 * @param resultsLimit - Jumlah post per profil (default 20)
 *
 * @example
 * const posts = await scrapeInstagramPosts(["nike"], 20);
 */
export async function scrapeInstagramPosts(
  usernames: string[],
  resultsLimit = 20
): Promise<unknown[]> {
  return runActorSync("apify/instagram-scraper", {
    usernames,
    resultsType: "posts",
    resultsLimit,
  });
}

/**
 * Scrape post Instagram berdasarkan hashtag.
 *
 * @example
 * const posts = await scrapeInstagramHashtag(["sneakers", "nike"], 30);
 */
export async function scrapeInstagramHashtag(
  hashtags: string[],
  resultsLimit = 30
): Promise<unknown[]> {
  return runActorSync("apify/instagram-scraper", {
    hashtags: hashtags.map(h => h.replace(/^#/, "")),
    resultsType: "posts",
    resultsLimit,
  });
}

/**
 * Scrape komentar dari post tertentu.
 *
 * @example
 * const comments = await scrapeInstagramComments(["https://www.instagram.com/p/ABC123/"], 50);
 */
export async function scrapeInstagramComments(
  postUrls: string[],
  resultsLimit = 50
): Promise<unknown[]> {
  return runActorSync("apify/instagram-scraper", {
    directUrls: postUrls,
    resultsType: "comments",
    resultsLimit,
  });
}

/**
 * Scrape stories dari satu atau beberapa profil.
 * CATATAN: Stories hanya bisa diakses jika akun sudah difollow atau publik.
 *
 * @example
 * const stories = await scrapeInstagramStories(["nike"]);
 */
export async function scrapeInstagramStories(usernames: string[]): Promise<unknown[]> {
  return runActorSync("apify/instagram-scraper", {
    usernames,
    resultsType: "stories",
    resultsLimit: 50,
  });
}

/**
 * Batch scraping Instagram banyak akun secara async.
 * Cocok untuk scraping 10+ akun sekaligus tanpa menunggu.
 *
 * @example
 * const { runId, datasetId } = await batchScrapeInstagram(usernames, 50);
 * // Cek progres:
 * // GET https://api.apify.com/v2/actor-runs/{runId}?token=TOKEN
 * // Ambil hasil saat SUCCEEDED:
 * // GET https://api.apify.com/v2/datasets/{datasetId}/items?token=TOKEN
 */
export async function batchScrapeInstagram(
  usernames: string[],
  resultsLimit = 50
): Promise<{ runId: string; datasetId: string }> {
  return startActorAsync("apify/instagram-scraper", {
    usernames,
    resultsType: "posts",
    resultsLimit,
  });
}

/**
 * Poll sampai Apify run selesai dan kembalikan hasilnya.
 * Timeout default: 5 menit.
 *
 * @example
 * const { runId, datasetId } = await batchScrapeInstagram(["nike", "adidas"]);
 * const results = await waitForInstagramRun(runId, datasetId);
 */
export async function waitForInstagramRun(
  runId: string,
  datasetId: string,
  timeoutMs = 300_000
): Promise<unknown[]> {
  const token = getToken();
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const res = await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${token}`);
    const data = (await res.json()) as { data?: { status?: string } };
    const status = String(data.data?.status ?? "UNKNOWN");

    if (status === "SUCCEEDED") {
      const itemsRes = await fetch(
        `${APIFY_BASE}/datasets/${datasetId}/items?token=${token}&format=json`
      );
      return itemsRes.json() as Promise<unknown[]>;
    }

    if (["FAILED", "ABORTED", "TIMED-OUT"].includes(status)) {
      throw new ProviderUpstreamError(`Apify Instagram run ${runId} ended with status: ${status}`);
    }

    await new Promise(r => setTimeout(r, 5000));
  }

  throw new ProviderUpstreamError(`Apify Instagram run timed out after ${timeoutMs}ms`);
}
