import { BlurTargetView } from "expo-blur";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
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
import { getCategoryGroup, resolveCategoryId } from "@/presentation/components/ui/activities-category-catalog";
import { FilterChipCloseIcon } from "@/presentation/components/ui/activities-filter-icons";
import {
  EmptyActivityIcon,
  FilterSlidersIcon,
  PlusIcon,
  SearchIcon,
} from "@/presentation/components/ui/activities-icons";
import {
  MONTHS_LONG,
  formatActivitySection,
} from "@/presentation/components/ui/calendar";
import { ActivitiesStickyHeaderBackdrop } from "@/presentation/components/ui/activities-sticky-header-backdrop";
import { CashFlowPair } from "@/presentation/components/ui/cash-flow-card";
import { getCurrencySymbol } from "@/presentation/components/ui/currencies";
import { TransactionListItem } from "@/presentation/components/ui/transaction-list-item";
import {
  APP_BOTTOM_CHROME_HEIGHT,
  BearCashColors,
  BearCashFonts,
  BearCashTypography,
} from "@/presentation/constants/theme";
import { createThemedStyles } from "@/presentation/constants/themed-styles";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { useTabRepressHandler } from "@/presentation/navigation/tab-repress-context";
import {
  HARD_PULL_HOLD,
  HARD_PULL_THRESHOLD,
  pullSpinnerOpacity,
  rubberbandPull,
} from "@/presentation/constants/pull-refresh";

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

function activeFilterCount(filters: ActivitiesFilters) {
  let count = 0;
  if (filters.period !== DEFAULT_ACTIVITIES_FILTERS.period) {
    count += 1;
  }
  if (filters.banks.length > 0) {
    count += 1;
  }
  if (filters.categories.length > 0) {
    count += 1;
  }
  if (filters.sort !== DEFAULT_ACTIVITIES_FILTERS.sort) {
    count += 1;
  }
  if (filters.showHidden) {
    count += 1;
  }
  return count;
}

function padDay(value: number) {
  return String(value).padStart(2, "0");
}

function lastDayOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function periodResultsLabel(period: PeriodId, now = new Date()) {
  const monthName = MONTHS_LONG[now.getMonth()];

  if (period === "current-month") {
    return `01 — ${padDay(lastDayOfMonth(now))} de ${monthName}`;
  }
  if (period === "last-month") {
    const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `01 — ${padDay(lastDayOfMonth(previous))} de ${MONTHS_LONG[previous.getMonth()]}`;
  }
  if (period === "today") {
    return `${padDay(now.getDate())} de ${monthName}`;
  }
  if (period === "yesterday") {
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    return `${padDay(yesterday.getDate())} de ${MONTHS_LONG[yesterday.getMonth()]}`;
  }
  if (period === "7d" || period === "15d") {
    const span = period === "7d" ? 6 : 14;
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - span);
    if (from.getMonth() === now.getMonth() && from.getFullYear() === now.getFullYear()) {
      return `${padDay(from.getDate())} — ${padDay(now.getDate())} de ${monthName}`;
    }
    return `${padDay(from.getDate())} de ${MONTHS_LONG[from.getMonth()]} — ${padDay(now.getDate())} de ${monthName}`;
  }
  if (period === "6m") {
    const from = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    if (from.getFullYear() === now.getFullYear()) {
      return `${MONTHS_LONG[from.getMonth()]} — ${monthName}`;
    }
    return `${MONTHS_LONG[from.getMonth()]} ${from.getFullYear()} — ${monthName} ${now.getFullYear()}`;
  }
  if (period === "year") {
    const from = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    return `${padDay(from.getDate())} de ${MONTHS_LONG[from.getMonth()]} — ${padDay(now.getDate())} de ${monthName}`;
  }
  return "Personalizado";
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
  const id = item.categoryId ? resolveCategoryId(item.categoryId) : "";
  const label = (item.category ?? "").toLowerCase();
  return categories.some((category) => {
    const filterId = resolveCategoryId(category);
    if (id && id === filterId) {
      return true;
    }
    const group = getCategoryGroup(filterId);
    if (group?.children.some((child) => child.id === id)) {
      return true;
    }
    return Boolean(
      group &&
        (label.includes(group.label.toLowerCase()) ||
          label.includes(group.chipLabel.toLowerCase())),
    );
  });
}
function matchesFilter(item: TransactionItem, filter: FilterId | null) {
  if (!filter) {
    return true;
  }
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

const STICKY_HEADER_FALLBACK_HEIGHT = 360;
const FILTERS_EXPANDED_FALLBACK = 38;
const COLLAPSE_AFTER_SCROLL = 132;
const EXPAND_BELOW_SCROLL = 20;

export function ActivitiesPage() {
  const styles = useStyles();
  const scrollRef = useRef<Animated.ScrollView>(null);
  const listBlurRef = useRef<View | null>(null);
  const scrollY = useSharedValue(0);
  const compact = useSharedValue(0);
  const collapsed = useSharedValue(0);
  const androidPull = useSharedValue(0);
  const refreshingSv = useSharedValue(false);
  const pullTriggered = useSharedValue(false);
  const filtersExpandedH = useSharedValue(FILTERS_EXPANDED_FALLBACK);
  const headerExpandedH = useSharedValue(STICKY_HEADER_FALLBACK_HEIGHT);
  const headerCollapsedH = useSharedValue(STICKY_HEADER_FALLBACK_HEIGHT - 120);
  const headerHeightSv = useSharedValue(STICKY_HEADER_FALLBACK_HEIGHT);
  const headerPhaseRef = useRef<"expanded" | "animating" | "collapsed">(
    "expanded",
  );
  const setHeaderPhase = useCallback(
    (phase: "expanded" | "animating" | "collapsed") => {
      headerPhaseRef.current = phase;
    },
    [],
  );
  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y;
      scrollY.value = y;
      if (refreshingSv.value || y < 0) {
        return;
      }
      if (y >= COLLAPSE_AFTER_SCROLL && collapsed.value === 0) {
        collapsed.value = 1;
        runOnJS(setHeaderPhase)("animating");
        compact.value = withTiming(1, {
          duration: 340,
          easing: Easing.out(Easing.cubic),
        }, (finished) => {
          if (finished) {
            runOnJS(setHeaderPhase)("collapsed");
          }
        });
        return;
      }
      if (y <= EXPAND_BELOW_SCROLL && collapsed.value === 1) {
        collapsed.value = 0;
        runOnJS(setHeaderPhase)("animating");
        compact.value = withTiming(0, {
          duration: 320,
          easing: Easing.out(Easing.cubic),
        }, (finished) => {
          if (finished) {
            runOnJS(setHeaderPhase)("expanded");
          }
        });
      }
    },
  });
  const filtersSlotStyle = useAnimatedStyle(() => {
    const p = compact.value;
    const expanded = filtersExpandedH.value;
    return {
      height: interpolate(p, [0, 1], [expanded, 0]),
      opacity: interpolate(p, [0, 0.4, 0.85], [1, 0.4, 0], Extrapolation.CLAMP),
      marginTop: interpolate(p, [0, 1], [16, 0]),
    };
  });
  const headerSpacerStyle = useAnimatedStyle(() => ({
    height: interpolate(
      compact.value,
      [0, 1],
      [headerExpandedH.value, headerCollapsedH.value],
    ),
  }));
  const [stickyHeaderHeight, setStickyHeaderHeight] = useState(
    STICKY_HEADER_FALLBACK_HEIGHT,
  );
  const router = useRouter();
  const api = useApiService();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterId | null>(null);
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
  const [refreshing, setRefreshing] = useState(false);
  const params = useLocalSearchParams<{
    category?: string | string[];
    q?: string | string[];
  }>();
  const categoryParam = Array.isArray(params.category)
    ? params.category[0]
    : params.category;
  const queryParam = Array.isArray(params.q) ? params.q[0] : params.q;

  useEffect(() => {
    if (!categoryParam) {
      return;
    }
    setFilters((current) => ({
      ...current,
      categories: [categoryParam],
    }));
    setActiveFilter("Saídas");
  }, [categoryParam]);

  useEffect(() => {
    if (!queryParam) {
      return;
    }
    setQuery(queryParam);
  }, [queryParam]);

  const loadTransactions = useCallback(
    async (search?: string, options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setLoading(true);
      }
      try {
        const response = await api.modules.transactions.list(search);
        setItems(response.items);
      } catch (error) {
        console.warn(
          getErrorMessage(error, "Não foi possível carregar as atividades."),
        );
      } finally {
        if (!options?.silent) {
          setLoading(false);
        }
      }
    },
    [api.modules.transactions],
  );

  const loadBankOptions = useCallback(async () => {
    try {
      const response = await api.modules.openFinance.listConnections();
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
    } catch {
      setBankOptions([]);
    }
  }, [api.modules.openFinance]);

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
      void loadBankOptions();
      return () => clearTimeout(handle);
    }, [query, loadTransactions, loadBankOptions]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await api.modules.openFinance.syncConnections();
      await Promise.all([
        loadTransactions(query, { silent: true }),
        loadBankOptions(),
      ]);
    } catch (error) {
      await Promise.all([
        loadTransactions(query, { silent: true }),
        loadBankOptions(),
      ]);
      Alert.alert(
        "Não foi possível atualizar",
        getErrorMessage(
          error,
          "Não foi possível sincronizar seus bancos. Tente novamente.",
        ),
      );
    } finally {
      setRefreshing(false);
    }
  }, [api.modules.openFinance, loadBankOptions, loadTransactions, query]);

  useEffect(() => {
    refreshingSv.value = refreshing;
    if (refreshing) {
      if (Platform.OS === "android") {
        androidPull.value = withTiming(HARD_PULL_HOLD, { duration: 180 });
      } else {
        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo({ y: -HARD_PULL_HOLD, animated: true });
        });
      }
      return;
    }
    pullTriggered.value = false;
    androidPull.value = withTiming(0, { duration: 220 });
  }, [androidPull, pullTriggered, refreshing, refreshingSv]);

  const armPullRefresh = useCallback(() => {
    if (pullTriggered.value || refreshingSv.value) {
      return;
    }
    pullTriggered.value = true;
    void onRefresh();
  }, [onRefresh, pullTriggered, refreshingSv]);

  function handlePullEndDrag(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (Platform.OS !== "ios" || refreshing || pullTriggered.value) {
      return;
    }
    if (-event.nativeEvent.contentOffset.y >= HARD_PULL_THRESHOLD) {
      armPullRefresh();
    }
  }

  function handlePullMomentumEnd(
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) {
    if (Platform.OS !== "ios" || refreshing || pullTriggered.value) {
      return;
    }
    if (-event.nativeEvent.contentOffset.y >= HARD_PULL_THRESHOLD) {
      armPullRefresh();
    }
  }

  const nativeScroll = Gesture.Native();
  const pullPan = Gesture.Pan()
    .enabled(Platform.OS === "android")
    .activeOffsetY(16)
    .failOffsetX([-18, 18])
    .simultaneousWithExternalGesture(nativeScroll)
    .onTouchesMove((_event, state) => {
      if (scrollY.value > 2) {
        state.fail();
      }
    })
    .onUpdate((event) => {
      if (refreshingSv.value || scrollY.value > 2 || event.translationY <= 0) {
        return;
      }
      androidPull.value = rubberbandPull(event.translationY);
    })
    .onEnd(() => {
      if (refreshingSv.value) {
        return;
      }
      if (androidPull.value >= HARD_PULL_THRESHOLD) {
        androidPull.value = withTiming(HARD_PULL_HOLD, { duration: 160 });
        runOnJS(armPullRefresh)();
        return;
      }
      androidPull.value = withTiming(0, { duration: 200 });
    });

  const androidPullStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: Platform.OS === "android" ? androidPull.value : 0 },
    ],
  }));

  const pullSpinnerStyle = useAnimatedStyle(() => {
    const isRefreshing = refreshingSv.value;
    const pull =
      Platform.OS === "ios"
        ? Math.max(-scrollY.value, isRefreshing ? HARD_PULL_HOLD : 0)
        : androidPull.value;
    return {
      top: headerHeightSv.value + 4,
      opacity: pullSpinnerOpacity(pull, isRefreshing),
      transform: [
        {
          translateY: isRefreshing
            ? 0
            : interpolate(pull, [0, HARD_PULL_THRESHOLD], [-18, 0]),
        },
      ],
    };
  });

  const handleTabRepress = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    void onRefresh();
  }, [onRefresh]);

  useTabRepressHandler("activities", handleTabRepress);

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

  const scopedItems = useMemo(() => {
    return items.filter((item) => {
      if (!filters.showHidden && item.hiddenFromTotals) {
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
  }, [items, filters]);

  const filteredItems = useMemo(() => {
    const filtered = scopedItems.filter((item) =>
      matchesFilter(item, activeFilter),
    );

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

    return filtered;
  }, [scopedItems, activeFilter, filters.sort]);

  const totals = useMemo(() => {
    let credit = 0;
    let debit = 0;
    for (const item of scopedItems) {
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
  }, [scopedItems]);

  const grouped = useMemo(() => {
    const sections = new Map<
      string,
      { key: string; title: string; data: TransactionItem[] }
    >();

    for (const item of filteredItems) {
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
  }, [filteredItems]);

  const clearSheetFilters = useCallback(() => {
    setFilters(DEFAULT_ACTIVITIES_FILTERS);
    if (categoryParam) {
      router.setParams({ category: "" });
    }
  }, [categoryParam, router]);

  const empty = grouped.length === 0;
  const hasQuery = query.trim().length > 0;
  const filterCount = activeFilterCount(filters);
  const filterActive = filterCount > 0;
  const incomeAmount = splitCurrencyAmount(totals.credit);
  const expenseAmount = splitCurrencyAmount(totals.debit);
  const resultsPeriodLabel = periodResultsLabel(filters.period);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.screen}>
        <BlurTargetView ref={listBlurRef} style={styles.listTarget}>
        <GestureDetector gesture={Gesture.Simultaneous(pullPan, nativeScroll)}>
        <Animated.ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          alwaysBounceVertical
          bounces
          overScrollMode={Platform.OS === "android" ? "never" : "always"}
          scrollEventThrottle={16}
          onScroll={onScroll}
          onScrollEndDrag={handlePullEndDrag}
          onMomentumScrollEnd={handlePullMomentumEnd}
          contentInset={
            Platform.OS === "ios" && refreshing
              ? { top: HARD_PULL_HOLD }
              : undefined
          }
        >
          <Animated.View style={androidPullStyle}>
          <Animated.View
            pointerEvents="none"
            style={headerSpacerStyle}
          />
          {loading && items.length === 0 ? (
            <View style={styles.loading}>
              <ActivityIndicator
                color={BearCashColors.primary}
                accessibilityLabel="Carregando atividades"
              />
            </View>
          ) : empty ? (
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
                <View style={styles.sectionList}>
                  {section.data.map((item) => (
                    <TransactionListItem
                      key={item.id}
                      item={item}
                      leading="mark"
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
            ))
          )}
          </Animated.View>
        </Animated.ScrollView>
        </GestureDetector>
        </BlurTargetView>

        <Animated.View
          pointerEvents="none"
          style={[styles.pullSpinner, pullSpinnerStyle]}
        >
          <View style={styles.pullSpinnerBadge}>
            <ActivityIndicator size="large" color={BearCashColors.buttonFilled} />
          </View>
        </Animated.View>

        <View
          style={styles.stickyHeader}
          onLayout={(event) => {
            const nextHeight = event.nativeEvent.layout.height;
            headerHeightSv.value = nextHeight;
            const phase = headerPhaseRef.current;
            if (phase === "expanded") {
              headerExpandedH.value = nextHeight;
              if (Math.abs(nextHeight - stickyHeaderHeight) > 0.5) {
                setStickyHeaderHeight(nextHeight);
              }
              return;
            }
            if (phase === "collapsed") {
              headerCollapsedH.value = nextHeight;
            }
          }}
          pointerEvents="box-none"
        >
          <View style={styles.stickyHeaderShell}>
            <ActivitiesStickyHeaderBackdrop blurTarget={listBlurRef} />
            <View style={styles.stickyHeaderContent}>
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
                          <Text style={styles.floatingLabel}>
                            Buscar atividades
                          </Text>
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

                <Animated.View
                  style={[styles.filtersSlot, filtersSlotStyle]}
                  pointerEvents="box-none"
                >
                  <View
                    style={styles.filtersWrap}
                    onLayout={(event) => {
                      if (headerPhaseRef.current !== "expanded") {
                        return;
                      }
                      const next = event.nativeEvent.layout.height;
                      if (next > 8) {
                        filtersExpandedH.value = next;
                      }
                    }}
                  >
                  <ScrollView
                    horizontal
                    nestedScrollEnabled
                    style={styles.filtersScroll}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filters}
                  >
                    {filterActive ? (
                      <Pressable
                        onPress={() => setFiltersOpen(true)}
                        style={styles.chipFilters}
                        accessibilityRole="button"
                        accessibilityLabel={`Filtros, ${filterCount} ativos`}
                      >
                        <FilterSlidersIcon
                          size={16}
                          color={BearCashColors.background}
                        />
                        <Text style={styles.chipFiltersText}>
                          Filtros ({filterCount})
                        </Text>
                      </Pressable>
                    ) : null}
                    {FILTERS.map((filter) => {
                      const selected = filter === activeFilter;
                      return (
                        <Pressable
                          key={filter}
                          onPress={() =>
                            setActiveFilter((current) =>
                              current === filter ? null : filter,
                            )
                          }
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
                </Animated.View>

                {filterActive ? (
                  <View style={styles.resultsBar}>
                    <View style={styles.resultsCopy}>
                      <Text style={styles.resultsCount}>
                        “{filteredItems.length}” Resultados para:
                      </Text>
                      <Text style={styles.resultsPeriod} numberOfLines={1}>
                        {resultsPeriodLabel}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Limpar filtros"
                      hitSlop={8}
                      onPress={clearSheetFilters}
                    >
                      <FilterChipCloseIcon size={20} />
                    </Pressable>
                  </View>
                ) : null}
              </View>
            </View>

            <CashFlowPair
              compact={compact}
              income={{
                symbol: incomeAmount.symbol,
                amount: incomeAmount.value,
                hidden: !incomeVisible,
                onToggleVisibility: toggleIncomeVisibility,
              }}
              expense={{
                symbol: expenseAmount.symbol,
                amount: expenseAmount.value,
                hidden: !expenseVisible,
                onToggleVisibility: toggleExpenseVisibility,
              }}
            />
            </View>
          </View>
        </View>
      </View>

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

const useStyles = createThemedStyles(() => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BearCashColors.background,
  },
  screen: {
    flex: 1,
  },
  listTarget: {
    flex: 1,
  },
  pullSpinner: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 5,
    alignItems: "center",
  },
  pullSpinnerBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10, 10, 11, 0.9)",
    borderWidth: 1,
    borderColor: BearCashColors.borderStrong,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: APP_BOTTOM_CHROME_HEIGHT,
    gap: 20,
  },
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  stickyHeaderShell: {
    position: "relative",
    width: "100%",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  stickyHeaderContent: {
    position: "relative",
    zIndex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
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
    gap: 0,
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
    backgroundColor: "rgba(10, 10, 11, 0.88)",
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
  filtersSlot: {
    overflow: "hidden",
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
    color: BearCashColors.onText,
  },
  chipFilters: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 40,
    backgroundColor: BearCashColors.text,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: "center",
    justifyContent: "center",
  },
  chipFiltersText: {
    ...BearCashTypography.bodySmall,
    color: BearCashColors.background,
    lineHeight: 22,
  },
  resultsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 16,
    backgroundColor: BearCashColors.surface,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  resultsCopy: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
  },
  resultsCount: {
    fontFamily: BearCashFonts.semiBold,
    fontSize: 12,
    lineHeight: 19,
    color: BearCashColors.text,
  },
  resultsPeriod: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
    flexShrink: 1,
  },
  summaryColumn: {
    gap: 12,
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
    fontFamily: BearCashFonts.semiBold,
    fontSize: 16,
    lineHeight: 26,
    color: BearCashColors.text,
  },
  sectionList: {
    gap: 16,
  },
  pressed: {
    opacity: 0.85,
  },
}));
