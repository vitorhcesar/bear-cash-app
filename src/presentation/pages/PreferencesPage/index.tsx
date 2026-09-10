import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
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
import { RefreshIcon } from '@/presentation/components/ui/auth-icons';
import { BackButton } from '@/presentation/components/ui/back-button';
import {
  BellIcon,
  SoundNoteIcon,
  VibrationPhoneIcon,
} from '@/presentation/components/ui/preferences-icons';
import { BearCashColors, BearCashFonts, BearCashTypography } from '@/presentation/constants/theme';
import { useApiService } from '@/presentation/hooks/use-api-service';

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
    <View style={[styles.row, value && styles.rowActive]}>
      <View style={styles.iconWrap}>{icon}</View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: BearCashColors.borderStrong,
          true: BearCashColors.primary,
        }}
        thumbColor={BearCashColors.text}
        ios_backgroundColor={BearCashColors.borderStrong}
      />
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <BackButton />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Restaurar preferências"
            onPress={handleRestore}
            style={({ pressed }) => [
              styles.restoreButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.restoreLabel}>Restaurar</Text>
            <RefreshIcon size={16} color={BearCashColors.textSoft} />
          </Pressable>
        </View>

        <View style={styles.headerCopy}>
          <Text style={styles.title}>Preferências</Text>
          <Text style={styles.subtitle}>Personalize sua experiência no BearCash</Text>
        </View>

        <View style={[styles.list, !ready && styles.listLoading]}>
          <PreferenceRow
            title="Habilitar sons"
            description="Reproduz efeitos sonoros ao receber notificações, alertas de conta e outros eventos."
            icon={<SoundNoteIcon size={20} color={BearCashColors.textMid} />}
            value={preferences.soundsEnabled}
            onValueChange={handleToggleSounds}
          />
          <PreferenceRow
            title="Habilitar vibrações"
            description="Ativa o feedback tátil do dispositivo ao receber ações e importantes"
            icon={<VibrationPhoneIcon size={20} color={BearCashColors.textMid} />}
            value={preferences.vibrationsEnabled}
            onValueChange={handleToggleVibrations}
          />
          <PreferenceRow
            title="Notificações push"
            description="Receba avisos do BearCash mesmo com o app fechado."
            icon={<BellIcon size={20} color={BearCashColors.textMid} />}
            value={preferences.pushEnabled}
            onValueChange={handleTogglePush}
          />
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
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  restoreLabel: {
    ...BearCashTypography.bodySmall,
    color: BearCashColors.textSoft,
  },
  headerCopy: {
    gap: 4,
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
    gap: 12,
  },
  listLoading: {
    opacity: 0.7,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
  },
  rowActive: {
    backgroundColor: BearCashColors.surface,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: BearCashColors.neutralBlackSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontFamily: BearCashFonts.semiBold,
    fontSize: 16,
    lineHeight: 26,
    color: BearCashColors.text,
  },
  rowDescription: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
  },
  pressed: {
    opacity: 0.85,
  },
});
