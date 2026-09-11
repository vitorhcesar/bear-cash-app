import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  DEFAULT_PREFERENCES,
  getPreferences,
  savePreferences,
} from '@/infra/preferences/preferences-store';
import {
  authenticateWithBiometrics,
  getBiometricCapability,
  type BiometricCapability,
} from '@/presentation/biometrics/biometric-capability';
import { BackButton } from '@/presentation/components/ui/back-button';
import { BiometricsGridIcon } from '@/presentation/components/ui/biometrics-icons';
import { HighlightCardBorder } from '@/presentation/components/ui/highlight-card-border';
import { PreferenceToggle } from '@/presentation/components/ui/preferences-icons';
import { BearCashColors, BearCashTypography } from '@/presentation/constants/theme';

const ICON_OFF = '#E0DFE2';
const ICON_ON = '#B385E0';

export function BiometricsPage() {
  const [enabled, setEnabled] = useState(
    DEFAULT_PREFERENCES.biometricsEnabled,
  );
  const [capability, setCapability] = useState<BiometricCapability | null>(
    null,
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [stored, bio] = await Promise.all([
        getPreferences(),
        getBiometricCapability(),
      ]);
      if (cancelled) {
        return;
      }
      setEnabled(stored.biometricsEnabled);
      setCapability(bio);
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (nextEnabled: boolean) => {
    setEnabled(nextEnabled);
    const current = await getPreferences();
    await savePreferences({
      ...current,
      biometricsEnabled: nextEnabled,
    });
  }, []);

  async function handleToggle(value: boolean) {
    if (!value) {
      await persist(false);
      return;
    }

    if (capability && !capability.hardwareAvailable) {
      Alert.alert(
        'Biometria indisponível',
        'Este dispositivo não possui hardware biométrico disponível.',
      );
      return;
    }

    if (capability && !capability.enrolled) {
      Alert.alert(
        'Biometria não configurada',
        `Configure ${capability.label} nas ajustes do sistema para usar no BearCash.`,
      );
      return;
    }

    try {
      const result = await authenticateWithBiometrics(
        'Confirme para habilitar a biometria no BearCash',
      );

      if (!result.success) {
        return;
      }

      await persist(true);
    } catch {
      if (Platform.OS === 'web') {
        await persist(true);
      }
    }
  }

  const subtitle =
    capability?.subtitle ?? 'Configure como a biometria é usada no BearCash';
  const toggleTitle = capability?.toggleTitle ?? 'Biometria';
  const toggleDescription =
    capability?.toggleDescription ??
    'Use a biometria para entrar no app sem digitar a senha';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <BackButton />
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Biometria</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
        </View>

        <View style={[enabled && styles.rowOnOuter, !ready && styles.rowLoading]}>
          {enabled ? <HighlightCardBorder /> : null}
          <View style={[styles.row, enabled ? styles.rowOnInner : styles.rowOff]}>
            <View style={styles.rowMain}>
              <View style={styles.iconSlot}>
                <BiometricsGridIcon
                  size={12}
                  color={enabled ? ICON_ON : ICON_OFF}
                />
              </View>
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>{toggleTitle}</Text>
                <Text style={styles.rowDescription}>{toggleDescription}</Text>
              </View>
            </View>
            <PreferenceToggle value={enabled} onValueChange={handleToggle} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BearCashColors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 24,
  },
  header: {
    gap: 8,
  },
  headerCopy: {
    gap: 8,
  },
  title: {
    ...BearCashTypography.h1,
    color: BearCashColors.text,
  },
  subtitle: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    padding: 12,
    borderRadius: 12,
  },
  rowOff: {
    backgroundColor: 'transparent',
  },
  rowOnOuter: {
    alignSelf: 'stretch',
    borderRadius: 12,
    padding: 1,
    overflow: 'hidden',
  },
  rowOnInner: {
    backgroundColor: BearCashColors.surface,
    borderRadius: 12,
  },
  rowLoading: {
    opacity: 0.7,
  },
  rowMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconSlot: {
    borderRadius: 8,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BearCashColors.neutralBase,
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rowTitle: {
    ...BearCashTypography.subheading,
    color: BearCashColors.text,
  },
  rowDescription: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
  },
});
