import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { CreditCardOverviewItem } from "@/infra/http/services/api/modules/open-finance.module";
import {
  creditCardInvoiceAmount,
  creditCardShortCaption,
} from "@/presentation/components/ui/credit-card-bill-summary";
import { parseCardDueDate } from "@/presentation/components/ui/credit-card-month-calendar";
import { getCurrencySymbol } from "@/presentation/components/ui/currencies";
import { InstitutionMark } from "@/presentation/components/ui/institution-mark";
import {
  BearCashColors,
  BearCashFonts,
  BearCashTypography,
} from "@/presentation/constants/theme";
import { createThemedStyles } from "@/presentation/constants/themed-styles";

const WEEKDAY_SHORT = [
  "DOM",
  "SEG",
  "TER",
  "QUA",
  "QUI",
  "SEX",
  "SÁB",
] as const;

type DayGroup = {
  key: string;
  date: Date;
  cards: CreditCardOverviewItem[];
};

function formatAmount(amount: number) {
  return Math.abs(amount).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function dateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function groupCardsByDueDate(cards: CreditCardOverviewItem[]): DayGroup[] {
  const groups = new Map<string, DayGroup>();
  for (const card of cards) {
    if (!card.dueDate) {
      continue;
    }
    const date = parseCardDueDate(card.dueDate);
    if (!date) {
      continue;
    }
    const key = dateKey(date);
    const current = groups.get(key);
    if (current) {
      current.cards.push(card);
      continue;
    }
    groups.set(key, { key, date, cards: [card] });
  }
  return [...groups.values()].sort(
    (left, right) => left.date.getTime() - right.date.getTime(),
  );
}

export function CreditCardDayCalendar({
  cards,
}: {
  cards: CreditCardOverviewItem[];
}) {
  const styles = useStyles();
  const groups = useMemo(() => groupCardsByDueDate(cards), [cards]);

  if (groups.length === 0) {
    return (
      <Text style={styles.empty}>Nenhum vencimento para mostrar</Text>
    );
  }

  return (
    <View style={styles.root}>
      {groups.map((group) => (
        <View key={group.key} style={styles.row}>
          <View style={styles.rail}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{String(group.date.getDate())}</Text>
            </View>
            <Text style={styles.weekday}>
              {WEEKDAY_SHORT[group.date.getDay()]}
            </Text>
          </View>
          <View style={styles.cards}>
            {group.cards.map((card) => (
              <View key={card.id} style={styles.card}>
                <InstitutionMark
                  name={card.institutionName}
                  logoUrl={card.institutionLogoUrl}
                  size={24}
                />
                <View style={styles.cardCopy}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {creditCardShortCaption(card.institutionName, card.last4)}
                  </Text>
                  <View style={styles.cardAmount}>
                    <Text style={styles.cardCoin}>
                      {getCurrencySymbol("BRL")}
                    </Text>
                    <Text style={styles.cardValue} numberOfLines={1}>
                      {formatAmount(creditCardInvoiceAmount(card))}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const useStyles = createThemedStyles(() =>
  StyleSheet.create({
    root: {
      alignSelf: "stretch",
      gap: 24,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    rail: {
      alignSelf: "stretch",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      paddingRight: 16,
      borderRightWidth: 4,
      borderRightColor: "#99959d",
    },
    badge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: BearCashColors.neutralLight,
    },
    badgeText: {
      fontFamily: BearCashFonts.semiBold,
      fontSize: 12,
      lineHeight: 19,
      color: "#0a0a0b",
    },
    weekday: {
      ...BearCashTypography.caption,
      color: BearCashColors.textSoft,
    },
    cards: {
      flex: 1,
      minWidth: 0,
      gap: 10,
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      padding: 12,
      borderRadius: 12,
      backgroundColor: BearCashColors.surface,
    },
    cardCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    cardName: {
      ...BearCashTypography.bodySmall,
      color: BearCashColors.textMid,
    },
    cardAmount: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    },
    cardCoin: {
      fontFamily: BearCashFonts.semiBold,
      fontSize: 10,
      lineHeight: 16,
      color: BearCashColors.text,
    },
    cardValue: {
      fontFamily: BearCashFonts.semiBold,
      fontSize: 12,
      lineHeight: 19,
      color: BearCashColors.text,
    },
    empty: {
      ...BearCashTypography.caption,
      color: BearCashColors.textSoft,
    },
  }),
);
