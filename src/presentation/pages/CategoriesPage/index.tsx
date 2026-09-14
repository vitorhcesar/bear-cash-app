import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { TransactionItem } from "@/infra/http/services/api/modules/transactions.module";
import { CategoryChipIcon } from "@/presentation/components/ui/activities-category-icons";
import { BackButton } from "@/presentation/components/ui/back-button";
import { HighlightCardBorder } from "@/presentation/components/ui/highlight-card-border";
import {
  CategoriesCalendarIcon,
  CategoriesChevronIcon,
} from "@/presentation/components/ui/categories-icons";
import { CategoryBubbleField } from "@/presentation/components/ui/category-bubble-field";
import {
  categoryAccentColor,
  categoryListLabel,
  summarizeCategorySpend,
  type CategorySpend,
} from "@/presentation/components/ui/category-spend";
import { getCurrencySymbol } from "@/presentation/components/ui/currencies";
import { HomeDashWalletIcon } from "@/presentation/components/ui/home-icons";
import {
  dateFromMonthValue,
  monthValueFromDate,
} from "@/presentation/components/ui/month-picker";
import {
  MonthPickerSheet,
  PeriodFilterChip,
} from "@/presentation/components/ui/month-picker-sheet";
import {
  BearCashColors,
  BearCashFonts,
  BearCashTypography,
} from "@/presentation/constants/theme";
import { useApiService } from "@/presentation/hooks/use-api-service";

const CHART_HEIGHT = 168;
const LARGE_BUBBLE = 83;
const MEDIUM_BUBBLE = 46;
const SMALL_BUBBLE = 37;
const LARGE_ICON = 44;
const SMALL_ICON = 22;

function monthLabel(date: Date) {
  return date.toLocaleDateString("pt-BR", { month: "long" }).toLowerCase();
}

function formatAmount(amount: number) {
  return Math.abs(amount).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function bubbleMetrics(share: number) {
  if (share >= 0.35) {
    return { size: LARGE_BUBBLE, icon: LARGE_ICON };
  }
  if (share >= 0.15) {
    return { size: MEDIUM_BUBBLE, icon: SMALL_ICON };
  }
  return { size: SMALL_BUBBLE, icon: SMALL_ICON };
}

function CategoryRow({
  item,
  selected,
  onPress,
}: {
  item: CategorySpend;
  selected: boolean;
  onPress: () => void;
}) {
  const color = categoryAccentColor(item.id, item.color);

  return (
    <View style={[styles.rowShell, selected && styles.rowShellSelected]}>
      {selected ? <HighlightCardBorder /> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={categoryListLabel(item)}
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <View style={styles.rowMain}>
          <View style={styles.rowIcon}>
            <CategoryChipIcon iconKey={item.iconKey} color={color} size={16} />
          </View>
          <View style={styles.rowCopy}>
            <Text style={styles.rowName}>{categoryListLabel(item)}</Text>
            <View style={styles.rowAmount}>
              <Text style={styles.rowCoin}>{getCurrencySymbol("BRL")}</Text>
              <Text style={styles.rowValue}>{formatAmount(item.amount)}</Text>
            </View>
          </View>
        </View>
        <CategoriesChevronIcon size={28} color={BearCashColors.textMid} />
      </Pressable>
    </View>
  );
}

export function CategoriesPage() {
  const router = useRouter();
  const api = useApiService();
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [filterActive, setFilterActive] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [transactions, setTransactions] = useState<TransactionItem[] | null>(
    null,
  );
  const [chartWidth, setChartWidth] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bubbleDragging, setBubbleDragging] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void api.modules.transactions
        .list()
        .then((response) => setTransactions(response.items))
        .catch(() => setTransactions([]));
    }, [api.modules.transactions]),
  );

  const spend = useMemo(() => {
    if (!transactions) {
      return { total: 0, items: [] as CategorySpend[] };
    }
    return summarizeCategorySpend(
      transactions,
      monthDate.getFullYear(),
      monthDate.getMonth(),
    );
  }, [monthDate, transactions]);

  const bubbleSpecs = useMemo(
    () =>
      spend.items.slice(0, 8).map((item) => {
        const { size, icon } = bubbleMetrics(
          spend.total > 0 ? item.amount / spend.total : 0,
        );
        return {
          id: item.id,
          size,
          icon,
          color: categoryAccentColor(item.id, item.color),
          iconKey: item.iconKey,
          percent: spend.total > 0 ? (item.amount / spend.total) * 100 : 0,
        };
      }),
    [spend.items, spend.total],
  );

  const listedItems = useMemo(() => {
    if (!selectedId) {
      return spend.items;
    }
    const selected = spend.items.filter((item) => item.id === selectedId);
    const rest = spend.items.filter((item) => item.id !== selectedId);
    return [...selected, ...rest];
  }, [selectedId, spend.items]);

  useEffect(() => {
    if (selectedId && !spend.items.some((item) => item.id === selectedId)) {
      setSelectedId(null);
    }
  }, [selectedId, spend.items]);

  function onChartLayout(event: LayoutChangeEvent) {
    const width = event.nativeEvent.layout.width;
    if (width !== chartWidth) {
      setChartWidth(width);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!bubbleDragging}
      >
        <View style={styles.topBlock}>
          <View style={styles.header}>
            <View style={styles.headerNav}>
              <BackButton fallbackHref="/(tabs)" />
            </View>
            <View style={styles.headerTitleRow}>
              <Text style={styles.title}>Categorias</Text>
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

          {filterActive ? (
            <PeriodFilterChip
              value={monthValueFromDate(monthDate)}
              onClear={() => {
                setFilterActive(false);
                setMonthDate(new Date());
              }}
            />
          ) : null}

          <View style={styles.summary}>
            <Text style={styles.caption}>
              {filterActive
                ? "Gastos do período em categorias"
                : `Gastos de ${monthLabel(monthDate)} em categorias`}
            </Text>
            <View style={styles.totalRow}>
              <View style={styles.walletHold}>
                <HomeDashWalletIcon size={12} />
              </View>
              <View style={styles.totalAmount}>
                <Text style={styles.totalCoin}>
                  {getCurrencySymbol("BRL")}
                </Text>
                <Text style={styles.totalValue} numberOfLines={1}>
                  {formatAmount(spend.total)}
                </Text>
              </View>
            </View>
          </View>

          {bubbleSpecs.length > 0 ? (
            <View style={styles.chart} onLayout={onChartLayout}>
              {chartWidth > 0 ? (
                <CategoryBubbleField
                  specs={bubbleSpecs}
                  width={chartWidth}
                  height={CHART_HEIGHT}
                  selectedId={selectedId}
                  onSelect={(id) =>
                    setSelectedId((current) => (current === id ? null : id))
                  }
                  onDragActive={setBubbleDragging}
                />
              ) : null}
            </View>
          ) : null}
        </View>

        <View style={styles.listBlock}>
          <Text style={styles.sectionTitle}>Categorias registradas</Text>
          {transactions === null ? (
            <ActivityIndicator color={BearCashColors.primary} />
          ) : spend.items.length === 0 ? (
            <Text style={styles.empty}>
              Nenhuma categoria registrada neste mês
            </Text>
          ) : (
            <View style={styles.list}>
              {listedItems.map((item) => (
                <CategoryRow
                  key={item.id}
                  item={item}
                  selected={item.id === selectedId}
                  onPress={() =>
                    router.push({
                      pathname: "/category/[id]",
                      params: {
                        id: item.id,
                        year: String(monthDate.getFullYear()),
                        month: String(monthDate.getMonth()),
                      },
                    })
                  }
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <MonthPickerSheet
        visible={pickerOpen}
        value={filterActive ? monthValueFromDate(monthDate) : null}
        onClose={() => setPickerOpen(false)}
        onSelect={(value) => {
          setMonthDate(dateFromMonthValue(value));
          setFilterActive(true);
        }}
        onClear={() => {
          setFilterActive(false);
          setMonthDate(new Date());
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BearCashColors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 32,
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
    gap: 3,
  },
  walletHold: {
    backgroundColor: BearCashColors.neutralBase,
    borderRadius: 4,
    padding: 4,
  },
  totalAmount: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  totalCoin: {
    fontFamily: BearCashFonts.semiBold,
    fontSize: 12,
    lineHeight: 19,
    color: BearCashColors.text,
  },
  totalValue: {
    flex: 1,
    fontFamily: BearCashFonts.semiBold,
    fontSize: 18,
    lineHeight: 22,
    color: BearCashColors.text,
  },
  chart: {
    height: CHART_HEIGHT,
    overflow: "hidden",
    position: "relative",
  },
  listBlock: {
    gap: 16,
  },
  sectionTitle: {
    fontFamily: BearCashFonts.semiBold,
    fontSize: 16,
    lineHeight: 26,
    color: BearCashColors.text,
  },
  list: {
    gap: 16,
  },
  rowShell: {
    borderRadius: 10,
    overflow: "hidden",
  },
  rowShellSelected: {
    padding: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: BearCashColors.surface,
    overflow: "hidden",
  },
  rowMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowIcon: {
    backgroundColor: BearCashColors.neutralBase,
    borderRadius: 4,
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rowName: {
    ...BearCashTypography.caption,
    color: BearCashColors.textMid,
  },
  rowAmount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  rowCoin: {
    fontFamily: BearCashFonts.semiBold,
    fontSize: 10,
    lineHeight: 16,
    color: BearCashColors.textMid,
  },
  rowValue: {
    ...BearCashTypography.subheading,
    color: BearCashColors.textMid,
  },
  empty: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
  },
});
