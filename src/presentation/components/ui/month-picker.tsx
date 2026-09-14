import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  CalendarChevronLeftIcon,
  CalendarChevronRightIcon,
} from "@/presentation/components/ui/calendar-icons";
import {
  BearCashColors,
  BearCashFonts,
  BearCashTypography,
} from "@/presentation/constants/theme";

export type MonthValue = {
  year: number;
  month: number;
};

/** Labels as in the Otto month picker (mixed short/full names). */
export const MONTH_PICKER_LABELS = [
  "Jan",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
] as const;

const SELECTED_FILL = "#ccadeb";

export function isSameMonth(left: MonthValue, right: MonthValue) {
  return left.year === right.year && left.month === right.month;
}

export function monthValueFromDate(date: Date): MonthValue {
  return { year: date.getFullYear(), month: date.getMonth() };
}

export function dateFromMonthValue(value: MonthValue) {
  return new Date(value.year, value.month, 1);
}

export type MonthPickerProps = {
  year: number;
  selected: MonthValue | null;
  onYearChange: (year: number) => void;
  onSelectMonth: (month: number) => void;
};

export function MonthPicker({
  year,
  selected,
  onYearChange,
  onSelectMonth,
}: MonthPickerProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ano anterior"
          hitSlop={8}
          onPress={() => onYearChange(year - 1)}
        >
          <CalendarChevronLeftIcon size={24} />
        </Pressable>
        <Text style={styles.year}>{year}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Próximo ano"
          hitSlop={8}
          onPress={() => onYearChange(year + 1)}
        >
          <CalendarChevronRightIcon size={24} />
        </Pressable>
      </View>

      <View style={styles.grid}>
        {Array.from({ length: 4 }, (_, row) => (
          <View key={row} style={styles.row}>
            {Array.from({ length: 3 }, (_, col) => {
              const month = row * 3 + col;
              const active =
                selected != null &&
                selected.year === year &&
                selected.month === month;
              return (
                <Pressable
                  key={MONTH_PICKER_LABELS[month]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={MONTH_PICKER_LABELS[month]}
                  onPress={() => onSelectMonth(month)}
                  style={[styles.slot, active && styles.slotSelected]}
                >
                  <Text
                    style={[styles.label, active && styles.labelSelected]}
                    numberOfLines={1}
                  >
                    {MONTH_PICKER_LABELS[month]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: "stretch",
    backgroundColor: BearCashColors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 12,
    minHeight: 292,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  year: {
    fontFamily: BearCashFonts.semiBold,
    fontSize: 14,
    lineHeight: 22,
    color: BearCashColors.text,
  },
  grid: {
    flex: 1,
    gap: 4,
  },
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "stretch",
  },
  slot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    overflow: "hidden",
  },
  slotSelected: {
    backgroundColor: SELECTED_FILL,
  },
  label: {
    ...BearCashTypography.bodySmall,
    color: BearCashColors.textSoft,
    textAlign: "center",
  },
  labelSelected: {
    color: BearCashColors.buttonFilledText,
    fontFamily: BearCashFonts.semiBold,
  },
});
