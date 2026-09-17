import { Image } from "expo-image";
import { useMemo, useState, type ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import type { OpenFinanceConnection } from "@/infra/http/services/api/modules/open-finance.module";
import type { TransactionItem } from "@/infra/http/services/api/modules/transactions.module";
import { CategoryChipIcon } from "@/presentation/components/ui/activities-category-icons";
import { summarizeCategorySpend } from "@/presentation/components/ui/category-spend";
import { getCurrencySymbol } from "@/presentation/components/ui/currencies";
import { HighlightCardBorder } from "@/presentation/components/ui/highlight-card-border";
import { TransactionListItem } from "@/presentation/components/ui/transaction-list-item";
import {
  HomeDashCardIcon,
  HomeDashInflowIcon,
  HomeDashInstallmentsIcon,
  HomeDashOutflowIcon,
  HomeDashSubscriptionsIcon,
  HomeDashWalletIcon,
  MastercardBrandMark,
} from "@/presentation/components/ui/home-icons";
import { InstitutionMark } from "@/presentation/components/ui/institution-mark";
import { BankMarkStack } from "@/presentation/components/ui/bank-mark-stack";
import {
  BearCashColors,
  BearCashFonts,
  BearCashTypography,
} from "@/presentation/constants/theme";
import { createThemedStyles } from "@/presentation/constants/themed-styles";

const CATEGORIES_BEAR = require("@/assets/images/home/categories-bear.jpg");
const BILL_TILE_WIDTH = 260;
const BILL_TILE_GAP = 10;

type HomeConnectedDashboardProps = {
  connections: OpenFinanceConnection[];
  transactions: TransactionItem[];
  onPressLastTransaction?: (id: string) => void;
  onPressTransactions?: () => void;
  onPressCategories?: () => void;
  onPressInflow?: () => void;
  onPressOutflow?: () => void;
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

function isMastercard(network: string | null) {
  return Boolean(network && /mastercard/i.test(network));
}

function cardCaption(
  institutionName: string,
  name: string | null,
  last4: string | null,
  mask = "***",
) {
  const title = [institutionName, name].filter(Boolean).join(" ");
  if (last4) {
    return `${title} ${mask}${last4}`;
  }
  return title;
}

type BillEntry = {
  connection: OpenFinanceConnection;
  card: OpenFinanceConnection["creditCards"][number];
};

function invoiceAmount(card: BillEntry["card"]) {
  return card.usedAmount ?? card.currentBill?.totalAmount ?? 0;
}

function billUsage(card: BillEntry["card"]) {
  const used = invoiceAmount(card);
  const available = card.availableLimit;
  const total = available != null ? used + available : null;
  return { used, total };
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

function IconHold({
  children,
  pad = 4,
  radius = 4,
}: {
  children: ReactNode;
  pad?: number;
  radius?: number;
}) {
  const styles = useStyles();
  return (
    <View style={[styles.iconHold, { padding: pad, borderRadius: radius }]}>
      {children}
    </View>
  );
}

function MoneyRow({
  amount,
  color = BearCashColors.text,
  amountStyle,
  fill = true,
}: {
  amount: number;
  color?: string;
  amountStyle?: object;
  fill?: boolean;
}) {
  const styles = useStyles();
  return (
    <View style={[styles.moneyRow, fill ? styles.moneyRowFill : null]}>
      <Text style={[styles.coin, { color }]}>
        {getCurrencySymbol("BRL")}
      </Text>
      <Text
        style={[
          styles.amount,
          fill ? styles.amountFill : null,
          amountStyle,
          { color },
        ]}
        numberOfLines={1}
      >
        {formatAmount(amount)}
      </Text>
    </View>
  );
}

function BillsCarousel({
  items,
  total,
}: {
  items: BillEntry[];
  total: number;
}) {
  const styles = useStyles();
  const [page, setPage] = useState(0);
  const interval = BILL_TILE_WIDTH + BILL_TILE_GAP;

  function onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(event.nativeEvent.contentOffset.x / interval);
    const clamped = Math.max(0, Math.min(next, items.length - 1));
    if (clamped !== page) {
      setPage(clamped);
    }
  }

  return (
    <GlassCard contentStyle={styles.billManyInner}>
      <View style={styles.billManyHeader}>
        <View style={styles.billCopy}>
          <Text style={styles.label}>Total fatura atual</Text>
          <View style={styles.billValue}>
            <IconHold pad={6} radius={8}>
              <HomeDashCardIcon size={16} />
            </IconHold>
            <MoneyRow amount={total} />
          </View>
        </View>
        {items.length > 1 ? (
          <View style={styles.billDots}>
            {items.map((item, index) => (
              <View
                key={item.card.id}
                style={[
                  styles.billDot,
                  index === page && styles.billDotActive,
                ]}
              />
            ))}
          </View>
        ) : null}
      </View>
      <ScrollView
        horizontal
        nestedScrollEnabled
        directionalLockEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToOffsets={items.map((_, index) => index * interval)}
        disableIntervalMomentum
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.billCarousel}
      >
        {items.map((item) => {
          const usage = billUsage(item.card);
          return (
            <View key={item.card.id} style={styles.billTile}>
              <View style={styles.billTileHeader}>
                <InstitutionMark
                  name={item.connection.institutionName}
                  logoUrl={item.connection.institutionLogoUrl}
                  size={24}
                />
                <Text style={styles.billTileTitle} numberOfLines={1}>
                  {cardCaption(
                    item.connection.institutionName,
                    item.card.name,
                    item.card.last4,
                    "•••",
                  )}
                </Text>
              </View>
              <View style={styles.billTileBody}>
                <View style={styles.billTileBar}>
                  <View
                    style={[
                      styles.billTileUsed,
                      { flex: Math.max(usage.used, 0) },
                    ]}
                  />
                  <View
                    style={[
                      styles.billTileRest,
                      {
                        flex: Math.max(
                          (usage.total ?? usage.used) - usage.used,
                          0.01,
                        ),
                      },
                    ]}
                  />
                </View>
                <View style={styles.limitLegend}>
                  <View style={styles.limitLegendItem}>
                    <Text style={styles.limitLegendLabel}>Usado:</Text>
                    <Text style={styles.limitLegendValue}>
                      {getCurrencySymbol("BRL")} {formatAmount(usage.used)}
                    </Text>
                  </View>
                  <View style={styles.limitLegendItem}>
                    <Text style={styles.limitLegendLabel}>Total:</Text>
                    <Text style={styles.limitLegendValue}>
                      {getCurrencySymbol("BRL")}{" "}
                      {formatAmount(usage.total ?? usage.used)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </GlassCard>
  );
}

export function HomeConnectedDashboard({
  connections,
  transactions,
  onPressLastTransaction,
  onPressTransactions,
  onPressCategories,
  onPressInflow,
  onPressOutflow,
}: HomeConnectedDashboardProps) {
  const styles = useStyles();
  const now = new Date();

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

  const billCards = connections.flatMap((item) =>
    item.creditCards.map((card) => ({
      connection: item,
      card,
    })),
  );
  const billTotal = billCards.reduce(
    (sum, item) => sum + invoiceAmount(item.card),
    0,
  );
  const primaryBill = billCards[0] ?? null;
  const billUsed = primaryBill ? invoiceAmount(primaryBill.card) : billTotal;
  const billAvailable = primaryBill?.card.availableLimit ?? null;
  const billLimitTotal =
    billAvailable != null ? billUsed + billAvailable : null;

  const monthFlow = useMemo(() => {
    let credit = 0;
    let debit = 0;
    for (const item of visible) {
      const date = new Date(item.date);
      const value = Math.abs(item.amount);
      if (!inMonth(date, now.getFullYear(), now.getMonth())) {
        continue;
      }
      if (item.type === "CREDIT") {
        credit += value;
      } else {
        debit += value;
      }
    }
    return { credit, debit };
  }, [now, visible]);

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
            <BankMarkStack connections={connections} maxVisible={3} />
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

      <View style={styles.flowRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Entrada"
          onPress={onPressInflow}
          disabled={!onPressInflow}
          style={({ pressed }) => [
            styles.flexCard,
            pressed && onPressInflow ? styles.flowPressed : null,
          ]}
        >
          <GlassCard style={styles.flowCardFill} contentStyle={styles.flowInnerSingle}>
            <IconHold pad={3}>
              <HomeDashInflowIcon size={18} />
            </IconHold>
            <View style={styles.flowCopy}>
              <Text style={styles.label}>Entrada</Text>
              <MoneyRow
                amount={monthFlow.credit}
                fill={false}
                amountStyle={styles.flowAmount}
              />
            </View>
          </GlassCard>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Saída"
          onPress={onPressOutflow}
          disabled={!onPressOutflow}
          style={({ pressed }) => [
            styles.flexCard,
            pressed && onPressOutflow ? styles.flowPressed : null,
          ]}
        >
          <GlassCard
            style={styles.flowCardFill}
            contentStyle={styles.flowInnerSingle}
          >
            <IconHold pad={3}>
              <HomeDashOutflowIcon size={18} />
            </IconHold>
            <View style={styles.flowCopy}>
              <Text style={styles.label}>Saída</Text>
              <MoneyRow
                amount={monthFlow.debit}
                fill={false}
                amountStyle={styles.flowAmount}
              />
            </View>
          </GlassCard>
        </Pressable>
      </View>

      {billCards.length > 1 ? (
        <BillsCarousel items={billCards} total={billTotal} />
      ) : (
        <GlassCard contentStyle={styles.billSingleInner}>
          {primaryBill ? (
            <View style={styles.billHeader}>
              <View style={styles.billHeaderMain}>
                <InstitutionMark
                  name={primaryBill.connection.institutionName}
                  logoUrl={primaryBill.connection.institutionLogoUrl}
                  size={24}
                />
                <Text style={styles.billHeaderTitle} numberOfLines={1}>
                  {cardCaption(
                    primaryBill.connection.institutionName,
                    primaryBill.card.name,
                    primaryBill.card.last4,
                  )}
                </Text>
              </View>
              {isMastercard(primaryBill.card.network) ? (
                <MastercardBrandMark width={28} height={19} />
              ) : null}
            </View>
          ) : null}
          <View style={styles.billBody}>
            <View style={styles.billCopy}>
              <Text style={styles.label}>Total fatura atual</Text>
              <View style={styles.billValue}>
                <IconHold pad={6} radius={8}>
                  <HomeDashCardIcon size={16} />
                </IconHold>
                <MoneyRow amount={billTotal} />
              </View>
            </View>
            {billLimitTotal != null && billLimitTotal > 0 ? (
              <View style={styles.limitBlock}>
                <Text style={styles.label}>Limite total:</Text>
                <View style={styles.limitBar}>
                  <View
                    style={[
                      styles.limitUsed,
                      {
                        flex: Math.max(billUsed, 0),
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.limitRest,
                      {
                        flex: Math.max(billLimitTotal - billUsed, 0.01),
                      },
                    ]}
                  />
                </View>
                <View style={styles.limitLegend}>
                  <View style={styles.limitLegendItem}>
                    <Text style={styles.limitLegendLabel}>Usado:</Text>
                    <Text style={styles.limitLegendValue}>
                      {getCurrencySymbol("BRL")} {formatAmount(billUsed)}
                    </Text>
                  </View>
                  <View style={styles.limitLegendItem}>
                    <Text style={styles.limitLegendLabel}>Total:</Text>
                    <Text style={styles.limitLegendValue}>
                      {getCurrencySymbol("BRL")} {formatAmount(billLimitTotal)}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}
          </View>
        </GlassCard>
      )}

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
              <HomeDashInstallmentsIcon size={16} />
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
              <HomeDashSubscriptionsIcon size={16} color="#995CD6" />
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
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  moneyRowFill: {
    flex: 1,
    minWidth: 0,
  },
  coin: {
    fontFamily: BearCashFonts.semiBold,
    fontSize: 12,
    lineHeight: 19,
    color: BearCashColors.text,
  },
  amount: {
    fontFamily: BearCashFonts.semiBold,
    fontSize: 18,
    lineHeight: 22,
    color: BearCashColors.text,
  },
  amountFill: {
    flex: 1,
    minWidth: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 16,
  },
  flowRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
  },
  flexCard: {
    flex: 1,
    minWidth: 0,
  },
  flowCardFill: {
    flex: 1,
  },
  flowPressed: {
    opacity: 0.92,
  },
  flowInnerSingle: {
    flex: 1,
    gap: 8,
    padding: 12,
  },
  flowCopy: {
    gap: 4,
  },
  flowAmount: {
    fontSize: 24,
    lineHeight: 29,
    flex: 0,
  },
  billManyInner: {
    padding: 0,
    gap: 0,
  },
  billManyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    padding: 16,
  },
  billDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  billDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BearCashColors.borderStrong,
  },
  billDotActive: {
    backgroundColor: BearCashColors.text,
  },
  billCarousel: {
    gap: BILL_TILE_GAP,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  billTile: {
    width: BILL_TILE_WIDTH,
    borderWidth: 1,
    borderColor: BearCashColors.borderStrong,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: BearCashColors.surface,
  },
  billTileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: BearCashColors.borderStrong,
  },
  billTileTitle: {
    flex: 1,
    ...BearCashTypography.caption,
    color: BearCashColors.textMid,
  },
  billTileBody: {
    padding: 12,
    gap: 12,
  },
  billTileBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    height: 6,
    alignSelf: "stretch",
  },
  billTileUsed: {
    height: 6,
    borderRadius: 40,
    minWidth: 4,
    backgroundColor: BearCashColors.text,
  },
  billTileRest: {
    height: 6,
    borderRadius: 40,
    minWidth: 4,
    backgroundColor: BearCashColors.borderSoft,
  },
  billSingleInner: {
    padding: 0,
    gap: 0,
  },
  billHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: BearCashColors.borderStrong,
  },
  billHeaderMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  billHeaderTitle: {
    flex: 1,
    ...BearCashTypography.captionSmall,
    color: BearCashColors.textMid,
  },
  billBody: {
    padding: 16,
    gap: 10,
  },
  billCopy: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  billValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  limitBlock: {
    gap: 8,
    alignSelf: "stretch",
  },
  limitBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    height: 12,
    alignSelf: "stretch",
  },
  limitUsed: {
    height: 12,
    borderRadius: 40,
    minWidth: 4,
    backgroundColor: BearCashColors.text,
  },
  limitRest: {
    height: 12,
    borderRadius: 40,
    minWidth: 4,
    backgroundColor: BearCashColors.borderSoft,
  },
  limitLegend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    alignSelf: "stretch",
  },
  limitLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  limitLegendLabel: {
    ...BearCashTypography.captionSmall,
    color: BearCashColors.textSoft,
  },
  limitLegendValue: {
    fontFamily: BearCashFonts.semiBold,
    fontSize: 12,
    lineHeight: 19,
    color: BearCashColors.textMid,
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
