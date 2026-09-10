import { Fragment } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { BearCashColors, BearCashTypography } from '@/presentation/constants/theme';

export type StepGroupProps = {
  total: number;
  current: number;
  style?: StyleProp<ViewStyle>;
};

const STEP_SIZE = 32;

export function StepGroup({ total, current, style }: StepGroupProps) {
  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: total }, (_, index) => {
        const step = index + 1;
        const completed = step < current;
        const active = step === current;

        return (
          <Fragment key={step}>
            {index > 0 ? (
              <View
                style={[
                  styles.connector,
                  step <= current ? styles.connectorActive : styles.connectorIdle,
                ]}
              />
            ) : null}
            <View
              style={[
                styles.item,
                completed && styles.itemCompleted,
                active && styles.itemCurrent,
                !completed && !active && styles.itemUpcoming,
              ]}
            >
              <Text
                style={[
                  styles.label,
                  completed ? styles.labelCompleted : styles.labelUpcoming,
                ]}
              >
                {step}
              </Text>
            </View>
          </Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 250,
    alignSelf: 'center',
  },
  connector: {
    flex: 1,
    height: 1,
    marginHorizontal: 4,
  },
  connectorActive: {
    backgroundColor: BearCashColors.buttonFilled,
  },
  connectorIdle: {
    backgroundColor: BearCashColors.borderStrong,
  },
  item: {
    width: STEP_SIZE,
    height: STEP_SIZE,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemCompleted: {
    backgroundColor: BearCashColors.neutralLight,
  },
  itemCurrent: {
    backgroundColor: BearCashColors.surface,
    borderWidth: 1,
    borderColor: BearCashColors.neutralLight,
  },
  itemUpcoming: {
    backgroundColor: BearCashColors.neutralBase,
  },
  label: {
    ...BearCashTypography.subheading,
    textAlign: 'center',
  },
  labelCompleted: {
    color: BearCashColors.buttonFilledText,
  },
  labelUpcoming: {
    color: BearCashColors.text,
  },
});
