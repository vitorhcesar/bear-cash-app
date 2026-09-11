import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getErrorMessage } from "@/infra/http/get-error-message";
import type { TransactionItem } from "@/infra/http/services/api/modules/transactions.module";
import {
  DEFAULT_PREFERENCES,
  getPreferences,
  updatePreferences,
} from "@/infra/preferences/preferences-store";
import {
  ActivitiesFilterSheet,
  DEFAULT_ACTIVITIES_FILTERS,
  type ActivitiesBankOption,
  type ActivitiesFilters,
  type PeriodId,
} from "@/presentation/components/ui/activities-filter-sheet";
import { getCategoryGroup } from "@/presentation/components/ui/activities-category-catalog";
import { FilterChipCloseIcon } from "@/presentation/components/ui/activities-filter-icons";
import {
  EmptyActivityIcon,
  FilterSlidersIcon,
  PlusIcon,
  SearchIcon,
} from "@/presentation/components/ui/activities-icons";
import { formatActivitySection } from "@/presentation/components/ui/calendar";
import { CashFlowCard } from "@/presentation/components/ui/cash-flow-card";
import { getCurrencySymbol } from "@/presentation/components/ui/currencies";
import { HighlightCardBorder } from "@/presentation/components/ui/highlight-card-border";
import { TransactionListItem } from "@/presentation/components/ui/transaction-list-item";
import {
  APP_BOTTOM_CHROME_HEIGHT,
  BearCashColors,
  BearCashFonts,
  BearCashTypography,
} from "@/presentation/constants/theme";
import { useApiService } from "@/presentation/hooks/use-api-service";

const FILTERS = ["Entradas", "Saídas", "Pagamentos", "Cartão"] as const;

type FilterId = (typeof FILTERS)[number];

function splitCurrencyAmount(amount: number, currencyCode = "BRL") {
  return {
    symbol: getCurrencySymbol(currencyCode),
    value: Math.abs(amount).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  };
}

function filtersAreActive(filters: ActivitiesFilters) {
  return (
    filters.period !== DEFAULT_ACTIVITIES_FILTERS.period ||
    filters.banks.length > 0 ||
    filters.categories.length > 0 ||
    filters.sort !== DEFAULT_ACTIVITIES_FILTERS.sort ||
    filters.showHidden
  );
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function matchesPeriod(date: Date, period: PeriodId) {
  const now = new Date();
  const startOfDay = (value: Date) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const day = startOfDay(date);
  const today = startOfDay(now);

  if (period === "today") {
    return day === today;
  }
  if (period === "yesterday") {
    return day === today - 86_400_000;
  }
  if (period === "7d") {
    return day >= today - 6 * 86_400_000;
  }
  if (period === "15d") {
    return day >= today - 14 * 86_400_000;
  }
  if (period === "current-month") {
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }
  if (period === "last-month") {
    const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return date.getFullYear() === last.getFullYear() && date.getMonth() === last.getMonth();
  }
  if (period === "6m") {
    const from = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    return date >= from;
  }
  if (period === "year") {
    const from = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    return date >= from;
  }
  return true;
}

function matchesBank(item: TransactionItem, banks: string[]) {
  if (banks.length === 0) {
    return true;
  }
  const name = (item.bankName ?? "").toLowerCase();
  const code = (item.bankCode ?? "").toLowerCase();
  return banks.some((bank) => {
    const needle = bank.toLowerCase();
    return name.includes(needle) || needle.includes(name) || code === needle;
  });
}

function matchesCategory(item: TransactionItem, categories: string[]) {
  if (categories.length === 0) {
    return true;
  }
  const id = item.categoryId ?? "";
  const label = (item.category ?? "").toLowerCase();
  return categories.some((category) => {
    if (id === category) {
      return true;
    }
    const group = getCategoryGroup(category);
    if (group?.children.some((child) => child.id === id)) {
      return true;
    }
    return Boolean(group?.label && label.includes(group.label.toLowerCase()));
  });
}
function matchesFilter(item: TransactionItem, filter: FilterId) {
  if (filter === "Entradas") {
    return item.type === "CREDIT";
  }
  if (filter === "Saídas") {
    return item.type === "DEBIT";
  }
  if (filter === "Pagamentos") {
    return item.operationType === "PAYMENT" || item.paymentData != null;
  }
  return Boolean(item.creditCardMetadata);
}

export function ActivitiesPage() {
  const router = useRouter();
  const api = useApiService();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterId>("Entradas");
  const [incomeVisible, setIncomeVisible] = useState(
    DEFAULT_PREFERENCES.activitiesIncomeVisible,
  );
  const [expenseVisible, setExpenseVisible] = useState(
    DEFAULT_PREFERENCES.activitiesExpenseVisible,
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<ActivitiesFilters>(
    DEFAULT_ACTIVITIES_FILTERS,
  );
  const [bankOptions, setBankOptions] = useState<ActivitiesBankOption[]>([]);

  const loadTransactions = useCallback(
    async (search?: string) => {
      setLoading(true);
      try {
        const response = await api.modules.transactions.list(search);
        setItems(response.items);
      } catch (error) {
        console.warn(
          getErrorMessage(error, "Não foi possível carregar as atividades."),
        );
      } finally {
        setLoading(false);
      }
    },
    [api.modules.transactions],
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const stored = await getPreferences();
      if (!cancelled) {
        setIncomeVisible(stored.activitiesIncomeVisible);
        setExpenseVisible(stored.activitiesExpenseVisible);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      const handle = setTimeout(() => {
        void loadTransactions(query);
      }, query ? 250 : 0);
      void api.modules.openFinance
        .listConnections()
        .then((response) => {
          const unique = new Map<string, ActivitiesBankOption>();
          for (const connection of response.items) {
            if (connection.revokedAt) {
              continue;
            }
            unique.set(connection.institutionName, {
              id: connection.institutionName,
              label: connection.institutionName,
              logoUrl: connection.institutionLogoUrl,
            });
          }
          setBankOptions([...unique.values()]);
        })
        .catch(() => {
          setBankOptions([]);
        });
      return () => clearTimeout(handle);
    }, [query, loadTransactions, api.modules.openFinance]),
  );

  const toggleIncomeVisibility = useCallback(() => {
    const next = !incomeVisible;
    setIncomeVisible(next);
    void updatePreferences({ activitiesIncomeVisible: next });
  }, [incomeVisible]);

  const toggleExpenseVisibility = useCallback(() => {
    const next = !expenseVisible;
    setExpenseVisible(next);
    void updatePreferences({ activitiesExpenseVisible: next });
  }, [expenseVisible]);

  const totals = useMemo(() => {
    let credit = 0;
    let debit = 0;
    for (const item of items) {
      if (item.hiddenFromTotals) {
        continue;
      }
      const value = Math.abs(item.amount);
      if (item.type === "CREDIT") {
        credit += value;
      } else {
        debit += value;
      }
    }
    return { credit, debit };
  }, [items]);

  const grouped = useMemo(() => {
    const filtered = items.filter((item) => {
      if (!filters.showHidden && item.hiddenFromTotals) {
        return false;
      }
      if (!matchesFilter(item, activeFilter)) {
        return false;
      }
      const date = new Date(item.date);
      if (!matchesPeriod(date, filters.period)) {
        return false;
      }
      if (!matchesBank(item, filters.banks)) {
        return false;
      }
      if (!matchesCategory(item, filters.categories)) {
        return false;
      }
      return true;
    });

    filtered.sort((left, right) => {
      if (filters.sort === "oldest") {
        return new Date(left.date).getTime() - new Date(right.date).getTime();
      }
      if (filters.sort === "highest") {
        return Math.abs(right.amount) - Math.abs(left.amount);
      }
      if (filters.sort === "lowest") {
        return Math.abs(left.amount) - Math.abs(right.amount);
      }
      return new Date(right.date).getTime() - new Date(left.date).getTime();
    });

    const sections = new Map<string, { key: string; title: string; data: TransactionItem[] }>();

    for (const item of filtered) {
      const date = new Date(item.date);
      const key = dayKey(date);
      const existing = sections.get(key);
      if (existing) {
        existing.data.push(item);
        continue;
      }
      sections.set(key, {
        key,
        title: formatActivitySection(date),
        data: [item],
      });
    }

    return [...sections.values()];
  }, [items, activeFilter, filters]);

  const empty = grouped.length === 0;
  const hasQuery = query.trim().length > 0;
  const filterActive = filtersAreActive(filters);
  const incomeAmount = splitCurrencyAmount(totals.credit);
  const expenseAmount = splitCurrencyAmount(totals.debit);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBlock}>
          <View style={styles.header}>
            <Text style={styles.title}>Atividades</Text>
            <Pressable
              style={({ pressed }) => [
                styles.addButton,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Nova transação"
              onPress={() => router.push("/new-transaction")}
            >
              <PlusIcon size={24} />
            </Pressable>
          </View>

          <View style={styles.toolbar}>
            <View style={styles.searchRow}>
              <View style={styles.searchField}>
                {hasQuery ? (
                  <View style={styles.floatingLabelRow} pointerEvents="none">
                    <View style={styles.floatingLabelBackground}>
                      <Text style={styles.floatingLabel}>Buscar atividades</Text>
                    </View>
                  </View>
                ) : null}
                <SearchIcon size={16} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar atividades"
                  placeholderTextColor={BearCashColors.textSoft}
                  value={query}
                  onChangeText={setQuery}
                  autoCorrect={false}
                  returnKeyType="search"
                  accessibilityLabel="Buscar atividades"
                />
                {hasQuery ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Limpar busca"
                    hitSlop={8}
                    onPress={() => setQuery("")}
                  >
                    <FilterChipCloseIcon size={16} />
                  </Pressable>
                ) : null}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Filtros"
                hitSlop={8}
                onPress={() => setFiltersOpen(true)}
              >
                <View style={styles.filterButton}>
                  <FilterSlidersIcon size={28} />
                  {filterActive ? <View style={styles.filterDot} /> : null}
                </View>
              </Pressable>
            </View>

            <View style={styles.filtersWrap}>
              <ScrollView
                horizontal
                style={styles.filtersScroll}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filters}
              >
                {FILTERS.map((filter) => {
                  const selected = filter === activeFilter;
                  return (
                    <Pressable
                      key={filter}
                      onPress={() => setActiveFilter(filter)}
                      style={[styles.chip, selected && styles.chipSelected]}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          selected && styles.chipTextSelected,
                        ]}
                      >
                        {filter}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </View>

        {loading && items.length === 0 ? (
          <View style={styles.loading}>
            <ActivityIndicator
              color={BearCashColors.primary}
              accessibilityLabel="Carregando atividades"
            />
          </View>
        ) : (
          <>
            <View style={styles.summaryRow}>
              <CashFlowCard
                label="Entrada"
                symbol={incomeAmount.symbol}
                amount={incomeAmount.value}
                hidden={!incomeVisible}
                onToggleVisibility={toggleIncomeVisibility}
                tone="income"
              />
              <CashFlowCard
                label="Saída"
                symbol={expenseAmount.symbol}
                amount={expenseAmount.value}
                hidden={!expenseVisible}
                onToggleVisibility={toggleExpenseVisibility}
                tone="expense"
              />
            </View>

            {empty ? (
              <View style={styles.emptyState}>
                <EmptyActivityIcon size={24} />
                <View style={styles.emptyCopy}>
                  <Text style={styles.emptyTitle}>
                    Nenhuma atividade encontrada
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    Você não possui nenhuma atividade financeira registrada
                  </Text>
                </View>
              </View>
            ) : (
              grouped.map((section) => (
                <View key={section.key} style={styles.section}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <View style={styles.sectionCard}>
                    <HighlightCardBorder />
                    <View style={styles.sectionList}>
                      {section.data.map((item) => (
                        <TransactionListItem
                          key={item.id}
                          item={item}
                          onPress={() =>
                            router.push({
                              pathname: "/transaction/[id]",
                              params: { id: item.id },
                            })
                          }
                        />
                      ))}
                    </View>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      <ActivitiesFilterSheet
        visible={filtersOpen}
        value={filters}
        banks={bankOptions}
        onClose={() => setFiltersOpen(false)}
        onApply={setFilters}
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
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: APP_BOTTOM_CHROME_HEIGHT,
    gap: 20,
  },
  topBlock: {
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 40,
  },
  toolbar: {
    gap: 16,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 24,
    backgroundColor: BearCashColors.buttonFilled,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  title: {
    ...BearCashTypography.h1,
    flex: 1,
    paddingRight: 12,
    color: BearCashColors.text,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchField: {
    flex: 1,
    minWidth: 0,
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: BearCashColors.borderSoft,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  floatingLabelRow: {
    position: "absolute",
    top: -8,
    left: 13,
    zIndex: 2,
  },
  floatingLabelBackground: {
    backgroundColor: BearCashColors.background,
    paddingHorizontal: 4,
  },
  floatingLabel: {
    ...BearCashTypography.captionSmall,
    color: BearCashColors.text,
  },
  searchInput: {
    flex: 1,
    ...BearCashTypography.body,
    color: BearCashColors.text,
    padding: 0,
  },
  filterButton: {
    width: 28,
    height: 28,
  },
  filterDot: {
    position: "absolute",
    top: 3,
    left: 13,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BearCashColors.primarySoft,
  },
  filtersWrap: {
    flexGrow: 0,
    flexShrink: 0,
  },
  filtersScroll: {
    flexGrow: 0,
  },
  filters: {
    gap: 10,
    paddingRight: 8,
    alignItems: "center",
  },
  chip: {
    borderRadius: 40,
    backgroundColor: BearCashColors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: "center",
    justifyContent: "center",
  },
  chipSelected: {
    backgroundColor: BearCashColors.text,
  },
  chipText: {
    ...BearCashTypography.bodySmall,
    color: BearCashColors.textMid,
    lineHeight: 22,
  },
  chipTextSelected: {
    color: BearCashColors.buttonFilledText,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    maxWidth: 250,
    alignSelf: "center",
  },
  emptyCopy: {
    gap: 6,
    alignItems: "center",
  },
  emptyTitle: {
    fontFamily: BearCashFonts.semiBold,
    fontSize: 20,
    lineHeight: 24,
    color: BearCashColors.textMid,
    textAlign: "center",
  },
  emptySubtitle: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
    textAlign: "center",
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 180,
  },
  section: {
    gap: 12,
    width: "100%",
  },
  sectionTitle: {
    ...BearCashTypography.subheading,
    color: BearCashColors.text,
  },
  sectionCard: {
    borderRadius: 12,
    padding: 1,
    overflow: "hidden",
  },
  sectionList: {
    backgroundColor: BearCashColors.surface,
    borderRadius: 12,
    padding: 18,
    gap: 16,
  },
  pressed: {
    opacity: 0.85,
  },
});
