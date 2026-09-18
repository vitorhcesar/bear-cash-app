import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

import type { CreditCardInstallmentPlan } from "@/infra/http/services/api/modules/open-finance.module";
import { getCategoryDisplay } from "@/presentation/components/ui/activities-category-catalog";
import { CategoryChipIcon } from "@/presentation/components/ui/activities-category-icons";
import { FilterCalendarIcon } from "@/presentation/components/ui/activities-filter-icons";
import { MONTHS_LONG } from "@/presentation/components/ui/calendar";
import { getCurrencySymbol } from "@/presentation/components/ui/currencies";
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

export function formatInstallmentMonth(month: string | null) {
  if (!month) {
    return null;
  }
  const [yearRaw, monthRaw] = month.split("-");
  const year = Number(yearRaw);
  const index = Number(monthRaw) - 1;
  const name = MONTHS_LONG[index];
  if (!name || !Number.isFinite(year)) {
    return null;
  }
  return `${name} ${year}`;
}

function MerchantMark({
  name,
  logoUrl,
  categoryId,
  size,
}: {
  name: string;
  logoUrl: string | null;
  categoryId: string | null;
  size: number;
}) {
  const styles = useMerchantStyles();
  const category = categoryId ? getCategoryDisplay(categoryId) : undefined;
  const initial = name.trim().charAt(0).toUpperCase() || "P";

  if (logoUrl) {
    return (
      <View
        style={[
          styles.frame,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        <Image
          source={{ uri: logoUrl }}
          style={styles.image}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={logoUrl}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.frame,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: category?.color ?? BearCashColors.borderSoft,
        },
      ]}
    >
      {category ? (
        <CategoryChipIcon
          iconKey={category.iconKey}
          color="#212220"
          size={Math.round(size * 0.5)}
        />
      ) : (
        <Text style={[styles.initial, { fontSize: Math.round(size * 0.4) }]}>
          {initial}
        </Text>
      )}
    </View>
  );
}

export function CreditCardInstallmentCard({
  item,
}: {
  item: CreditCardInstallmentPlan;
}) {
  const styles = useStyles();
  const paidFlex = Math.max(item.current, 0.01);
  const restFlex = Math.max(item.total - item.current, 0.01);
  const usedBarColor =
    getBearCashScheme() === "dark" ? "#A670DB" : BearCashColors.iconAccent;
  const lastMonth = formatInstallmentMonth(item.lastInstallmentMonth);

  return (
    <View style={styles.root}>
      <View style={styles.body}>
        <View style={styles.header}>
          <View style={styles.identity}>
            <View style={styles.avatar}>
              <View style={styles.merchantWrap}>
                <MerchantMark
                  name={item.merchantName}
                  logoUrl={item.merchantLogoUrl}
                  categoryId={item.categoryId}
                  size={32}
                />
              </View>
              <View style={styles.bankWrap}>
                <InstitutionMark
                  name={item.institutionName}
                  logoUrl={item.institutionLogoUrl}
                  size={16}
                />
              </View>
            </View>
            <View style={styles.copy}>
              <Text style={styles.name} numberOfLines={1}>
                {item.merchantName}
              </Text>
              <Text style={styles.progressLabel}>
                {`${item.current} de ${item.total}`}
              </Text>
            </View>
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.coin}>{getCurrencySymbol("BRL")}</Text>
            <Text style={styles.amount} numberOfLines={1}>
              {formatAmount(item.installmentAmount)}
            </Text>
          </View>
        </View>
        <View style={styles.limitBlock}>
          <View style={styles.limitBar}>
            <View
              style={[
                styles.limitUsed,
                { flex: paidFlex, backgroundColor: usedBarColor },
              ]}
            />
            <View style={[styles.limitRest, { flex: restFlex }]} />
          </View>
          <View style={styles.limitLegend}>
            <View style={styles.limitLegendItem}>
              <Text style={styles.limitLegendLabel}>Pago:</Text>
              <Text style={styles.limitLegendValue}>
                {`${getCurrencySymbol("BRL")}${formatAmount(item.paidAmount)}`}
              </Text>
            </View>
            <View style={styles.limitLegendItem}>
              <Text style={styles.limitLegendLabel}>Falta:</Text>
              <Text style={styles.limitLegendValue}>
                {`${getCurrencySymbol("BRL")}${formatAmount(item.remainingAmount)}`}
              </Text>
            </View>
          </View>
        </View>
      </View>
      {lastMonth ? (
        <View style={styles.footer}>
          <FilterCalendarIcon size={12} color={BearCashColors.textMid} />
          <View style={styles.footerCopy}>
            <Text style={styles.footerLabel}>Última parcela em</Text>
            <Text style={styles.footerMonth}>{lastMonth}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const useMerchantStyles = createThemedStyles(() =>
  StyleSheet.create({
    frame: {
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: BearCashColors.neutralBlackSoft,
    },
    image: {
      width: "100%",
      height: "100%",
    },
    initial: {
      fontFamily: BearCashFonts.semiBold,
      color: BearCashColors.text,
    },
  }),
);

const useStyles = createThemedStyles(() =>
  StyleSheet.create({
    root: {
      alignSelf: "stretch",
      overflow: "hidden",
      borderRadius: 12,
      backgroundColor: BearCashColors.surface,
    },
    body: {
      padding: 16,
      gap: 12,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    identity: {
      flex: 1,
      minWidth: 0,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    avatar: {
      flexDirection: "row",
      alignItems: "flex-end",
      flexShrink: 0,
    },
    merchantWrap: {
      marginRight: -8,
      zIndex: 0,
    },
    bankWrap: {
      zIndex: 1,
      borderWidth: 0.8,
      borderColor: BearCashColors.surface,
      borderRadius: 199,
      overflow: "hidden",
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
    progressLabel: {
      ...BearCashTypography.captionSmall,
      color: BearCashColors.textMid,
    },
    amountRow: {
      flexShrink: 0,
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
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
    footer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: BearCashColors.borderSoft,
    },
    footerCopy: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      flexShrink: 1,
    },
    footerLabel: {
      ...BearCashTypography.caption,
      color: BearCashColors.textMid,
    },
    footerMonth: {
      fontFamily: BearCashFonts.semiBold,
      fontSize: 12,
      lineHeight: 19,
      color: BearCashColors.text,
    },
  }),
);
