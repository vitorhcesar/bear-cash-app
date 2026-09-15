/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/presentation/constants/theme';
import { useBearCashTheme } from '@/presentation/theme/bear-cash-theme-context';

export function useTheme() {
  const { scheme } = useBearCashTheme();
  return Colors[scheme];
}
