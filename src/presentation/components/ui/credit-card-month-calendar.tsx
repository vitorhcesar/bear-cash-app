import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { CreditCardOverviewItem } from "@/infra/http/services/api/modules/open-finance.module";
import { creditCardInvoiceAmount } from "@/presentation/components/ui/credit-card-bill-summary";
import { getCurrencySymbol } from "@/presentation/components/ui/currencies";
import { InstitutionMark } from "@/presentation/components/ui/institution-mark";
import {
  BearCashColors,
  BearCashTypography,
} from "@/presentation/constants/theme";
import { createThemedStyles } from "@/presentation/constants/themed-styles";

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] as const;

type CalendarDay = {
  date: Date;
  inMonth: boolean;
};

export type CreditCardDueMark = {
  name: string;
  logoUrl: string | null;
  amount: number;
};

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function mondayOffset(date: Date) {
  return (date.getDay() + 6) % 7;
}

function dateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function parseCardDueDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function buildMonthWeeks(month: Date): CalendarDay[][] {
  const first = startOfMonth(month);
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - mondayOffset(first));

  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
  const gridEnd = new Date(last);
  gridEnd.setDate(last.getDate() + (6 - mondayOffset(last)));

  const weeks: CalendarDay[][] = [];
  const cursor = new Date(gridStart);
  while (cursor.getTime() <= gridEnd.getTime()) {
    const week: CalendarDay[] = [];
    for (let index = 0; index < 7; index += 1) {
      week.push({
        date: new Date(cursor),
        inMonth: cursor.getMonth() === first.getMonth(),
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

export function dueMarksByDay(cards: CreditCardOverviewItem[]) {
  const marks = new Map<string, CreditCardDueMark>();
  for (const card of cards) {
    if (!card.dueDate) {
      continue;
    }
    const date = parseCardDueDate(card.dueDate);
    if (!date) {
      continue;
    }
    const key = dateKey(date);
    if (marks.has(key)) {
      continue;
    }
    marks.set(key, {
      name: card.institutionName,
      logoUrl: card.institutionLogoUrl,
      amount: creditCardInvoiceAmount(card),
    });
  }
  return marks;
}

function dayLabel(day: CalendarDay) {
  if (day.inMonth) {
    return String(day.date.getDate());
  }
  return String(day.date.getDate()).padStart(2, "0");
}

function formatAmount(amount: number) {
  return Math.abs(amount).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function CreditCardMonthCalendar({
  month,
  cards,
}: {
  month: Date;
  cards: CreditCardOverviewItem[];
}) {
  const styles = useStyles();
  const weeks = useMemo(() => buildMonthWeeks(month), [month]);
  const marks = useMemo(() => dueMarksByDay(cards), [cards]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  function toggleDay(key: string) {
    setSelectedKey((current) => (current === key ? null : key));
  }

  return (
    <View style={styles.root}>
      <View style={styles.weekdays}>
        {WEEKDAYS.map((label) => (
          <View key={label} style={styles.weekday}>
            <Text style={styles.weekdayLabel}>{label}</Text>
          </View>
        ))}
      </View>
      {weeks.map((week, weekIndex) => (
        <View
          key={week[0] ? dateKey(week[0].date) : `week-${weekIndex}`}
          style={styles.week}
        >
          {week.map((day) => {
            const key = dateKey(day.date);
            const mark = marks.get(key);
            const selected = selectedKey === key;
            return (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={
                  mark
                    ? `${dayLabel(day)}, ${mark.name}, ${getCurrencySymbol("BRL")} ${formatAmount(mark.amount)}`
                    : dayLabel(day)
                }
                onPress={() => toggleDay(key)}
                style={[
                  styles.day,
                  selected && styles.daySelected,
                  selected && styles.dayRaised,
                ]}
              >
                {selected && mark ? (
                  <View style={styles.tooltipAnchor} pointerEvents="none">
                    <View style={styles.tooltip}>
                      <Text style={styles.tooltipName} numberOfLines={1}>
                        {mark.name}
                      </Text>
                      <View style={styles.tooltipAmount}>
                        <InstitutionMark
                          name={mark.name}
                          logoUrl={mark.logoUrl}
                          size={16}
                        />
                        <Text style={styles.tooltipCoin}>
                          {getCurrencySymbol("BRL")}
                        </Text>
                        <Text style={styles.tooltipValue} numberOfLines={1}>
                          {formatAmount(mark.amount)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.tooltipTail} />
                  </View>
                ) : null}
                <Text
                  style={[styles.dayNumber, !day.inMonth && styles.dayMuted]}
                >
                  {dayLabel(day)}
                </Text>
                {mark ? (
                  <InstitutionMark
                    name={mark.name}
                    logoUrl={mark.logoUrl}
                    size={20}
                  />
                ) : (
                  <View style={styles.daySpacer} />
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const useStyles = createThemedStyles(() =>
  StyleSheet.create({
    root: {
      alignSelf: "stretch",
      gap: 8,
      overflow: "visible",
    },
    weekdays: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    weekday: {
      flex: 1,
      minWidth: 0,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 4,
      paddingVertical: 8,
    },
    weekdayLabel: {
      ...BearCashTypography.caption,
      color: BearCashColors.text,
    },
    week: {
      flexDirection: "row",
      alignItems: "stretch",
      gap: 8,
      overflow: "visible",
      zIndex: 0,
    },
    day: {
      flex: 1,
      minWidth: 0,
      minHeight: 72,
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 8,
      paddingBottom: 6,
      paddingHorizontal: 2,
      borderRadius: 4,
      backgroundColor: BearCashColors.surface,
      overflow: "hidden",
    },
    daySelected: {
      backgroundColor: BearCashColors.borderSoft,
      overflow: "visible",
    },
    dayRaised: {
      zIndex: 4,
    },
    dayNumber: {
      ...BearCashTypography.caption,
      color: BearCashColors.text,
    },
    dayMuted: {
      color: BearCashColors.bannerMuted,
    },
    daySpacer: {
      height: 20,
    },
    tooltipAnchor: {
      position: "absolute",
      bottom: 34,
      left: 4,
      zIndex: 8,
      alignItems: "center",
    },
    tooltip: {
      backgroundColor: BearCashColors.neutralBase,
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 4,
      alignItems: "center",
      shadowColor: "#0E121B",
      shadowOpacity: 0.06,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      elevation: 6,
    },
    tooltipName: {
      ...BearCashTypography.captionSmall,
      color: BearCashColors.textSoft,
    },
    tooltipAmount: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    tooltipCoin: {
      ...BearCashTypography.captionSmall,
      color: BearCashColors.textMid,
    },
    tooltipValue: {
      ...BearCashTypography.captionSmall,
      color: BearCashColors.textMid,
    },
    tooltipTail: {
      width: 0,
      height: 0,
      borderLeftWidth: 6,
      borderRightWidth: 6,
      borderTopWidth: 6,
      borderLeftColor: "transparent",
      borderRightColor: "transparent",
      borderTopColor: BearCashColors.neutralBase,
    },
  }),
);
