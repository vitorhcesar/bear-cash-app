import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BearCashColors, BearCashTypography } from '@/presentation/constants/theme';

export type OutlineSelectProps = {
  label: string;
  value: string;
  placeholder?: string;
  trailing?: ReactNode;
  expanded?: boolean;
  onPress: () => void;
};

export function OutlineSelect({
  label,
  value,
  placeholder,
  trailing,
  expanded = false,
  onPress,
}: OutlineSelectProps) {
  const filled = value.trim().length > 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ expanded }}
      onPress={onPress}
    >
      <View style={styles.labelRow} pointerEvents="none">
        <View style={styles.labelBackground}>
          <Text style={styles.floatingLabel}>{label}</Text>
        </View>
      </View>
      <View style={[styles.shell, expanded && styles.shellOpen]}>
        <Text
          style={[styles.value, !filled && styles.placeholder]}
          numberOfLines={1}
        >
          {filled ? value : (placeholder ?? label)}
        </Text>
        {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    position: 'absolute',
    top: -8,
    left: 13,
    zIndex: 2,
  },
  labelBackground: {
    backgroundColor: BearCashColors.background,
    paddingHorizontal: 4,
  },
  floatingLabel: {
    ...BearCashTypography.captionSmall,
    color: BearCashColors.text,
  },
  shell: {
    borderWidth: 1,
    borderColor: BearCashColors.borderSoft,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shellOpen: {
    borderColor: BearCashColors.borderStrong,
  },
  value: {
    flex: 1,
    ...BearCashTypography.body,
    color: BearCashColors.text,
  },
  placeholder: {
    color: BearCashColors.textSoft,
  },
  trailing: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
