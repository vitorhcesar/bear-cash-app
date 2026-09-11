import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  DEFAULT_PREFERENCES,
  getPreferences,
  savePreferences,
  type AppPreferences,
} from '@/infra/preferences/preferences-store';
import {
  registerPushForCurrentUser,
  unregisterPushForCurrentUser,
} from '@/infra/notifications/push-notifications';
import { BackButton } from '@/presentation/components/ui/back-button';
import { HighlightCardBorder } from '@/presentation/components/ui/highlight-card-border';
import {
  BellIcon,
  PreferenceRestoreIcon,
  PreferenceToggle,
  SoundNoteIcon,
  SunIcon,
  VibrationPhoneIcon,
} from '@/presentation/components/ui/preferences-icons';
import { BearCashColors, BearCashTypography } from '@/presentation/constants/theme';
import { useApiService } from '@/presentation/hooks/use-api-service';

const ICON_OFF = '#E0DFE2';
const ICON_ON = '#9941F1';

type PreferenceRowProps = {
  title: string;
  description: string;
  icon: ReactNode;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

function PreferenceRow({
  title,
  description,
  icon,
  value,
  onValueChange,
}: PreferenceRowProps) {
  return (
    <View style={value ? styles.rowOnOuter : undefined}>
      {value ? <HighlightCardBorder /> : null}
      <View style={[styles.row, value ? styles.rowOnInner : styles.rowOff]}>
        <View style={styles.rowMain}>
          <View style={styles.iconSlot}>{icon}</View>
          <View style={styles.rowCopy}>
            <Text style={styles.rowTitle}>{title}</Text>
            <Text style={styles.rowDescription}>{description}</Text>
          </View>
        </View>
        <PreferenceToggle value={value} onValueChange={onValueChange} />
      </View>
    </View>
  );
}

export function PreferencesPage() {
  const api = useApiService();
  const [preferences, setPreferences] = useState<AppPreferences>(
    DEFAULT_PREFERENCES,
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const stored = await getPreferences();
      if (!cancelled) {
        setPreferences(stored);
        setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (next: AppPreferences) => {
    setPreferences(next);
    await savePreferences(next);
  }, []);

  async function handleToggleSounds(value: boolean) {
    await persist({ ...preferences, soundsEnabled: value });
  }

  async function handleToggleVibrations(value: boolean) {
    await persist({ ...preferences, vibrationsEnabled: value });
  }

  async function handleTogglePush(value: boolean) {
    await persist({ ...preferences, pushEnabled: value });
    if (value) {
      await registerPushForCurrentUser(api.modules.push);
      return;
    }
    await unregisterPushForCurrentUser(api.modules.push);
  }

  async function handleToggleLightMode(value: boolean) {
    await persist({ ...preferences, lightModeEnabled: value });
  }

  async function handleRestore() {
    const next = {
      ...DEFAULT_PREFERENCES,
      activitiesIncomeVisible: preferences.activitiesIncomeVisible,
      activitiesExpenseVisible: preferences.activitiesExpenseVisible,
    };
    await persist(next);
    if (next.pushEnabled) {
      await registerPushForCurrentUser(api.modules.push);
      return;
    }
    await unregisterPushForCurrentUser(api.modules.push);
  }

  function iconColor(enabled: boolean) {
    return enabled ? ICON_ON : ICON_OFF;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <BackButton />
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Preferências</Text>
            <Text style={styles.subtitle}>
              Personalize sua experiência no BearCash
            </Text>
          </View>
        </View>

        <View style={[styles.list, !ready && styles.listLoading]}>
          <PreferenceRow
            title="Habilitar sons"
            description="Reproduz efeitos sonoros ao receber notificações, alertas de conta e outros eventos."
            icon={<SoundNoteIcon size={12} color={iconColor(preferences.soundsEnabled)} />}
            value={preferences.soundsEnabled}
            onValueChange={handleToggleSounds}
          />
          <PreferenceRow
            title="Habilitar vibrações"
            description="Ativa o feedback tátil do dispositivo ao receber ações e importantes"
            icon={
              <VibrationPhoneIcon
                size={12}
                color={iconColor(preferences.vibrationsEnabled)}
              />
            }
            value={preferences.vibrationsEnabled}
            onValueChange={handleToggleVibrations}
          />
          <PreferenceRow
            title="Notificações push"
            description="Receba avisos do BearCash mesmo com o app fechado."
            icon={<BellIcon size={12} color={iconColor(preferences.pushEnabled)} />}
            value={preferences.pushEnabled}
            onValueChange={handleTogglePush}
          />
          <PreferenceRow
            title="Modo Claro"
            description="Exibe o aplicativo com um tema claro."
            icon={<SunIcon size={12} color={iconColor(preferences.lightModeEnabled)} />}
            value={preferences.lightModeEnabled}
            onValueChange={handleToggleLightMode}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Restaurar preferências"
          onPress={handleRestore}
          style={({ pressed }) => [styles.restoreButton, pressed && styles.pressed]}
        >
          <Text style={styles.restoreLabel}>Restaurar</Text>
          <PreferenceRestoreIcon size={12} color={BearCashColors.textSoft} />
        </Pressable>
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
  list: {
    gap: 24,
  },
  listLoading: {
    opacity: 0.7,
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
    borderRadius: 12,
    padding: 1,
    overflow: 'hidden',
  },
  rowOnInner: {
    backgroundColor: BearCashColors.surface,
    borderRadius: 12,
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
  restoreButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  restoreLabel: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
  },
  pressed: {
    opacity: 0.85,
  },
});
