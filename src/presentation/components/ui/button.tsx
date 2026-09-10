import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { BearCashColors, BearCashTypography } from '@/presentation/constants/theme';

type ButtonVariant = 'filled' | 'stroke' | 'danger';

export type ButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: ButtonVariant;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  variant = 'filled',
  leftIcon,
  rightIcon,
  loading = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const isFilled = variant === 'filled';
  const isDanger = variant === 'danger';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        isFilled && styles.filled,
        variant === 'stroke' && styles.stroke,
        isDanger && styles.danger,
        isFilled && isDisabled && styles.filledDisabled,
        variant === 'stroke' && isDisabled && styles.strokeDisabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={
            isDanger
              ? BearCashColors.text
              : isFilled
                ? BearCashColors.buttonFilledText
                : BearCashColors.text
          }
        />
      ) : (
        <View style={styles.content}>
          {leftIcon ? <View style={styles.iconSlot}>{leftIcon}</View> : null}
          <Text
            style={[
              styles.label,
              isFilled && styles.filledLabel,
              variant === 'stroke' && styles.strokeLabel,
              isDanger && styles.dangerLabel,
            ]}
          >
            {label}
          </Text>
          {rightIcon ? <View style={styles.iconSlot}>{rightIcon}</View> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  filled: {
    backgroundColor: BearCashColors.buttonFilled,
  },
  filledDisabled: {
    backgroundColor: BearCashColors.buttonFilledDisabled,
  },
  stroke: {
    backgroundColor: BearCashColors.surface,
  },
  strokeDisabled: {
    opacity: 0.7,
  },
  danger: {
    backgroundColor: BearCashColors.danger,
  },
  pressed: {
    opacity: 0.85,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  iconSlot: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  label: {
    ...BearCashTypography.body,
  },
  filledLabel: {
    color: BearCashColors.buttonFilledText,
  },
  strokeLabel: {
    color: BearCashColors.text,
  },
  dangerLabel: {
    color: BearCashColors.text,
  },
});
