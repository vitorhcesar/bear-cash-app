import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { TransactionItem } from "@/infra/http/services/api/modules/transactions.module";
import { getCategoryGroup } from "@/presentation/components/ui/activities-category-catalog";
import { CategoryChipIcon } from "@/presentation/components/ui/activities-category-icons";
import { BackButton } from "@/presentation/components/ui/back-button";
import { Button } from "@/presentation/components/ui/button";
import { CategoriesCalendarIcon } from "@/presentation/components/ui/categories-icons";
import { CategoryMonthChart } from "@/presentation/components/ui/category-month-chart";
import {
  categoryAccentColor,
  categoryDebitTotal,
  categoryListLabel,
  inCalendarMonth,
  summarizeSubcategorySpend,
  transactionMatchesCategoryGroup,
} from "@/presentation/components/ui/category-spend";
import { CategorySubcategories } from "@/presentation/components/ui/category-subcategories";
import { getCurrencySymbol } from "@/presentation/components/ui/currencies";
import {
  dateFromMonthValue,
  monthValueFromDate,
} from "@/presentation/components/ui/month-picker";
import { MonthPickerSheet } from "@/presentation/components/ui/month-picker-sheet";
import { TransactionListItem } from "@/presentation/components/ui/transaction-list-item";
import {
  BearCashColors,
  BearCashFonts,
  BearCashTypography,
} from "@/presentation/constants/theme";
import { createThemedStyles } from "@/presentation/constants/themed-styles";
import { useApiService } from "@/presentation/hooks/use-api-service";

const LATEST_LIMIT = 8;
const TAB_LAUNCHES = "launches";
const TAB_SUBS = "subs";

function monthLabel(date: Date) {
  return date.toLocaleDateString("pt-BR", { month: "long" }).toLowerCase();
}

function formatAmount(amount: number) {
  return Math.abs(amount).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function paramValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export function CategoryDetailPage() {
  const styles = useStyles();
  const router = useRouter();
  const api = useApiService();
  const params = useLocalSearchParams<{
    id?: string | string[];
    year?: string | string[];
    month?: string | string[];
  }>();

  const groupId = paramValue(params.id) ?? "";
  const group = getCategoryGroup(groupId);
  const title = group
    ? categoryListLabel({ id: group.id, chipLabel: group.chipLabel })
    : groupId || "Categoria";
  const accent = categoryAccentColor(groupId, group?.color ?? BearCashColors.textMid);

  const [monthDate, setMonthDate] = useState(() => {
    const year = Number(paramValue(params.year));
    const month = Number(paramValue(params.month));
    if (Number.isInteger(year) && Number.isInteger(month) && month >= 0 && month <= 11) {
      return new Date(year, month, 1);
    }
    return new Date();
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [tab, setTab] = useState<typeof TAB_LAUNCHES | typeof TAB_SUBS>(TAB_LAUNCHES);
  const [transactions, setTransactions] = useState<TransactionItem[] | null>(
    null,
  );

  useFocusEffect(
    useCallback(() => {
      void api.modules.transactions
        .list()
        .then((response) => setTransactions(response.items))
        .catch(() => setTransactions([]));
    }, [api.modules.transactions]),
  );

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  const monthValues = useMemo(() => {
    const items = transactions ?? [];
    return Array.from({ length: 12 }, (_, index) =>
      categoryDebitTotal(items, groupId, year, index),
    );
  }, [groupId, transactions, year]);

  const total = monthValues[month] ?? 0;
  const previousTotal =
    month === 0
      ? categoryDebitTotal(transactions ?? [], groupId, year - 1, 11)
      : (monthValues[month - 1] ?? 0);
  const delta =
    previousTotal > 0
      ? Math.round(((total - previousTotal) / previousTotal) * 100)
      : null;

  const latest = useMemo(() => {
    if (!transactions) {
      return [];
    }
    return transactions
      .filter((item) => {
        if (item.hiddenFromTotals || item.type !== "DEBIT") {
          return false;
        }
        if (!inCalendarMonth(new Date(item.date), year, month)) {
          return false;
        }
        return transactionMatchesCategoryGroup(item, groupId);
      })
      .sort(
        (left, right) =>
          new Date(right.date).getTime() - new Date(left.date).getTime(),
      )
      .slice(0, LATEST_LIMIT);
  }, [groupId, month, transactions, year]);

  const subcategories = useMemo(
    () =>
      summarizeSubcategorySpend(transactions ?? [], groupId, year, month),
    [groupId, month, transactions, year],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBlock}>
          <View style={styles.header}>
            <View style={styles.headerNav}>
              <BackButton fallbackHref={"/(tabs)" as const} />
            </View>
            <View style={styles.headerTitleRow}>
              <Text style={styles.title}>{title}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Selecionar mês"
                onPress={() => setPickerOpen(true)}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <CategoriesCalendarIcon size={28} />
              </Pressable>
            </View>
          </View>

          <View style={styles.summary}>
            <Text style={styles.caption}>
              Gastos de {monthLabel(monthDate)} em {title}
            </Text>
            <View style={styles.totalRow}>
              <View style={[styles.iconHold, { backgroundColor: accent }]}>
                <CategoryChipIcon
                  iconKey={group?.parentIconKey ?? "parent-food"}
                  color={BearCashColors.buttonFilledText}
                  size={16}
                />
              </View>
              <View style={styles.totalAmount}>
                <Text style={styles.totalCoin}>{getCurrencySymbol("BRL")}</Text>
                <Text style={styles.totalValue} numberOfLines={1}>
                  {formatAmount(total)}
                </Text>
              </View>
              {delta != null && delta !== 0 ? (
                <Text
                  style={[
                    styles.delta,
                    delta > 0 ? styles.deltaUp : styles.deltaDown,
                  ]}
                >
                  {delta > 0 ? "+" : ""}
                  {delta}%
                </Text>
              ) : null}
            </View>
          </View>

          <CategoryMonthChart
            values={monthValues}
            selectedMonth={month}
            accentColor={accent}
            onSelectMonth={(next) => setMonthDate(new Date(year, next, 1))}
          />
        </View>

        <View style={styles.listBlock}>
          <View style={styles.tabs}>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === TAB_LAUNCHES }}
              onPress={() => setTab(TAB_LAUNCHES)}
              style={[styles.tab, tab === TAB_LAUNCHES && styles.tabActive]}
            >
              <Text
                style={[
                  styles.tabLabel,
                  tab === TAB_LAUNCHES && styles.tabLabelActive,
                ]}
              >
                Últimos lançamentos
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === TAB_SUBS }}
              onPress={() => setTab(TAB_SUBS)}
              style={[styles.tab, tab === TAB_SUBS && styles.tabActive]}
            >
              <Text
                style={[
                  styles.tabLabel,
                  tab === TAB_SUBS && styles.tabLabelActive,
                ]}
              >
                Subcategorias
              </Text>
            </Pressable>
          </View>

          {tab === TAB_SUBS ? (
            transactions === null ? (
              <ActivityIndicator color={BearCashColors.primary} />
            ) : (
              <CategorySubcategories
                items={subcategories}
                accent={accent}
                groupLabel={title}
                onOpenTransaction={(item) =>
                  router.push({
                    pathname: "/transaction/[id]",
                    params: { id: item.id },
                  })
                }
                onSeeAll={(categoryId) =>
                  router.push({
                    pathname: "/(tabs)/activities",
                    params: { category: categoryId },
                  })
                }
              />
            )
          ) : transactions === null ? (
            <ActivityIndicator color={BearCashColors.primary} />
          ) : latest.length === 0 ? (
            <Text style={styles.empty}>
              Nenhum lançamento nesta categoria neste mês
            </Text>
          ) : (
            <View style={styles.list}>
              {latest.map((item) => (
                <TransactionListItem
                  key={item.id}
                  item={item}
                  leading="mark"
                  iconKey={group?.parentIconKey}
                  iconColor={accent}
                  categoryLabel={title}
                  onPress={() =>
                    router.push({
                      pathname: "/transaction/[id]",
                      params: { id: item.id },
                    })
                  }
                />
              ))}
              <Button
                label="Ver todos lançamentos"
                variant="stroke"
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/activities",
                    params: { category: groupId },
                  })
                }
              />
            </View>
          )}
        </View>
      </ScrollView>

      <MonthPickerSheet
        visible={pickerOpen}
        value={monthValueFromDate(monthDate)}
        onClose={() => setPickerOpen(false)}
        onSelect={(value) => setMonthDate(dateFromMonthValue(value))}
        onClear={() => setMonthDate(new Date())}
      />
    </SafeAreaView>
  );
}

const useStyles = createThemedStyles(() => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BearCashColors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 24,
  },
  topBlock: {
    gap: 16,
  },
  header: {
    gap: 8,
  },
  headerNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    flex: 1,
    ...BearCashTypography.h1,
    color: BearCashColors.text,
  },
  pressed: {
    opacity: 0.85,
  },
  summary: {
    gap: 8,
  },
  caption: {
    ...BearCashTypography.captionSmall,
    color: BearCashColors.textMid,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconHold: {
    borderRadius: 4,
    padding: 4,
  },
  totalAmount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    minWidth: 0,
    flexShrink: 1,
  },
  totalCoin: {
    fontFamily: BearCashFonts.semiBold,
    fontSize: 12,
    lineHeight: 19,
    color: BearCashColors.text,
  },
  totalValue: {
    fontFamily: BearCashFonts.semiBold,
    fontSize: 20,
    lineHeight: 24,
    color: BearCashColors.text,
  },
  delta: {
    ...BearCashTypography.captionSmall,
  },
  deltaUp: {
    color: BearCashColors.dangerVivid,
  },
  deltaDown: {
    color: BearCashColors.income,
  },
  listBlock: {
    gap: 16,
  },
  tabs: {
    flexDirection: "row",
    alignSelf: "stretch",
    backgroundColor: BearCashColors.surface,
    borderRadius: 40,
    padding: 4,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 24,
  },
  tabActive: {
    backgroundColor: BearCashColors.surface,
  },
  tabLabel: {
    ...BearCashTypography.caption,
    color: BearCashColors.textMid,
    textAlign: "center",
  },
  tabLabelActive: {
    color: BearCashColors.text,
  },
  list: {
    gap: 16,
  },
  empty: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
  },
}));
