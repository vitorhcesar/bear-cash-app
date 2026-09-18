import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import {
  BearCashColors,
  BearCashFonts,
  BearCashTypography,
  getBearCashScheme,
} from "@/presentation/constants/theme";
import { createThemedStyles } from "@/presentation/constants/themed-styles";

const SIZE = 213;
const STROKE = 24;

export function CreditCardLimitDonut({ percent }: { percent: number }) {
  const styles = useStyles();
  const radius = (SIZE - STROKE) / 2;
  const center = SIZE / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const filled = (clamped / 100) * circumference;
  const usedColor =
    getBearCashScheme() === "dark" ? "#A670DB" : BearCashColors.iconAccent;

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
          strokeLinecap="round"
        />
        {filled > 0 ? (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={usedColor}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={`${filled} ${circumference}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
          />
        ) : null}
      </Svg>
      <View pointerEvents="none" style={styles.labelHold}>
        <Text style={styles.percent}>{`${Math.round(clamped)}%`}</Text>
        <Text style={styles.caption}>Utilizado</Text>
      </View>
    </View>
  );
}

const useStyles = createThemedStyles(() =>
  StyleSheet.create({
    wrap: {
      alignSelf: "center",
      width: SIZE,
      height: SIZE,
      alignItems: "center",
      justifyContent: "center",
    },
    labelHold: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      alignItems: "center",
      justifyContent: "center",
      gap: 0,
    },
    percent: {
      fontFamily: BearCashFonts.semiBold,
      fontSize: 32,
      lineHeight: 38,
      color: BearCashColors.text,
      textAlign: "center",
    },
    caption: {
      ...BearCashTypography.bodySmall,
      color: BearCashColors.textSoft,
      textAlign: "center",
    },
  }),
);
