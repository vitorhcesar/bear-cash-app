import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TransactionItem } from '@/infra/http/services/api/modules/transactions.module';
import {
  getCategoryDisplay,
  getCategoryGroupLabel,
} from '@/presentation/components/ui/activities-category-catalog';
import { CategoryChipIcon } from '@/presentation/components/ui/activities-category-icons';
import { formatActivityDay } from '@/presentation/components/ui/calendar';
import { getCurrencySymbol } from '@/presentation/components/ui/currencies';
import { TransactionPencilIcon } from '@/presentation/components/ui/new-transaction-icons';
import {
  BearCashColors,
  BearCashFonts,
  BearCashTypography,
} from '@/presentation/constants/theme';

function formatAbsoluteAmount(amount: number) {
  return Math.abs(amount).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function TransactionListItem({
  item,
  onPress,
}: {
  item: TransactionItem;
  onPress?: () => void;
}) {
  const category = item.categoryId
    ? getCategoryDisplay(item.categoryId)
    : undefined;
  const groupLabel =
    (item.categoryId ? getCategoryGroupLabel(item.categoryId) : undefined) ??
    item.category ??
    'Sem categoria';
  const isCredit = item.type === 'CREDIT';
  const symbol = getCurrencySymbol(item.currencyCode);
  const accountLabel = item.bankName?.trim() || 'BearCash';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.description}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, pressed && onPress ? styles.pressed : null]}
    >
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          {category ? (
            <CategoryChipIcon
              iconKey={category.iconKey}
              color={category.color}
              size={12}
            />
          ) : (
            <TransactionPencilIcon size={12} />
          )}
          <Text style={styles.title} numberOfLines={1}>
            {item.description}
          </Text>
        </View>
        <View>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>
              {formatActivityDay(new Date(item.date))}
            </Text>
            <View style={styles.dot} />
            <Text style={styles.meta} numberOfLines={1}>
              {groupLabel}
            </Text>
          </View>
          <Text style={styles.meta} numberOfLines={1}>
            {accountLabel}
          </Text>
        </View>
      </View>

      <View style={styles.amount}>
        <Text
          style={[
            styles.amountSymbol,
            isCredit ? styles.income : styles.expense,
          ]}
        >
          {isCredit ? '+' : '-'}
          {symbol}
        </Text>
        <Text
          style={[
            styles.amountValue,
            isCredit ? styles.income : styles.expense,
          ]}
        >
          {formatAbsoluteAmount(item.amount)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  pressed: {
    opacity: 0.85,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  title: {
    flex: 1,
    fontFamily: BearCashFonts.semiBold,
    fontSize: 12,
    lineHeight: 19,
    color: BearCashColors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  meta: {
    ...BearCashTypography.captionSmall,
    color: BearCashColors.textSoft,
  },
  dot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: BearCashColors.textSoft,
  },
  amount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  amountSymbol: {
    ...BearCashTypography.captionSmall,
  },
  amountValue: {
    ...BearCashTypography.caption,
  },
  income: {
    color: BearCashColors.income,
  },
  expense: {
    color: BearCashColors.dangerVivid,
  },
});
