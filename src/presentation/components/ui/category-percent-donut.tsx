import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import {
  BearCashColors,
  BearCashTypography,
} from "@/presentation/constants/theme";

const SIZE = 48;
const STROKE = 4;

export function CategoryPercentDonut({
  percent,
  color,
}: {
  percent: number;
  color: string;
}) {
  const radius = (SIZE - STROKE) / 2;
  const center = SIZE / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const filled = (clamped / 100) * circumference;

  return (
    <View style={styles.wrap}>
      <Svg width={SIZE} height={SIZE}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={BearCashColors.borderStrong}
          strokeWidth={STROKE}
          fill="none"
        />
        {filled > 0 ? (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={color}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={`${filled} ${circumference}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
          />
        ) : null}
      </Svg>
      <View pointerEvents="none" style={styles.labelHold}>
        <Text style={styles.label}>{`${Math.round(clamped)}%`}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  labelHold: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    ...BearCashTypography.caption,
    color: BearCashColors.textMid,
    textAlign: "center",
  },
});
