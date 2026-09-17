import { useEffect, useRef, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { BearCashColors } from "@/presentation/constants/theme";
import { createThemedStyles } from "@/presentation/constants/themed-styles";

const OPEN_SPRING = {
  damping: 18,
  stiffness: 210,
  mass: 0.82,
  overshootClamping: false,
} as const;

const CLOSE_MS = 220;

const START_RADIUS = 44;
const START_SCALE = 0.72;
const START_Y = 72;

type BearCashIaScreenTransitionProps = {
  children: ReactNode;
  closing: boolean;
  onClosed: () => void;
};

/** Bubble expand on enter; fade out on close. */
export function BearCashIaScreenTransition({
  children,
  closing,
  onClosed,
}: BearCashIaScreenTransitionProps) {
  const styles = useStyles();
  const progress = useSharedValue(0);
  const fade = useSharedValue(1);
  const onClosedRef = useRef(onClosed);

  useEffect(() => {
    onClosedRef.current = onClosed;
  }, [onClosed]);

  useEffect(() => {
    progress.value = withSpring(1, OPEN_SPRING);
  }, [progress]);

  useEffect(() => {
    if (!closing) {
      return;
    }

    fade.value = withTiming(0, {
      duration: CLOSE_MS,
      easing: Easing.out(Easing.quad),
    });

    const timeout = setTimeout(() => {
      onClosedRef.current();
    }, CLOSE_MS);

    return () => clearTimeout(timeout);
  }, [closing, fade]);

  const bubbleStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      borderRadius: interpolate(p, [0, 0.75, 1], [START_RADIUS, 18, 0]),
      opacity: interpolate(p, [0, 0.12, 1], [0, 1, 1]) * fade.value,
      transform: [
        { translateY: interpolate(p, [0, 1], [START_Y, 0]) },
        { scale: interpolate(p, [0, 1], [START_SCALE, 1]) },
      ],
    };
  });

  return (
    <View style={styles.root}>
      <Animated.View
        style={[styles.bubble, bubbleStyle]}
        pointerEvents={closing ? "none" : "auto"}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const useStyles = createThemedStyles(() =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: "transparent",
    },
    bubble: {
      flex: 1,
      overflow: "hidden",
      backgroundColor: BearCashColors.background,
      transformOrigin: "50% 100%",
    },
  }),
);
