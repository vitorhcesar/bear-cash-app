import { useSyncExternalStore } from "react";

import {
  getBearCashScheme,
  getBearCashThemeVersion,
  subscribeBearCashScheme,
  type BearCashScheme,
} from "@/presentation/constants/theme";

const cache = new WeakMap<
  Function,
  { scheme: BearCashScheme; styles: unknown }
>();

/**
 * Builds a StyleSheet that follows the BearCash palette.
 * Call the returned hook in every component that reads the styles so
 * native views re-render when light/dark mode toggles.
 */
export function createThemedStyles<T extends object>(factory: () => T) {
  return function useStyles(): T {
    useSyncExternalStore(
      subscribeBearCashScheme,
      getBearCashThemeVersion,
      getBearCashThemeVersion,
    );

    const scheme = getBearCashScheme();
    const cached = cache.get(factory);
    if (cached && cached.scheme === scheme) {
      return cached.styles as T;
    }

    const styles = factory();
    cache.set(factory, { scheme, styles });
    return styles;
  };
}
