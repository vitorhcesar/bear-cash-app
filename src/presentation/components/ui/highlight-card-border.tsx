import { useId, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/** Figma Highlight Card: 1px gradient rim + glass edge. */
export function HighlightCardBorder() {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const gradientId = `highlight${uid}`;
  const [size, setSize] = useState({ width: 0, height: 0 });

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width !== size.width || height !== size.height) {
      setSize({ width, height });
    }
  };

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} onLayout={onLayout}>
      {size.width > 0 ? (
        <Svg width={size.width} height={size.height}>
          <Defs>
            <LinearGradient
              id={gradientId}
              x1="0.875"
              y1="0.17"
              x2="0.125"
              y2="0.83"
            >
              <Stop offset="0.072" stopColor="rgb(0,0,0)" stopOpacity={0.15} />
              <Stop offset="1" stopColor="rgb(85,85,85)" stopOpacity={0.15} />
            </LinearGradient>
          </Defs>
          <Rect
            x={0.5}
            y={0.5}
            width={size.width - 1}
            height={size.height - 1}
            rx={11.5}
            fill={`url(#${gradientId})`}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={1}
          />
        </Svg>
      ) : null}
    </View>
  );
}
