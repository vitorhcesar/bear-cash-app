import { Image } from 'expo-image';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FullWindowOverlay } from 'react-native-screens';

import { useAuthSession } from '@/presentation/auth/auth-session-context';
import {
  authenticateWithBiometrics,
  shouldRequireBiometricLock,
  type BiometricCapability,
} from '@/presentation/biometrics/biometric-capability';
import { Button } from '@/presentation/components/ui/button';
import {
  BiometricsFaceIcon,
  BiometricsFingerprintIcon,
} from '@/presentation/components/ui/biometrics-icons';
import { OttoColors, OttoTypography } from '@/presentation/constants/theme';
import { HomeLoading } from '@/presentation/pages/HomePage';

type Gate = 'pending' | 'open' | 'locked';

export function BiometricLockGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, hasCompletedOnboarding, signOut } = useAuthSession();
  const lockEnabled = isAuthenticated && hasCompletedOnboarding;
  const [gate, setGate] = useState<Gate>(lockEnabled ? 'pending' : 'open');
  const [capability, setCapability] = useState<BiometricCapability | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const gateRef = useRef(gate);
  const promptingRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);
  const sawLoggedOutReady = useRef(!lockEnabled);

  useEffect(() => {
    gateRef.current = gate;
  }, [gate]);

  const lockIfRequired = useCallback(async () => {
    const { required, capability: bio } = await shouldRequireBiometricLock();
    setCapability(bio);
    if (required) {
      setGate('locked');
      return bio;
    }
    setGate('open');
    return null;
  }, []);

  const promptUnlock = useCallback(async (bio: BiometricCapability) => {
    if (promptingRef.current) {
      return;
    }

    promptingRef.current = true;
    try {
      const result = await authenticateWithBiometrics(
        `Desbloqueie o Otto com ${bio.label}`,
      );
      if (result.success) {
        setGate('open');
      }
    } catch {
      // Stay locked; the overlay offers a retry.
    } finally {
      promptingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!lockEnabled) {
      sawLoggedOutReady.current = true;
      setGate('open');
      setCapability(null);
      return;
    }

    if (sawLoggedOutReady.current) {
      setGate('open');
      return;
    }

    let cancelled = false;

    (async () => {
      const bio = await lockIfRequired();
      if (cancelled || !bio) {
        return;
      }
      await promptUnlock(bio);
    })();

    return () => {
      cancelled = true;
    };
  }, [lockEnabled, lockIfRequired, promptUnlock]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const previous = appStateRef.current;
      appStateRef.current = nextState;

      if (nextState === 'background' && lockEnabled) {
        void lockIfRequired();
        return;
      }

      if (nextState !== 'active' || previous !== 'background' || !lockEnabled) {
        return;
      }

      void (async () => {
        const bio = await lockIfRequired();
        if (bio && gateRef.current === 'locked') {
          await promptUnlock(bio);
        }
      })();
    });

    return () => {
      subscription.remove();
    };
  }, [lockEnabled, lockIfRequired, promptUnlock]);

  async function handleRetry() {
    const bio = capability ?? (await lockIfRequired());
    if (!bio) {
      return;
    }
    await promptUnlock(bio);
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  }

  const cover = lockEnabled && gate !== 'open';
  const icon =
    capability?.kind === 'fingerprint' ? (
      <BiometricsFingerprintIcon size={32} color={OttoColors.textMid} />
    ) : (
      <BiometricsFaceIcon size={32} color={OttoColors.textMid} />
    );

  const lockUi =
    gate === 'pending' ? (
      <HomeLoading />
    ) : (
      <SafeAreaView style={styles.lockSafe} edges={['top', 'bottom']}>
        <View style={styles.lockContent}>
          <Image
            source={require('@/assets/images/auth/logo.png')}
            style={styles.logo}
            contentFit="contain"
            accessibilityLabel="Otto"
          />
          <View style={styles.iconWrap}>{icon}</View>
          <View style={styles.copy}>
            <Text style={styles.title}>Desbloquear Otto</Text>
            <Text style={styles.subtitle}>
              {capability
                ? `Use ${capability.label} para entrar no app`
                : 'Use a biometria para entrar no app'}
            </Text>
          </View>
          <View style={styles.actions}>
            <Button
              label={`Usar ${capability?.label ?? 'biometria'}`}
              variant="filled"
              onPress={handleRetry}
            />
            <Button
              label="Sair da conta"
              variant="stroke"
              loading={signingOut}
              onPress={handleSignOut}
            />
          </View>
        </View>
      </SafeAreaView>
    );

  return (
    <View style={styles.root}>
      <View style={styles.app}>{children}</View>
      {cover ? <AppLockCover>{lockUi}</AppLockCover> : null}
    </View>
  );
}

/** iOS: native screens and Liquid Glass ignore sibling zIndex; attach to the window. */
function AppLockCover({ children }: { children: ReactNode }) {
  const layer = (
    <View
      style={Platform.OS === 'ios' ? styles.coverWindow : styles.coverHost}
      pointerEvents="auto"
    >
      {children}
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  app: {
    flex: 1,
  },
  overlayPortal: {
    ...StyleSheet.absoluteFill,
    pointerEvents: 'box-none',
  },
  coverWindow: {
    flex: 1,
    backgroundColor: OttoColors.background,
  },
  coverHost: {
    ...StyleSheet.absoluteFill,
    backgroundColor: OttoColors.background,
  },
  lockSafe: {
    flex: 1,
  },
  lockContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 24,
  },
  logo: {
    width: 57,
    height: 59,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: OttoColors.neutralBlackSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    alignItems: 'center',
    gap: 4,
  },
  title: {
    ...OttoTypography.h3,
    color: OttoColors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...OttoTypography.caption,
    color: OttoColors.textSoft,
    textAlign: 'center',
  },
  actions: {
    alignSelf: 'stretch',
    maxWidth: 400,
    gap: 12,
  },
});
