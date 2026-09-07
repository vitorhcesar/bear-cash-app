import {
  Poppins_400Regular,
  Poppins_600SemiBold,
  useFonts,
} from '@expo-google-fonts/poppins';
import {
  DarkTheme,
  Stack,
  ThemeProvider,
  router,
  usePathname,
  type Theme,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { isSocialOnboardingPath } from '@/presentation/auth/auth-flow';
import { AuthDraftProvider } from '@/presentation/auth/auth-draft-context';
import {
  AuthSessionProvider,
  useAuthSession,
} from '@/presentation/auth/auth-session-context';
import { SessionTransitionProvider } from '@/presentation/auth/session-transition';
import { BiometricLockGate } from '@/presentation/biometrics/biometric-lock-gate';
import { AnimatedSplashOverlay } from '@/presentation/components/animated-icon';
import { OttoColors } from '@/presentation/constants/theme';
import { HomeLoading } from '@/presentation/pages/HomePage';

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 0, fade: false });

const OttoNavigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: OttoColors.background,
    card: OttoColors.background,
    border: OttoColors.borderSoft,
    primary: OttoColors.primary,
    text: OttoColors.text,
  },
};

function RootNavigator() {
  const { isLoading, isAuthenticated, hasCompletedOnboarding, user } = useAuthSession();
  const pathname = usePathname();
  const canUseApp = isAuthenticated && hasCompletedOnboarding;

  useEffect(() => {
    if (isLoading || !isAuthenticated || hasCompletedOnboarding) {
      return;
    }

    if (isSocialOnboardingPath(pathname)) {
      return;
    }

    router.replace({
      pathname: '/login-email-phone',
      params: {
        method: 'google',
        email: user?.email ?? '',
      },
    });
  }, [hasCompletedOnboarding, isAuthenticated, isLoading, pathname, user?.email]);

  if (isLoading) {
    return <HomeLoading />;
  }

  return (
    <BiometricLockGate>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: styles.screen,
        }}
      >
        <Stack.Protected guard={canUseApp}>
          <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
          <Stack.Screen name="home" options={{ animation: 'none' }} />
          <Stack.Screen
            name="settings"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="profile"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="preferences"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="api-keys"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="biometrics"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="change-password-code"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="change-password"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="subscription"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="subscription-pro"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="bank-connection"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="new-transaction"
            options={{ animation: 'slide_from_right' }}
          />
        </Stack.Protected>

        <Stack.Protected guard={!canUseApp}>
          <Stack.Screen name="index" options={{ animation: 'none' }} />
          <Stack.Screen name="login-email" />
          <Stack.Screen name="login-email-phone" />
          <Stack.Screen name="login-email-whatsapp" />
          <Stack.Screen name="login-email-code" />
          <Stack.Screen name="login-email-profile" />
          <Stack.Screen name="login-email-data" />
          <Stack.Screen name="login-password" />
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
  });

  if (!fontsLoaded && !fontError) {
    return <View style={styles.root} />;
  }

  return (
    <View style={styles.root}>
      <ThemeProvider value={OttoNavigationTheme}>
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
    backgroundColor: OttoColors.background,
  },
  screen: {
    backgroundColor: OttoColors.background,
  },
});
