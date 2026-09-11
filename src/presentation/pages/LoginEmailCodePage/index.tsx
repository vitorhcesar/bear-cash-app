import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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
  paramString,
  parseAuthMethod,
} from '@/presentation/auth/auth-flow';
import { AuthScene } from '@/presentation/auth/auth-switch-transition';
import { useAuthDraft } from '@/presentation/auth/auth-draft-context';
import { AuthFlowHeader } from '@/presentation/components/ui/auth-flow-header';
import { AuthLogo } from '@/presentation/components/ui/auth-logo';
import { Button } from '@/presentation/components/ui/button';
import { OtpField } from '@/presentation/components/ui/otp-field';
import { formatBrazilPhoneDisplay } from '@/presentation/components/ui/phone-field';
import { TimerIcon } from '@/presentation/components/ui/timer-icon';
import { BearCashColors, BearCashTypography } from '@/presentation/constants/theme';
import { useApiService } from '@/presentation/hooks/use-api-service';

const RESEND_SECONDS = 21;
const CODE_LENGTH = 6;

export function LoginEmailCodePage() {
  const router = useRouter();
  const api = useApiService();
  const { setVerificationToken, setPhone, setEmail, setMethod, setOtpDevHint, setAvatarKey, setAvatarUrl, draft } =
    useAuthDraft();
  const params = useLocalSearchParams<{
    email?: string;
    phone?: string;
    method?: string;
  }>();
  const method = parseAuthMethod(params.method);
  const email = paramString(params.email) || draft.email;
  const phone = paramString(params.phone) || draft.phone;
  const step = getAuthStep(method, 'code');

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const phoneDisplay = useMemo(() => formatBrazilPhoneDisplay(phone), [phone]);
  const canContinue = code.replace(/\D/g, '').length === CODE_LENGTH;
  const canResend = secondsLeft <= 0;

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setSecondsLeft((current) => current - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [secondsLeft]);

  function handleCodeChange(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
    if (error) {
      setError(undefined);
    }
  }

  async function handleResend() {
    if (!canResend || resending) {
      return;
    }

    setResending(true);
    try {
      const otp = await api.modules.auth.sendOtp(phone);
      setOtpDevHint(otp.devHint ?? '');
      setSecondsLeft(otp.resendCooldown || RESEND_SECONDS);
      setError(undefined);
      setCode('');
    } catch (err) {
      Alert.alert(
        'Erro',
        getErrorMessage(err, 'Não foi possível reenviar o código.'),
      );
    } finally {
      setResending(false);
    }
  }

  async function handleContinue() {
    if (!canContinue || loading) {
      return;
    }

    setLoading(true);
    setError(undefined);
    try {
      const result = await api.modules.auth.verifyOtp(phone, code);
      setVerificationToken(result.verificationToken);
      setPhone(result.phone);
      setEmail(email);
      setMethod(method);

      if (result.phoneRegistered) {
        if (method !== 'phone') {
          setError('Este telefone já está vinculado a outra conta.');
          return;
        }

        setAvatarKey(result.avatarKey ?? '');
        setAvatarUrl(result.avatarUrl ?? '');
        router.push({
          pathname: '/login-password',
          params: {
            method: 'phone',
            phone: result.phone,
            avatarKey: result.avatarKey ?? '',
            avatarUrl: result.avatarUrl ?? '',
          },
        });
        return;
      }

      router.push({
        pathname: '/login-email-profile',
        params: {
          method,
          email,
          phone: result.phone,
        },
      });
    } catch (err) {
      setError(getErrorMessage(err, 'O código informado não está correto.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <AuthFlowHeader total={step.total} current={step.current} />

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <AuthScene kind="register" style={styles.scene}>
            <AuthLogo />

            <View style={styles.form}>
              <View style={styles.headerCopy}>
                <View style={styles.titleBlock}>
                  <Text style={styles.title}>Código do WhatsApp!</Text>
                  <Text style={styles.subtitle}>Enviamos um código de 6 dígitos para:</Text>
                </View>
                <Text style={styles.phone}>{phoneDisplay || '—'}</Text>
                {draft.otpDevHint ? (
                  <Text style={styles.devHint}>
                    Em desenvolvimento use o código {draft.otpDevHint}
                  </Text>
                ) : null}
              </View>

              <OtpField
                length={CODE_LENGTH}
                value={code}
                onChangeText={handleCodeChange}
                error={error}
              />

              <Button
                label="Validar Código"
                variant="filled"
                disabled={!canContinue}
                loading={loading}
                onPress={handleContinue}
              />
            </View>

            {canResend ? (
              <Pressable accessibilityRole="link" onPress={handleResend} disabled={resending}>
                <Text style={styles.resendLink}>
                  {resending ? 'Reenviando…' : 'Reenviar código'}
                </Text>
              </Pressable>
            ) : (
              <View style={styles.resendRow}>
                <TimerIcon size={16} color={BearCashColors.textSoft} />
                <Text style={styles.resendText}>
                  Reenviar em {secondsLeft} {secondsLeft === 1 ? 'segundo' : 'segundos'}
                </Text>
              </View>
            )}
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
    backgroundColor: BearCashColors.background,
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 88,
    gap: 32,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  scene: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 32,
  },
  form: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 40,
  },
  headerCopy: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 12,
  },
  titleBlock: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 4,
  },
  title: {
    ...BearCashTypography.h3,
    color: BearCashColors.text,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  subtitle: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  phone: {
    ...BearCashTypography.h3,
    color: BearCashColors.text,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  devHint: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
    textAlign: 'center',
    marginTop: 8,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resendText: {
    ...BearCashTypography.body,
    color: BearCashColors.textSoft,
  },
  resendLink: {
    ...BearCashTypography.body,
    color: BearCashColors.textMid,
    textDecorationLine: 'underline',
  },
});
