// ============================================================
// Shared types untuk EnsembleData scraping
// ============================================================

// ---------- TikTok ----------

export interface TikTokProfile {
  uniqueId: string;
  nickname: string;
  avatarUrl: string;
  bio: string;
  verified: boolean;
  followerCount: number;
  followingCount: number;
  heartCount: number;
  videoCount: number;
  friendCount: number;
}

export interface TikTokVideo {
  id: string;
  description: string;
  createTime: number;   // unix timestamp
  coverUrl: string;
  videoUrl: string;
  playCount: number;
  diggCount: number;    // likes
  commentCount: number;
  shareCount: number;
  collectCount: number; // saves/bookmarks
  durationSeconds: number;
}

export interface TikTokFetchResult {
  profile: TikTokProfile;
  videos: TikTokVideo[];
}

// ---------- Instagram ----------

export interface InstagramProfile {
  userId: string;       // numerik, dibutuhkan untuk fetch posts
  username: string;
  fullName: string;
  profilePicUrl: string;
  biography: string;
  verified: boolean;
  followerCount: number;
  followingCount: number;
  postCount: number;
  externalUrl: string;
}

export interface InstagramPost {
  id: string;
  caption: string;
  createTime: number;   // unix timestamp
  thumbnailUrl: string;
  postUrl: string;
  mediaType: string;    // "image" | "video" | "carousel"
  likeCount: number;
  commentCount: number;
  viewCount: number;    // video/reel saja
  saveCount: number;
  durationSeconds: number;
}

export interface InstagramFetchResult {
  profile: InstagramProfile;
  posts: InstagramPost[];
}

// ---------- Error classes ----------

export class ProviderNotFoundError extends Error {
  constructor(platform: string, username: string) {
    super(`${platform} account "${username}" not found (mungkin privat atau tidak ada)`);
    this.name = "ProviderNotFoundError";
  }
}

export class ProviderUpstreamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderUpstreamError";
  }
}
