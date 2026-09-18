import { StyleSheet, Text, View } from "react-native";

import type { CreditCardOverviewItem } from "@/infra/http/services/api/modules/open-finance.module";
import { MONTHS_LONG } from "@/presentation/components/ui/calendar";
import { getCurrencySymbol } from "@/presentation/components/ui/currencies";
import {
  HomeDashCardIcon,
  MastercardBrandMark,
  VisaBrandMark,
} from "@/presentation/components/ui/home-icons";
import { InstitutionMark } from "@/presentation/components/ui/institution-mark";
import {
  BearCashColors,
  BearCashFonts,
  BearCashTypography,
  getBearCashScheme,
} from "@/presentation/constants/theme";
import { createThemedStyles } from "@/presentation/constants/themed-styles";

function formatAmount(amount: number) {
  return Math.abs(amount).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function cardBrand(network: string | null) {
  if (!network) {
    return null;
  }
  if (/mastercard/i.test(network)) {
    return "mastercard";
  }
  if (/visa/i.test(network)) {
    return "visa";
  }
  return null;
}

export function creditCardCaption(
  institutionName: string,
  name: string | null,
  last4: string | null,
) {
  const title = [institutionName, name].filter(Boolean).join(" ");
  if (last4) {
    return `${title} •••${last4}`;
  }
  return title;
}

export function creditCardShortCaption(
  institutionName: string,
  last4: string | null,
) {
  if (last4) {
    return `${institutionName} •••${last4}`;
  }
  return institutionName;
}

function formatDueVence(value: string | null) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const month = MONTHS_LONG[date.getMonth()] ?? "";
  return `Vence ${date.getDate()} de ${month}`;
}

export function creditCardInvoiceAmount(item: CreditCardOverviewItem) {
  return item.currentInvoice?.amount ?? item.currentBill?.totalAmount ?? 0;
}

export function creditCardBillUsage(item: CreditCardOverviewItem) {
  const used = item.usedAmount ?? creditCardInvoiceAmount(item);
  const available = item.availableLimit;
  const total =
    item.limitAmount ?? (available != null ? used + available : null);
  return { used, total };
}

export function CreditCardCompactSummary({
  item,
}: {
  item: CreditCardOverviewItem;
}) {
  const styles = useCompactStyles();
  const invoice = creditCardInvoiceAmount(item);
  const usage = creditCardBillUsage(item);
  const due = formatDueVence(item.dueDate);
  const usedBarColor =
    getBearCashScheme() === "dark" ? "#A670DB" : BearCashColors.iconAccent;
  const showLimit = usage.total != null && usage.total > 0;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.identity}>
          <InstitutionMark
            name={item.institutionName}
            logoUrl={item.institutionLogoUrl}
            size={32}
          />
          <View style={styles.copy}>
            <Text style={styles.name} numberOfLines={1}>
              {creditCardShortCaption(item.institutionName, item.last4)}
            </Text>
            {due ? (
              <Text style={styles.due} numberOfLines={1}>
                {due}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={styles.amountRow}>
          <View style={styles.statusDot} />
          <Text style={styles.coin}>{getCurrencySymbol("BRL")}</Text>
          <Text style={styles.amount} numberOfLines={1}>
            {formatAmount(invoice)}
          </Text>
        </View>
      </View>

      {showLimit ? (
        <View style={styles.limitBlock}>
          <View style={styles.limitBar}>
            <View
              style={[
                styles.limitUsed,
                {
                  flex: Math.max(usage.used, 0),
                  backgroundColor: usedBarColor,
                },
              ]}
            />
            <View
              style={[
                styles.limitRest,
                { flex: Math.max((usage.total ?? 0) - usage.used, 0.01) },
              ]}
            />
          </View>
          <View style={styles.limitLegend}>
            <View style={styles.limitLegendItem}>
              <Text style={styles.limitLegendLabel}>Usado:</Text>
              <Text style={styles.limitLegendValue}>
                {getCurrencySymbol("BRL")}
                {formatAmount(usage.used)}
              </Text>
            </View>
            <View style={styles.limitLegendItem}>
              <Text style={styles.limitLegendLabel}>Limite:</Text>
              <Text style={styles.limitLegendValue}>
                {getCurrencySymbol("BRL")}
                {formatAmount(usage.total ?? 0)}
              </Text>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

export function CreditCardBillSummary({
  item,
}: {
  item: CreditCardOverviewItem;
}) {
  const styles = useStyles();
  const invoice = creditCardInvoiceAmount(item);
  const usage = creditCardBillUsage(item);
  const brand = cardBrand(item.network);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <InstitutionMark
            name={item.institutionName}
            logoUrl={item.institutionLogoUrl}
            size={20}
          />
          <Text style={styles.headerTitle} numberOfLines={1}>
            {creditCardCaption(item.institutionName, item.name, item.last4)}
          </Text>
        </View>
        {brand === "mastercard" ? (
          <MastercardBrandMark width={23.5} height={16} />
        ) : brand === "visa" ? (
          <VisaBrandMark width={35} height={16} />
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.invoiceRow}>
          <View style={styles.invoiceCopy}>
            <Text style={styles.label}>Total fatura atual</Text>
            <View style={styles.invoiceValue}>
              <View style={styles.iconHold}>
                <HomeDashCardIcon size={12} />
              </View>
              <Text style={styles.coin}>{getCurrencySymbol("BRL")}</Text>
              <Text style={styles.amount} numberOfLines={1}>
                {formatAmount(invoice)}
              </Text>
            </View>
          </View>
          {item.billStatus === "open" ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Aberta</Text>
            </View>
          ) : null}
        </View>

        {usage.total != null && usage.total > 0 ? (
          <View style={styles.limitBlock}>
            <Text style={styles.label}>Limite total:</Text>
            <View style={styles.limitBar}>
              <View
                style={[styles.limitUsed, { flex: Math.max(usage.used, 0) }]}
              />
              <View
                style={[
                  styles.limitRest,
                  { flex: Math.max(usage.total - usage.used, 0.01) },
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
                <Text style={styles.limitLegendLabel}>Limite:</Text>
                <Text style={styles.limitLegendValue}>
                  {getCurrencySymbol("BRL")} {formatAmount(usage.total)}
                </Text>
              </View>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const useStyles = createThemedStyles(() =>
  StyleSheet.create({
    root: {
      alignSelf: "stretch",
      backgroundColor: BearCashColors.surface,
      borderRadius: 12,
      overflow: "hidden",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: BearCashColors.borderStrong,
    },
    headerMain: {
      flex: 1,
      minWidth: 0,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    headerTitle: {
      flex: 1,
      ...BearCashTypography.captionSmall,
      color: BearCashColors.textMid,
    },
    body: {
      padding: 16,
      gap: 10,
    },
    invoiceRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    invoiceCopy: {
      flex: 1,
      minWidth: 0,
      gap: 8,
    },
    label: {
      ...BearCashTypography.captionSmall,
      color: BearCashColors.textMid,
    },
    invoiceValue: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    iconHold: {
      backgroundColor: BearCashColors.neutralBase,
      borderRadius: 8,
      padding: 6,
    },
    coin: {
      fontFamily: BearCashFonts.semiBold,
      fontSize: 12,
      lineHeight: 19,
      color: BearCashColors.text,
    },
    amount: {
      flex: 1,
      minWidth: 0,
      fontFamily: BearCashFonts.semiBold,
      fontSize: 18,
      lineHeight: 22,
      color: BearCashColors.text,
    },
    badge: {
      backgroundColor: "#981B1D",
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    badgeText: {
      ...BearCashTypography.captionSmall,
      color: "#F5F4F5",
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
  }),
);

const useCompactStyles = createThemedStyles(() =>
  StyleSheet.create({
    root: {
      alignSelf: "stretch",
      backgroundColor: BearCashColors.surface,
      borderRadius: 12,
      padding: 16,
      gap: 12,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    identity: {
      flex: 1,
      minWidth: 0,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    copy: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },
    name: {
      fontFamily: BearCashFonts.semiBold,
      fontSize: 12,
      lineHeight: 19,
      color: BearCashColors.text,
    },
    due: {
      ...BearCashTypography.captionSmall,
      color: BearCashColors.textMid,
    },
    amountRow: {
      flexShrink: 0,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: BearCashColors.dangerVivid,
    },
    coin: {
      fontFamily: BearCashFonts.semiBold,
      fontSize: 10,
      lineHeight: 16,
      color: BearCashColors.text,
    },
    amount: {
      fontFamily: BearCashFonts.semiBold,
      fontSize: 14,
      lineHeight: 22,
      color: BearCashColors.text,
    },
    limitBlock: {
      gap: 10,
      alignSelf: "stretch",
    },
    limitBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      height: 6,
      alignSelf: "stretch",
    },
    limitUsed: {
      height: 6,
      borderRadius: 40,
      minWidth: 4,
    },
    limitRest: {
      height: 6,
      borderRadius: 40,
      minWidth: 4,
      backgroundColor: BearCashColors.borderSoft,
    },
    limitLegend: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    limitLegendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    },
    limitLegendLabel: {
      ...BearCashTypography.captionSmall,
      color: BearCashColors.textSoft,
    },
    limitLegendValue: {
      ...BearCashTypography.captionSmall,
      color: BearCashColors.textMid,
    },
  }),
);
