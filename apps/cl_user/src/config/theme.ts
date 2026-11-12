/**
 * TrustPassz Design Tokens Configuration
 * Centralized theme tokens matching src/styles/theme-tokens.css
 */

export const THEME_TOKENS = {
  light: {
    bgCanvas: "#FFFFFF",
    bgSurface: "#F8FAFC",
    bgInput: "#F1F5F9",
    borderSubtle: "#E2E8F0",
    borderStrong: "#CBD5E1",
    textPrimary: "#0F172A",
    textSecondary: "#475569",
    textMuted: "#94A3B8",
    accentPink: "#FF1866",
    accentPinkHover: "#E11D48",
    accentPinkTint: "#FFF1F2",
  },
  dark: {
    bgCanvas: "#0B0F17",
    bgSurface: "#0F172A",
    bgInput: "#070A10",
    borderSubtle: "#1E293B",
    borderStrong: "#334155",
    textPrimary: "#F8FAFC",
    textSecondary: "#94A3B8",
    textMuted: "#64748B",
    accentPink: "#FF2D78",
    accentPinkHover: "#FF1866",
    accentPinkTint: "#3F0D1C",
  },
} as const;

export type ThemeTokens = typeof THEME_TOKENS;
export type ThemeMode = keyof ThemeTokens;
