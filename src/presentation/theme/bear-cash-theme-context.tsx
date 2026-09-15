import { DarkTheme, DefaultTheme, type Theme } from "expo-router";
import * as SystemUI from "expo-system-ui";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Appearance } from "react-native";

import {
  getPreferences,
  updatePreferences,
} from "@/infra/preferences/preferences-store";
import {
  applyBearCashColorScheme,
  BearCashColors,
  getBearCashScheme,
  getBearCashThemeVersion,
  subscribeBearCashScheme,
  type BearCashColorTokens,
  type BearCashScheme,
} from "@/presentation/constants/theme";

type BearCashThemeContextValue = {
  ready: boolean;
  scheme: BearCashScheme;
  lightModeEnabled: boolean;
  colors: BearCashColorTokens;
  navigationTheme: Theme;
  setLightModeEnabled: (enabled: boolean) => Promise<void>;
};

const BearCashThemeContext = createContext<BearCashThemeContextValue | null>(
  null,
);

function navigationThemeFor(scheme: BearCashScheme): Theme {
  const base = scheme === "light" ? DefaultTheme : DarkTheme;
  return {
    ...base,
    dark: scheme === "dark",
    colors: {
      ...base.colors,
      background: BearCashColors.background,
      card: BearCashColors.background,
      border: BearCashColors.borderSoft,
      primary: BearCashColors.primary,
      text: BearCashColors.text,
    },
  };
}

function applyNativeAppearance(scheme: BearCashScheme) {
  applyBearCashColorScheme(scheme);
  Appearance.setColorScheme(scheme);
  void SystemUI.setBackgroundColorAsync(BearCashColors.background);
}

export function BearCashThemeProvider({ children }: { children: ReactNode }) {
  const [scheme, setScheme] = useState<BearCashScheme>(getBearCashScheme);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const preferences = await getPreferences();
      if (cancelled) {
        return;
      }
      const next = preferences.lightModeEnabled ? "light" : "dark";
      applyNativeAppearance(next);
      setScheme(next);
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const setLightModeEnabled = useCallback(async (enabled: boolean) => {
    const next: BearCashScheme = enabled ? "light" : "dark";
    applyNativeAppearance(next);
    setScheme(next);
    await updatePreferences({ lightModeEnabled: enabled });
  }, []);

  const value = useMemo<BearCashThemeContextValue>(
    () => ({
      ready,
      scheme,
      lightModeEnabled: scheme === "light",
      colors: { ...BearCashColors },
      navigationTheme: navigationThemeFor(scheme),
      setLightModeEnabled,
    }),
    [ready, scheme, setLightModeEnabled],
  );

  return (
    <BearCashThemeContext.Provider value={value}>
      {children}
    </BearCashThemeContext.Provider>
  );
}

export function useBearCashTheme() {
  useSyncExternalStore(
    subscribeBearCashScheme,
    getBearCashThemeVersion,
    getBearCashThemeVersion,
  );
  const value = useContext(BearCashThemeContext);
  if (!value) {
    throw new Error(
      "useBearCashTheme must be used within BearCashThemeProvider",
    );
  }
  return value;
}
