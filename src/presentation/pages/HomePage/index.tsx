import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useId, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import type { OpenFinanceConnection } from "@/infra/http/services/api/modules/open-finance.module";
import type { TransactionItem } from "@/infra/http/services/api/modules/transactions.module";
import { useAuthSession } from "@/presentation/auth/auth-session-context";
import { BankConnectionsChip } from "@/presentation/components/ui/bank-connections-chip";
import { BankSelectSheet } from "@/presentation/components/ui/bank-select-sheet";
import { Button } from "@/presentation/components/ui/button";
import { HomeConnectedDashboard } from "@/presentation/components/ui/home-connected-dashboard";
import { HomePlusIcon } from "@/presentation/components/ui/home-icons";
import {
  DEFAULT_AVATARS,
  resolveAvatarSource,
  type IAvatarOption,
} from "@/presentation/constants/avatars";
import {
  APP_BOTTOM_CHROME_HEIGHT,
  BearCashColors,
  BearCashFonts,
  BearCashTypography,
} from "@/presentation/constants/theme";
import { useApiService } from "@/presentation/hooks/use-api-service";

const AVATAR_SIZE = 44;
const HERO_PANDA = require("@/assets/images/home/hero-panda.jpg");

function firstNameFromSession(
  fullName?: string | null,
  displayName?: string | null,
  userName?: string | null,
) {
  const raw = displayName?.trim() || fullName?.trim() || userName?.trim() || "";
  if (!raw) {
    return "você";
  }
  const first = raw.split(/\s+/)[0];
  return first.charAt(0).toUpperCase() + first.slice(1);
}

function HeroScrim() {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [size, setSize] = useState({ width: 0, height: 0 });

  function onLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    if (width !== size.width || height !== size.height) {
      setSize({ width, height });
    }
  }

  return (
    <View pointerEvents="none" onLayout={onLayout} style={styles.heroScrim}>
      {size.width > 0 ? (
        <Svg
          width={size.width}
          height={size.height}
          style={StyleSheet.absoluteFill}
        >
          <Defs>
            <LinearGradient id={`hero${uid}`} x1="0" y1="0" x2="0" y2="1">
              <Stop
                offset="0.07276"
                stopColor={BearCashColors.background}
                stopOpacity={0}
              />
              <Stop
                offset="0.36963"
                stopColor={BearCashColors.background}
                stopOpacity={0.637}
              />
              <Stop
                offset="0.60764"
                stopColor={BearCashColors.background}
                stopOpacity={0.882}
              />
              <Stop
                offset="0.78936"
                stopColor={BearCashColors.background}
                stopOpacity={1}
              />
            </LinearGradient>
          </Defs>
          <Rect
            width={size.width}
            height={size.height}
            fill={`url(#hero${uid})`}
          />
        </Svg>
      ) : null}
    </View>
  );
}

function ProfileAvatar({
  source,
}: {
  source: IAvatarOption["source"];
}) {
  return (
    <View style={styles.avatarFrame}>
      <Image
        source={source}
        style={styles.avatarImage}
        contentFit="cover"
        accessibilityLabel="Foto de perfil"
      />
    </View>
  );
}

function HomeEmptyState({
  firstName,
  avatarSource,
  connections,
  onConnect,
  onOpenBankSelect,
}: {
  firstName: string;
  avatarSource: IAvatarOption["source"];
  connections: OpenFinanceConnection[];
  onConnect: () => void;
  onOpenBankSelect: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [heroSize, setHeroSize] = useState({ width: 0, height: 0 });

  return (
    <View style={styles.safeArea}>
      <View style={styles.emptyRoot}>
        <View
          style={styles.hero}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            if (width !== heroSize.width || height !== heroSize.height) {
              setHeroSize({ width, height });
            }
          }}
        >
          {heroSize.width > 0 ? (
            <Image
              source={HERO_PANDA}
              style={{
                position: "absolute",
                width: heroSize.width,
                height: heroSize.height,
              }}
              contentFit="cover"
              contentPosition="center"
              cachePolicy="memory-disk"
              accessibilityLabel="Mascote BearCash"
            />
          ) : null}
          <HeroScrim />

          <View style={[styles.heroHeader, { top: insets.top + 16 }]}>
            <ProfileAvatar source={avatarSource} />
            <BankConnectionsChip
              connections={connections}
              onPress={onOpenBankSelect}
            />
          </View>

          <View style={styles.heroGreeting}>
            <Text style={styles.heroHello}>
              Olá, <Text style={styles.heroName}>{firstName}</Text>!
            </Text>
            <Text style={styles.heroWelcome}>
              Bem-vindo a suas finanças! 🖐️
            </Text>
          </View>
        </View>

        <View style={styles.emptyCopy}>
          <View style={styles.emptyTitleBlock}>
            <Text style={styles.emptyTitle}>
              Saiba exatamente para{" "}
              <Text style={styles.emptyTitleAccent}>onde</Text> cada real seu
              está indo
            </Text>
            <Text style={styles.emptySubtitle}>
              Visualize seus gastos em um só lugar e entenda melhor como você
              usa seu dinheiro.
            </Text>
          </View>
          <Button
            label="Conectar"
            variant="filled"
            rightIcon={
              <HomePlusIcon size={16} color={BearCashColors.buttonFilledText} />
            }
            onPress={onConnect}
          />
        </View>
      </View>
    </View>
  );
}

function HomeConnectedState({
  firstName,
  avatarSource,
  chipConnections,
  connections,
  transactions,
  onOpenBankSelect,
  onPressLastTransaction,
  onPressTransactions,
}: {
  firstName: string;
  avatarSource: IAvatarOption["source"];
  chipConnections: OpenFinanceConnection[];
  connections: OpenFinanceConnection[];
  transactions: TransactionItem[];
  onOpenBankSelect: () => void;
  onPressLastTransaction: (id: string) => void;
  onPressTransactions: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [heroSize, setHeroSize] = useState({ width: 0, height: 0 });
  const heroHeight = Math.max(280, Math.round(windowHeight * 0.38));

  return (
    <View style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.connectedScroll}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[styles.connectedHero, { height: heroHeight }]}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            if (width !== heroSize.width || height !== heroSize.height) {
              setHeroSize({ width, height });
            }
          }}
        >
          {heroSize.width > 0 ? (
            <Image
              source={HERO_PANDA}
              style={{
                position: "absolute",
                width: heroSize.width,
                height: heroSize.height,
              }}
              contentFit="cover"
              contentPosition="center"
              cachePolicy="memory-disk"
              accessibilityLabel="Mascote BearCash"
            />
          ) : null}
          <HeroScrim />

          <View style={[styles.heroHeader, { top: insets.top + 16 }]}>
            <ProfileAvatar source={avatarSource} />
            <BankConnectionsChip
              connections={chipConnections}
              onPress={onOpenBankSelect}
            />
          </View>

          <View style={styles.heroGreeting}>
            <Text style={styles.heroHello}>
              Olá, <Text style={styles.heroName}>{firstName}</Text>!
            </Text>
            <Text style={styles.heroWelcome}>
              Bem-vindo a suas finanças! 🖐️
            </Text>
          </View>
        </View>

        <View style={styles.connectedDashboard}>
          <HomeConnectedDashboard
            connections={connections}
            transactions={transactions}
            onPressLastTransaction={onPressLastTransaction}
            onPressTransactions={onPressTransactions}
          />
        </View>
      </ScrollView>
    </View>
  );
}

export function HomePage() {
  const router = useRouter();
  const api = useApiService();
  const { profile, user } = useAuthSession();
  const [connections, setConnections] = useState<
    OpenFinanceConnection[] | null
  >(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [bankSelectOpen, setBankSelectOpen] = useState(false);
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);
  const firstName = useMemo(
    () =>
      firstNameFromSession(profile?.fullName, profile?.displayName, user?.name),
    [profile?.displayName, profile?.fullName, user?.name],
  );
  const avatar = useMemo(
    () => resolveAvatarSource(profile?.avatarKey, profile?.avatarUrl, DEFAULT_AVATARS[0]),
    [profile?.avatarKey, profile?.avatarUrl],
  );

  useFocusEffect(
    useCallback(() => {
      void Promise.all([
        api.modules.openFinance.listConnections(),
        api.modules.transactions.list(),
      ])
        .then(([connectionResponse, transactionResponse]) => {
          setConnections(connectionResponse.items);
          setTransactions(transactionResponse.items);
        })
        .catch(() => {
          setConnections([]);
          setTransactions([]);
        });
    }, [api.modules.openFinance, api.modules.transactions]),
  );

  if (connections === null) {
    return <HomeLoading />;
  }

  const connected = connections.filter(
    (item) => !item.revokedAt && item.status === "AUTHORISED",
  );
  const selectedConnections = connected.filter((item) => {
    if (selectedBankIds.length === 0) {
      return true;
    }
    return selectedBankIds.includes(item.institutionId || item.id);
  });
  const dashboardConnections =
    selectedConnections.length > 0 ? selectedConnections : connected;
  const selectedNames = new Set(
    dashboardConnections.map((item) => item.institutionName.toLowerCase()),
  );
  const dashboardTransactions = transactions.filter((item) => {
    const bankName = item.bankName?.trim().toLowerCase();
    if (!bankName) {
      return dashboardConnections.length === connected.length;
    }
    return selectedNames.has(bankName);
  });

  const bankSelectSheet = (
    <BankSelectSheet
      visible={bankSelectOpen}
      connections={connections}
      selectedIds={selectedBankIds}
      onClose={() => setBankSelectOpen(false)}
      onSelect={(ids) => {
        setSelectedBankIds(ids);
        setBankSelectOpen(false);
      }}
      onAddAccount={() => {
        setBankSelectOpen(false);
        router.push("/bank-connection");
      }}
    />
  );

  if (connected.length === 0) {
    return (
      <>
        <HomeEmptyState
          firstName={firstName}
          avatarSource={avatar.source}
          connections={connections}
          onConnect={() => router.push("/bank-connection")}
          onOpenBankSelect={() => setBankSelectOpen(true)}
        />
        {bankSelectSheet}
      </>
    );
  }

  return (
    <>
      <HomeConnectedState
        firstName={firstName}
        avatarSource={avatar.source}
        chipConnections={dashboardConnections}
        connections={dashboardConnections}
        transactions={dashboardTransactions}
        onOpenBankSelect={() => setBankSelectOpen(true)}
        onPressLastTransaction={(id) =>
          router.push({ pathname: "/transaction/[id]", params: { id } })
        }
        onPressTransactions={() => router.navigate("/(tabs)/activities")}
      />
      {bankSelectSheet}
    </>
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
  emptyRoot: {
    flex: 1,
  },
  hero: {
    flex: 1,
    width: "100%",
    minHeight: 280,
    overflow: "hidden",
    position: "relative",
  },
  heroScrim: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "72%",
  },
  heroHeader: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    zIndex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroGreeting: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 4,
    zIndex: 2,
    gap: 3,
    maxWidth: 263,
  },
  heroHello: {
    fontFamily: BearCashFonts.semiBold,
    fontSize: 24,
    lineHeight: 32,
    color: BearCashColors.text,
  },
  heroName: {
    fontFamily: BearCashFonts.script,
    fontSize: 24,
    lineHeight: 32,
    color: BearCashColors.textAccent,
  },
  heroWelcome: {
    ...BearCashTypography.caption,
    color: BearCashColors.textMid,
  },
  emptyCopy: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: APP_BOTTOM_CHROME_HEIGHT,
    gap: 24,
  },
  emptyTitleBlock: {
    gap: 6,
  },
  emptyTitle: {
    fontFamily: BearCashFonts.semiBold,
    fontSize: 20,
    lineHeight: 24,
    color: BearCashColors.textMid,
  },
  emptyTitleAccent: {
    color: BearCashColors.textAccent,
  },
  emptySubtitle: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
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
  connectedScroll: {
    paddingBottom: APP_BOTTOM_CHROME_HEIGHT,
  },
  connectedHero: {
    width: "100%",
    overflow: "hidden",
    position: "relative",
  },
  connectedDashboard: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
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
