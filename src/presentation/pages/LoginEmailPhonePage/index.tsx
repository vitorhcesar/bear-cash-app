import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/infra/http/get-error-message';
import {
  getAuthStep,
  isOauthMethod,
  paramString,
  parseAuthMethod,
} from '@/presentation/auth/auth-flow';
import { useAuthDraft } from '@/presentation/auth/auth-draft-context';
import { useAuthSession } from '@/presentation/auth/auth-session-context';
import { Button } from '@/presentation/components/ui/button';
import { getPhoneDigits, PhoneField } from '@/presentation/components/ui/phone-field';
import { StepGroup } from '@/presentation/components/ui/step-group';
import { OttoColors, OttoTypography } from '@/presentation/constants/theme';
import { useApiService } from '@/presentation/hooks/use-api-service';

function getUsernameFromEmail(email?: string) {
  if (!email) {
    return 'usuário';
  }

  const localPart = email.split('@')[0]?.trim();
  return localPart || 'usuário';
}

export function LoginEmailPhonePage() {
  const router = useRouter();
  const api = useApiService();
  const { signOut, isAuthenticated, profile, user } = useAuthSession();
  const { setEmail, setPhone, setMethod, setOtpDevHint } = useAuthDraft();
  const params = useLocalSearchParams<{
    email?: string;
    method?: string;
  }>();
  const method = parseAuthMethod(params.method);
  const email = paramString(params.email) || user?.email || '';
  const isOauthOnboarding =
    isOauthMethod(method) || (isAuthenticated && !profile?.onboardingCompleted);
  const [phone, setPhoneLocal] = useState('');
  const [loading, setLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const step = getAuthStep(isOauthOnboarding ? 'google' : 'email', 'phone');

  const username = useMemo(() => getUsernameFromEmail(email), [email]);
  const canContinue = getPhoneDigits(phone).length >= 10;

  async function handleContinue() {
    if (!canContinue || loading) {
      return;
    }

    const phoneDigits = getPhoneDigits(phone);
    setLoading(true);
    try {
      const start = await api.modules.auth.startPhone(phoneDigits);
      if (start.exists) {
        Alert.alert(
          'Telefone em uso',
          isOauthOnboarding
            ? 'Este número já está vinculado a outra conta. Use outro telefone.'
            : 'Este número já está vinculado a outra conta. Use outro telefone ou faça login com essa conta.',
        );
        return;
      }

      const otp = await api.modules.auth.sendOtp(phoneDigits);
      setMethod(isOauthOnboarding ? 'google' : 'email');
      setEmail(email);
      setPhone(phoneDigits);
      setOtpDevHint(otp.devHint ?? '');

      router.push({
        pathname: '/login-email-code',
        params: {
          method: isOauthOnboarding ? 'google' : 'email',
          email,
          phone: phoneDigits,
        },
      });
    } catch (error) {
      Alert.alert(
        'Erro',
        getErrorMessage(error, 'Não foi possível enviar o código. Tente novamente.'),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <StepGroup total={step.total} current={step.current} style={styles.steps} />

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Image
              source={require('@/assets/images/auth/logo.png')}
              style={styles.logo}
              contentFit="contain"
              accessibilityLabel="Otto"
            />

            <View style={styles.form}>
              <View style={styles.headerCopy}>
                <Text style={styles.title}>Boas-vindas, {username}!</Text>
                <Text style={styles.subtitle}>Qual o seu número de telefone?</Text>
              </View>

              <PhoneField value={phone} onChangeText={setPhoneLocal} />

              <Button
                label="Continuar"
                variant="filled"
                disabled={!canContinue}
                loading={loading}
                onPress={handleContinue}
              />
            </View>

            <View style={styles.footer}>
              {isOauthOnboarding ? (
                <>
                  <Text style={styles.footerText}>Quer usar outra conta?</Text>
                  <Pressable
                    accessibilityRole="link"
                    onPress={() => {
                      if (signingOut) {
                        return;
                      }
                      setSigningOut(true);
                      void signOut().finally(() => setSigningOut(false));
                    }}
                  >
                    <Text style={styles.footerLink}>
                      {signingOut ? 'Saindo…' : 'Sair'}
                    </Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={styles.footerText}>Já tem uma conta?</Text>
                  <Pressable accessibilityRole="link" onPress={() => router.replace('/')}>
                    <Text style={styles.footerLink}>Fazer login</Text>
                  </Pressable>
                </>
              )}
            </View>
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
  steps: {
    marginTop: 16,
    marginBottom: 8,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 48,
    gap: 32,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  logo: {
    width: 57,
    height: 59,
  },
  form: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 24,
  },
  headerCopy: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 4,
  },
  title: {
    ...OttoTypography.h3,
    color: OttoColors.text,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  subtitle: {
    ...OttoTypography.caption,
    color: OttoColors.textSoft,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  footerText: {
    ...OttoTypography.body,
    color: OttoColors.textSoft,
  },
  footerLink: {
    ...OttoTypography.body,
    color: OttoColors.text,
    textDecorationLine: 'underline',
  },
});
