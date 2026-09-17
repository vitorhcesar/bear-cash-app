import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { useId, useState, type ReactNode } from "react";
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import { createThemedStyles } from "@/presentation/constants/themed-styles";
import { useBearCashTheme } from "@/presentation/theme/bear-cash-theme-context";

/**
 * In-content glass for inputs and cards.
 *
 * Neutral refraction rim (no purple wash). Uses Liquid Glass when available.
 * Does not use BlurView — content sits inside the tab BlurTargetView, and a
 * nested blur crashes Android.
 */
const PanelGlass = {
  radius: 12,
  rimWidth: 1,
} as const;

type GlassPanelProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  radius?: number;
  glassEffectStyle?: "clear" | "regular";
};

export function GlassPanel({
  children,
  style,
  contentStyle,
  radius = PanelGlass.radius,
  glassEffectStyle = "clear",
}: GlassPanelProps) {
  const styles = useStyles();
  const { scheme } = useBearCashTheme();
  const useLiquidGlass = isLiquidGlassAvailable();
  const [size, setSize] = useState({ width: 0, height: 0 });

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width !== size.width || height !== size.height) {
      setSize({ width, height });
    }
  };

  return (
    <View
      style={[styles.base, { borderRadius: radius }, style]}
      onLayout={onLayout}
    >
      {useLiquidGlass ? (
        <GlassView
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
          glassEffectStyle={glassEffectStyle}
          colorScheme={scheme}
          tintColor="transparent"
        />
      ) : null}

      {size.width > 0 ? (
        <ClearGlassRim
          width={size.width}
          height={size.height}
          radius={radius}
        />
      ) : null}

      {children ? (
        <View style={[styles.content, contentStyle]}>{children}</View>
      ) : null}
    </View>
  );
}

function ClearGlassRim({
  width,
  height,
  radius: radiusProp,
}: {
  width: number;
  height: number;
  radius: number;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const rimId = `panelRim${uid}`;
  const radius = Math.min(radiusProp, height / 2);
  const stroke = PanelGlass.rimWidth;
  const inset = stroke / 2;

  return (
    <Svg
      pointerEvents="none"
      width={width}
      height={height}
      style={StyleSheet.absoluteFill}
    >
      <Defs>
        <LinearGradient id={rimId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="rgb(255,255,255)" stopOpacity={0.28} />
          <Stop offset="0.18" stopColor="rgb(255,255,255)" stopOpacity={0.08} />
          <Stop offset="0.5" stopColor="rgb(255,255,255)" stopOpacity={0.14} />
          <Stop offset="0.82" stopColor="rgb(255,255,255)" stopOpacity={0.1} />
          <Stop offset="1" stopColor="rgb(255,255,255)" stopOpacity={0.4} />
        </LinearGradient>
      </Defs>
      <Rect
        x={inset}
        y={inset}
        width={width - stroke}
        height={height - stroke}
        rx={Math.max(0, radius - inset)}
        fill="none"
        stroke={`url(#${rimId})`}
        strokeWidth={stroke}
      />
    </Svg>
  );
}

const useStyles = createThemedStyles(() =>
  StyleSheet.create({
    base: {
      overflow: "hidden",
      borderRadius: PanelGlass.radius,
      backgroundColor: "transparent",
    },
    content: {
      position: "relative",
      zIndex: 1,
    },
  }),
);
