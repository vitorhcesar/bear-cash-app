import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnUI,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import type { TransactionType } from '@/infra/http/services/api/modules/transactions.module';
import {
  ExpenseArrowIcon,
  IncomeArrowIcon,
} from '@/presentation/components/ui/activities-icons';
import { springPill } from '@/presentation/components/ui/pill-motion';
import { OttoColors, OttoTypography } from '@/presentation/constants/theme';

const PILL_PAD = 4;
const PILL_BG = '#212220';

export type TransactionTypeSwitchProps = {
  value: TransactionType;
  onChange: (value: TransactionType) => void;
};

export function TransactionTypeSwitch({
  value,
  onChange,
}: TransactionTypeSwitchProps) {
  const pillX = useSharedValue(PILL_PAD);
  const pillW = useSharedValue(0);
  const slotWidth = useRef(0);
  const measured = useRef(false);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
    width: pillW.value,
  }));

  function slotX(type: TransactionType, width: number) {
    return type === 'CREDIT' ? PILL_PAD : PILL_PAD + width;
  }

  function snapPill(type: TransactionType, width: number) {
    const nextX = slotX(type, width);
    runOnUI(() => {
      'worklet';
      pillX.value = nextX;
      pillW.value = width;
    })();
  }

  function animatePill(type: TransactionType, width: number) {
    if (width <= 0) {
      return;
    }
    const nextX = slotX(type, width);
    runOnUI((nextX: number, nextW: number) => {
      'worklet';
      pillX.value = springPill(nextX);
      pillW.value = springPill(nextW);
    })(nextX, width);
  }

  function select(next: TransactionType) {
    animatePill(next, slotWidth.current);
    onChange(next);
  }

  return (
    <View
      style={styles.track}
      onLayout={(event) => {
        const inner = Math.max(0, event.nativeEvent.layout.width - PILL_PAD * 2);
        const width = inner / 2;
        const widthChanged = Math.abs(width - slotWidth.current) > 0.5;
        slotWidth.current = width;

        if (!measured.current) {
          measured.current = true;
          snapPill(value, width);
          return;
        }

        if (widthChanged) {
          snapPill(value, width);
        }
      }}
    >
      <Animated.View pointerEvents="none" style={[styles.pill, pillStyle]} />

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: value === 'CREDIT' }}
        accessibilityLabel="Entrada"
        onPress={() => select('CREDIT')}
        style={styles.item}
      >
        <IncomeArrowIcon size={12} />
        <Text
          style={[styles.label, value === 'CREDIT' ? styles.labelSelected : null]}
        >
          Entrada
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: value === 'DEBIT' }}
        accessibilityLabel="Saída"
        onPress={() => select('DEBIT')}
        style={styles.item}
      >
        <ExpenseArrowIcon size={12} />
        <Text
          style={[styles.label, value === 'DEBIT' ? styles.labelSelected : null]}
        >
          Saída
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: OttoColors.surface,
    borderRadius: 40,
    padding: PILL_PAD,
    position: 'relative',
  },
  pill: {
    position: 'absolute',
    top: PILL_PAD,
    bottom: PILL_PAD,
    left: 0,
    borderRadius: 24,
    backgroundColor: PILL_BG,
  },
  item: {
    flex: 1,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 24,
  },
  label: {
    ...OttoTypography.caption,
    color: OttoColors.textMid,
  },
  labelSelected: {
    color: OttoColors.text,
  },
});
