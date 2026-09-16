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
import {
  getLastSettingsRoute,
  setLastSettingsRoute,
  type SettingsNavId,
} from "@/infra/preferences/settings-last-route";
import { useAuthDraft } from "@/presentation/auth/auth-draft-context";
import { useAuthSession } from "@/presentation/auth/auth-session-context";
import { BackButton } from "@/presentation/components/ui/back-button";
import { EmailIcon } from "@/presentation/components/ui/brand-icons";
import { HighlightCardBorder } from "@/presentation/components/ui/highlight-card-border";
import { InstitutionMark } from "@/presentation/components/ui/institution-mark";
import { ProfileAvatarControl } from "@/presentation/components/ui/profile-avatar-control";
import { ReportProblemSheet } from "@/presentation/components/ui/report-problem-sheet";
import { SettingsPremiumBanner } from "@/presentation/components/ui/settings-premium-banner";
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
  SettingsStarIcon,
  SettingsSupportIcon,
} from "@/presentation/components/ui/settings-icons";
import {
  DEFAULT_AVATARS,
  getAvatarUri,
  isCustomAvatar,
  resolveAvatarSource,
  type IAvatarOption,
} from "@/presentation/constants/avatars";
import {
  BearCashColors,
  BearCashFonts,
  BearCashTypography,
} from "@/presentation/constants/theme";
import { createThemedStyles } from "@/presentation/constants/themed-styles";
import { useApiService } from "@/presentation/hooks/use-api-service";

const MAX_BANK_STACK = 4;
const BANK_MARK_SIZE = 32;
const BANK_MARK_OVERLAP = 8;

type NavRowProps = {
  label: string;
  icon: ReactNode;
  onPress?: () => void;
  badge?: number;
  highlighted?: boolean;
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

function NavRow({ label, icon, onPress, badge, highlighted }: NavRowProps) {
  const styles = useStyles();
  const content = (
    <>
      <View style={styles.navRowLeft}>
        {highlighted ? icon : <View style={styles.iconSlot}>{icon}</View>}
        <Text style={styles.navLabel}>{label}</Text>
        {badge != null && badge > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <SettingsChevronIcon size={16} color={BearCashColors.textMid} />
    </>
  );

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        highlighted ? styles.navRowHighlightOuter : styles.navRow,
        pressed && styles.pressed,
      ]}
    >
      {highlighted ? <HighlightCardBorder /> : null}
      {highlighted ? (
        <View style={styles.navRowHighlightInner}>{content}</View>
      ) : (
        content
      )}
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionList}>{children}</View>
    </View>
  );
}

function BankStack({ connections }: { connections: OpenFinanceConnection[] }) {
  const styles = useStyles();
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
              marginLeft: index === 0 ? 0 : -BANK_MARK_OVERLAP,
              zIndex: visible.length - index,
            },
          ]}
        >
          <InstitutionMark
            name={connection.institutionName}
            logoUrl={connection.institutionLogoUrl}
            size={BANK_MARK_SIZE}
          />
        </View>
      ))}
      {remaining > 0 ? (
        <View
          style={[
            styles.bankDot,
            styles.bankMore,
            { marginLeft: -BANK_MARK_OVERLAP, zIndex: 0 },
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
  const styles = useStyles();
  const router = useRouter();
  const api = useApiService();
  const { profile, user, signOut, updateAvatar, uploadAvatarPhoto } = useAuthSession();
  const { resetDraft } = useAuthDraft();
  const [loggingOut, setLoggingOut] = useState(false);
  const [reportSheetOpen, setReportSheetOpen] = useState(false);
  const [lastRoute, setLastRoute] = useState<string | null>(null);
  const [connections, setConnections] = useState<OpenFinanceConnection[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<IAvatarOption>(() =>
    resolveAvatarSource(profile?.avatarKey, profile?.avatarUrl, DEFAULT_AVATARS[0]),
  );

  useEffect(() => {
    setSelectedAvatar(resolveAvatarSource(profile?.avatarKey, profile?.avatarUrl, DEFAULT_AVATARS[0]));
  }, [profile?.avatarKey, profile?.avatarUrl]);

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
      void getLastSettingsRoute().then(setLastRoute);
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
      if (isCustomAvatar(avatar)) {
        const uri = getAvatarUri(avatar);
        if (!uri) {
          throw new Error("missing photo");
        }
        await uploadAvatarPhoto(uri);
      } else {
        await updateAvatar(avatar.id);
      }
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

  function openSettingsRoute(id: SettingsNavId, action: () => void) {
    setLastRoute(id);
    void setLastSettingsRoute(id);
    action();
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

          <SettingsPremiumBanner
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
              icon={<SettingsBankIcon size={16} color={BearCashColors.iconAccent} />}
              badge={connections.length}
              highlighted={lastRoute === "banks"}
              onPress={() =>
                openSettingsRoute("banks", () => router.push("/bank-connection"))
              }
            />
          </Section>

          <Section title="Geral">
            <NavRow
              label="Perfil"
              icon={<SettingsProfileIcon size={16} color={BearCashColors.iconAccent} />}
              highlighted={lastRoute === "profile"}
              onPress={() =>
                openSettingsRoute("profile", () => router.push("/profile"))
              }
            />
            <NavRow
              label="Assinatura"
              icon={<SettingsCardIcon size={16} color={BearCashColors.iconAccent} />}
              highlighted={lastRoute === "subscription"}
              onPress={() =>
                openSettingsRoute("subscription", () =>
                  router.push("/subscription"),
                )
              }
            />
            <NavRow
              label="Preferências"
              icon={<SettingsSlidersIcon size={16} color={BearCashColors.iconAccent} />}
              highlighted={lastRoute === "preferences"}
              onPress={() =>
                openSettingsRoute("preferences", () =>
                  router.push("/preferences"),
                )
              }
            />
            {/* Não deve aparecer no app por enquanto */}
            {/* <NavRow
              label="Chave API"
              icon={<SettingsKeyIcon size={16} color={BearCashColors.iconAccent} />}
              onPress={() => router.push('/api-keys')}
            /> */}
            <NavRow
              label="Avalie o BearCash"
              icon={<SettingsStarIcon size={16} color={BearCashColors.iconAccent} />}
              highlighted={lastRoute === "rate"}
              onPress={() =>
                openSettingsRoute("rate", () => comingSoon("Avalie o BearCash"))
              }
            />
          </Section>

          <Section title="Segurança e Suporte">
            <NavRow
              label="Alterar senha"
              icon={<SettingsPasswordIcon size={16} color={BearCashColors.iconAccent} />}
              highlighted={lastRoute === "password"}
              onPress={() =>
                openSettingsRoute("password", () =>
                  router.push("/change-password-code"),
                )
              }
            />
            <NavRow
              label="Biometria"
              icon={<SettingsBiometricsIcon size={16} color={BearCashColors.iconAccent} />}
              highlighted={lastRoute === "biometrics"}
              onPress={() =>
                openSettingsRoute("biometrics", () => router.push("/biometrics"))
              }
            />
            <NavRow
              label="Reportar um problema"
              icon={<SettingsReportIcon size={16} color={BearCashColors.iconAccent} />}
              highlighted={lastRoute === "report"}
              onPress={() =>
                openSettingsRoute("report", () => setReportSheetOpen(true))
              }
            />
            <NavRow
              label="Suporte"
              icon={<SettingsSupportIcon size={16} color={BearCashColors.iconAccent} />}
              highlighted={lastRoute === "support"}
              onPress={() =>
                openSettingsRoute("support", () => comingSoon("Suporte"))
              }
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

const useStyles = createThemedStyles(() => StyleSheet.create({
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
  bankStack: {
    flexDirection: "row",
    alignItems: "center",
    height: BANK_MARK_SIZE,
  },
  bankDot: {
    width: BANK_MARK_SIZE,
    height: BANK_MARK_SIZE,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BearCashColors.surface,
    overflow: "hidden",
  },
  bankMore: {
    backgroundColor: BearCashColors.text,
    borderColor: BearCashColors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  bankMoreText: {
    ...BearCashTypography.captionSmall,
    color: BearCashColors.onText,
  },
  navRow: {
    alignSelf: "stretch",
    padding: 12,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navRowHighlightOuter: {
    alignSelf: "stretch",
    borderRadius: 12,
    padding: 1,
    overflow: "hidden",
  },
  navRowHighlightInner: {
    backgroundColor: BearCashColors.surface,
    borderRadius: 12,
    padding: 12,
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
}));
