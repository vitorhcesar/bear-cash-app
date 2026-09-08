import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/presentation/components/ui/button';
import { Sheet } from '@/presentation/components/ui/sheet';
import { PlanRadioIcon } from '@/presentation/components/ui/subscription-icons';
import { OttoColors, OttoTypography } from '@/presentation/constants/theme';

export const BANK_KIND_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'banks', label: 'Bancos' },
  { id: 'brokers', label: 'Corretoras' },
] as const;

export type BankKindFilter = (typeof BANK_KIND_FILTERS)[number]['id'];

export function bankKindFilterLabel(id: BankKindFilter) {
  return BANK_KIND_FILTERS.find((option) => option.id === id)?.label ?? '';
}

export type BankFilterSheetProps = {
  visible: boolean;
  value: BankKindFilter;
  onClose: () => void;
  onApply: (value: BankKindFilter) => void;
};

function RadioRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <PlanRadioIcon selected={selected} />
      <Text style={styles.rowLabel}>{label}</Text>
    </Pressable>
  );
}

export function BankFilterSheet({
  visible,
  value,
  onClose,
  onApply,
}: BankFilterSheetProps) {
  const [draft, setDraft] = useState<BankKindFilter>(value);

  const handleOpen = useCallback(() => {
    setDraft(value);
  }, [value]);

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      onOpen={handleOpen}
      title="Filtrar por"
      contentStyle={styles.sheet}
    >
      <View style={styles.body}>
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel="Tipo de instituição"
          style={styles.options}
        >
          {BANK_KIND_FILTERS.map((option) => (
            <RadioRow
              key={option.id}
              label={option.label}
              selected={draft === option.id}
              onPress={() => setDraft(option.id)}
            />
          ))}
        </View>

        <Button
          label="Filtrar"
          variant="filled"
          onPress={() => {
            onApply(draft);
            onClose();
          }}
        />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  sheet: {
    paddingHorizontal: 16,
  },
  body: {
    gap: 24,
  },
  options: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rowLabel: {
    flex: 1,
    ...OttoTypography.bodySmall,
    color: OttoColors.textMid,
  },
  pressed: {
    opacity: 0.85,
  },
});
