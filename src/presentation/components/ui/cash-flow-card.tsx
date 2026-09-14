import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  ActivityEyeClosedIcon,
  ActivityEyeOpenIcon,
  ExpenseArrowIcon,
  IncomeArrowIcon,
} from '@/presentation/components/ui/activities-icons';
import {
  BearCashColors,
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
  return (
    <View style={styles.card}>
      <View style={styles.iconHold}>
        {tone === 'income' ? (
          <IncomeArrowIcon size={12} />
        ) : (
          <ExpenseArrowIcon size={12} />
        )}
      </View>
      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.amountRow}>
          <Text style={styles.amount} numberOfLines={1}>
            {hidden ? `${symbol}*,**` : `${symbol}${amount}`}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Mostrar valor' : 'Ocultar valor'}
            onPress={onToggleVisibility}
            hitSlop={8}
          >
            {hidden ? (
              <ActivityEyeClosedIcon size={16} />
            ) : (
              <ActivityEyeOpenIcon size={16} />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: BearCashColors.borderSoft,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  iconHold: {
    backgroundColor: BearCashColors.borderSoft,
    borderRadius: 8,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  label: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  amount: {
    ...BearCashTypography.subheading,
    color: BearCashColors.textMid,
    flexShrink: 1,
  },
});
