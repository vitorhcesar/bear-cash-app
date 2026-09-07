import { useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/infra/http/get-error-message';
import { ExistingAccountLogin } from '@/presentation/auth/existing-account-login';
import {
  isValidEmail,
  paramString,
  parseAuthMethod,
} from '@/presentation/auth/auth-flow';
import { useAuthDraft } from '@/presentation/auth/auth-draft-context';
import { useAuthSession } from '@/presentation/auth/auth-session-context';
import { AuthScene, authFadeIn } from '@/presentation/auth/auth-switch-transition';
import { useGoogleSignIn } from '@/presentation/auth/use-google-sign-in';
import { useAppleSignIn } from '@/presentation/auth/use-apple-sign-in';
import { BackButton } from '@/presentation/components/ui/back-button';
import { OttoColors } from '@/presentation/constants/theme';
import { useApiService } from '@/presentation/hooks/use-api-service';

export function LoginPasswordPage() {
  const api = useApiService();
  const { applyAuthResult } = useAuthSession();
  const { signIn: signInWithGoogle, loading: googleLoading } = useGoogleSignIn();
  const { signIn: signInWithApple, loading: appleLoading } = useAppleSignIn();
  const { draft, setEmail, resetDraft } = useAuthDraft();
  const params = useLocalSearchParams<{
    email?: string;
    phone?: string;
    method?: string;
    avatarKey?: string;
  }>();
  const method =
    parseAuthMethod(params.method) === 'phone' || Boolean(paramString(params.phone))
      ? 'phone'
      : 'email';
  const emailParam = paramString(params.email) || draft.email;
  const phone = paramString(params.phone) || (method === 'phone' ? draft.phone : '');
  const avatarKey = paramString(params.avatarKey) || draft.avatarKey;

  const [email, setEmailLocal] = useState(emailParam);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);
  const insets = useSafeAreaInsets();

  async function submitLogin(nextEmail: string, nextPassword: string) {
    if (submittingRef.current || nextPassword.length < 6) {
      return;
    }

    if (method === 'phone') {
      if (phone.length < 10) {
        return;
      }
    } else if (!isValidEmail(nextEmail)) {
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    try {
      const result = await api.modules.auth.login(
        method === 'phone'
          ? { phone, password: nextPassword }
          : { email: nextEmail.trim(), password: nextPassword },
      );
      await applyAuthResult(result);
      resetDraft();
    } catch (error) {
      Alert.alert(
        'Erro no login',
        getErrorMessage(error, 'Não foi possível entrar. Tente novamente.'),
      );
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <Animated.View
        entering={authFadeIn('left')}
        style={[styles.backWrap, { top: insets.top + 8, left: insets.left + 24 }]}
      >
        <BackButton fallbackHref="/" />
      </Animated.View>

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <AuthScene kind="login" style={styles.scene}>
              <ExistingAccountLogin
                method={method}
                email={email}
                phone={phone}
                password={password}
                avatarKey={avatarKey}
                loading={loading}
                googleLoading={googleLoading}
                appleLoading={appleLoading}
                onEmailChange={(value) => {
                  setEmailLocal(value);
                  setEmail(value.trim());
                }}
                onPasswordChange={setPassword}
                onSubmit={(nextPassword) => {
                  void submitLogin(email, nextPassword ?? password);
                }}
                onGooglePress={() => {
                  void signInWithGoogle();
                }}
                onApplePress={() => {
                  void signInWithApple();
                }}
              />
            </AuthScene>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: OttoColors.background,
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  backWrap: {
    position: 'absolute',
    top: 8,
    left: 24,
    zIndex: 2,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  scene: {
    alignSelf: 'stretch',
  },
});
