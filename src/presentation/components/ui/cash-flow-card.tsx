import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  ActivityEyeClosedIcon,
  ActivityEyeOpenIcon,
  ExpenseArrowIcon,
  IncomeArrowIcon,
} from '@/presentation/components/ui/activities-icons';
import { HighlightCardBorder } from '@/presentation/components/ui/highlight-card-border';
import {
  BearCashColors,
  BearCashFonts,
  BearCashTypography,
} from '@/presentation/constants/theme';

export function CashFlowCard({
  label,
  symbol,
  amount,
  hidden,
  onToggleVisibility,
  tone,
}: {
  label: string;
  symbol: string;
  amount: string;
  hidden: boolean;
  onToggleVisibility: () => void;
  tone: 'income' | 'expense';
}) {
  const expense = tone === 'expense';

  return (
    <View style={styles.outer}>
      <HighlightCardBorder />
      <View style={styles.inner}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Mostrar valor' : 'Ocultar valor'}
            onPress={onToggleVisibility}
            hitSlop={8}
          >
            {hidden ? (
              <ActivityEyeClosedIcon size={12} />
            ) : (
              <ActivityEyeOpenIcon size={12} />
            )}
          </Pressable>
        </View>
        <View style={styles.amountRow}>
          <View style={styles.iconWrap}>
            {tone === 'income' ? (
              <IncomeArrowIcon size={12} />
            ) : (
              <ExpenseArrowIcon size={12} />
            )}
          </View>
          <View style={styles.amount}>
            <Text style={[styles.symbol, expense && styles.expense]}>
              {symbol}
            </Text>
            <Text
              style={[styles.value, expense && styles.expense]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {hidden ? '*,**' : amount}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    minWidth: 0,
    borderRadius: 12,
    padding: 1,
    overflow: 'hidden',
  },
  inner: {
    backgroundColor: BearCashColors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    ...BearCashTypography.captionSmall,
    color: BearCashColors.textMid,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconWrap: {
    backgroundColor: BearCashColors.neutralBase,
    borderRadius: 4,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minWidth: 0,
  },
  symbol: {
    fontFamily: BearCashFonts.semiBold,
    fontSize: 12,
    lineHeight: 19,
    color: BearCashColors.text,
  },
  value: {
    ...BearCashTypography.h3,
    lineHeight: 22,
    color: BearCashColors.text,
  },
  expense: {
    color: BearCashColors.dangerStrongest,
  },
});
