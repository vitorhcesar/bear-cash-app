import { useCallback, useMemo, type ReactNode } from 'react';
import Animated, {
  Easing,
  FadeInLeft,
  FadeInRight,
  FadeOutLeft,
  FadeOutRight,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import type { StyleProp, ViewStyle } from 'react-native';

const SWITCH_DURATION = 280;
const SWITCH_EXIT_DURATION = 220;
const SWITCH_SLIDE = 18;
const SWITCH_EASING = Easing.out(Easing.cubic);

export type AuthSlideDirection = 'left' | 'right';
export type AuthSceneKind = 'login' | 'register';

export function authFadeIn(from: AuthSlideDirection) {
  const translateX = from === 'right' ? SWITCH_SLIDE : -SWITCH_SLIDE;
  const entering = from === 'right' ? FadeInRight : FadeInLeft;

  return entering
    .duration(SWITCH_DURATION)
    .easing(SWITCH_EASING)
    .withInitialValues({
      opacity: 0,
      transform: [{ translateX }],
    });
}

export function authFadeOut(to: AuthSlideDirection) {
  const translateX = to === 'right' ? SWITCH_SLIDE : -SWITCH_SLIDE;
  const exiting = to === 'right' ? FadeOutRight : FadeOutLeft;

  return exiting
    .duration(SWITCH_EXIT_DURATION)
    .easing(SWITCH_EASING)
    .withTargetValues({
      opacity: 0,
      transform: [{ translateX }],
    });
}

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

export function useAuthSceneMotion() {
  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  const playExit = useCallback(async () => {
    await Promise.all([
      timing(opacity, 0, SWITCH_EXIT_DURATION, SWITCH_EASING),
      timing(translateX, SWITCH_SLIDE, SWITCH_EXIT_DURATION, SWITCH_EASING),
    ]);
  }, [opacity, translateX]);

  const playEnter = useCallback(async () => {
    opacity.value = 0;
    translateX.value = -SWITCH_SLIDE;
    await Promise.all([
      timing(opacity, 1, SWITCH_DURATION, SWITCH_EASING),
      timing(translateX, 0, SWITCH_DURATION, SWITCH_EASING),
    ]);
  }, [opacity, translateX]);

  return useMemo(
    () => ({ style, playExit, playEnter }),
    [style, playExit, playEnter],
  );
}

type AuthSceneProps = {
  kind: AuthSceneKind;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function AuthScene({ children, style }: AuthSceneProps) {
  return (
    <Animated.View entering={authFadeIn('right')} style={style}>
      {children}
    </Animated.View>
  );
}
