/**
 * NODE.JS — Instagram via instagram-private-api (butuh login)
 *
 * Versi Node.js/TypeScript dari Instagram Private API wrapper.
 * Simulate Instagram Android app — butuh akun Instagram aktif.
 *
 * Package  : https://www.npmjs.com/package/instagram-private-api
 * Versi    : 1.46.1 (Juli 2026, aktif)
 * Install  : npm install instagram-private-api
 * Auth     : Login username + password (session disimpan ke file)
 * Harga    : GRATIS
 * Env      : IG_USERNAME, IG_PASSWORD
 *
 * ─────────────────────────────────────────────────────────────
 * KEUNGGULAN (sama dengan instagrapi tapi TypeScript):
 *   - Stories user ✅
 *   - Followers & following list ✅
 *   - Direct Messages ✅
 *   - Highlights ✅
 *   - Pagination built-in via Feeds ✅
 *
 * PILIH MANA:
 *   - Kalau server pakai Python → gunakan instagrapi (lebih aktif)
 *   - Kalau server pakai Node.js/TypeScript → gunakan paket ini
 * ─────────────────────────────────────────────────────────────
 */

import { readFileSync, writeFileSync, existsSync } from "fs";

// Dynamic import karena package mungkin tidak terinstall di semua environment
async function getIgLib() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("instagram-private-api") as typeof import("instagram-private-api");
  } catch {
    throw new Error(
      "instagram-private-api tidak terinstall.\n" +
      "Install dengan: npm install instagram-private-api\n" +
      "Atau di project: pnpm add instagram-private-api"
    );
  }
}

const SESSION_FILE = "ig-session.json";

async function getClient() {
  const { IgApiClient } = await getIgLib();
  const ig = new IgApiClient();

  const username = process.env.IG_USERNAME;
  const password = process.env.IG_PASSWORD;

  if (!username || !password) {
    throw new Error("Set IG_USERNAME dan IG_PASSWORD di environment (.env atau export)");
  }

  ig.state.generateDevice(username);

  if (existsSync(SESSION_FILE)) {
    const session = JSON.parse(readFileSync(SESSION_FILE, "utf8"));
    await ig.state.deserialize(session);
    console.log(`✅ Session restored dari ${SESSION_FILE}`);
  } else {
    console.log(`🔑 Login sebagai @${username}...`);
    await ig.simulate.preLoginFlow();
    await ig.account.login(username, password);
    await ig.simulate.postLoginFlow();
    const serialized = await ig.state.serialize();
    writeFileSync(SESSION_FILE, JSON.stringify(serialized));
    console.log(`✅ Login berhasil, session disimpan ke ${SESSION_FILE}`);
  }

  return ig;
}

// ── Profil user ──────────────────────────────────────────────────────────────

/** Profil lengkap user Instagram by username */
export async function igPrivateUserInfo(username: string) {
  const ig = await getClient();
  const userId = await ig.user.getIdByUsername(username);
  return ig.user.info(userId);
}

// ── Posts ─────────────────────────────────────────────────────────────────────

/** Semua post user (paginated, automatic) */
export async function igPrivateUserPosts(username: string, limit = 20) {
  const ig = await getClient();
  const userId = await ig.user.getIdByUsername(username);
  const feed = ig.feed.user(userId);

  const posts = [];
  while (posts.length < limit) {
    const items = await feed.items();
    posts.push(...items);
    if (!feed.isMoreAvailable()) break;
  }
  return posts.slice(0, limit);
}

/** Reels user */
export async function igPrivateUserReels(username: string, limit = 20) {
  const ig = await getClient();
  const userId = await ig.user.getIdByUsername(username);
  const feed = ig.feed.userReelMedia(userId);

  const reels = [];
  while (reels.length < limit) {
    const items = await feed.items();
    reels.push(...items);
    if (!feed.isMoreAvailable()) break;
  }
  return reels.slice(0, limit);
}

// ── Stories ───────────────────────────────────────────────────────────────────

/**
 * Stories aktif user.
 * FITUR EKSKLUSIF — tidak ada provider gratis tanpa login yang bisa ini.
 */
export async function igPrivateUserStories(username: string) {
  const ig = await getClient();
  const userId = await ig.user.getIdByUsername(username);
  const reelsFeed = ig.feed.reelsTray();
  const storiesReel = await ig.story.userStory(userId);
  return storiesReel?.items ?? [];
}

// ── Followers / Following ─────────────────────────────────────────────────────

/**
 * Daftar followers user.
 * FITUR EKSKLUSIF — tidak ada provider gratis tanpa login.
 */
export async function igPrivateUserFollowers(username: string, limit = 100) {
  const ig = await getClient();
  const userId = await ig.user.getIdByUsername(username);
  const followersFeed = ig.feed.accountFollowers(userId);

  const followers = [];
  while (followers.length < limit) {
    const items = await followersFeed.items();
    followers.push(...items);
    if (!followersFeed.isMoreAvailable()) break;
  }
  return followers.slice(0, limit);
}

/** Daftar following user. */
export async function igPrivateUserFollowing(username: string, limit = 100) {
  const ig = await getClient();
  const userId = await ig.user.getIdByUsername(username);
  const followingFeed = ig.feed.accountFollowing(userId);

  const following = [];
  while (following.length < limit) {
    const items = await followingFeed.items();
    following.push(...items);
    if (!followingFeed.isMoreAvailable()) break;
  }
  return following.slice(0, limit);
}

// ── Direct Messages ───────────────────────────────────────────────────────────

/** Daftar thread DM (inbox). */
export async function igPrivateDirectThreads(limit = 20) {
  const ig = await getClient();
  const inbox = ig.feed.directInbox();
  const threads = [];
  while (threads.length < limit) {
    const items = await inbox.items();
    threads.push(...items);
    if (!inbox.isMoreAvailable()) break;
  }
  return threads.slice(0, limit);
}

// ── Highlights ────────────────────────────────────────────────────────────────

/** Daftar highlights user. */
export async function igPrivateUserHighlights(username: string) {
  const ig = await getClient();
  const userId = await ig.user.getIdByUsername(username);
  const highlights = await ig.highlights.highlightsTray(userId);
  return highlights.tray ?? [];
}
