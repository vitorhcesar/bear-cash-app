import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/infra/http/get-error-message';
import { useAuthDraft } from '@/presentation/auth/auth-draft-context';
import { useAuthSession } from '@/presentation/auth/auth-session-context';
import { BackButton } from '@/presentation/components/ui/back-button';
import {
  BancoDoBrasilLogo,
  CaixaLogo,
  ItauLogo,
  NubankLogo,
  SantanderLogo,
} from '@/presentation/components/ui/bank-logos';
import { EmailIcon } from '@/presentation/components/ui/brand-icons';
import { ProfileAvatarControl } from '@/presentation/components/ui/profile-avatar-control';
import { ReportProblemSheet } from '@/presentation/components/ui/report-problem-sheet';
import {
  SettingsBiometricsIcon,
  SettingsCardIcon,
  SettingsChevronIcon,
  SettingsKeyIcon,
  SettingsLogoutIcon,
  SettingsPasswordIcon,
  SettingsProfileIcon,
  SettingsReportIcon,
  SettingsRocketIcon,
  SettingsSlidersIcon,
  SettingsStarIcon,
  SettingsSupportIcon,
} from '@/presentation/components/ui/settings-icons';
import {
  DEFAULT_AVATARS,
  getAvatarOption,
  type IAvatarOption,
} from '@/presentation/constants/avatars';
import { OttoColors, OttoFonts, OttoTypography } from '@/presentation/constants/theme';

const BANK_STACK = [
  { id: 'santander', Logo: SantanderLogo },
  { id: 'bb', Logo: BancoDoBrasilLogo },
  { id: 'nubank', Logo: NubankLogo },
  { id: 'caixa', Logo: CaixaLogo },
  { id: 'itau', Logo: ItauLogo },
] as const;

type NavRowProps = {
  label: string;
  icon: ReactNode;
  onPress?: () => void;
};

function NavRow({ label, icon, onPress }: NavRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.navRow, pressed && styles.pressed]}
    >
      <View style={styles.navRowLeft}>
        <View style={styles.iconSlot}>{icon}</View>
        <Text style={styles.navLabel}>{label}</Text>
      </View>
      <SettingsChevronIcon size={16} />
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionList}>{children}</View>
    </View>
  );
}

function appVersionLabel() {
  const version =
    Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? '1.0.0';
  const build =
    Constants.nativeBuildVersion ??
    Constants.expoConfig?.ios?.buildNumber ??
    Constants.expoConfig?.android?.versionCode ??
    '0';
  return `V.${version} (${build})`;
}

export function SettingsPage() {
  const router = useRouter();
  const { profile, user, signOut, updateAvatar } = useAuthSession();
  const { resetDraft } = useAuthDraft();
  const [loggingOut, setLoggingOut] = useState(false);
  const [reportSheetOpen, setReportSheetOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<IAvatarOption>(() =>
    getAvatarOption(profile?.avatarKey, DEFAULT_AVATARS[0]),
  );

  useEffect(() => {
    setSelectedAvatar(getAvatarOption(profile?.avatarKey, DEFAULT_AVATARS[0]));
  }, [profile?.avatarKey]);

  const displayName = useMemo(() => {
    return (
      profile?.displayName?.trim() ||
      profile?.fullName?.trim() ||
      user?.name?.trim() ||
      'Usuário'
    );
  }, [profile?.displayName, profile?.fullName, user?.name]);

  async function handleAvatarChange(avatar: IAvatarOption) {
    const previous = selectedAvatar;
    setSelectedAvatar(avatar);
    try {
      await updateAvatar(avatar.id);
    } catch (error) {
      setSelectedAvatar(previous);
      Alert.alert(
        'Erro',
        getErrorMessage(error, 'Não foi possível atualizar o avatar.'),
      );
    }
  }

  async function handleLogout() {
    if (loggingOut) {
      return;
    }
    setLoggingOut(true);
    try {
      await signOut();
      resetDraft();
    } catch {
      Alert.alert('Erro', 'Não foi possível sair. Tente novamente.');
    } finally {
      setLoggingOut(false);
    }
  }

  function comingSoon(feature: string) {
    Alert.alert(feature, 'Em breve.');
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <BackButton />
        </View>

        <ProfileAvatarControl
          avatar={selectedAvatar}
          onChange={handleAvatarChange}
          size={80}
          action="edit"
        />

        <View style={styles.body}>
          <Text style={styles.name}>{displayName}</Text>

          <View style={styles.topActions}>
            <View style={styles.summaryRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/subscription')}
                style={({ pressed }) => [
                  styles.featureCard,
                  pressed && styles.pressed,
                ]}
              >
                <SettingsRocketIcon size={16} />
                <View style={styles.featureCopy}>
                  <Text style={styles.featureTitle}>Grátis</Text>
                  <Text style={styles.featureSubtitle}>Plano</Text>
                </View>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => comingSoon('Conexões')}
                style={({ pressed }) => [
                  styles.featureCard,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.bankStack}>
                  {BANK_STACK.map((bank, index) => {
                    const Logo = bank.Logo;
                    return (
                      <View
                        key={bank.id}
                        style={[
                          styles.bankDot,
                          {
                            marginLeft: index === 0 ? 0 : -5,
                            zIndex: BANK_STACK.length - index,
                            borderColor: OttoColors.surface,
                          },
                        ]}
                      >
                        <Logo size={20} />
                      </View>
                    );
                  })}
                  <View
                    style={[
                      styles.bankDot,
                      styles.bankMore,
                      { marginLeft: -5, zIndex: 0 },
                    ]}
                  >
                    <Text style={styles.bankMoreText}>+1</Text>
                  </View>
                </View>
                <View style={styles.featureCopy}>
                  <Text style={styles.featureTitle}>6 Bancos</Text>
                  <Text style={styles.featureSubtitle}>Conexões</Text>
                </View>
              </Pressable>
            </View>

            <NavRow
              label="Avalie o Otto"
              icon={<SettingsStarIcon size={16} />}
              onPress={() => comingSoon('Avalie o Otto')}
            />

            {!user?.emailVerified && user?.email ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Verifique seu e-mail"
                onPress={() => router.push('/verify-email')}
                style={({ pressed }) => [
                  styles.verifyBanner,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.verifyBannerLeft}>
                  <View style={styles.verifyBannerIcon}>
                    <EmailIcon size={16} color={OttoColors.warningText} />
                  </View>
                  <View style={styles.verifyBannerCopy}>
                    <Text style={styles.verifyBannerTitle}>Verifique seu e-mail</Text>
                    <Text style={styles.verifyBannerSubtitle}>
                      Confirme sua conta com um código
                    </Text>
                  </View>
                </View>
                <SettingsChevronIcon size={16} color={OttoColors.warningText} />
              </Pressable>
            ) : null}
          </View>

          <Section title="Geral">
            <NavRow
              label="Perfil"
              icon={<SettingsProfileIcon size={16} />}
              onPress={() => router.push('/profile')}
            />
            <NavRow
              label="Preferências"
              icon={<SettingsSlidersIcon size={16} />}
              onPress={() => router.push('/preferences')}
            />
            <NavRow
              label="Assinatura"
              icon={<SettingsCardIcon size={16} />}
              onPress={() => router.push('/subscription')}
            />
            <NavRow
              label="API Keys"
              icon={<SettingsKeyIcon size={16} />}
              onPress={() => router.push('/api-keys')}
            />
          </Section>

          <Section title="Seguranças">
            <NavRow
              label="Alterar senha"
              icon={<SettingsPasswordIcon size={16} />}
              onPress={() => router.push('/change-password-code')}
            />
            <NavRow
              label="Biometria"
              icon={<SettingsBiometricsIcon size={16} />}
              onPress={() => router.push('/biometrics')}
            />
            <NavRow
              label="Reportar um problema"
              icon={<SettingsReportIcon size={16} />}
              onPress={() => setReportSheetOpen(true)}
            />
          </Section>

          <Section title="Suporte">
            <NavRow
              label="Falar com suporte"
              icon={<SettingsSupportIcon size={16} />}
              onPress={() => comingSoon('Falar com suporte')}
            />
          </Section>

          <Pressable
            accessibilityRole="button"
            disabled={loggingOut}
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && !loggingOut && styles.pressed,
            ]}
          >
            <Text style={styles.logoutLabel}>
              {loggingOut ? 'Saindo…' : 'Sair'}
            </Text>
            <SettingsLogoutIcon size={16} />
          </Pressable>

          <Text style={styles.version}>{appVersionLabel()}</Text>
        </View>
      </ScrollView>

      <ReportProblemSheet
        visible={reportSheetOpen}
        onClose={() => setReportSheetOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: OttoColors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 32,
    alignItems: 'center',
  },
  header: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
  },
  body: {
    alignSelf: 'stretch',
    gap: 24,
    alignItems: 'center',
  },
  name: {
    ...OttoTypography.h1,
    color: OttoColors.text,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  topActions: {
    alignSelf: 'stretch',
    gap: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 16,
    alignSelf: 'stretch',
  },
  featureCard: {
    flex: 1,
    backgroundColor: OttoColors.surface,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  featureCopy: {
    gap: 2,
  },
  featureTitle: {
    fontFamily: OttoFonts.semiBold,
    fontSize: 16,
    lineHeight: 26,
    color: OttoColors.textMid,
  },
  featureSubtitle: {
    ...OttoTypography.caption,
    color: OttoColors.textSoft,
  },
  bankStack: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
  },
  bankDot: {
    width: 20,
    height: 20,
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
  },
  bankMore: {
    backgroundColor: OttoColors.text,
    borderColor: '#212220',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankMoreText: {
    ...OttoTypography.captionSmall,
    color: OttoColors.background,
  },
  navRow: {
    alignSelf: 'stretch',
    height: 50,
    backgroundColor: OttoColors.surface,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconSlot: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  navLabel: {
    fontFamily: OttoFonts.semiBold,
    fontSize: 16,
    lineHeight: 26,
    color: OttoColors.textMid,
  },
  verifyBanner: {
    alignSelf: 'stretch',
    minHeight: 58,
    backgroundColor: OttoColors.warning,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verifyBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  verifyBannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(10, 11, 10, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyBannerCopy: {
    flex: 1,
    gap: 0,
  },
  verifyBannerTitle: {
    fontFamily: OttoFonts.semiBold,
    fontSize: 16,
    lineHeight: 22,
    color: OttoColors.warningText,
  },
  verifyBannerSubtitle: {
    ...OttoTypography.caption,
    color: OttoColors.warningText,
    opacity: 0.72,
  },
  section: {
    alignSelf: 'stretch',
    gap: 16,
  },
  sectionTitle: {
    fontFamily: OttoFonts.semiBold,
    fontSize: 14,
    lineHeight: 22,
    color: OttoColors.text,
  },
  sectionList: {
    gap: 12,
  },
  logoutButton: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: OttoColors.borderStrong,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  logoutLabel: {
    ...OttoTypography.bodySmall,
    color: OttoColors.text,
  },
  version: {
    ...OttoTypography.captionSmall,
    color: OttoColors.textSoft,
  },
  pressed: {
    opacity: 0.85,
  },
});
