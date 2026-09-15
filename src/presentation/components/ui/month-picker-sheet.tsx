import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { CloseIcon } from "@/presentation/components/ui/auth-icons";
import { Button } from "@/presentation/components/ui/button";
import { MONTHS_LONG } from "@/presentation/components/ui/calendar";
import {
  MonthPicker,
  monthValueFromDate,
  type MonthValue,
} from "@/presentation/components/ui/month-picker";
import { Sheet } from "@/presentation/components/ui/sheet";
import {
  BearCashColors,
  BearCashFonts,
  BearCashTypography,
} from "@/presentation/constants/theme";
import { createThemedStyles } from "@/presentation/constants/themed-styles";

export type MonthPickerSheetProps = {
  visible: boolean;
  value: MonthValue | null;
  onClose: () => void;
  onSelect: (value: MonthValue) => void;
  onClear?: () => void;
  title?: string;
  subtitle?: string;
  confirmLabel?: string;
  clearLabel?: string;
};

function lastDayOfMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function formatMonthPeriod(value: MonthValue) {
  const last = lastDayOfMonth(value.year, value.month);
  const name = MONTHS_LONG[value.month] ?? "";
  const start = "01";
  const end = String(last).padStart(2, "0");
  return `${start} — ${end} de ${name}`;
}

export function PeriodFilterChip({
  value,
  onClear,
}: {
  value: MonthValue;
  onClear: () => void;
}) {
  const styles = useStyles();
  return (
    <View style={styles.chip}>
      <View style={styles.chipCopy}>
        <Text style={styles.chipTitle}>Filtro por período:</Text>
        <Text style={styles.chipRange} numberOfLines={1}>
          {formatMonthPeriod(value)}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Limpar filtro de período"
        hitSlop={8}
        onPress={onClear}
      >
        <CloseIcon size={20} color={BearCashColors.text} />
      </Pressable>
    </View>
  );
}

export function MonthPickerSheet({
  visible,
  value,
  onClose,
  onSelect,
  onClear,
  title = "Selecionar mês",
  subtitle = "Selecione o mês que deseja visualizar para conferir seus gastos por categoria.",
  confirmLabel = "Selecionar",
  clearLabel = "Limpar filtro",
}: MonthPickerSheetProps) {
  const styles = useStyles();
  const fallback = monthValueFromDate(new Date());
  const [viewYear, setViewYear] = useState(value?.year ?? fallback.year);
  const [draft, setDraft] = useState<MonthValue>(value ?? fallback);

  const handleOpen = useCallback(() => {
    const next = value ?? monthValueFromDate(new Date());
    setViewYear(next.year);
    setDraft(next);
  }, [value]);

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      onOpen={handleOpen}
      animateLayout
      contentStyle={styles.sheet}
    >
      <MonthPicker
        year={viewYear}
        selected={draft}
        onYearChange={setViewYear}
        onSelectMonth={(month) => setDraft({ year: viewYear, month })}
      />
      <View style={styles.actions}>
        {onClear ? (
          <Button
            label={clearLabel}
            variant="stroke"
            onPress={() => {
              onClear();
              onClose();
            }}
          />
        ) : null}
        <Button
          label={confirmLabel}
          onPress={() => {
            onSelect(draft);
            onClose();
          }}
          style={styles.confirm}
        />
      </View>
    </Sheet>
  );
}

const useStyles = createThemedStyles(() => StyleSheet.create({
  sheet: {
    paddingHorizontal: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    gap: 24,
  },
  actions: {
    gap: 12,
    alignSelf: "stretch",
  },
  confirm: {
    backgroundColor: "#e0dfe2",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    alignSelf: "stretch",
    backgroundColor: BearCashColors.surface,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipCopy: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  chipTitle: {
    fontFamily: BearCashFonts.semiBold,
    fontSize: 12,
    lineHeight: 19,
    color: BearCashColors.text,
  },
  chipRange: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
    flexShrink: 1,
  },
}));
