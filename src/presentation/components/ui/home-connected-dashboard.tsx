import { Image } from "expo-image";
import { useMemo, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { OpenFinanceConnection } from "@/infra/http/services/api/modules/open-finance.module";
import type { TransactionItem } from "@/infra/http/services/api/modules/transactions.module";
import { CategoryChipIcon } from "@/presentation/components/ui/activities-category-icons";
import { summarizeCategorySpend } from "@/presentation/components/ui/category-spend";
import { ExpenseArrowIcon } from "@/presentation/components/ui/activities-icons";
import { getCurrencySymbol } from "@/presentation/components/ui/currencies";
import { HighlightCardBorder } from "@/presentation/components/ui/highlight-card-border";
import { TransactionListItem } from "@/presentation/components/ui/transaction-list-item";
import {
  HomeDashInflowIcon,
  HomeDashInstallmentsIcon,
  HomeDashSubscriptionsIcon,
  HomeDashWalletIcon,
} from "@/presentation/components/ui/home-icons";
import { InstitutionMark } from "@/presentation/components/ui/institution-mark";
import { BankMarkStack } from "@/presentation/components/ui/bank-mark-stack";
import { TransactionCardIcon } from "@/presentation/components/ui/new-transaction-icons";
import {
  BearCashColors,
  BearCashFonts,
  BearCashTypography,
} from "@/presentation/constants/theme";
import { createThemedStyles } from "@/presentation/constants/themed-styles";

const CATEGORIES_BEAR = require("@/assets/images/home/categories-bear.jpg");
const OUTFLOW_AMOUNT = "#ffa9aa";
const TREND_MUTED = "#59565d";

type HomeConnectedDashboardProps = {
  connections: OpenFinanceConnection[];
  transactions: TransactionItem[];
  onPressLastTransaction?: (id: string) => void;
  onPressTransactions?: () => void;
  onPressCategories?: () => void;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function firstNumber(record: Record<string, unknown> | null, keys: string[]) {
  if (!record) {
    return null;
  }
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      const numeric = Number(value);
      if (Number.isFinite(numeric)) {
        return numeric;
      }
    }
  }
  return null;
}

function isInstallment(item: TransactionItem) {
  const card = asRecord(item.creditCardMetadata);
  const total = firstNumber(card, ["chargeNumber", "charge_number"]);
  return total != null && total > 1;
}

function formatAmount(amount: number) {
  return Math.abs(amount).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatLegendAmount(amount: number) {
  const whole = Number.isInteger(amount);
  return amount.toLocaleString("pt-BR", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

function normalizeBankName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const BANK_ACCENT_FALLBACK = [
  "#820ad1",
  "#ff6200",
  "#ea1d25",
  "#fde100",
  "#002c4d",
  "#b385e0",
];

function bankAccentColor(name: string) {
  const normalized = normalizeBankName(name);
  if (normalized.includes("nubank")) {
    return "#820ad1";
  }
  if (normalized.includes("itau")) {
    return "#ff6200";
  }
  if (normalized.includes("santander")) {
    return "#ea1d25";
  }
  if (/\bc6\b/.test(normalized) || normalized.includes("c6 bank")) {
    return BearCashColors.text;
  }
  if (normalized.includes("banco do brasil") || normalized.includes("bb ")) {
    return "#fde100";
  }
  if (normalized.includes("caixa")) {
    return "#002c4d";
  }

  let hash = 0;
  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash + normalized.charCodeAt(index)) % BANK_ACCENT_FALLBACK.length;
  }
  return BANK_ACCENT_FALLBACK[hash] ?? BANK_ACCENT_FALLBACK[0];
}

function connectionBalance(connection: OpenFinanceConnection) {
  return connection.accounts.reduce(
    (sum, account) => sum + (account.availableAmount ?? 0),
    0,
  );
}

function formatTrend(current: number, previous: number) {
  if (previous <= 0) {
    return null;
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct}%`;
}

function inMonth(date: Date, year: number, month: number) {
  return date.getFullYear() === year && date.getMonth() === month;
}

function GlassCard({
  children,
  style,
  contentStyle,
}: {
  children: ReactNode;
  style?: object;
  contentStyle?: object | object[];
}) {
  const styles = useStyles();
  return (
    <View style={[styles.glass, style]}>
      <HighlightCardBorder />
      <View style={[styles.glassInner, contentStyle]}>{children}</View>
    </View>
  );
}

function IconHold({ children }: { children: ReactNode }) {
  const styles = useStyles();
  return <View style={styles.iconHold}>{children}</View>;
}

function MoneyRow({
  amount,
  color = BearCashColors.text,
  amountStyle,
}: {
  amount: number;
  color?: string;
  amountStyle?: object;
}) {
  const styles = useStyles();
  return (
    <View style={styles.moneyRow}>
      <Text style={[styles.coin, { color }]}>
        {getCurrencySymbol("BRL")}
      </Text>
      <Text style={[styles.amount, amountStyle, { color }]} numberOfLines={1}>
        {formatAmount(amount)}
      </Text>
    </View>
  );
}

export function HomeConnectedDashboard({
  connections,
  transactions,
  onPressLastTransaction,
  onPressTransactions,
  onPressCategories,
}: HomeConnectedDashboardProps) {
  const styles = useStyles();
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const visible = useMemo(
    () => transactions.filter((item) => !item.hiddenFromTotals),
    [transactions],
  );

  const balance = connections
    .flatMap((item) => item.accounts)
    .reduce((sum, account) => sum + (account.availableAmount ?? 0), 0);
  const isMany = connections.length > 1;
  const shares = connections.map((connection) => ({
    key: connection.institutionId || connection.id,
    name: connection.institutionName,
    amount: connectionBalance(connection),
    color: bankAccentColor(connection.institutionName),
  }));
  const shareTotal = shares.reduce((sum, item) => sum + item.amount, 0);

  const markBank = connections[0];
  const billBanks = connections.filter(
    (connection) => connection.creditCards.length > 0,
  );
  const billStack = billBanks.length > 0 ? billBanks : connections;

  const billCards = connections.flatMap((item) => item.creditCards);
  const billTotal = billCards.reduce(
    (sum, card) => sum + (card.currentBill?.totalAmount ?? 0),
    0,
  );
  const billLast4 = billCards.find((card) => card.last4)?.last4 ?? null;

  const monthFlow = useMemo(() => {
    let credit = 0;
    let debit = 0;
    let prevCredit = 0;
    let prevDebit = 0;
    for (const item of visible) {
      const date = new Date(item.date);
      const value = Math.abs(item.amount);
      if (inMonth(date, now.getFullYear(), now.getMonth())) {
        if (item.type === "CREDIT") {
          credit += value;
        } else {
          debit += value;
        }
      } else if (inMonth(date, prev.getFullYear(), prev.getMonth())) {
        if (item.type === "CREDIT") {
          prevCredit += value;
        } else {
          prevDebit += value;
        }
      }
    }
    return { credit, debit, prevCredit, prevDebit };
  }, [now, prev, visible]);

  const categories = useMemo(() => {
    const spend = summarizeCategorySpend(
      visible,
      now.getFullYear(),
      now.getMonth(),
    );
    return {
      total: spend.total,
      count: spend.items.length,
      top: spend.items[0] ?? null,
    };
  }, [now, visible]);

  const installments = visible.filter(isInstallment).length;
  const recurring = visible.filter((item) => item.recurring);
  const recurringTotal = recurring.reduce(
    (sum, item) => sum + Math.abs(item.amount),
    0,
  );

  const last = useMemo(() => {
    return [...visible].sort(
      (a, b) => Date.parse(b.date) - Date.parse(a.date),
    )[0];
  }, [visible]);

  return (
    <View style={styles.root}>
      <GlassCard
        contentStyle={[styles.balanceInner, isMany && styles.balanceInnerMany]}
      >
        <Text style={styles.label}>Saldo em suas contas</Text>
        <View style={styles.balanceRow}>
          <View style={styles.balanceValue}>
            <IconHold>
              <HomeDashWalletIcon size={12} />
            </IconHold>
            <MoneyRow amount={balance} />
          </View>
          {isMany ? (
            <BankMarkStack connections={connections} maxVisible={2} />
          ) : markBank ? (
            <InstitutionMark
              name={markBank.institutionName}
              logoUrl={markBank.institutionLogoUrl}
              size={20}
            />
          ) : null}
        </View>
        {isMany ? (
          <>
            <View style={styles.allocationBar}>
              {shares.map((share) => (
                <View
                  key={share.key}
                  style={[
                    styles.allocationSegment,
                    {
                      backgroundColor: share.color,
                      flex: shareTotal > 0 ? Math.max(share.amount, 0) : 1,
                    },
                  ]}
                />
              ))}
            </View>
            <View style={styles.legend}>
              {shares.map((share) => (
                <View key={share.key} style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: share.color }]}
                  />
                  <Text style={styles.legendName} numberOfLines={1}>
                    {share.name}
                  </Text>
                  <View style={styles.legendDivider} />
                  <Text style={styles.legendAmount}>
                    {getCurrencySymbol("BRL")}
                    {formatLegendAmount(share.amount)}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </GlassCard>

      <View style={styles.row}>
        <GlassCard style={styles.flexCard} contentStyle={styles.flowInner}>
          <View style={styles.flowHeader}>
            <Text style={styles.label}>Entrada</Text>
            {formatTrend(monthFlow.credit, monthFlow.prevCredit) ? (
              <Text style={styles.trend}>
                {formatTrend(monthFlow.credit, monthFlow.prevCredit)}
              </Text>
            ) : null}
          </View>
          <View style={styles.flowValue}>
            <IconHold>
              <HomeDashInflowIcon size={12} />
            </IconHold>
            <MoneyRow amount={monthFlow.credit} />
          </View>
        </GlassCard>

        <GlassCard style={styles.flexCard} contentStyle={styles.flowInner}>
          <View style={styles.flowHeader}>
            <Text style={styles.label}>Saída</Text>
            {formatTrend(monthFlow.debit, monthFlow.prevDebit) ? (
              <Text style={styles.trend}>
                {formatTrend(monthFlow.debit, monthFlow.prevDebit)}
              </Text>
            ) : null}
          </View>
          <View style={styles.flowValue}>
            <IconHold>
              <ExpenseArrowIcon size={12} />
            </IconHold>
            <MoneyRow amount={monthFlow.debit} color={OUTFLOW_AMOUNT} />
          </View>
        </GlassCard>
      </View>

      <GlassCard contentStyle={styles.billInner}>
        <View style={styles.billCopy}>
          <Text style={styles.label}>Total fatura atual</Text>
          <View style={styles.billValue}>
            <IconHold>
              <TransactionCardIcon size={12} color="#B385E0" />
            </IconHold>
            <MoneyRow amount={billTotal} />
          </View>
        </View>
        {isMany ? (
          <BankMarkStack connections={billStack} maxVisible={3} />
        ) : billLast4 || markBank ? (
          <View style={styles.billCardMeta}>
            {markBank ? (
              <InstitutionMark
                name={markBank.institutionName}
                logoUrl={markBank.institutionLogoUrl}
                size={20}
              />
            ) : null}
            {billLast4 ? (
              <Text style={styles.billLast4}>**{billLast4}</Text>
            ) : null}
          </View>
        ) : null}
      </GlassCard>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Total em categorias"
        onPress={onPressCategories}
        style={({ pressed }) => [
          styles.categoriesCard,
          pressed && styles.categoriesPressed,
        ]}
      >
        <Image
          source={CATEGORIES_BEAR}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
        <View style={styles.categoriesDim} />
        <View style={styles.categoriesInner}>
          <View style={styles.categoriesCopy}>
            <Text style={styles.label}>Total em categorias</Text>
            <MoneyRow amount={categories.total} />
            <Text style={styles.label}>
              {String(categories.count).padStart(2, "0")}{" "}
              {categories.count === 1 ? "Categoria" : "Categorias"}
            </Text>
          </View>
          {categories.top ? (
            <View style={styles.categoryChip}>
              <View style={styles.categoryChipMain}>
                <CategoryChipIcon
                  iconKey={categories.top.iconKey}
                  color="#D9C1F0"
                  size={12}
                />
                <Text style={styles.categoryChipLabel} numberOfLines={1}>
                  {categories.top.label}
                </Text>
              </View>
              <MoneyRow
                amount={categories.top.amount}
                amountStyle={styles.categoryChipAmount}
              />
            </View>
          ) : null}
        </View>
      </Pressable>

      <View style={styles.row}>
        <GlassCard style={styles.flexCard} contentStyle={styles.metricInner}>
          <Text style={styles.label}>Parcelamentos</Text>
          <View style={styles.metricValue}>
            <IconHold>
              <HomeDashInstallmentsIcon size={12} />
            </IconHold>
            <Text style={styles.metricNumber} numberOfLines={1}>
              {installments}
            </Text>
          </View>
          <Text style={styles.label}>Em andamento</Text>
        </GlassCard>

        <GlassCard style={styles.flexCard} contentStyle={styles.metricInner}>
          <Text style={styles.label}>Assinaturas</Text>
          <View style={styles.metricValue}>
            <IconHold>
              <HomeDashSubscriptionsIcon size={12} />
            </IconHold>
            <MoneyRow amount={recurringTotal} />
          </View>
          <Text style={styles.label}>
            {String(recurring.length).padStart(2, "0")}{" "}
            {recurring.length === 1 ? "Ativa" : "Ativas"}
          </Text>
        </GlassCard>
      </View>

      <GlassCard contentStyle={styles.lastInner}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ver transações"
          onPress={onPressTransactions}
          style={styles.lastHeader}
        >
          <Text style={styles.lastTitle}>Última transação</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{visible.length}</Text>
          </View>
        </Pressable>
        {last ? (
          <TransactionListItem
            item={last}
            onPress={
              onPressLastTransaction
                ? () => onPressLastTransaction(last.id)
                : undefined
            }
          />
        ) : (
          <Text style={styles.emptyLast}>Nenhuma transação ainda</Text>
        )}
      </GlassCard>
    </View>
  );
}

const useStyles = createThemedStyles(() => StyleSheet.create({
  root: {
    gap: 16,
  },
  glass: {
    borderRadius: 12,
    overflow: "hidden",
    padding: 1,
  },
  glassInner: {
    backgroundColor: BearCashColors.surface,
    borderRadius: 12,
    padding: 18,
  },
  label: {
    ...BearCashTypography.captionSmall,
    color: BearCashColors.textMid,
  },
  balanceInner: {
    gap: 10,
  },
  balanceInnerMany: {
    gap: 16,
  },
  allocationBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    height: 12,
    alignSelf: "stretch",
  },
  allocationSegment: {
    height: 12,
    borderRadius: 40,
    minWidth: 4,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
    alignSelf: "stretch",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendName: {
    ...BearCashTypography.captionSmall,
    color: BearCashColors.textMid,
    maxWidth: 120,
  },
  legendDivider: {
    width: 1,
    height: 9,
    backgroundColor: BearCashColors.borderStrong,
  },
  legendAmount: {
    ...BearCashTypography.captionSmall,
    color: BearCashColors.text,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  balanceValue: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconHold: {
    backgroundColor: BearCashColors.neutralBase,
    borderRadius: 4,
    padding: 4,
  },
  moneyRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  coin: {
    fontFamily: BearCashFonts.semiBold,
    fontSize: 12,
    lineHeight: 19,
    color: BearCashColors.text,
  },
  amount: {
    flex: 1,
    fontFamily: BearCashFonts.semiBold,
    fontSize: 18,
    lineHeight: 22,
    color: BearCashColors.text,
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 16,
  },
  flexCard: {
    flex: 1,
    minWidth: 0,
  },
  flowInner: {
    gap: 8,
    padding: 16,
  },
  flowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  trend: {
    ...BearCashTypography.captionSmall,
    color: TREND_MUTED,
  },
  flowValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  billInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  billCopy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  billValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  billCardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  billLast4: {
    fontFamily: BearCashFonts.semiBold,
    fontSize: 14,
    lineHeight: 22,
    color: BearCashColors.text,
  },
  categoriesCard: {
    borderRadius: 12,
    overflow: "hidden",
    minHeight: 148,
  },
  categoriesPressed: {
    opacity: 0.92,
  },
  categoriesDim: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  categoriesInner: {
    minHeight: 148,
    padding: 18,
    gap: 10,
    justifyContent: "space-between",
    backgroundColor: "rgba(18,19,17,0.4)",
  },
  categoriesCopy: {
    width: 120,
    gap: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    borderWidth: 1,
    borderColor: "#99959d",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  categoryChipMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  categoryChipLabel: {
    flex: 1,
    ...BearCashTypography.caption,
    color: BearCashColors.textMid,
  },
  categoryChipAmount: {
    fontSize: 14,
    lineHeight: 22,
    flex: 0,
  },
  metricInner: {
    gap: 8,
    padding: 16,
  },
  metricValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metricNumber: {
    flex: 1,
    fontFamily: BearCashFonts.semiBold,
    fontSize: 18,
    lineHeight: 22,
    color: BearCashColors.text,
  },
  lastInner: {
    gap: 8,
  },
  lastHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  lastTitle: {
    ...BearCashTypography.caption,
    color: BearCashColors.textMid,
  },
  countBadge: {
    backgroundColor: BearCashColors.textAccent,
    borderRadius: 999,
    paddingHorizontal: 4,
    minWidth: 20,
    alignItems: "center",
  },
  countBadgeText: {
    ...BearCashTypography.captionSmall,
    color: BearCashColors.buttonFilledText,
  },
  emptyLast: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
  },
}));
