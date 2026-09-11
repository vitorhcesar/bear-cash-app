import {
  Poppins_400Regular,
  Poppins_600SemiBold,
  useFonts,
} from "@expo-google-fonts/poppins";
import {
  DarkTheme,
  Stack,
  ThemeProvider,
  router,
  usePathname,
  type Theme,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";

import { setupNotificationHandler } from "@/infra/notifications/push-notifications";
import { AuthDraftProvider } from "@/presentation/auth/auth-draft-context";
import { isSocialOnboardingPath } from "@/presentation/auth/auth-flow";
import {
  AuthSessionProvider,
  useAuthSession,
} from "@/presentation/auth/auth-session-context";
import { SessionTransitionProvider } from "@/presentation/auth/session-transition";
import { BiometricLockGate } from "@/presentation/biometrics/biometric-lock-gate";
import { AnimatedSplashOverlay } from "@/presentation/components/animated-icon";
import { BearCashColors } from "@/presentation/constants/theme";
import { usePushRegistration } from "@/presentation/hooks/use-push-registration";
import { HomeLoading } from "@/presentation/pages/HomePage";

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 0, fade: false });
setupNotificationHandler();

const BearCashNavigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: BearCashColors.background,
    card: BearCashColors.background,
    border: BearCashColors.borderSoft,
    primary: BearCashColors.primary,
    text: BearCashColors.text,
  },
};

const pushFromRight = { animation: "slide_from_right" as const };
const noAnimation = { animation: "none" as const };

function RootNavigator() {
  const { isLoading, isAuthenticated, hasCompletedOnboarding, user } =
    useAuthSession();
  const pathname = usePathname();
  const canUseApp = isAuthenticated && hasCompletedOnboarding;
  usePushRegistration(canUseApp);

  useEffect(() => {
    if (isLoading || !isAuthenticated || hasCompletedOnboarding) {
      return;
    }

    if (isSocialOnboardingPath(pathname)) {
      return;
    }

    router.replace({
      pathname: "/login-email-phone",
      params: {
        method: "google",
        email: user?.email ?? "",
      },
    });
  }, [
    hasCompletedOnboarding,
    isAuthenticated,
    isLoading,
    pathname,
    user?.email,
  ]);

  if (isLoading) {
    return <HomeLoading />;
  }

  return (
    <BiometricLockGate>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "none",
          animationTypeForReplace: "push",
          contentStyle: styles.screen,
        }}
      >
        <Stack.Protected guard={canUseApp}>
          <Stack.Screen name="(tabs)" options={noAnimation} />
          <Stack.Screen name="home" options={noAnimation} />
          <Stack.Screen name="settings" options={pushFromRight} />
          <Stack.Screen name="verify-email" options={pushFromRight} />
          <Stack.Screen name="profile" options={pushFromRight} />
          <Stack.Screen name="preferences" options={pushFromRight} />
          <Stack.Screen name="api-keys" options={pushFromRight} />
          <Stack.Screen name="biometrics" options={pushFromRight} />
          <Stack.Screen name="change-password-code" options={pushFromRight} />
          <Stack.Screen name="change-password" options={pushFromRight} />
          <Stack.Screen name="subscription" options={pushFromRight} />
          <Stack.Screen name="subscription-pro" options={pushFromRight} />
          <Stack.Screen name="subscription-premium" options={pushFromRight} />
          <Stack.Screen name="bank-connection" options={pushFromRight} />
          <Stack.Screen
            name="bear-cash-ia"
            options={{ animation: "fade" }}
            dangerouslySingular
          />
          <Stack.Screen name="bear-cash-ia-history" options={pushFromRight} />
          <Stack.Screen name="bank-select" options={pushFromRight} />
          <Stack.Screen name="open-finance/callback" options={noAnimation} />
          <Stack.Screen name="new-transaction" options={pushFromRight} />
          <Stack.Screen name="edit-transaction" options={pushFromRight} />
          <Stack.Screen name="transaction/[id]" options={pushFromRight} />
        </Stack.Protected>

        <Stack.Protected guard={!canUseApp}>
          <Stack.Screen name="index" options={noAnimation} />
          <Stack.Screen name="login-email" options={noAnimation} />
          <Stack.Screen name="login-email-phone" options={noAnimation} />
          <Stack.Screen name="login-email-whatsapp" options={noAnimation} />
          <Stack.Screen name="login-email-code" options={noAnimation} />
          <Stack.Screen name="login-email-profile" options={noAnimation} />
          <Stack.Screen name="login-email-data" options={noAnimation} />
          <Stack.Screen name="login-password" options={noAnimation} />
          <Stack.Screen name="forgot-password" options={noAnimation} />
          <Stack.Screen name="explore" />
        </Stack.Protected>
      </Stack>
    </BiometricLockGate>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    // After adding assets/fonts/LumenScript-Heavy.otf, uncomment:
    "LumenScript-Heavy": require("@/assets/fonts/LumenScript-Heavy.otf"),
  });

  if (!fontsLoaded && !fontError) {
    return <View style={styles.root} />;
  }

  return (
    <View style={styles.root}>
      <ThemeProvider value={BearCashNavigationTheme}>
        <AuthDraftProvider>
          <SessionTransitionProvider>
            <AuthSessionProvider>
              <StatusBar style="light" />
              <AnimatedSplashOverlay />
              <RootNavigator />
            </AuthSessionProvider>
          </SessionTransitionProvider>
        </AuthDraftProvider>
      </ThemeProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BearCashColors.background,
  },
  screen: {
    backgroundColor: BearCashColors.background,
  },
});
