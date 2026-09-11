import Constants from "expo-constants";
import { useFocusEffect, useRouter } from "expo-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getErrorMessage } from "@/infra/http/get-error-message";
import type { OpenFinanceConnection } from "@/infra/http/services/api/modules/open-finance.module";
import { useAuthDraft } from "@/presentation/auth/auth-draft-context";
import { useAuthSession } from "@/presentation/auth/auth-session-context";
import { BackButton } from "@/presentation/components/ui/back-button";
import { EmailIcon } from "@/presentation/components/ui/brand-icons";
import { InstitutionMark } from "@/presentation/components/ui/institution-mark";
import { ProfileAvatarControl } from "@/presentation/components/ui/profile-avatar-control";
import { ReportProblemSheet } from "@/presentation/components/ui/report-problem-sheet";
import {
  SettingsBankIcon,
  SettingsBiometricsIcon,
  SettingsCardIcon,
  SettingsChevronIcon,
  SettingsLogoutIcon,
  SettingsPasswordIcon,
  SettingsProfileIcon,
  SettingsReportIcon,
  SettingsSlidersIcon,
  SettingsSparkleIcon,
  SettingsStarIcon,
  SettingsSupportIcon,
} from "@/presentation/components/ui/settings-icons";
import {
  DEFAULT_AVATARS,
  getAvatarOption,
  type IAvatarOption,
} from "@/presentation/constants/avatars";
import {
  BearCashColors,
  BearCashFonts,
  BearCashTypography,
} from "@/presentation/constants/theme";
import { useApiService } from "@/presentation/hooks/use-api-service";

const NAV_ICON_COLOR = BearCashColors.iconAccent;
const MAX_BANK_STACK = 4;

type NavRowProps = {
  label: string;
  icon: ReactNode;
  onPress?: () => void;
  badge?: number;
};

function uniqueInstitutions(connections: OpenFinanceConnection[]) {
  const seen = new Set<string>();
  const result: OpenFinanceConnection[] = [];

  for (const connection of connections) {
    const key = connection.institutionId || connection.institutionName;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(connection);
  }

  return result;
}

function NavRow({ label, icon, onPress, badge }: NavRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.navRow, pressed && styles.pressed]}
    >
      <View style={styles.navRowLeft}>
        <View style={styles.iconSlot}>{icon}</View>
        <Text style={styles.navLabel}>{label}</Text>
        {badge != null && badge > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <SettingsChevronIcon size={16} color={BearCashColors.textMid} />
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

function SettingsPlanBanner({
  hasPlan,
  onPress,
}: {
  hasPlan: boolean;
  onPress: () => void;
}) {
  return (
    <View style={styles.planBanner}>
      <View style={styles.planBannerCopy}>
        <View style={styles.planBannerTitleRow}>
          <SettingsSparkleIcon size={16} />
          <Text style={styles.planBannerTitle}>
            {hasPlan ? "Sua conta é Pro!" : "Faça upgrade!"}
          </Text>
        </View>
        <Text style={styles.planBannerSubtitle}>
          {hasPlan
            ? "Conheça todos os benefícios para controlar e organizar seus gastos"
            : "Desbloqueie mais benefícios e aproveite a experiência completa."}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.planCta, pressed && styles.pressed]}
      >
        <Text style={styles.planCtaLabel}>
          {hasPlan ? "Ver plano" : "Assinar"}
        </Text>
      </Pressable>
    </View>
  );
}

function BankStack({ connections }: { connections: OpenFinanceConnection[] }) {
  const visible = connections.slice(0, MAX_BANK_STACK);
  const remaining = connections.length - visible.length;

  return (
    <View style={styles.bankStack}>
      {visible.map((connection, index) => (
        <View
          key={connection.institutionId || connection.id}
          style={[
            styles.bankDot,
            {
              marginLeft: index === 0 ? 0 : -5,
              zIndex: visible.length - index,
            },
          ]}
        >
          <InstitutionMark
            name={connection.institutionName}
            logoUrl={connection.institutionLogoUrl}
            size={20}
          />
        </View>
      ))}
      {remaining > 0 ? (
        <View
          style={[
            styles.bankDot,
            styles.bankMore,
            { marginLeft: -5, zIndex: 0 },
          ]}
        >
          <Text style={styles.bankMoreText}>+{remaining}</Text>
        </View>
      ) : null}
    </View>
  );
}

function appVersionLabel() {
  const version =
    Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? "1.0.0";
  const build =
    Constants.nativeBuildVersion ??
    Constants.expoConfig?.ios?.buildNumber ??
    Constants.expoConfig?.android?.versionCode ??
    "0";
  return `V.${version} (${build})`;
}

export function SettingsPage() {
  const router = useRouter();
  const api = useApiService();
  const { profile, user, signOut, updateAvatar } = useAuthSession();
  const { resetDraft } = useAuthDraft();
  const [loggingOut, setLoggingOut] = useState(false);
  const [reportSheetOpen, setReportSheetOpen] = useState(false);
  const [connections, setConnections] = useState<OpenFinanceConnection[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<IAvatarOption>(() =>
    getAvatarOption(profile?.avatarKey, DEFAULT_AVATARS[0]),
  );

  useEffect(() => {
    setSelectedAvatar(getAvatarOption(profile?.avatarKey, DEFAULT_AVATARS[0]));
  }, [profile?.avatarKey]);

  const loadConnections = useCallback(async () => {
    try {
      const response = await api.modules.openFinance.listConnections();
      setConnections(response.items.filter((item) => !item.revokedAt));
    } catch {
      setConnections([]);
    }
  }, [api.modules.openFinance]);

  useFocusEffect(
    useCallback(() => {
      void loadConnections();
    }, [loadConnections]),
  );

  const displayName = useMemo(() => {
    return (
      profile?.displayName?.trim() ||
      profile?.fullName?.trim() ||
      user?.name?.trim() ||
      "Usuário"
    );
  }, [profile?.displayName, profile?.fullName, user?.name]);

  const institutions = useMemo(
    () => uniqueInstitutions(connections),
    [connections],
  );
  const hasConnections = institutions.length > 0;
  const hasPlan = false;

  async function handleAvatarChange(avatar: IAvatarOption) {
    const previous = selectedAvatar;
    setSelectedAvatar(avatar);
    try {
      await updateAvatar(avatar.id);
    } catch (error) {
      setSelectedAvatar(previous);
      Alert.alert(
        "Erro",
        getErrorMessage(error, "Não foi possível atualizar o avatar."),
      );
    }
  }

  async function handleLogout() {
    if (loggingOut) {
      return;
    }
    setLoggingOut(true);
    resetDraft();
    try {
      await signOut();
    } finally {
      setLoggingOut(false);
    }
  }

  function comingSoon(feature: string) {
    Alert.alert(feature, "Em breve.");
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
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
          <View
            style={[
              styles.identity,
              hasConnections && styles.identityConnected,
            ]}
          >
            <Text style={styles.name}>{displayName}</Text>
            {hasConnections ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Conexões"
                onPress={() => router.push("/bank-connection")}
                style={({ pressed }) => [
                  styles.connectionsSummary,
                  pressed && styles.pressed,
                ]}
              >
                <BankStack connections={institutions} />
                <Text style={styles.connectionsCaption}>Conexões</Text>
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/bank-select")}
                style={({ pressed }) => [
                  styles.connectLink,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.connectLinkLabel}>Conectar banco</Text>
                <SettingsChevronIcon size={16} color={BearCashColors.textMid} />
              </Pressable>
            )}
          </View>

          <SettingsPlanBanner
            hasPlan={hasPlan}
            onPress={() =>
              router.push(hasPlan ? "/subscription" : "/subscription-premium")
            }
          />

          {!user?.emailVerified && user?.email ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Verifique seu e-mail"
              onPress={() => router.push("/verify-email")}
              style={({ pressed }) => [
                styles.verifyBanner,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.verifyBannerLeft}>
                <View style={styles.verifyBannerIcon}>
                  <EmailIcon size={16} color={BearCashColors.warningText} />
                </View>
                <View style={styles.verifyBannerCopy}>
                  <Text style={styles.verifyBannerTitle}>
                    Verifique seu e-mail
                  </Text>
                  <Text style={styles.verifyBannerSubtitle}>
                    Confirme sua conta com um código
                  </Text>
                </View>
              </View>
              <SettingsChevronIcon
                size={16}
                color={BearCashColors.warningText}
              />
            </Pressable>
          ) : null}

          <Section title="Conexões">
            <NavRow
              label="Bancos"
              icon={<SettingsBankIcon size={16} color={NAV_ICON_COLOR} />}
              badge={connections.length}
              onPress={() => router.push("/bank-connection")}
            />
          </Section>

          <Section title="Geral">
            <NavRow
              label="Perfil"
              icon={<SettingsProfileIcon size={16} color={NAV_ICON_COLOR} />}
              onPress={() => router.push("/profile")}
            />
            <NavRow
              label="Assinatura"
              icon={<SettingsCardIcon size={16} color={NAV_ICON_COLOR} />}
              onPress={() => router.push("/subscription")}
            />
            <NavRow
              label="Preferências"
              icon={<SettingsSlidersIcon size={16} color={NAV_ICON_COLOR} />}
              onPress={() => router.push("/preferences")}
            />
            {/* Não deve aparecer no app por enquanto */}
            {/* <NavRow
              label="Chave API"
              icon={<SettingsKeyIcon size={16} color={NAV_ICON_COLOR} />}
              onPress={() => router.push('/api-keys')}
            /> */}
            <NavRow
              label="Avalie o BearCash"
              icon={<SettingsStarIcon size={16} color={NAV_ICON_COLOR} />}
              onPress={() => comingSoon("Avalie o BearCash")}
            />
          </Section>

          <Section title="Segurança e Suporte">
            <NavRow
              label="Alterar senha"
              icon={<SettingsPasswordIcon size={16} color={NAV_ICON_COLOR} />}
              onPress={() => router.push("/change-password-code")}
            />
            <NavRow
              label="Biometria"
              icon={<SettingsBiometricsIcon size={16} color={NAV_ICON_COLOR} />}
              onPress={() => router.push("/biometrics")}
            />
            <NavRow
              label="Reportar um problema"
              icon={<SettingsReportIcon size={16} color={NAV_ICON_COLOR} />}
              onPress={() => setReportSheetOpen(true)}
            />
            <NavRow
              label="Suporte"
              icon={<SettingsSupportIcon size={16} color={NAV_ICON_COLOR} />}
              onPress={() => comingSoon("Suporte")}
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
              {loggingOut ? "Saindo…" : "Sair"}
            </Text>
            <SettingsLogoutIcon size={16} color={BearCashColors.danger} />
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
    backgroundColor: BearCashColors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 24,
    alignItems: "center",
  },
  header: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
  },
  body: {
    alignSelf: "stretch",
    gap: 24,
    alignItems: "center",
  },
  identity: {
    alignSelf: "stretch",
    alignItems: "center",
    gap: 8,
  },
  identityConnected: {
    gap: 10,
  },
  name: {
    ...BearCashTypography.h1,
    color: BearCashColors.text,
    textAlign: "center",
    alignSelf: "stretch",
  },
  connectLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  connectLinkLabel: {
    ...BearCashTypography.bodySmall,
    color: BearCashColors.textMid,
  },
  connectionsSummary: {
    alignItems: "center",
    gap: 8,
    alignSelf: "stretch",
  },
  connectionsCaption: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
    textAlign: "center",
  },
  planBanner: {
    alignSelf: "stretch",
    backgroundColor: BearCashColors.neutralLight,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
    overflow: "hidden",
  },
  planBannerCopy: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 150,
    gap: 4,
  },
  planBannerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  planBannerTitle: {
    ...BearCashTypography.subheading,
    color: BearCashColors.buttonFilledText,
  },
  planBannerSubtitle: {
    ...BearCashTypography.caption,
    color: BearCashColors.bannerMuted,
  },
  planCta: {
    height: 34,
    borderRadius: 24,
    backgroundColor: BearCashColors.buttonFilled,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  planCtaLabel: {
    ...BearCashTypography.bodySmall,
    color: BearCashColors.buttonFilledText,
  },
  bankStack: {
    flexDirection: "row",
    alignItems: "center",
    height: 20,
  },
  bankDot: {
    width: 20,
    height: 20,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BearCashColors.surface,
    overflow: "hidden",
  },
  bankMore: {
    backgroundColor: BearCashColors.text,
    borderColor: "#212022",
    alignItems: "center",
    justifyContent: "center",
  },
  bankMoreText: {
    ...BearCashTypography.captionSmall,
    color: BearCashColors.buttonFilledText,
  },
  navRow: {
    alignSelf: "stretch",
    padding: 12,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    paddingRight: 8,
  },
  iconSlot: {
    backgroundColor: BearCashColors.surface,
    borderRadius: 6,
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  navLabel: {
    fontFamily: BearCashFonts.semiBold,
    fontSize: 16,
    lineHeight: 26,
    color: BearCashColors.textMid,
  },
  badge: {
    minWidth: 16,
    height: 16,
    paddingHorizontal: 2,
    borderRadius: 999,
    backgroundColor: BearCashColors.iconAccent,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    ...BearCashTypography.captionSmall,
    color: BearCashColors.buttonFilledText,
    textAlign: "center",
  },
  verifyBanner: {
    alignSelf: "stretch",
    minHeight: 58,
    backgroundColor: BearCashColors.warning,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  verifyBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  verifyBannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(10, 11, 10, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  verifyBannerCopy: {
    flex: 1,
    gap: 0,
  },
  verifyBannerTitle: {
    fontFamily: BearCashFonts.semiBold,
    fontSize: 16,
    lineHeight: 22,
    color: BearCashColors.warningText,
  },
  verifyBannerSubtitle: {
    ...BearCashTypography.caption,
    color: BearCashColors.warningText,
    opacity: 0.72,
  },
  section: {
    alignSelf: "stretch",
    gap: 8,
  },
  sectionTitle: {
    ...BearCashTypography.subheading,
    color: BearCashColors.text,
  },
  sectionList: {
    gap: 8,
  },
  logoutButton: {
    alignSelf: "stretch",
    backgroundColor: BearCashColors.surface,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    overflow: "hidden",
  },
  logoutLabel: {
    ...BearCashTypography.bodySmall,
    color: BearCashColors.danger,
  },
  version: {
    ...BearCashTypography.captionSmall,
    color: BearCashColors.textSoft,
  },
  pressed: {
    opacity: 0.85,
  },
});
