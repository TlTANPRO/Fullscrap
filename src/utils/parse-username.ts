/**
 * Utility: Parse username dari berbagai format input.
 *
 * Mendukung input:
 * - Username biasa: "charlidamelio"
 * - Dengan @: "@charlidamelio"
 * - URL TikTok: "https://www.tiktok.com/@charlidamelio"
 * - URL Instagram: "https://www.instagram.com/nike/?hl=id"
 * - URL pendek Instagram: "https://instagram.com/nike"
 */

/**
 * Parse TikTok username dari string apapun.
 *
 * @example
 * parseTikTokUsername("@charlidamelio")            // "charlidamelio"
 * parseTikTokUsername("https://tiktok.com/@user")  // "user"
 * parseTikTokUsername("charlidamelio")             // "charlidamelio"
 */
export function parseTikTokUsername(rawInput: string): string {
  const trimmed = rawInput.trim();

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const match = url.pathname.match(/@([^/]+)/);
      if (match?.[1]) return match[1];
    } catch {
      // fall through
    }
  }

  return trimmed.replace(/^@/, "").trim();
}

/**
 * Parse Instagram username dari string apapun.
 *
 * @example
 * parseInstagramUsername("@nike")                              // "nike"
 * parseInstagramUsername("https://www.instagram.com/nike/")   // "nike"
 * parseInstagramUsername("nike")                              // "nike"
 */
export function parseInstagramUsername(rawInput: string): string {
  const trimmed = rawInput.trim();

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const match = url.pathname.match(/\/([^/?#]+)/);
      if (match?.[1] && match[1] !== "p" && match[1] !== "reel") {
        return match[1];
      }
    } catch {
      // fall through
    }
  }

  return trimmed.replace(/^@/, "").trim();
}

/**
 * Validasi apakah string adalah username yang valid (tidak kosong, tidak ada spasi).
 */
export function isValidUsername(username: string): boolean {
  return username.length > 0 && !/\s/.test(username);
}
