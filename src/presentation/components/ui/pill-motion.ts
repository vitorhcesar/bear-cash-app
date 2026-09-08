import { withSpring, type WithSpringConfig } from 'react-native-reanimated';

/** Slight overshoot — used by the type switch and the tab bar pill. */
export const PILL_SPRING: WithSpringConfig = {
  damping: 14,
  stiffness: 220,
  mass: 0.68,
  overshootClamping: false,
};

export function springPill(to: number) {
  'worklet';
  return withSpring(to, PILL_SPRING);
}
