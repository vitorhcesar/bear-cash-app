import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

import { getPreferences } from '@/infra/preferences/preferences-store';

export type BiometricKind = 'face' | 'fingerprint' | 'iris' | 'generic';

export type BiometricCapability = {
  kind: BiometricKind;
  /** Short marketing name: Face ID, Touch ID, Impressão digital… */
  label: string;
  /** Page subtitle */
  subtitle: string;
  /** Toggle row title */
  toggleTitle: string;
  /** Toggle row description */
  toggleDescription: string;
  hardwareAvailable: boolean;
  enrolled: boolean;
};

function labelForKind(kind: BiometricKind): string {
  switch (kind) {
    case 'face':
      return Platform.OS === 'ios' ? 'Face ID' : 'reconhecimento facial';
    case 'fingerprint':
      return Platform.OS === 'ios' ? 'Touch ID' : 'impressão digital';
    case 'iris':
      return 'íris';
    default:
      return 'biometria';
  }
}

function resolveKind(
  types: LocalAuthentication.AuthenticationType[],
): BiometricKind {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'face';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'fingerprint';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return 'iris';
  }

  // Fallback by platform when hardware APIs are unavailable (e.g. web/simulator).
  if (Platform.OS === 'ios') {
    return 'face';
  }
  if (Platform.OS === 'android') {
    return 'fingerprint';
  }
  return 'generic';
}

export async function getBiometricCapability(): Promise<BiometricCapability> {
  let hardwareAvailable = false;
  let enrolled = false;
  let types: LocalAuthentication.AuthenticationType[] = [];

  try {
    hardwareAvailable = await LocalAuthentication.hasHardwareAsync();
    enrolled = hardwareAvailable
      ? await LocalAuthentication.isEnrolledAsync()
      : false;
    types = hardwareAvailable
      ? await LocalAuthentication.supportedAuthenticationTypesAsync()
      : [];
  } catch {
    hardwareAvailable = false;
    enrolled = false;
    types = [];
  }

  const kind = resolveKind(types);
  const label = labelForKind(kind);

  const subtitle =
    kind === 'face' && Platform.OS === 'ios'
      ? 'Configure como o Face ID é usado no BearCash'
      : kind === 'fingerprint' && Platform.OS === 'ios'
        ? 'Configure como o Touch ID é usado no BearCash'
        : kind === 'fingerprint'
          ? 'Configure como a impressão digital é usada no BearCash'
          : kind === 'face'
            ? 'Configure como o reconhecimento facial é usado no BearCash'
            : 'Configure como a biometria é usada no BearCash';

  const toggleTitle = 'Habilitar Biometria';

  const toggleDescription =
    kind === 'face' && Platform.OS === 'ios'
      ? 'Use o Face ID para entrar no app sem digitar a senha'
      : kind === 'fingerprint' && Platform.OS === 'ios'
        ? 'Use o Touch ID para entrar no app sem digitar a senha'
        : kind === 'fingerprint'
          ? 'Use a impressão digital para entrar no app sem digitar a senha'
          : kind === 'face'
            ? 'Use o reconhecimento facial para entrar no app sem digitar a senha'
            : 'Use a biometria para entrar no app sem digitar a senha';

  return {
    kind,
    label,
    subtitle,
    toggleTitle,
    toggleDescription,
    hardwareAvailable,
    enrolled,
  };
}

export async function authenticateWithBiometrics(promptMessage: string) {
  return LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: 'Cancelar',
    disableDeviceFallback: false,
  });
}

export async function shouldRequireBiometricLock() {
  const [prefs, capability] = await Promise.all([
    getPreferences(),
    getBiometricCapability(),
  ]);

  return {
    required:
      prefs.biometricsEnabled &&
      capability.hardwareAvailable &&
      capability.enrolled,
    capability,
  };
}
