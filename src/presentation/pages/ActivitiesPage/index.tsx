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
  type ActivitiesFilters,
} from "@/presentation/components/ui/activities-filter-sheet";
import {
  ActivityEyeClosedIcon,
  ActivityEyeOpenIcon,
  EmptyActivityIcon,
  ExpenseArrowIcon,
  FilterSlidersIcon,
  IncomeArrowIcon,
  PlusIcon,
  SearchIcon,
} from "@/presentation/components/ui/activities-icons";
import { BackButton } from "@/presentation/components/ui/back-button";
import { formatActivitySection } from "@/presentation/components/ui/calendar";
import { getCurrencySymbol } from "@/presentation/components/ui/currencies";
import { TransactionListItem } from "@/presentation/components/ui/transaction-list-item";
import {
  BearCashColors,
  BearCashFonts,
  BearCashTypography,
} from "@/presentation/constants/theme";
import { useApiService } from "@/presentation/hooks/use-api-service";

const FILTERS = ["Entradas", "Saídas", "Pagamentos", "Cartão"] as const;

type FilterId = (typeof FILTERS)[number];

type SummaryCardProps = {
  label: string;
  value: string;
  hidden: boolean;
  onToggleVisibility: () => void;
  tone: "income" | "expense";
};

function SummaryCard({
  label,
  value,
  hidden,
  onToggleVisibility,
  tone,
}: SummaryCardProps) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryIconWrap}>
        {tone === "income" ? (
          <IncomeArrowIcon size={12} />
        ) : (
          <ExpenseArrowIcon size={12} />
        )}
      </View>
      <View style={styles.summaryCopy}>
        <Text style={styles.summaryLabel}>{label}</Text>
        <View style={styles.summaryValueRow}>
          <Text style={styles.summaryValue}>{hidden ? "R$*,**" : value}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Mostrar valor" : "Ocultar valor"}
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

function formatTotal(amount: number, currencyCode = "BRL") {
  return `${getCurrencySymbol(currencyCode)}${amount.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
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
      return () => clearTimeout(handle);
    }, [query, loadTransactions]),
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
    const filtered = items.filter((item) => matchesFilter(item, activeFilter));
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
  }, [items, activeFilter]);

  const empty = grouped.length === 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBlock}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <BackButton />
              <Pressable
                style={styles.addButton}
                accessibilityRole="button"
                accessibilityLabel="Nova transação"
                onPress={() => router.push("/new-transaction")}
              >
                <PlusIcon size={24} />
              </Pressable>
            </View>
            <Text style={styles.title}>Atividades</Text>
          </View>

          <View style={styles.toolbar}>
            <View style={styles.searchRow}>
              <View style={styles.searchField}>
                <SearchIcon size={16} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar atividades"
                  placeholderTextColor={BearCashColors.textSoft}
                  value={query}
                  onChangeText={setQuery}
                  autoCorrect={false}
                  returnKeyType="search"
                />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Filtros"
                hitSlop={8}
                onPress={() => setFiltersOpen(true)}
              >
                <FilterSlidersIcon size={28} />
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
              color={BearCashColors.text}
              accessibilityLabel="Carregando atividades"
            />
          </View>
        ) : (
          <>
        <View style={styles.summaryRow}>
          <SummaryCard
            label="Total entrada"
            value={formatTotal(totals.credit)}
            hidden={!incomeVisible}
            onToggleVisibility={toggleIncomeVisibility}
            tone="income"
          />
          <SummaryCard
            label="Total saídas"
            value={formatTotal(totals.debit)}
            hidden={!expenseVisible}
            onToggleVisibility={toggleExpenseVisibility}
            tone="expense"
          />
        </View>

        {empty ? (
          <View style={styles.emptyState}>
            <EmptyActivityIcon size={24} />
            <View style={styles.emptyCopy}>
              <Text style={styles.emptyTitle}>Nenhuma atividade encontrada</Text>
              <Text style={styles.emptySubtitle}>
                Você não possui nenhuma atividade financeira registrada
              </Text>
            </View>
          </View>
        ) : (
          grouped.map((section) => (
            <View key={section.key} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionList}>
                {section.data.map((item) => (
                  <TransactionListItem
                    key={item.id}
                    item={item}
                    onPress={() =>
                      router.push({
                        pathname: '/transaction/[id]',
                        params: { id: item.id },
                      })
                    }
                  />
                ))}
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
  headerTop: {
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
    backgroundColor: BearCashColors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...BearCashTypography.h1,
    color: BearCashColors.text,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchField: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: BearCashColors.borderSoft,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    ...BearCashTypography.body,
    color: BearCashColors.text,
    padding: 0,
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
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    minWidth: 150,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: BearCashColors.borderSoft,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  summaryIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: BearCashColors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCopy: {
    flex: 1,
    gap: 2,
  },
  summaryLabel: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
  },
  summaryValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  summaryValue: {
    ...BearCashTypography.bodySmall,
    color: BearCashColors.textMid,
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
    gap: 4,
    alignItems: "center",
  },
  emptyTitle: {
    ...BearCashTypography.bodySmall,
    color: BearCashColors.text,
    textAlign: "center",
    fontFamily: BearCashFonts.semiBold,
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
    ...BearCashTypography.body,
    fontFamily: BearCashFonts.semiBold,
    color: BearCashColors.text,
  },
  sectionList: {
    gap: 16,
  },
});
