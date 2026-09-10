/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import "@/global.css";

import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#000000",
    background: "#ffffff",
    backgroundElement: "#F0F0F3",
    backgroundSelected: "#E0E1E6",
    textSecondary: "#60646C",
  },
  dark: {
    text: "#ffffff",
    background: "#000000",
    backgroundElement: "#212225",
    backgroundSelected: "#2E3135",
    textSecondary: "#B0B4BA",
  },
} as const;

/** Design tokens from Otto Figma (Autenticação) */
export const BearCashColors = {
  background: "#0a0a0b",
  surface: "#121113",
  text: "#f5f4f5",
  textMid: "#cccace",
  textSoft: "#78737d",
  textDisabled: "#a5a2a9",
  borderSoft: "#1c1b1d",
  borderStrong: "#2e2c30",
  buttonFilled: "#cc9afe",
  buttonFilledDisabled: "#cc9afe",
  buttonFilledText: "#0a0a0b",
  iconAccent: "#b366ff",
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
  warning: "#E8C547",
  warningText: "#0a0b0a",
  premiumGold: "#FFD700",
  premiumGoldMuted: "#F5A623",
  income: "#63e29f",
  expense: "#ff6b6b",
  neutralBlackSoft: "#1C1D1B",
  greenUseHighlight: "#95FF52",
} as const;

export const BearCashFonts = {
  regular: "Poppins_400Regular",
  semiBold: "Poppins_600SemiBold",
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
export const MaxContentWidth = 800;
