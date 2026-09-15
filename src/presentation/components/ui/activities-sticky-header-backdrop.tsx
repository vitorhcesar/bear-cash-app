import { BlurView } from "expo-blur";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { Platform, StyleSheet, View } from "react-native";

import type { BlurTargetRef } from "@/presentation/blur/blur-target-context";

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
  const useLiquidGlass = isLiquidGlassAvailable();
  const canBlurAndroid = Platform.OS === "android";

  return (
    <View pointerEvents="none" style={styles.backdrop} collapsable={false}>
      {useLiquidGlass ? (
        <GlassView
          style={styles.fill}
          glassEffectStyle="regular"
          colorScheme="dark"
          tintColor="rgba(18, 17, 19, 0.35)"
        />
      ) : Platform.OS === "ios" ? (
        <BlurView intensity={64} tint="dark" style={styles.fill} />
      ) : canBlurAndroid ? (
        <BlurView
          blurTarget={blurTarget}
          blurMethod="dimezisBlurViewSdk31Plus"
          blurReductionFactor={2}
          intensity={64}
          tint="dark"
          style={styles.fill}
        />
      ) : null}
      <View style={styles.tint} />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: FILL,
  fill: FILL,
  tint: {
    ...FILL,
    backgroundColor: "rgba(10, 10, 11, 0.72)",
  },
});
