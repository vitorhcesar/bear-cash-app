import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { BearCashColors } from '@/presentation/constants/theme';

export type StepGroupProps = {
  total: number;
  current: number;
  style?: StyleProp<ViewStyle>;
};

export function StepGroup({ total, current, style }: StepGroupProps) {
  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: total }, (_, index) => {
        const active = index < current;
        return (
          <View
            key={index}
            style={[styles.item, active ? styles.itemActive : styles.itemInactive]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 200,
    maxWidth: 200,
    alignSelf: 'center',
  },
  item: {
    flex: 1,
    height: 6,
    borderRadius: 8,
  },
  itemActive: {
    backgroundColor: BearCashColors.primary,
  },
  itemInactive: {
    backgroundColor: BearCashColors.stepInactive,
  },
});
