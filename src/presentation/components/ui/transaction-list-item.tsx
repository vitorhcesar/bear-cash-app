import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TransactionItem } from '@/infra/http/services/api/modules/transactions.module';
import {
  getCategoryDisplay,
  getTransactionCategoryLabel,
} from '@/presentation/components/ui/activities-category-catalog';
import { CategoryChipIcon } from '@/presentation/components/ui/activities-category-icons';
import { formatActivityDay } from '@/presentation/components/ui/calendar';
import { getCurrencySymbol } from '@/presentation/components/ui/currencies';
import { TransactionPencilIcon } from '@/presentation/components/ui/new-transaction-icons';
import { TransactionBankBadge } from '@/presentation/components/ui/transaction-bank-badge';
import {
  BearCashColors,
  BearCashFonts,
  BearCashTypography,
} from '@/presentation/constants/theme';
import { createThemedStyles } from '@/presentation/constants/themed-styles';

function formatAbsoluteAmount(amount: number) {
  return Math.abs(amount).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export const TransactionListItem = memo(function TransactionListItem({
  item,
  onPress,
  leading = 'inline',
  iconKey,
  iconColor,
  categoryLabel,
}: {
  item: TransactionItem;
  onPress?: () => void;
  leading?: 'inline' | 'mark';
  iconKey?: string;
  iconColor?: string;
  categoryLabel?: string;
}) {
  const styles = useStyles();
  const category = item.categoryId
    ? getCategoryDisplay(item.categoryId)
    : undefined;
  const groupLabel =
    categoryLabel ??
    (item.categoryId
      ? getTransactionCategoryLabel(item.categoryId)
      : undefined) ??
    item.category ??
    'Sem categoria';
  const isCredit = item.type === 'CREDIT';
  const symbol = getCurrencySymbol(item.currencyCode);
  const mark = leading === 'mark';
  const resolvedIconKey = iconKey ?? category?.iconKey;
  const resolvedIconColor = iconColor ?? category?.color ?? BearCashColors.textMid;

  const amount = (
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
        numberOfLines={1}
        style={[
          styles.amountValue,
          isCredit ? styles.income : styles.expense,
        ]}
      >
        {formatAbsoluteAmount(item.amount)}
      </Text>
    </View>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.description}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        mark && styles.rowMark,
        pressed && onPress ? styles.pressed : null,
      ]}
    >
      {mark ? (
        <View style={styles.mark}>
          <View style={styles.markIcon}>
            {resolvedIconKey ? (
              <CategoryChipIcon
                iconKey={resolvedIconKey}
                color={resolvedIconColor}
                size={18}
              />
            ) : (
              <TransactionPencilIcon size={18} />
            )}
          </View>
          <View style={styles.markBadge}>
            <TransactionBankBadge
              bankName={item.bankName}
              bankCode={item.bankCode}
              bankLogoUrl={item.bankLogoUrl}
              source={item.source}
              size={20}
            />
          </View>
        </View>
      ) : null}
      <View style={[styles.copy, mark && styles.copyMark]}>
        <View style={styles.titleRow}>
          <View style={styles.titleMain}>
            {mark ? null : category ? (
              <CategoryChipIcon
                iconKey={category.iconKey}
                color={category.color}
                size={14}
              />
            ) : (
              <TransactionPencilIcon size={14} />
            )}
            <Text
              style={styles.title}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.description}
            </Text>
          </View>
          {mark ? null : amount}
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>
            {formatActivityDay(new Date(item.date))}
          </Text>
          <View style={styles.dot} />
          <Text
            style={styles.metaFlexible}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {groupLabel}
          </Text>
        </View>
      </View>
      {mark ? amount : null}
    </Pressable>
  );
});

const useStyles = createThemedStyles(() => StyleSheet.create({
  row: {
    alignSelf: 'stretch',
    width: '100%',
    minWidth: 0,
  },
  rowMark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mark: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  markIcon: {
    backgroundColor: BearCashColors.surface,
    borderRadius: 8,
    padding: 8,
    marginRight: -8,
    zIndex: 0,
  },
  markBadge: {
    zIndex: 1,
  },
  pressed: {
    opacity: 0.85,
  },
  copy: {
    minWidth: 0,
    gap: 6,
    overflow: 'hidden',
  },
  copyMark: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  titleMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  title: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    fontFamily: BearCashFonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: BearCashColors.text,
    includeFontPadding: false,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  meta: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
    flexShrink: 0,
    includeFontPadding: false,
  },
  metaFlexible: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    includeFontPadding: false,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: BearCashColors.textSoft,
  },
  amount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  amountSymbol: {
    ...BearCashTypography.caption,
  },
  amountValue: {
    fontFamily: BearCashFonts.regular,
    fontSize: 14,
    lineHeight: 20,
    includeFontPadding: false,
  },
  income: {
    color: BearCashColors.income,
  },
  expense: {
    color: BearCashColors.dangerVivid,
  },
}));
