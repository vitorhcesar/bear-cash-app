import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { BackButton } from "@/presentation/components/ui/back-button";
import { Button } from "@/presentation/components/ui/button";
import {
  CashFlowChart,
  type CashFlowChartPoint,
} from "@/presentation/components/ui/cash-flow-chart";
import { CashFlowInfoIcon } from "@/presentation/components/ui/cash-flow-icons";
import { getCurrencySymbol } from "@/presentation/components/ui/currencies";
import {
  HomeDashInflowIcon,
  HomeDashOutflowIcon,
} from "@/presentation/components/ui/home-icons";
import { TransactionListItem } from "@/presentation/components/ui/transaction-list-item";
import {
  BearCashColors,
  BearCashFonts,
  BearCashTypography,
} from "@/presentation/constants/theme";
import { createThemedStyles } from "@/presentation/constants/themed-styles";
import { useApiService } from "@/presentation/hooks/use-api-service";

const LATEST_LIMIT = 8;
const INFO_TOOLTIP_WIDTH = 211;
const INFO_COPY =
  "Consideramos apenas o dinheiro que entra ou sai da conta. Compras no cartão entram no cálculo quando a fatura é paga.";

type FlowTab = "general" | "inflow" | "outflow";
type PeriodId = "month" | "3m" | "6m" | "1y";

const TYPE_TABS: { id: FlowTab; label: string }[] = [
  { id: "general", label: "Geral" },
  { id: "inflow", label: "Entradas" },
  { id: "outflow", label: "Saídas" },
];

const PERIODS: { id: PeriodId; label: string }[] = [
  { id: "month", label: "Este mês" },
  { id: "3m", label: "3M" },
  { id: "6m", label: "6M" },
  { id: "1y", label: "1A" },
];

const MONTH_SHORT = [
  "JAN",
  "FEV",
  "MAR",
  "ABR",
  "MAI",
  "JUN",
  "JUL",
  "AGO",
  "SET",
  "OUT",
  "NOV",
  "DEZ",
] as const;

function paramValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function parseTab(value: string | undefined): FlowTab {
  if (value === "inflow" || value === "outflow") {
    return value;
  }
  return "general";
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

function formatAmount(amount: number) {
  return Math.abs(amount).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function periodRange(period: PeriodId, now = new Date()) {
  const today = startOfDay(now);
  if (period === "month") {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
    };
  }
  if (period === "3m") {
    return {
      start: new Date(now.getFullYear(), now.getMonth() - 2, 1),
      end: today,
    };
  }
  if (period === "6m") {
    return {
      start: new Date(now.getFullYear(), now.getMonth() - 5, 1),
      end: today,
    };
  }
  return {
    start: new Date(now.getFullYear(), 0, 1),
    end: new Date(now.getFullYear(), 11, 31),
  };
}

function inRange(date: Date, start: Date, end: Date) {
  const time = startOfDay(date).getTime();
  return time >= startOfDay(start).getTime() && time <= startOfDay(end).getTime();
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function buildDailyPoints(
  items: TransactionItem[],
  start: Date,
  end: Date,
): CashFlowChartPoint[] {
  const points: CashFlowChartPoint[] = [];
  let cursor = startOfDay(start);
  const last = startOfDay(end);
  while (cursor.getTime() <= last.getTime()) {
    points.push({
      key: dayKey(cursor),
      label: String(cursor.getDate()).padStart(2, "0"),
      date: cursor,
      inflow: 0,
      outflow: 0,
    });
    cursor = addDays(cursor, 1);
  }
  const map = new Map(points.map((point) => [point.key, point]));
  for (const item of items) {
    const date = new Date(item.date);
    const point = map.get(dayKey(date));
    if (!point) {
      continue;
    }
    const value = Math.abs(item.amount);
    if (item.type === "CREDIT") {
      point.inflow += value;
    } else {
      point.outflow += value;
    }
  }
  return points;
}

function buildMonthlyPoints(
  items: TransactionItem[],
  start: Date,
  end: Date,
): CashFlowChartPoint[] {
  const points: CashFlowChartPoint[] = [];
  let year = start.getFullYear();
  let month = start.getMonth();
  const endYear = end.getFullYear();
  const endMonth = end.getMonth();
  while (year < endYear || (year === endYear && month <= endMonth)) {
    points.push({
      key: `${year}-${month}`,
      label: MONTH_SHORT[month],
      date: new Date(year, month, 1),
      inflow: 0,
      outflow: 0,
    });
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  const map = new Map(points.map((point) => [point.key, point]));
  for (const item of items) {
    const date = new Date(item.date);
    const point = map.get(monthKey(date));
    if (!point) {
      continue;
    }
    const value = Math.abs(item.amount);
    if (item.type === "CREDIT") {
      point.inflow += value;
    } else {
      point.outflow += value;
    }
  }
  return points;
}

function captionFor(tab: FlowTab, period: PeriodId) {
  const year = new Date().getFullYear();
  if (tab === "inflow") {
    if (period === "month") {
      return "Entrada deste mês";
    }
    if (period === "3m") {
      return "Entrada do trimestre";
    }
    if (period === "6m") {
      return "Entrada do semestre";
    }
    return `Entrada do ano — ${year}`;
  }
  if (tab === "outflow") {
    if (period === "month") {
      return "Saída deste mês";
    }
    if (period === "3m") {
      return "Saída do trimestre";
    }
    if (period === "6m") {
      return "Saída do semestre";
    }
    return `Saída do ano — ${year}`;
  }
  const window =
    period === "month"
      ? "deste mês"
      : period === "3m"
        ? "dos últimos 3 meses"
        : period === "6m"
          ? "do último semestre"
          : "deste ano";
  return `Fluxo geral ${window}`;
}

export function CashFlowPage() {
  const styles = useStyles();
  const router = useRouter();
  const api = useApiService();
  const params = useLocalSearchParams<{ tab?: string | string[] }>();
  const tabFromRoute = parseTab(paramValue(params.tab));
  const [tab, setTab] = useState<FlowTab>(tabFromRoute);
  const [period, setPeriod] = useState<PeriodId>("month");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [transactions, setTransactions] = useState<TransactionItem[] | null>(
    null,
  );

  useEffect(() => {
    setTab(tabFromRoute);
  }, [tabFromRoute]);

  useFocusEffect(
    useCallback(() => {
      void api.modules.transactions
        .list()
        .then((response) => setTransactions(response.items))
        .catch(() => setTransactions([]));
    }, [api.modules.transactions]),
  );

  const visible = useMemo(
    () => (transactions ?? []).filter((item) => !item.hiddenFromTotals),
    [transactions],
  );

  const range = useMemo(() => periodRange(period), [period]);

  const periodItems = useMemo(
    () =>
      visible.filter((item) => inRange(new Date(item.date), range.start, range.end)),
    [range.end, range.start, visible],
  );

  const points = useMemo(
    () =>
      period === "month"
        ? buildDailyPoints(periodItems, range.start, range.end)
        : buildMonthlyPoints(periodItems, range.start, range.end),
    [period, periodItems, range.end, range.start],
  );

  useEffect(() => {
    if (points.length === 0) {
      setSelectedKey(null);
      return;
    }
    const todayKey =
      period === "month" ? dayKey(new Date()) : monthKey(new Date());
    setSelectedKey((current) => {
      if (current && points.some((point) => point.key === current)) {
        return current;
      }
      return (
        points.find((point) => point.key === todayKey)?.key ??
        points[points.length - 1]?.key ??
        null
      );
    });
  }, [period, points]);

  const inflowTotal = periodItems.reduce(
    (sum, item) => (item.type === "CREDIT" ? sum + Math.abs(item.amount) : sum),
    0,
  );
  const outflowTotal = periodItems.reduce(
    (sum, item) => (item.type === "DEBIT" ? sum + Math.abs(item.amount) : sum),
    0,
  );
  const net = inflowTotal - outflowTotal;
  const headline =
    tab === "inflow" ? inflowTotal : tab === "outflow" ? outflowTotal : net;
  const showSign = tab === "outflow" || (tab === "general" && net < 0);

  const listed = useMemo(() => {
    const typed =
      tab === "inflow"
        ? periodItems.filter((item) => item.type === "CREDIT")
        : tab === "outflow"
          ? periodItems.filter((item) => item.type === "DEBIT")
          : periodItems;
    return [...typed]
      .sort(
        (left, right) =>
          new Date(right.date).getTime() - new Date(left.date).getTime(),
      )
      .slice(0, LATEST_LIMIT);
  }, [periodItems, tab]);

  function onSeeAll() {
    router.push("/(tabs)/activities" as const);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => setInfoOpen(false)}
      >
        <View style={styles.header}>
          <View style={styles.headerNav}>
            <BackButton fallbackHref="/(tabs)" />
          </View>
          <Text style={styles.title}>Fluxo de caixa</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.typeTabs}>
            {TYPE_TABS.map((item) => {
              const selected = item.id === tab;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    setInfoOpen(false);
                    setTab(item.id);
                  }}
                  style={[styles.typeTab, selected && styles.typeTabActive]}
                >
                  <Text
                    style={[
                      styles.typeTabLabel,
                      selected && styles.typeTabLabelActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.summary}>
            <Text style={styles.caption}>{captionFor(tab, period)}</Text>
            <View style={styles.totalRow}>
              {showSign ? <Text style={styles.sign}>−</Text> : null}
              <View style={styles.totalAmount}>
                <Text style={styles.totalCoin}>{getCurrencySymbol("BRL")}</Text>
                <Text style={styles.totalValue} numberOfLines={1}>
                  {formatAmount(headline)}
                </Text>
              </View>
              <View collapsable={false} style={styles.infoWrap}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Sobre o fluxo de caixa"
                  accessibilityState={{ expanded: infoOpen }}
                  hitSlop={8}
                  onPress={() => setInfoOpen((open) => !open)}
                  style={styles.infoButton}
                >
                  <CashFlowInfoIcon
                    size={16}
                    color={infoOpen ? "#48ABFE" : undefined}
                  />
                </Pressable>
                {infoOpen ? (
                  <View pointerEvents="none" style={styles.infoTooltip}>
                    <View style={styles.infoTail} />
                    <View style={styles.infoBubble}>
                      <Text style={styles.infoText}>{INFO_COPY}</Text>
                    </View>
                  </View>
                ) : null}
              </View>
            </View>
            {tab === "general" ? (
              <View style={styles.breakdown}>
                <View style={styles.breakdownItem}>
                  <HomeDashInflowIcon size={12} />
                  <Text style={styles.breakdownLabel}>Entrada:</Text>
                  <Text style={styles.breakdownValue}>
                    {getCurrencySymbol("BRL")} {formatAmount(inflowTotal)}
                  </Text>
                </View>
                <View style={styles.breakdownItem}>
                  <HomeDashOutflowIcon size={12} />
                  <Text style={styles.breakdownLabel}>Saída:</Text>
                  <Text style={styles.breakdownValue}>
                    {getCurrencySymbol("BRL")} {formatAmount(outflowTotal)}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          <View style={styles.chartWrap}>
            <CashFlowChart
              points={points}
              selectedKey={selectedKey}
              showInflow={tab !== "outflow"}
              showOutflow={tab !== "inflow"}
              onSelect={setSelectedKey}
              loading={transactions === null}
              title={
                period === "3m"
                  ? "Análise Trimestral"
                  : period === "6m"
                    ? "Análise Semestral"
                    : period === "1y"
                      ? "Análise Anual"
                      : "Análise Mensal"
              }
              axis={period === "month" ? "day" : "month"}
              layout={period === "3m" || period === "6m" ? "fit" : "scroll"}
              inset={period === "3m" ? "wide" : "default"}
            />
          </View>

          <View style={styles.listBlock}>
            <View style={styles.periodTabs}>
              {PERIODS.map((item) => {
                const selected = item.id === period;
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="tab"
                    accessibilityState={{ selected }}
                    onPress={() => {
                      setInfoOpen(false);
                      setPeriod(item.id);
                    }}
                    style={[
                      styles.periodTab,
                      selected && styles.periodTabActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.periodTabLabel,
                        selected && styles.periodTabLabelActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {transactions === null ? (
              <ActivityIndicator color={BearCashColors.primary} />
            ) : listed.length === 0 ? (
              <Text style={styles.empty}>
                Nenhum lançamento neste período
              </Text>
            ) : (
              <View style={styles.list}>
                {listed.map((item) => (
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
                <Button
                  label="Ver todos lançamentos"
                  variant="stroke"
                  onPress={onSeeAll}
                />
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = createThemedStyles(() =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: BearCashColors.background,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 24,
      gap: 24,
      overflow: "visible",
    },
    header: {
      gap: 8,
    },
    headerNav: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    title: {
      ...BearCashTypography.h1,
      color: BearCashColors.text,
    },
    body: {
      gap: 24,
      overflow: "visible",
    },
    typeTabs: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
    },
    typeTab: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 6,
      paddingVertical: 4,
      borderRadius: 40,
      backgroundColor: BearCashColors.surface,
    },
    typeTabActive: {
      backgroundColor: BearCashColors.text,
    },
    typeTabLabel: {
      ...BearCashTypography.caption,
      color: BearCashColors.textMid,
    },
    typeTabLabelActive: {
      fontFamily: BearCashFonts.semiBold,
      color: BearCashColors.onText,
    },
    summary: {
      gap: 8,
      zIndex: 4,
      overflow: "visible",
    },
    caption: {
      ...BearCashTypography.captionSmall,
      color: BearCashColors.textMid,
    },
    totalRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      zIndex: 2,
      overflow: "visible",
    },
    sign: {
      fontFamily: BearCashFonts.semiBold,
      fontSize: 20,
      lineHeight: 24,
      color: BearCashColors.text,
    },
    totalAmount: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      minWidth: 0,
    },
    totalCoin: {
      fontFamily: BearCashFonts.semiBold,
      fontSize: 12,
      lineHeight: 19,
      color: BearCashColors.text,
    },
    totalValue: {
      fontFamily: BearCashFonts.semiBold,
      fontSize: 24,
      lineHeight: 29,
      color: BearCashColors.text,
    },
    infoButton: {
      padding: 4,
    },
    infoWrap: {
      position: "relative",
      alignItems: "center",
      zIndex: 5,
    },
    infoTooltip: {
      position: "absolute",
      top: 24,
      left: "50%",
      width: INFO_TOOLTIP_WIDTH,
      marginLeft: -(INFO_TOOLTIP_WIDTH / 2),
      alignItems: "center",
    },
    infoTail: {
      width: 0,
      height: 0,
      borderLeftWidth: 6,
      borderRightWidth: 6,
      borderBottomWidth: 6,
      borderLeftColor: "transparent",
      borderRightColor: "transparent",
      borderBottomColor: BearCashColors.surface,
    },
    infoBubble: {
      alignSelf: "stretch",
      backgroundColor: BearCashColors.surface,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 6,
      shadowColor: "#0e121b",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.06,
      shadowRadius: 24,
      elevation: 6,
    },
    infoText: {
      ...BearCashTypography.captionSmall,
      color: BearCashColors.textSoft,
      alignSelf: "stretch",
    },
    breakdown: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      zIndex: 1,
    },
    breakdownItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    breakdownLabel: {
      ...BearCashTypography.captionSmall,
      color: BearCashColors.textSoft,
    },
    breakdownValue: {
      fontFamily: BearCashFonts.semiBold,
      fontSize: 12,
      lineHeight: 19,
      color: BearCashColors.text,
    },
    chartWrap: {
      zIndex: 0,
      alignSelf: "stretch",
    },
    listBlock: {
      gap: 16,
    },
    periodTabs: {
      flexDirection: "row",
      alignSelf: "stretch",
      backgroundColor: BearCashColors.surface,
      borderRadius: 40,
      padding: 4,
    },
    periodTab: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 24,
    },
    periodTabActive: {
      backgroundColor: BearCashColors.borderStrong,
    },
    periodTabLabel: {
      ...BearCashTypography.caption,
      color: BearCashColors.textMid,
    },
    periodTabLabelActive: {
      fontFamily: BearCashFonts.semiBold,
      color: BearCashColors.text,
    },
    list: {
      gap: 16,
    },
    empty: {
      ...BearCashTypography.caption,
      color: BearCashColors.textSoft,
    },
  }),
);
