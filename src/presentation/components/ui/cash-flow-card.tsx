import { useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import {
  ActivityEyeClosedIcon,
  ActivityEyeOpenIcon,
  ExpenseArrowIcon,
  IncomeArrowIcon,
} from "@/presentation/components/ui/activities-icons";
import {
  BearCashColors,
  BearCashTypography,
} from "@/presentation/constants/theme";

const EXPANDED_GAP = 12;
const COLLAPSED_GAP = 8;

export function CashFlowCard({
  label,
  symbol,
  amount,
  hidden,
  onToggleVisibility,
  tone,
  compact,
}: {
  label: string;
  symbol: string;
  amount: string;
  hidden: boolean;
  onToggleVisibility: () => void;
  tone: "income" | "expense";
  compact: SharedValue<number>;
}) {
  const cardStyle = useAnimatedStyle(() => ({
    paddingHorizontal: interpolate(compact.value, [0, 1], [12, 8]),
    paddingVertical: interpolate(compact.value, [0, 1], [8, 4]),
    gap: interpolate(compact.value, [0, 1], [10, 6]),
    borderRadius: interpolate(compact.value, [0, 1], [12, 10]),
  }));

  const iconStyle = useAnimatedStyle(() => ({
    padding: interpolate(compact.value, [0, 1], [6, 4]),
    borderRadius: interpolate(compact.value, [0, 1], [8, 6]),
  }));

  return (
    <Animated.View style={[styles.card, cardStyle]}>
      <Animated.View style={[styles.iconHold, iconStyle]}>
        {tone === "income" ? (
          <IncomeArrowIcon size={12} />
        ) : (
          <ExpenseArrowIcon size={12} />
        )}
      </Animated.View>
      <View style={styles.copy}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        <View style={styles.amountRow}>
          <Text style={styles.amount} numberOfLines={1}>
            {hidden ? `${symbol}*,**` : `${symbol}${amount}`}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Mostrar valor" : "Ocultar valor"}
            onPress={onToggleVisibility}
            hitSlop={8}
          >
            {hidden ? (
              <ActivityEyeClosedIcon size={16} />
            ) : (
              <ActivityEyeOpenIcon size={16} />
            )}
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

export function CashFlowPair({
  compact,
  income,
  expense,
}: {
  compact: SharedValue<number>;
  income: {
    symbol: string;
    amount: string;
    hidden: boolean;
    onToggleVisibility: () => void;
  };
  expense: {
    symbol: string;
    amount: string;
    hidden: boolean;
    onToggleVisibility: () => void;
  };
}) {
  const rowWidth = useSharedValue(0);
  const cardHeight = useSharedValue(56);
  const lastCardHeight = useRef(56);

  const containerStyle = useAnimatedStyle(() => {
    const p = compact.value;
    const expandedH = cardHeight.value;
    const collapsedH = Math.round(expandedH * 0.82);
    return {
      height: interpolate(
        p,
        [0, 1],
        [expandedH * 2 + EXPANDED_GAP, collapsedH],
      ),
    };
  });

  const firstStyle = useAnimatedStyle(() => {
    const p = compact.value;
    const expandedW = rowWidth.value;
    if (expandedW <= 1) {
      return { width: "100%" as const };
    }
    const collapsedW = Math.max((expandedW - COLLAPSED_GAP) / 2, 1);
    return {
      width: interpolate(p, [0, 1], [expandedW, collapsedW]),
    };
  });

  const secondStyle = useAnimatedStyle(() => {
    const p = compact.value;
    const expandedW = rowWidth.value;
    const collapsedW = Math.max((expandedW - COLLAPSED_GAP) / 2, 1);
    return {
      width: expandedW <= 1 ? ("100%" as const) : interpolate(p, [0, 1], [expandedW, collapsedW]),
      transform: [
        {
          translateY: interpolate(
            p,
            [0, 1],
            [cardHeight.value + EXPANDED_GAP, 0],
          ),
        },
        {
          translateX: interpolate(
            p,
            [0, 1],
            [0, expandedW <= 1 ? 0 : collapsedW + COLLAPSED_GAP],
          ),
        },
      ],
    };
  });

  return (
    <Animated.View
      style={[styles.pair, containerStyle]}
      onLayout={(event) => {
        const next = event.nativeEvent.layout.width;
        if (next > 1) {
          rowWidth.value = next;
        }
      }}
    >
      <Animated.View
        style={firstStyle}
        onLayout={(event) => {
          const next = event.nativeEvent.layout.height;
          if (next < 40) {
            return;
          }
          if (next > lastCardHeight.current) {
            lastCardHeight.current = next;
            cardHeight.value = next;
          }
        }}
      >
        <CashFlowCard
          label="Total entrada"
          symbol={income.symbol}
          amount={income.amount}
          hidden={income.hidden}
          onToggleVisibility={income.onToggleVisibility}
          tone="income"
          compact={compact}
        />
      </Animated.View>
      <Animated.View style={[styles.secondCard, secondStyle]}>
        <CashFlowCard
          label="Total saídas"
          symbol={expense.symbol}
          amount={expense.amount}
          hidden={expense.hidden}
          onToggleVisibility={expense.onToggleVisibility}
          tone="expense"
          compact={compact}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pair: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
    minHeight: 56,
  },
  secondCard: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  card: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: BearCashColors.borderSoft,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  iconHold: {
    backgroundColor: BearCashColors.borderSoft,
    borderRadius: 8,
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  label: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  amount: {
    ...BearCashTypography.subheading,
    color: BearCashColors.textMid,
    flexShrink: 1,
  },
});
