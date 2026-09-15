import { useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const DURATION_MS = 1300;
const STAGGER_MS = 55;

type AmountChar =
  | { key: string; kind: 'digit'; digit: number; digitIndex: number; fromRight: number }
  | { key: string; kind: 'sep'; char: string };

function formatAbsoluteAmount(amount: number) {
  return Math.abs(amount).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseAmountChars(formatted: string): AmountChar[] {
  const digitTotal = [...formatted].filter((char) => char >= '0' && char <= '9').length;
  let digitIndex = 0;

  return [...formatted].map((char, index) => {
    if (char >= '0' && char <= '9') {
      const current = digitIndex;
      digitIndex += 1;
      return {
        key: `${index}-${char}`,
        kind: 'digit' as const,
        digit: Number(char),
        digitIndex: current,
        fromRight: digitTotal - 1 - current,
      };
    }

    return { key: `${index}-${char}`, kind: 'sep' as const, char };
  });
}

function DigitReel({
  digit,
  delayMs,
  cycles,
  height,
  width,
  textStyle,
}: {
  digit: number;
  delayMs: number;
  cycles: number;
  height: number;
  width: number;
  textStyle: StyleProp<TextStyle>;
}) {
  const progress = useSharedValue(0);
  const startDigit = useMemo(() => Math.floor(Math.random() * 10), []);
  const reelItems = useMemo(
    () => Array.from({ length: (cycles + 1) * 10 }, (_, index) => index % 10),
    [cycles],
  );
  const startOffset = -startDigit * height;
  const endOffset = -(cycles * 10 + digit) * height;

  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      delayMs,
      withTiming(1, {
        duration: Math.max(900, DURATION_MS - delayMs * 0.35),
        easing: Easing.bezier(0.2, 0.82, 0.22, 1),
        reduceMotion: ReduceMotion.System,
      }),
    );
  }, [cycles, delayMs, digit, progress]);

  const reelStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(progress.value, [0, 1], [startOffset, endOffset]),
      },
    ],
    opacity: interpolate(progress.value, [0, 0.82, 1], [0.8, 0.93, 1]),
    filter: [{ blur: interpolate(progress.value, [0, 0.7, 1], [2.2, 0.7, 0]) }],
  }));

  const ghostStyle = useAnimatedStyle(() => {
    const smear = interpolate(progress.value, [0, 0.78, 1], [5.5, 1.8, 0]);
    return {
      opacity: interpolate(progress.value, [0, 0.7, 1], [0.28, 0.12, 0]),
      transform: [
        {
          translateY:
            interpolate(progress.value, [0, 1], [startOffset, endOffset]) + smear,
        },
      ],
    };
  });

  return (
    <View
      style={[styles.reelWindow, { width, height }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      collapsable={false}
    >
      <Animated.View pointerEvents="none" style={[styles.reel, ghostStyle]}>
        {reelItems.map((value, index) => (
          <Text
            key={`ghost-${index}`}
            style={[textStyle, styles.digit, { height, lineHeight: height }]}
          >
            {value}
          </Text>
        ))}
      </Animated.View>
      <Animated.View style={[styles.reel, reelStyle]}>
        {reelItems.map((value, index) => (
          <Text
            key={`main-${index}`}
            style={[textStyle, styles.digit, { height, lineHeight: height }]}
          >
            {value}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

export function SpinningAmount({
  value,
  style,
}: {
  value: number;
  style?: StyleProp<TextStyle>;
}) {
  const formatted = formatAbsoluteAmount(value);
  const chars = useMemo(() => parseAmountChars(formatted), [formatted]);
  const flat = StyleSheet.flatten(style);
  const fontSize = typeof flat?.fontSize === 'number' ? flat.fontSize : 24;
  const height = typeof flat?.lineHeight === 'number' ? flat.lineHeight : 29;
  const digitWidth = Math.ceil(fontSize * 0.66);
  const sepWidth = Math.ceil(fontSize * 0.36);

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={formatted}
      style={styles.row}
    >
      {chars.map((char) =>
        char.kind === 'sep' ? (
          <Text
            key={char.key}
            style={[style, styles.sep, { width: sepWidth, height, lineHeight: height }]}
          >
            {char.char}
          </Text>
        ) : (
          <DigitReel
            key={char.key}
            digit={char.digit}
            delayMs={char.digitIndex * STAGGER_MS}
            cycles={Math.min(3, 2 + Math.min(char.fromRight, 1))}
            height={height}
            width={digitWidth}
            textStyle={style}
          />
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reelWindow: {
    overflow: 'hidden',
  },
  reel: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  digit: {
    textAlign: 'center',
    includeFontPadding: false,
    fontVariant: ['tabular-nums'],
  },
  sep: {
    textAlign: 'center',
    includeFontPadding: false,
  },
});
