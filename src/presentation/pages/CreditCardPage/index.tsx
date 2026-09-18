import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type {
  CreditCardInstallmentPlan,
  CreditCardOverviewItem,
} from "@/infra/http/services/api/modules/open-finance.module";
import { MONTHS_LONG } from "@/presentation/components/ui/calendar";
import { BackButton } from "@/presentation/components/ui/back-button";
import {
  CreditCardBillSummary,
  CreditCardCompactSummary,
  creditCardBillUsage,
} from "@/presentation/components/ui/credit-card-bill-summary";
import {
  CreditCardBillsChart,
  type CreditCardBillMonthPoint,
} from "@/presentation/components/ui/credit-card-bills-chart";
import { CreditCardDayCalendar } from "@/presentation/components/ui/credit-card-day-calendar";
import { CreditCardInstallmentCard } from "@/presentation/components/ui/credit-card-installment-card";
import { CreditCardLimitCard } from "@/presentation/components/ui/credit-card-limit-card";
import { CreditCardLimitDonut } from "@/presentation/components/ui/credit-card-limit-donut";
import { CreditCardMonthCalendar } from "@/presentation/components/ui/credit-card-month-calendar";
import {
  CreditCardCalendarIcon,
  CreditCardListIcon,
  CreditCardStackIcon,
} from "@/presentation/components/ui/credit-card-icons";
import { getCurrencySymbol } from "@/presentation/components/ui/currencies";
import { InstitutionMark } from "@/presentation/components/ui/institution-mark";
import {
  BearCashColors,
  BearCashFonts,
  BearCashTypography,
  getBearCashScheme,
} from "@/presentation/constants/theme";
import { createThemedStyles } from "@/presentation/constants/themed-styles";
import { useApiService } from "@/presentation/hooks/use-api-service";

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

const TABS = [
  { id: "invoices", label: "Faturas" },
  { id: "installments", label: "Parcelas" },
  { id: "limits", label: "Limites" },
] as const;

const CALENDAR_TABS = [
  { id: "monthly", label: "Mensal" },
  { id: "daily", label: "Diária" },
] as const;

type CreditCardTab = (typeof TABS)[number]["id"];
type CreditCardView = "list" | "calendar";
type CalendarPeriod = (typeof CALENDAR_TABS)[number]["id"];
const ALL_CARDS = "all";

type BankChip = {
  id: string;
  name: string;
  logoUrl: string | null;
  last4: string | null;
};

function formatAmount(amount: number) {
  return Math.abs(amount).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function monthLabel(month: string) {
  const part = month.split("-")[1];
  const index = Number(part) - 1;
  return MONTH_SHORT[index] ?? month;
}

function monthLongLabel(month: string | null) {
  if (!month) {
    return MONTHS_LONG[new Date().getMonth()] ?? "";
  }
  const part = month.split("-")[1];
  const index = Number(part) - 1;
  return MONTHS_LONG[index] ?? month;
}

function bankChipLabel(bank: BankChip) {
  if (bank.last4) {
    return `${bank.name} •••${bank.last4}`;
  }
  return bank.name;
}

function formatDueLong(date: Date) {
  const month = MONTHS_LONG[date.getMonth()] ?? "";
  return `${date.getDate()} de ${month} — ${date.getFullYear()}`;
}

function soonestDue(cards: CreditCardOverviewItem[]) {
  const dates = cards
    .map((item) => item.dueDate)
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((left, right) => left.getTime() - right.getTime());
  return dates[0] ?? null;
}

function uniqueBanks(items: CreditCardOverviewItem[]): BankChip[] {
  const seen = new Map<string, BankChip>();
  for (const item of items) {
    if (seen.has(item.id)) {
      continue;
    }
    seen.set(item.id, {
      id: item.id,
      name: item.institutionName,
      logoUrl: item.institutionLogoUrl,
      last4: item.last4 ?? item.accountLast4,
    });
  }
  return [...seen.values()];
}

function aggregateMonths(items: CreditCardOverviewItem[]): CreditCardBillMonthPoint[] {
  const keys = items[0]?.months.map((point) => point.month) ?? [];
  return keys.map((month, index) => {
    let amount = 0;
    let hasData = false;
    for (const item of items) {
      const point = item.months[index];
      if (!point) {
        continue;
      }
      amount += point.amount;
      hasData = hasData || point.hasData;
    }
    return {
      key: month,
      label: monthLabel(month),
      amount: Math.round(amount * 100) / 100,
      hasData,
    };
  });
}

export function CreditCardPage() {
  const styles = useStyles();
  const api = useApiService();
  const [items, setItems] = useState<CreditCardOverviewItem[] | null>(null);
  const [installments, setInstallments] = useState<
    CreditCardInstallmentPlan[] | null
  >(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState(ALL_CARDS);
  const [tab, setTab] = useState<CreditCardTab>("invoices");
  const [viewMode, setViewMode] = useState<CreditCardView>("list");
  const [calendarPeriod, setCalendarPeriod] =
    useState<CalendarPeriod>("monthly");
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void api.modules.openFinance
        .listCreditCards()
        .then((response) => setItems(response.items))
        .catch(() => setItems([]));
      void api.modules.openFinance
        .listCreditCardInstallments()
        .then((response) => setInstallments(response.items))
        .catch(() => setInstallments([]));
    }, [api.modules.openFinance]),
  );

  const cards = items ?? [];
  const banks = useMemo(() => uniqueBanks(cards), [cards]);
  const visibleCards = useMemo(() => {
    if (selectedConnectionId === ALL_CARDS) {
      return cards;
    }
    return cards.filter((item) => item.id === selectedConnectionId);
  }, [cards, selectedConnectionId]);
  const visibleInstallments = useMemo(() => {
    const plans = installments ?? [];
    if (selectedConnectionId === ALL_CARDS) {
      return plans;
    }
    return plans.filter((item) => item.creditCardId === selectedConnectionId);
  }, [installments, selectedConnectionId]);

  useEffect(() => {
    if (
      selectedConnectionId !== ALL_CARDS &&
      !banks.some((bank) => bank.id === selectedConnectionId)
    ) {
      setSelectedConnectionId(ALL_CARDS);
    }
  }, [banks, selectedConnectionId]);

  const monthPoints = useMemo(
    () => aggregateMonths(visibleCards),
    [visibleCards],
  );

  useEffect(() => {
    if (monthPoints.length === 0) {
      setSelectedMonthKey(null);
      return;
    }
    setSelectedMonthKey((current) => {
      if (current && monthPoints.some((point) => point.key === current)) {
        return current;
      }
      const withData = [...monthPoints].reverse().find((point) => point.hasData);
      return withData?.key ?? monthPoints[monthPoints.length - 1]?.key ?? null;
    });
  }, [monthPoints]);

  const semesterTotal = monthPoints.reduce(
    (sum, point) => sum + point.amount,
    0,
  );
  const committedTotal = visibleCards.reduce(
    (sum, item) => sum + (item.usedAmount ?? 0),
    0,
  );
  const remainingLimit = visibleCards.reduce(
    (sum, item) => sum + (item.availableLimit ?? 0),
    0,
  );
  const limitUsage = useMemo(() => {
    let used = 0;
    let available = 0;
    let total = 0;
    for (const item of visibleCards) {
      const usage = creditCardBillUsage(item);
      used += usage.used;
      available +=
        item.availableLimit ?? Math.max((usage.total ?? 0) - usage.used, 0);
      total += usage.total ?? 0;
    }
    return { used, available, total };
  }, [visibleCards]);
  const usedPercent =
    limitUsage.total > 0 ? (limitUsage.used / limitUsage.total) * 100 : 0;
  const nextDue = soonestDue(visibleCards);
  const loading = items === null;
  const installmentsLoading = installments === null;
  const calendarMonth = useMemo(() => {
    const due = nextDue ?? soonestDue(cards);
    if (due) {
      return new Date(due.getFullYear(), due.getMonth(), 1);
    }
    return new Date();
  }, [cards, nextDue]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <BackButton fallbackHref="/(tabs)" />
          <View style={styles.headerRow}>
            <Text style={styles.title}>Cartão de crédito</Text>
            <View style={styles.switcher}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ver lista"
                accessibilityState={{ selected: viewMode === "list" }}
                onPress={() => setViewMode("list")}
                style={[
                  styles.switcherItem,
                  viewMode === "list" && styles.switcherItemActive,
                ]}
              >
                <CreditCardListIcon
                  size={16}
                  color={
                    viewMode === "list"
                      ? BearCashColors.onText
                      : BearCashColors.iconMuted
                  }
                />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ver calendário"
                accessibilityState={{ selected: viewMode === "calendar" }}
                onPress={() => setViewMode("calendar")}
                style={[
                  styles.switcherItem,
                  viewMode === "calendar" && styles.switcherItemActive,
                ]}
              >
                <CreditCardCalendarIcon
                  size={16}
                  color={
                    viewMode === "calendar"
                      ? BearCashColors.onText
                      : BearCashColors.iconMuted
                  }
                />
              </Pressable>
            </View>
          </View>
        </View>

        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chips}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: selectedConnectionId === ALL_CARDS }}
            onPress={() => setSelectedConnectionId(ALL_CARDS)}
            style={[
              styles.chip,
              selectedConnectionId === ALL_CARDS && styles.chipSelected,
            ]}
          >
            <CreditCardStackIcon
              size={16}
              color={
                selectedConnectionId === ALL_CARDS
                  ? BearCashColors.onText
                  : BearCashColors.textMid
              }
            />
            <Text
              style={[
                styles.chipLabel,
                selectedConnectionId === ALL_CARDS && styles.chipLabelSelected,
              ]}
            >
              Todos os cartões
            </Text>
          </Pressable>
          {banks.map((bank) => {
            const selected = selectedConnectionId === bank.id;
            return (
              <Pressable
                key={bank.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setSelectedConnectionId(bank.id)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <InstitutionMark
                  name={bank.name}
                  logoUrl={bank.logoUrl}
                  size={20}
                />
                <Text
                  style={[
                    styles.chipLabelMuted,
                    selected && styles.chipLabelSelected,
                  ]}
                  numberOfLines={1}
                >
                  {bankChipLabel(bank)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.summary}>
          {tab === "limits" ? (
            <>
              <View style={styles.summaryCopy}>
                <Text style={styles.summaryCaption}>Limite total utilizado</Text>
                <View style={styles.limitUsedRow}>
                  <View style={styles.usedDot} />
                  <View style={styles.summaryAmount}>
                    <Text style={styles.summaryCoin}>
                      {getCurrencySymbol("BRL")}
                    </Text>
                    <Text style={styles.summaryValue} numberOfLines={1}>
                      {formatAmount(limitUsage.used)}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.remainRow}>
                <View style={styles.availableDot} />
                <Text style={styles.remainLabel}>Limite disponível:</Text>
                <Text style={styles.remainValue}>
                  {`${getCurrencySymbol("BRL")} ${formatAmount(limitUsage.available)}`}
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.summaryCopy}>
                <Text style={styles.summaryCaption}>
                  {tab === "installments"
                    ? `Comprometido em ${monthLongLabel(selectedMonthKey)}`
                    : "Fluxo geral do último semestre"}
                </Text>
                <View style={styles.summaryAmount}>
                  <Text style={styles.summaryCoin}>
                    {getCurrencySymbol("BRL")}
                  </Text>
                  <Text style={styles.summaryValue} numberOfLines={1}>
                    {formatAmount(
                      tab === "installments" ? committedTotal : semesterTotal,
                    )}
                  </Text>
                </View>
              </View>
              {tab === "installments" ? (
                <View style={styles.remainRow}>
                  <Text style={styles.remainLabel}>Restam:</Text>
                  <Text style={styles.remainValue}>
                    {`${getCurrencySymbol("BRL")} ${formatAmount(remainingLimit)}`}
                  </Text>
                </View>
              ) : nextDue ? (
                <Text style={styles.dueCaption}>
                  Próximo vencimento em {formatDueLong(nextDue)}
                </Text>
              ) : null}
            </>
          )}
        </View>

        {viewMode === "list" && tab === "limits" ? (
          <CreditCardLimitDonut percent={usedPercent} />
        ) : viewMode === "list" ? (
          <CreditCardBillsChart
            points={monthPoints}
            selectedKey={selectedMonthKey}
            onSelect={setSelectedMonthKey}
            loading={loading}
          />
        ) : null}

        {viewMode === "list" ? (
        <View style={styles.tabBlock}>
          <View style={styles.tabs}>
            {TABS.map((item) => {
              const selected = item.id === tab;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  onPress={() => setTab(item.id)}
                  style={[styles.tab, selected && styles.tabActive]}
                >
                  <Text
                    style={[styles.tabLabel, selected && styles.tabLabelActive]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {tab === "invoices" ? (
            loading ? null : visibleCards.length === 0 ? (
              <Text style={styles.empty}>Nenhum cartão conectado ainda</Text>
            ) : (
              <View style={styles.cards}>
                {visibleCards.map((item) =>
                  visibleCards.length > 1 ? (
                    <CreditCardCompactSummary key={item.id} item={item} />
                  ) : (
                    <CreditCardBillSummary key={item.id} item={item} />
                  ),
                )}
              </View>
            )
          ) : tab === "installments" ? (
            installmentsLoading ? null : visibleInstallments.length === 0 ? (
              <Text style={styles.empty}>Nenhuma parcela em andamento</Text>
            ) : (
              <View style={styles.cards}>
                {visibleInstallments.map((item) => (
                  <CreditCardInstallmentCard key={item.id} item={item} />
                ))}
              </View>
            )
          ) : tab === "limits" ? (
            loading ? null : visibleCards.length === 0 ? (
              <Text style={styles.empty}>Nenhum cartão conectado ainda</Text>
            ) : (
              <View style={styles.cards}>
                {visibleCards.map((item) => (
                  <CreditCardLimitCard key={item.id} item={item} />
                ))}
              </View>
            )
          ) : null}
        </View>
        ) : (
          <View style={styles.tabBlock}>
            <View style={styles.tabs}>
              {CALENDAR_TABS.map((item) => {
                const selected = item.id === calendarPeriod;
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="tab"
                    accessibilityState={{ selected }}
                    onPress={() => setCalendarPeriod(item.id)}
                    style={[styles.tab, selected && styles.tabActive]}
                  >
                    <Text
                      style={[
                        styles.tabLabel,
                        selected && styles.tabLabelActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {calendarPeriod === "monthly" ? (
              <CreditCardMonthCalendar
                month={calendarMonth}
                cards={visibleCards}
              />
            ) : (
              <CreditCardDayCalendar cards={visibleCards} />
            )}
          </View>
        )}
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
    },
    header: {
      gap: 8,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
    },
    title: {
      flex: 1,
      ...BearCashTypography.h1,
      color: BearCashColors.text,
    },
    switcher: {
      flexShrink: 0,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      padding: 2,
      borderRadius: 80,
      backgroundColor: BearCashColors.neutralBase,
    },
    switcherItem: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    switcherItemActive: {
      backgroundColor: BearCashColors.iconMuted,
    },
    chipsScroll: {
      flexGrow: 0,
      marginHorizontal: -16,
    },
    chips: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flexGrow: 1,
      minWidth: "100%",
      paddingHorizontal: 16,
    },
    chip: {
      flexShrink: 0,
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 40,
      backgroundColor: BearCashColors.surface,
    },
    chipSelected: {
      backgroundColor: BearCashColors.text,
    },
    chipLabel: {
      fontFamily: BearCashFonts.semiBold,
      fontSize: 14,
      lineHeight: 22,
      color: BearCashColors.textMid,
    },
    chipLabelMuted: {
      ...BearCashTypography.bodySmall,
      color: BearCashColors.textMid,
    },
    chipLabelSelected: {
      fontFamily: BearCashFonts.semiBold,
      color: BearCashColors.onText,
    },
    summary: {
      gap: 4,
    },
    summaryCopy: {
      gap: 8,
    },
    limitUsedRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    usedDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor:
        getBearCashScheme() === "dark" ? "#A670DB" : BearCashColors.iconAccent,
    },
    availableDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      borderWidth: 1,
      borderColor: BearCashColors.textSoft,
    },
    summaryCaption: {
      ...BearCashTypography.caption,
      color: BearCashColors.textMid,
    },
    summaryAmount: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    },
    summaryCoin: {
      fontFamily: BearCashFonts.semiBold,
      fontSize: 12,
      lineHeight: 19,
      color: BearCashColors.text,
    },
    summaryValue: {
      fontFamily: BearCashFonts.semiBold,
      fontSize: 24,
      lineHeight: 29,
      color: BearCashColors.text,
    },
    dueCaption: {
      ...BearCashTypography.captionSmall,
      color: BearCashColors.textMid,
    },
    remainRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    remainLabel: {
      ...BearCashTypography.captionSmall,
      color: BearCashColors.textSoft,
    },
    remainValue: {
      fontFamily: BearCashFonts.semiBold,
      fontSize: 12,
      lineHeight: 19,
      color: BearCashColors.text,
    },
    tabBlock: {
      gap: 16,
    },
    tabs: {
      flexDirection: "row",
      alignSelf: "stretch",
      padding: 4,
      borderRadius: 40,
      backgroundColor: BearCashColors.surface,
    },
    tab: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 24,
    },
    tabActive: {
      backgroundColor: BearCashColors.borderStrong,
    },
    tabLabel: {
      ...BearCashTypography.caption,
      color: BearCashColors.textMid,
    },
    tabLabelActive: {
      fontFamily: BearCashFonts.semiBold,
      color: BearCashColors.text,
    },
    cards: {
      gap: 16,
    },
    empty: {
      ...BearCashTypography.caption,
      color: BearCashColors.textSoft,
    },
  }),
);
