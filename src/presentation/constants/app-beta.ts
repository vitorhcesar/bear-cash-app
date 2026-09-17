import Constants from 'expo-constants';

function extraBetaFlag() {
  const extra = Constants.expoConfig?.extra as { beta?: unknown } | undefined;
  return extra?.beta === true;
}

/**
 * Debug surfaces (Polp transaction id, raw JSON sheet) stay visible while the
 * product is in beta. Flip `expo.extra.beta` in app.json or set
 * `EXPO_PUBLIC_BETA=false` to hide them for a production release.
 */
export function isAppBeta() {
  const fromEnv = process.env.EXPO_PUBLIC_BETA?.trim().toLowerCase();
  if (fromEnv === 'false' || fromEnv === '0' || fromEnv === 'no') {
    return false;
  }
  if (fromEnv === 'true' || fromEnv === '1' || fromEnv === 'yes') {
    return true;
  }
  if (extraBetaFlag()) {
    return true;
  }
  return __DEV__;
}
