/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import "@/global.css";

import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#0a0a0b",
    background: "#f5f4f5",
    backgroundElement: "#ffffff",
    backgroundSelected: "#e6e4e8",
    textSecondary: "#78737d",
  },
  dark: {
    text: "#f5f4f5",
    background: "#0a0a0b",
    backgroundElement: "#121113",
    backgroundSelected: "#2e2c30",
    textSecondary: "#78737d",
  },
} as const;

export type BearCashScheme = "light" | "dark";

const darkBearCashColors = {
  background: "#0a0a0b",
  surface: "#121113",
  text: "#f5f4f5",
  textMid: "#cccace",
  textSoft: "#78737d",
  textAccent: "#bf99e5",
  textDisabled: "#a5a2a9",
  borderSoft: "#1c1b1d",
  borderStrong: "#2e2c30",
  buttonFilled: "#cc9afe",
  buttonFilledDisabled: "#cc9afe",
  buttonFilledText: "#0a0a0b",
  iconAccent: "#b366ff",
  iconMuted: "#e0dfe2",
  bannerMuted: "#38363a",
  primary: "#49dc14",
  primarySoft: "#95ff52",
  stepInactive: "#1c1d1b",
  neutralBase: "#171618",
  neutralLight: "#d6d5d8",
  error: "#f04438",
  errorSoft: "#f97066",
  danger: "#c33a22",
  dangerBase: "#ff8f61",
  dangerVivid: "#ff2e31",
  dangerStrongest: "#ffa9aa",
  warning: "#E8C547",
  warningText: "#0a0b0a",
  premiumGold: "#FFD700",
  premiumGoldMuted: "#F5A623",
  income: "#63e29f",
  expense: "#ff6b6b",
  neutralBlackSoft: "#1C1D1B",
  greenUseHighlight: "#95FF52",
  onText: "#0a0a0b",
  highlightStroke: "rgba(255,255,255,0.1)",
  headerScrim: "rgba(10, 10, 11, 0.72)",
  glassFallback: "rgba(18,17,19,0.28)",
  glassFill: "rgb(18,17,19)",
  glassTint: "rgba(18, 17, 19, 0.35)",
} as const;

/** Light tokens invert the dark neutrals and keep brand/status hues. */
const lightBearCashColors = {
  background: "#f5f4f5",
  surface: "#ffffff",
  text: "#0a0a0b",
  textMid: "#4a464e",
  textSoft: "#78737d",
  textAccent: "#8d5bc4",
  textDisabled: "#8a8790",
  borderSoft: "#e6e4e8",
  borderStrong: "#d0ced3",
  buttonFilled: "#cc9afe",
  buttonFilledDisabled: "#cc9afe",
  buttonFilledText: "#0a0a0b",
  iconAccent: "#9b4de8",
  iconMuted: "#59565d",
  bannerMuted: "#6f6b74",
  primary: "#3bb80f",
  primarySoft: "#6fd62a",
  stepInactive: "#e4e4e2",
  neutralBase: "#ecebed",
  neutralLight: "#d6d5d8",
  error: "#f04438",
  errorSoft: "#d92d20",
  danger: "#c33a22",
  dangerBase: "#e36a3d",
  dangerVivid: "#e11d20",
  dangerStrongest: "#c33a22",
  warning: "#E8C547",
  warningText: "#0a0b0a",
  premiumGold: "#C9A400",
  premiumGoldMuted: "#C47A10",
  income: "#1a9a5c",
  expense: "#d64545",
  neutralBlackSoft: "#e6e7e4",
  greenUseHighlight: "#3bb80f",
  onText: "#f5f4f5",
  highlightStroke: "rgba(10,10,11,0.12)",
  headerScrim: "rgba(245, 244, 245, 0.78)",
  glassFallback: "rgba(255,255,255,0.55)",
  glassFill: "rgb(255,255,255)",
  glassTint: "rgba(245, 244, 245, 0.45)",
} as const;

export type BearCashColorTokens = {
  [K in keyof typeof darkBearCashColors]: string;
};

export const BearCashColorSchemes: Record<BearCashScheme, BearCashColorTokens> =
  {
    dark: { ...darkBearCashColors },
    light: { ...lightBearCashColors },
  };

/** Live palette. Mutated by `applyBearCashColorScheme` when the user toggles theme. */
export const BearCashColors: BearCashColorTokens = {
  ...darkBearCashColors,
};

let currentScheme: BearCashScheme = "dark";

export function getBearCashScheme(): BearCashScheme {
  return currentScheme;
}

let themeVersion = 0;
const themeListeners = new Set<() => void>();

export function subscribeBearCashScheme(onStoreChange: () => void) {
  themeListeners.add(onStoreChange);
  return () => {
    themeListeners.delete(onStoreChange);
  };
}

export function getBearCashThemeVersion() {
  return themeVersion;
}

export function applyBearCashColorScheme(scheme: BearCashScheme) {
  currentScheme = scheme;
  Object.assign(BearCashColors, BearCashColorSchemes[scheme]);
  themeVersion += 1;
  themeListeners.forEach((listener) => listener());
}

export const BearCashFonts = {
  regular: "Poppins_400Regular",
  semiBold: "Poppins_600SemiBold",
  script: "LumenScript-Heavy",
} as const;

export const BearCashTypography = {
  h1: {
    fontSize: 24,
    lineHeight: 29,
    fontFamily: BearCashFonts.semiBold,
  },
  h3: {
    fontSize: 18,
    lineHeight: 22,
    fontFamily: BearCashFonts.semiBold,
  },
  body: {
    fontSize: 16,
    lineHeight: 26,
    fontFamily: BearCashFonts.regular,
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: BearCashFonts.regular,
  },
  subheading: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: BearCashFonts.semiBold,
  },
  caption: {
    fontSize: 12,
    lineHeight: 19,
    fontFamily: BearCashFonts.regular,
  },
  captionSmall: {
    fontSize: 10,
    lineHeight: 16,
    fontFamily: BearCashFonts.regular,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
/** Espaço reservado para AI bar + nav + safe area */
export const APP_BOTTOM_CHROME_HEIGHT = 148;
export const MaxContentWidth = 800;
