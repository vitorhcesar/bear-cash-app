import { BlurView } from "expo-blur";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { Platform, StyleSheet, View } from "react-native";

import type { BlurTargetRef } from "@/presentation/blur/blur-target-context";
import { BearCashColors } from "@/presentation/constants/theme";
import { createThemedStyles } from "@/presentation/constants/themed-styles";
import { useBearCashTheme } from "@/presentation/theme/bear-cash-theme-context";

const FILL = {
  position: "absolute" as const,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

export function ActivitiesStickyHeaderBackdrop({
  blurTarget,
}: {
  blurTarget: BlurTargetRef;
}) {
  const styles = useStyles();
  const { scheme } = useBearCashTheme();
  const useLiquidGlass = isLiquidGlassAvailable();
  const canBlurAndroid = Platform.OS === "android";

  return (
    <View pointerEvents="none" style={styles.backdrop} collapsable={false}>
      {useLiquidGlass ? (
        <GlassView
          style={styles.fill}
          glassEffectStyle="regular"
          colorScheme={scheme}
          tintColor={BearCashColors.glassTint}
        />
      ) : Platform.OS === "ios" ? (
        <BlurView intensity={64} tint={scheme} style={styles.fill} />
      ) : canBlurAndroid ? (
        <BlurView
          blurTarget={blurTarget}
          blurMethod="dimezisBlurViewSdk31Plus"
          blurReductionFactor={2}
          intensity={64}
          tint={scheme}
          style={styles.fill}
        />
      ) : null}
      <View style={styles.tint} />
    </View>
  );
}

const useStyles = createThemedStyles(() =>
  StyleSheet.create({
    backdrop: FILL,
    fill: FILL,
    tint: {
      ...FILL,
      backgroundColor: BearCashColors.headerScrim,
    },
  }),
);
