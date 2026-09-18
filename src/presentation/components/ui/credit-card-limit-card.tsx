import { StyleSheet, Text, View } from "react-native";

import type { CreditCardOverviewItem } from "@/infra/http/services/api/modules/open-finance.module";
import {
  creditCardBillUsage,
  creditCardShortCaption,
} from "@/presentation/components/ui/credit-card-bill-summary";
import { getCurrencySymbol } from "@/presentation/components/ui/currencies";
import { InstitutionMark } from "@/presentation/components/ui/institution-mark";
import {
  BearCashColors,
  BearCashFonts,
  BearCashTypography,
  getBearCashScheme,
} from "@/presentation/constants/theme";
import { createThemedStyles } from "@/presentation/constants/themed-styles";

function formatMoney(amount: number) {
  return Math.abs(amount).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatTotal(amount: number) {
  const rounded = Math.round(amount * 100) / 100;
  return Math.abs(rounded).toLocaleString("pt-BR", {
    minimumFractionDigits: Number.isInteger(rounded) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export function CreditCardLimitCard({
  item,
}: {
  item: CreditCardOverviewItem;
}) {
  const styles = useStyles();
  const usage = creditCardBillUsage(item);
  const total = usage.total ?? 0;
  const used = usage.used;
  const available = item.availableLimit ?? Math.max(total - used, 0);
  const usedBarColor =
    getBearCashScheme() === "dark" ? "#A670DB" : BearCashColors.iconAccent;
  const showBar = total > 0;
  const symbol = getCurrencySymbol("BRL");

  return (
    <View style={styles.root}>
      <View style={styles.identity}>
        <InstitutionMark
          name={item.institutionName}
          logoUrl={item.institutionLogoUrl}
          size={26}
        />
        <View style={styles.copy}>
          <Text style={styles.name} numberOfLines={1}>
            {creditCardShortCaption(item.institutionName, item.last4)}
          </Text>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Limite total:</Text>
            <Text style={styles.totalValue}>
              {`${symbol}${formatTotal(total)}`}
            </Text>
          </View>
        </View>
      </View>
      {showBar ? (
        <View style={styles.bar}>
          <View
            style={[
              styles.barUsed,
              { flex: Math.max(used, 0.01), backgroundColor: usedBarColor },
            ]}
          />
          <View
            style={[styles.barRest, { flex: Math.max(total - used, 0.01) }]}
          />
        </View>
      ) : null}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <Text style={styles.legendLabel}>Utilizado:</Text>
          <Text style={styles.legendValue}>
            {`${symbol}${formatMoney(used)}`}
          </Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={styles.legendLabel}>Disponível:</Text>
          <Text style={styles.legendValue}>
            {`${symbol}${formatMoney(available)}`}
          </Text>
        </View>
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
      padding: 12,
      gap: 12,
    },
    identity: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    copy: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    name: {
      ...BearCashTypography.caption,
      color: BearCashColors.textMid,
    },
    totalRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    totalLabel: {
      ...BearCashTypography.caption,
      color: BearCashColors.textSoft,
    },
    totalValue: {
      fontFamily: BearCashFonts.semiBold,
      fontSize: 12,
      lineHeight: 19,
      color: BearCashColors.text,
    },
    bar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      height: 6,
      alignSelf: "stretch",
    },
    barUsed: {
      height: 6,
      borderRadius: 40,
      minWidth: 4,
    },
    barRest: {
      height: 6,
      borderRadius: 40,
      minWidth: 4,
      backgroundColor: BearCashColors.borderSoft,
    },
    legend: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    legendLabel: {
      ...BearCashTypography.caption,
      color: BearCashColors.textSoft,
    },
    legendValue: {
      fontFamily: BearCashFonts.semiBold,
      fontSize: 12,
      lineHeight: 19,
      color: BearCashColors.text,
    },
  }),
);
