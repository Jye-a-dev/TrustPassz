/**
 * Smart Avatar resolver for TrustPassz User accounts.
 * - Google OAuth logins automatically preserve and display the native Google avatarUrl.
 * - Non-Google logins (Email, Passkey, Web3) or profiles without custom photo
 *   automatically generate a fun, vibrant avatar via DiceBear Bottts / Fun-Emoji API.
 */

export interface AvatarSourceUser {
  id?: string;
  email?: string | null;
  avatarUrl?: string | null;
}

export function generateRandomSeed(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function getSmartAvatarUrl(
  user?: AvatarSourceUser | null,
  customSeed?: string
): string {
  if (customSeed && customSeed.trim().length > 0) {
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(customSeed.trim())}`;
  }

  if (user?.avatarUrl && user.avatarUrl.trim().length > 0) {
    return user.avatarUrl.trim();
  }

  const seed = user?.id || user?.email || "trustpassz-bot";
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed)}`;
}
