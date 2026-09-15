import { Extrapolation, interpolate } from "react-native-reanimated";

/** Finger travel needed before refresh actually fires. */
export const HARD_PULL_THRESHOLD = 102;
export const HARD_PULL_HOLD = 56;
export const HARD_PULL_MAX = 148;
/** Higher = more finger movement for the same visual pull. */
export const HARD_PULL_RESISTANCE = 190;
/** Spinner stays hidden until the pull is close to the trigger. */
export const HARD_PULL_SPINNER_START = 58;

export function rubberbandPull(distance: number) {
  "worklet";
  return HARD_PULL_MAX * (1 - Math.exp(-distance / HARD_PULL_RESISTANCE));
}

export function pullSpinnerOpacity(pull: number, refreshing: boolean) {
  "worklet";
  if (refreshing) {
    return 1;
  }
  return interpolate(
    pull,
    [0, HARD_PULL_SPINNER_START, HARD_PULL_THRESHOLD],
    [0, 0, 1],
    Extrapolation.CLAMP,
  );
}
