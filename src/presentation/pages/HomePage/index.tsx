import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useId, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
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

import { getErrorMessage } from "@/infra/http/get-error-message";
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
const EMPTY_HERO_RATIO = 0.6;
const EMPTY_COPY_MIN_HEIGHT = 300;

function homeRefreshControl(refreshing: boolean, onRefresh: () => void) {
  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={BearCashColors.buttonFilled}
      colors={[BearCashColors.buttonFilled]}
      progressBackgroundColor={BearCashColors.surface}
    />
  );
}

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

function HeroPanda({ width, height }: { width: number; height: number }) {
  if (width <= 0 || height <= 0) {
    return null;
  }

  return (
    <Image
      source={HERO_PANDA}
      style={{ position: "absolute", top: 0, left: 0, width, height }}
      contentFit="cover"
      contentPosition="center"
      cachePolicy="memory-disk"
      accessibilityLabel="Mascote BearCash"
    />
  );
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

  const svgHeight = size.height + 2;

  return (
    <View pointerEvents="none" style={styles.heroScrim}>
      <View onLayout={onLayout} style={StyleSheet.absoluteFill}>
        {size.width > 0 ? (
          <Svg
            width={size.width}
            height={svgHeight}
            style={StyleSheet.absoluteFill}
            preserveAspectRatio="none"
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
                <Stop
                  offset="1"
                  stopColor={BearCashColors.background}
                  stopOpacity={1}
                />
              </LinearGradient>
            </Defs>
            <Rect
              width={size.width}
              height={svgHeight}
              fill={`url(#hero${uid})`}
            />
          </Svg>
        ) : null}
      </View>
      <View style={styles.heroScrimCap} />
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
  refreshing,
  onRefresh,
  onConnect,
  onOpenBankSelect,
}: {
  firstName: string;
  avatarSource: IAvatarOption["source"];
  connections: OpenFinanceConnection[];
  refreshing: boolean;
  onRefresh: () => void;
  onConnect: () => void;
  onOpenBankSelect: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const heroHeight = Math.min(
    Math.round(windowHeight * EMPTY_HERO_RATIO),
    Math.max(280, windowHeight - EMPTY_COPY_MIN_HEIGHT),
  );
  const [heroSize, setHeroSize] = useState({
    width: windowWidth,
    height: heroHeight,
  });

  return (
    <View style={styles.safeArea}>
      <ScrollView
        style={styles.emptyScroll}
        contentContainerStyle={styles.emptyScrollContent}
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical
        overScrollMode="always"
        refreshControl={homeRefreshControl(refreshing, onRefresh)}
      >
        <View style={styles.emptyRoot}>
        <View
          style={[styles.hero, { height: heroHeight }]}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            if (width !== heroSize.width || height !== heroSize.height) {
              setHeroSize({ width, height });
            }
          }}
        >
          <HeroPanda width={heroSize.width} height={heroSize.height} />
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
      </ScrollView>
    </View>
  );
}

function HomeConnectedState({
  firstName,
  avatarSource,
  chipConnections,
  connections,
  transactions,
  refreshing,
  onRefresh,
  onOpenBankSelect,
  onPressLastTransaction,
  onPressTransactions,
  onPressCategories,
}: {
  firstName: string;
  avatarSource: IAvatarOption["source"];
  chipConnections: OpenFinanceConnection[];
  connections: OpenFinanceConnection[];
  transactions: TransactionItem[];
  refreshing: boolean;
  onRefresh: () => void;
  onOpenBankSelect: () => void;
  onPressLastTransaction: (id: string) => void;
  onPressTransactions: () => void;
  onPressCategories: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const heroHeight = Math.max(280, Math.round(windowHeight * 0.38));
  const [heroSize, setHeroSize] = useState({
    width: windowWidth,
    height: heroHeight,
  });

  return (
    <View style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.connectedScroll}
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical
        overScrollMode="always"
        refreshControl={homeRefreshControl(refreshing, onRefresh)}
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
          <HeroPanda width={heroSize.width} height={heroSize.height} />
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
            onPressCategories={onPressCategories}
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
  const [refreshing, setRefreshing] = useState(false);
  const firstName = useMemo(
    () =>
      firstNameFromSession(profile?.fullName, profile?.displayName, user?.name),
    [profile?.displayName, profile?.fullName, user?.name],
  );
  const avatar = useMemo(
    () => resolveAvatarSource(profile?.avatarKey, profile?.avatarUrl, DEFAULT_AVATARS[0]),
    [profile?.avatarKey, profile?.avatarUrl],
  );

  const loadHomeData = useCallback(async () => {
    const [connectionResponse, transactionResponse] = await Promise.all([
      api.modules.openFinance.listConnections(),
      api.modules.transactions.list(),
    ]);
    setConnections(connectionResponse.items);
    setTransactions(transactionResponse.items);
  }, [api.modules.openFinance, api.modules.transactions]);

  useFocusEffect(
    useCallback(() => {
      void loadHomeData().catch(() => {
        setConnections((current) => current ?? []);
      });
    }, [loadHomeData]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const synced = await api.modules.openFinance.syncConnections();
      const transactionResponse = await api.modules.transactions.list();
      setConnections(synced.items);
      setTransactions(transactionResponse.items);
    } catch (error) {
      try {
        await loadHomeData();
      } catch {
        setConnections((current) => current ?? []);
      }
      Alert.alert(
        "Não foi possível atualizar",
        getErrorMessage(
          error,
          "Não foi possível sincronizar seus bancos. Tente novamente.",
        ),
      );
    } finally {
      setRefreshing(false);
    }
  }, [api.modules.openFinance, api.modules.transactions, loadHomeData]);

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
          refreshing={refreshing}
          onRefresh={() => void onRefresh()}
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
        refreshing={refreshing}
        onRefresh={() => void onRefresh()}
        onOpenBankSelect={() => setBankSelectOpen(true)}
        onPressLastTransaction={(id) =>
          router.push({ pathname: "/transaction/[id]", params: { id } })
        }
        onPressTransactions={() => router.navigate("/(tabs)/activities")}
        onPressCategories={() => router.push("/categories")}
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
  emptyScroll: {
    flex: 1,
  },
  emptyScrollContent: {
    flexGrow: 1,
  },
  hero: {
    width: "100%",
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
  heroScrimCap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 6,
    backgroundColor: BearCashColors.background,
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
    flex: 1,
    zIndex: 2,
    marginTop: -2,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: APP_BOTTOM_CHROME_HEIGHT,
    gap: 24,
    backgroundColor: BearCashColors.background,
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
    zIndex: 2,
    marginTop: -2,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
    backgroundColor: BearCashColors.background,
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
