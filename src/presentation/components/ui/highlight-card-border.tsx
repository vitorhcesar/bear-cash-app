import { useId, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import { BearCashColors } from "@/presentation/constants/theme";
import { useBearCashTheme } from "@/presentation/theme/bear-cash-theme-context";

/** Figma Highlight Card: 1px gradient rim + glass edge. */
export function HighlightCardBorder() {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const gradientId = `highlight${uid}`;
  const [size, setSize] = useState({ width: 0, height: 0 });
  const { scheme } = useBearCashTheme();

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width !== size.width || height !== size.height) {
      setSize({ width, height });
    }
  };

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={onLayout}
    >
      {size.width > 0 ? (
        <Svg key={scheme} width={size.width} height={size.height}>
          <Defs>
            <LinearGradient
              id={gradientId}
              x1="0.875"
              y1="0.17"
              x2="0.125"
              y2="0.83"
            >
              <Stop
                offset="0.072"
                stopColor={
                  scheme === "dark" ? "rgb(0,0,0)" : "rgb(255,255,255)"
                }
                stopOpacity={scheme === "dark" ? 0.15 : 0.35}
              />
              <Stop
                offset="1"
                stopColor={
                  scheme === "dark" ? "rgb(85,85,85)" : "rgb(180,180,180)"
                }
                stopOpacity={0.15}
              />
            </LinearGradient>
          </Defs>
          <Rect
            x={0.5}
            y={0.5}
            width={size.width - 1}
            height={size.height - 1}
            rx={11.5}
            fill={`url(#${gradientId})`}
            stroke={BearCashColors.highlightStroke}
            strokeWidth={1}
          />
        </Svg>
      ) : null}
    </View>
  );
}
