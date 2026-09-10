import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useId, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import { useAuthSession } from "@/presentation/auth/auth-session-context";
import { Button } from "@/presentation/components/ui/button";
import { formatCurrencyAmount } from "@/presentation/components/ui/currencies";
import { useApiService } from "@/presentation/hooks/use-api-service";
import type { OpenFinanceConnection } from "@/infra/http/services/api/modules/open-finance.module";
import {
  HomeChevronIcon,
  HomeMailIcon,
  HomeShieldIcon,
  HomeSparkleIcon,
  HomeWalletIcon,
} from "@/presentation/components/ui/home-icons";
import {
  DEFAULT_AVATARS,
  getAvatarOption,
} from "@/presentation/constants/avatars";
import {
  BearCashColors,
  BearCashFonts,
  BearCashTypography,
} from "@/presentation/constants/theme";

const AVATAR_SIZE = 44;
const MAIL_STROKE = "#373A36";

function greetingForHour(hour: number) {
  if (hour >= 5 && hour < 12) {
    return "Bom dia,";
  }
  if (hour >= 12 && hour < 18) {
    return "Boa tarde,";
  }
  return "Boa noite,";
}

function displayNameFromSession(
  fullName?: string | null,
  displayName?: string | null,
  userName?: string | null,
) {
  const normalizedName = (name?: string | null) => {
    if (!name) return undefined;

    if (name.includes(" ")) {
      const [firstName, lastName] = name.split(" ");

      let capitalizedFirstName =
        firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

      if (!lastName) return capitalizedFirstName;

      let capitalizedLastName =
        lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase();

      return `${capitalizedFirstName} ${capitalizedLastName}`;
    }

    return name.trim();
  };

  return (
    normalizedName(fullName) ||
    normalizedName(displayName) ||
    normalizedName(userName) ||
    "você"
  );
}

function BearCashInsightBanner() {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [size, setSize] = useState({ width: 0, height: 0 });

  function onLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    if (width !== size.width || height !== size.height) {
      setSize({ width, height });
    }
  }

  return (
    <View onLayout={onLayout} style={styles.insightBanner}>
      {size.width > 0 ? (
        <Svg
          pointerEvents="none"
          width={size.width}
          height={size.height}
          style={StyleSheet.absoluteFill}
        >
          <Defs>
            <LinearGradient id={`base${uid}`} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#121311" />
              <Stop offset="0.5" stopColor="#1A1D1A" />
              <Stop offset="1" stopColor="#0A0B0A" />
            </LinearGradient>
            <LinearGradient id={`green${uid}`} x1="0" y1="0" x2="1" y2="0">
              <Stop
                offset="0"
                stopColor={BearCashColors.primary}
                stopOpacity={0.053}
              />
              <Stop
                offset="1"
                stopColor={BearCashColors.primary}
                stopOpacity={0.053}
              />
            </LinearGradient>
          </Defs>
          <Rect
            width={size.width}
            height={size.height}
            rx={16}
            fill={`url(#base${uid})`}
          />
          <Rect
            width={size.width}
            height={size.height}
            rx={16}
            fill={`url(#green${uid})`}
          />
        </Svg>
      ) : null}

      <View style={styles.insightBadge}>
        <Text style={styles.insightBadgeText}>BEARCASH IA INSIGHT</Text>
      </View>
      <Text style={styles.insightBody}>
        Olá! Conecte seu banco para começar a receber{" "}
        <Text style={styles.insightHighlight}>insights personalizados</Text>{" "}
        sobre seus hábitos de consumo e dicas reais de economia.
      </Text>
    </View>
  );
}

export function HomePage() {
  const router = useRouter();
  const api = useApiService();
  const { profile, user } = useAuthSession();
  const [connections, setConnections] = useState<OpenFinanceConnection[]>([]);
  const greeting = useMemo(() => greetingForHour(new Date().getHours()), []);
  const name = useMemo(
    () =>
      displayNameFromSession(
        profile?.fullName,
        profile?.displayName,
        user?.name,
      ),
    [profile?.displayName, profile?.fullName, user?.name],
  );
  const avatar = useMemo(
    () => getAvatarOption(profile?.avatarKey, DEFAULT_AVATARS[0]),
    [profile?.avatarKey],
  );

  useFocusEffect(
    useCallback(() => {
      void api.modules.openFinance
        .listConnections()
        .then((response) => setConnections(response.items))
        .catch(() => setConnections([]));
    }, [api.modules.openFinance]),
  );

  const connected = connections.filter(
    (item) => !item.revokedAt && item.status === 'AUTHORISED',
  );
  const availableBalance = connected
    .flatMap((item) => item.accounts)
    .reduce((sum, account) => sum + (account.availableAmount ?? 0), 0);
  const syncing = connections.some(
    (item) =>
      !item.revokedAt &&
      (item.status === 'AWAITING_AUTHORIZATION' ||
        item.executionStatus === 'AWAITING_RESOURCES'),
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View style={styles.avatarFrame}>
              <Image
                source={avatar.source}
                style={styles.avatarImage}
                contentFit="cover"
                accessibilityLabel="Foto de perfil"
              />
            </View>
            <View style={styles.textStack}>
              <Text style={styles.greeting}>{greeting}</Text>
              <Text style={styles.userName} numberOfLines={1}>
                {name}
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mensagens"
            style={({ pressed }) => [
              styles.mailButton,
              pressed && styles.pressed,
            ]}
          >
            <HomeMailIcon size={24} color={MAIL_STROKE} />
          </Pressable>
        </View>

        {connected.length > 0 ? (
          <View style={styles.connectCard}>
            <View style={styles.connectHeader}>
              <View style={styles.connectIconHolder}>
                <HomeWalletIcon size={24} />
              </View>
              <View style={styles.connectTitleBlock}>
                <Text style={styles.connectTitle}>Saldo nas contas</Text>
                <Text style={styles.connectSubtitle}>
                  {syncing
                    ? 'Sincronizando Open Finance…'
                    : `${connected.length} ${connected.length === 1 ? 'banco conectado' : 'bancos conectados'}`}
                </Text>
              </View>
            </View>
            <Text style={styles.balanceValue}>
              {formatCurrencyAmount(availableBalance)}
            </Text>
            <Button
              label="Gerenciar contas"
              variant="filled"
              rightIcon={<HomeChevronIcon size={16} />}
              onPress={() => router.push("/bank-connection")}
            />
          </View>
        ) : (
          <View style={styles.connectCard}>
            <View style={styles.connectHeader}>
              <View style={styles.connectIconHolder}>
                <HomeWalletIcon size={24} />
              </View>
              <View style={styles.connectTitleBlock}>
                <Text style={styles.connectTitle}>
                  Conecte sua conta bancária
                </Text>
                <Text style={styles.connectSubtitle}>
                  {syncing ? 'Aguardando autorização no banco' : 'Ative o controle automático'}
                </Text>
              </View>
            </View>
            <Text style={styles.connectBody}>
              Conecte seu banco para visualizar seus gastos, saldo e transações
              automaticamente sem precisar digitar nada.
            </Text>
            <Button
              label="Conectar banco"
              variant="filled"
              rightIcon={<HomeChevronIcon size={16} />}
              onPress={() => router.push("/bank-connection")}
            />
          </View>
        )}

        <BearCashInsightBanner />

        <View style={styles.benefits}>
          <Text style={styles.benefitsTitle}>Por que conectar?</Text>
          <View style={styles.benefitsRow}>
            <View style={styles.benefitCard}>
              <View style={styles.benefitIconHolder}>
                <HomeShieldIcon size={16} />
              </View>
              <View style={styles.benefitCopy}>
                <Text style={styles.benefitTitle}>Segurança Open Finance</Text>
                <Text style={styles.benefitBody}>
                  Tecnologia e padrões de segurança oficiais dos maiores bancos
                  do país.
                </Text>
              </View>
            </View>
            <View style={styles.benefitCard}>
              <View style={styles.benefitIconHolder}>
                <HomeSparkleIcon size={16} />
              </View>
              <View style={styles.benefitCopy}>
                <Text style={styles.benefitTitle}>Monitoramento 24h</Text>
                <Text style={styles.benefitBody}>
                  BearCash monitora seu saldo e descobre economias invisíveis
                  enquanto você vive.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function HomeLoading() {
  return (
    <View style={styles.loadingRoot}>
      <SafeAreaView style={styles.loadingSafeArea}>
        <ActivityIndicator color={BearCashColors.primary} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BearCashColors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingRight: 12,
  },
  avatarFrame: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: "hidden",
    borderWidth: 0.55,
    borderColor: BearCashColors.borderSoft,
    backgroundColor: BearCashColors.surface,
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  textStack: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  greeting: {
    ...BearCashTypography.bodySmall,
    color: BearCashColors.textMid,
  },
  userName: {
    ...BearCashTypography.h3,
    color: BearCashColors.text,
  },
  mailButton: {
    width: 40,
    height: 40,
    borderRadius: 24,
    backgroundColor: BearCashColors.buttonFilled,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  pressed: {
    opacity: 0.85,
  },
  connectCard: {
    backgroundColor: BearCashColors.surface,
    borderWidth: 1,
    borderColor: BearCashColors.borderStrong,
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  connectHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  connectIconHolder: {
    backgroundColor: BearCashColors.borderSoft,
    borderRadius: 12,
    padding: 8,
  },
  connectTitleBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  connectTitle: {
    ...BearCashTypography.h3,
    color: BearCashColors.text,
  },
  connectSubtitle: {
    ...BearCashTypography.captionSmall,
    color: BearCashColors.textSoft,
  },
  connectBody: {
    ...BearCashTypography.bodySmall,
    color: BearCashColors.textMid,
  },
  balanceValue: {
    ...BearCashTypography.h1,
    color: BearCashColors.text,
  },
  insightBanner: {
    alignSelf: "stretch",
    borderRadius: 16,
    padding: 16,
    gap: 10,
    overflow: "hidden",
    backgroundColor: BearCashColors.surface,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  insightBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  insightBadgeText: {
    ...BearCashTypography.captionSmall,
    color: BearCashColors.primarySoft,
  },
  insightBody: {
    ...BearCashTypography.bodySmall,
    color: BearCashColors.text,
  },
  insightHighlight: {
    fontFamily: BearCashFonts.semiBold,
    color: BearCashColors.primarySoft,
  },
  benefits: {
    gap: 12,
  },
  benefitsTitle: {
    ...BearCashTypography.bodySmall,
    fontFamily: BearCashFonts.semiBold,
    color: BearCashColors.text,
  },
  benefitsRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
  },
  benefitCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: BearCashColors.surface,
    borderWidth: 1,
    borderColor: BearCashColors.borderStrong,
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  benefitIconHolder: {
    alignSelf: "flex-start",
    backgroundColor: BearCashColors.borderSoft,
    borderRadius: 8,
    padding: 6,
  },
  benefitCopy: {
    gap: 2,
  },
  benefitTitle: {
    ...BearCashTypography.bodySmall,
    fontFamily: BearCashFonts.semiBold,
    color: BearCashColors.textMid,
  },
  benefitBody: {
    ...BearCashTypography.captionSmall,
    color: BearCashColors.textSoft,
  },
  loadingRoot: {
    flex: 1,
    backgroundColor: BearCashColors.background,
  },
  loadingSafeArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
