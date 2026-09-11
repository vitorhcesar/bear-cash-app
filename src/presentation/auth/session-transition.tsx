import { Image } from 'expo-image';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { BearCashColors } from '@/presentation/constants/theme';

type SessionTransitionKind = 'enter' | 'leave';

type SessionTransitionContextValue = {
  playEnter: (commit: () => void | Promise<void>) => Promise<void>;
  playLeave: (commit: () => void | Promise<void>) => Promise<void>;
};

const SessionTransitionContext = createContext<SessionTransitionContextValue | null>(null);

const COVER_MS = 240;
const REVEAL_MS = 520;
const COVER_EASING = Easing.in(Easing.cubic);
const REVEAL_EASING = Easing.out(Easing.cubic);

function timing(
  value: SharedValue<number>,
  to: number,
  duration: number,
  easing: (t: number) => number,
) {
  return new Promise<void>((resolve) => {
    const finish = () => resolve();
    value.value = withTiming(to, { duration, easing }, () => {
      runOnJS(finish)();
    });
  });
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function SessionTransitionProvider({ children }: { children: ReactNode }) {
  const overlayOpacity = useSharedValue(0);
  const markOpacity = useSharedValue(0);
  const markScale = useSharedValue(0.82);
  const contentOpacity = useSharedValue(1);
  const contentScale = useSharedValue(1);
  const contentTranslateY = useSharedValue(0);
  const runningRef = useRef(false);
  const [blocking, setBlocking] = useState(false);

  const fillStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const markStyle = useAnimatedStyle(() => ({
    opacity: markOpacity.value,
    transform: [{ scale: markScale.value }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    width: '100%',
    height: '100%',
    opacity: contentOpacity.value,
    transform: [
      { translateY: contentTranslateY.value },
      { scale: contentScale.value },
    ],
  }));

  const play = useCallback(
    async (kind: SessionTransitionKind, commit: () => void | Promise<void>) => {
      if (runningRef.current) {
        await commit();
        return;
      }

      runningRef.current = true;
      setBlocking(true);
      await wait(16);

      const outgoingScale = kind === 'enter' ? 1.08 : 0.94;
      const outgoingY = kind === 'enter' ? -22 : 28;
      const incomingScale = kind === 'enter' ? 0.94 : 1.06;
      const incomingY = kind === 'enter' ? 32 : -18;
      const markStart = kind === 'enter' ? 0.78 : 1.16;
      const markEnd = kind === 'enter' ? 1.18 : 0.82;

      try {
        markScale.value = markStart;
        markOpacity.value = 0;

        await Promise.all([
          timing(contentOpacity, 0, COVER_MS, COVER_EASING),
          timing(contentScale, outgoingScale, COVER_MS, COVER_EASING),
          timing(contentTranslateY, outgoingY, COVER_MS, COVER_EASING),
          timing(overlayOpacity, 1, COVER_MS, COVER_EASING),
          timing(markOpacity, 1, COVER_MS, COVER_EASING),
          timing(markScale, 1, COVER_MS, COVER_EASING),
        ]);

        await commit();
        await wait(64);

        contentOpacity.value = 0;
        contentScale.value = incomingScale;
        contentTranslateY.value = incomingY;

        await Promise.all([
          timing(overlayOpacity, 0, REVEAL_MS, REVEAL_EASING),
          timing(markOpacity, 0, 360, REVEAL_EASING),
          timing(markScale, markEnd, REVEAL_MS, REVEAL_EASING),
          timing(contentOpacity, 1, REVEAL_MS, REVEAL_EASING),
          timing(contentScale, 1, REVEAL_MS, REVEAL_EASING),
          timing(contentTranslateY, 0, REVEAL_MS, REVEAL_EASING),
        ]);
      } catch {
        overlayOpacity.value = 0;
        markOpacity.value = 0;
        markScale.value = 1;
        contentOpacity.value = 1;
        contentScale.value = 1;
        contentTranslateY.value = 0;
      } finally {
        setBlocking(false);
        runningRef.current = false;
      }
    },
    [
      contentOpacity,
      contentScale,
      contentTranslateY,
      markOpacity,
      markScale,
      overlayOpacity,
    ],
  );

  const playEnter = useCallback(
    (commit: () => void | Promise<void>) => play('enter', commit),
    [play],
  );

  const playLeave = useCallback(
    (commit: () => void | Promise<void>) => play('leave', commit),
    [play],
  );

  const value = useMemo(
    () => ({ playEnter, playLeave }),
    [playEnter, playLeave],
  );

  return (
    <SessionTransitionContext.Provider value={value}>
      <View style={styles.root}>
        <View style={styles.contentClip}>
          <Animated.View style={contentStyle}>{children}</Animated.View>
        </View>
        {blocking ? (
          <SessionCover fillStyle={fillStyle} markStyle={markStyle} />
        ) : null}
      </View>
    </SessionTransitionContext.Provider>
  );
}

function SessionCover({
  fillStyle,
  markStyle,
}: {
  fillStyle: object;
  markStyle: object;
}) {
  const layer = (
    <View
      pointerEvents="auto"
      style={Platform.OS === 'ios' ? styles.overlayWindow : styles.overlayHost}
    >
      <Animated.View style={[styles.overlayFill, fillStyle]} />
      <View style={styles.markCenter} pointerEvents="none">
        <Animated.View style={markStyle}>
          <Image
            source={require('@/assets/images/auth/logo.png')}
            style={styles.mark}
            contentFit="contain"
            accessibilityLabel="BearCash"
          />
        </Animated.View>
      </View>
    </View>
  );

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.overlayPortal} pointerEvents="box-none">
        <FullWindowOverlay>{layer}</FullWindowOverlay>
      </View>
    );
  }

  return layer;
}

export function useSessionTransition() {
  const context = useContext(SessionTransitionContext);
  if (!context) {
    throw new Error('useSessionTransition must be used within SessionTransitionProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  contentClip: {
    flex: 1,
    overflow: 'hidden',
  },
  overlayPortal: {
    ...StyleSheet.absoluteFill,
    pointerEvents: 'box-none',
  },
  overlayWindow: {
    flex: 1,
  },
  overlayHost: {
    ...StyleSheet.absoluteFill,
  },
  overlayFill: {
    ...StyleSheet.absoluteFill,
    backgroundColor: BearCashColors.background,
  },
  markCenter: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    width: 57,
    height: 59,
  },
});

