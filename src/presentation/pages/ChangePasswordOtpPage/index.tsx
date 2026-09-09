import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

import { getErrorMessage, isApiError } from '@/infra/http/get-error-message';
import { useAuthDraft } from '@/presentation/auth/auth-draft-context';
import { useAuthSession } from '@/presentation/auth/auth-session-context';
import { BackButton } from '@/presentation/components/ui/back-button';
import { Button } from '@/presentation/components/ui/button';
import { OtpField } from '@/presentation/components/ui/otp-field';
import { formatBrazilPhoneDisplay } from '@/presentation/components/ui/phone-field';
import { TimerIcon } from '@/presentation/components/ui/timer-icon';
import { BearCashColors, BearCashTypography } from '@/presentation/constants/theme';
import { useApiService } from '@/presentation/hooks/use-api-service';

const RESEND_SECONDS = 21;
const CODE_LENGTH = 6;

export function ChangePasswordOtpPage() {
  const router = useRouter();
  const api = useApiService();
  const { user } = useAuthSession();
  const { setVerificationToken, setOtpDevHint, draft } = useAuthDraft();
  const sentOnMount = useRef(false);

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(true);
  const [resending, setResending] = useState(false);

  const phoneDisplay = useMemo(
    () => formatBrazilPhoneDisplay(user?.phoneNumber ?? ''),
    [user?.phoneNumber],
  );
  const canContinue = code.replace(/\D/g, '').length === CODE_LENGTH;
  const canResend = secondsLeft <= 0 && !sending;

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setSecondsLeft((current) => current - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const sendCode = useCallback(
    async (isResend = false) => {
      if (isResend) {
        setResending(true);
      } else {
        setSending(true);
      }

      try {
        const otp = await api.modules.auth.sendPasswordOtp();
        setOtpDevHint(otp.devHint ?? '');
        setSecondsLeft(otp.resendCooldown || RESEND_SECONDS);
        setError(undefined);
        if (isResend) {
          setCode('');
        }
      } catch (err) {
        if (isApiError(err) && err.code === 'OTP_RESEND_COOLDOWN') {
          setSecondsLeft(RESEND_SECONDS);
          return;
        }

        Alert.alert(
          'Erro',
          getErrorMessage(err, 'Não foi possível enviar o código. Tente novamente.'),
          isResend ? undefined : [{ text: 'OK', onPress: () => router.replace('/settings') }],
        );
      } finally {
        setSending(false);
        setResending(false);
      }
    },
    [api.modules.auth, router, setOtpDevHint],
  );

  useEffect(() => {
    if (sentOnMount.current) {
      return;
    }
    sentOnMount.current = true;

    if (!user?.phoneNumber) {
      setSending(false);
      Alert.alert(
        'Telefone necessário',
        'Não encontramos um telefone na sua conta para enviar o código.',
        [{ text: 'OK', onPress: () => router.replace('/settings') }],
      );
      return;
    }

    void sendCode();
  }, [router, sendCode, user?.phoneNumber]);

  function handleCodeChange(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
    if (error) {
      setError(undefined);
    }
  }

  async function handleContinue() {
    if (!canContinue || loading) {
      return;
    }

    setLoading(true);
    setError(undefined);
    try {
      const result = await api.modules.auth.verifyPasswordOtp(code);
      setVerificationToken(result.verificationToken);
      router.replace('/change-password');
    } catch (err) {
      setError(getErrorMessage(err, 'Código inválido'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <BackButton fallbackHref="/settings" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>Confirme seu telefone</Text>
              <Text style={styles.subtitle}>
                Enviamos um código de 6 dígitos para alterar sua senha:
              </Text>
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
              label="Validar código"
              variant="filled"
              disabled={!canContinue}
              loading={loading || sending}
              onPress={handleContinue}
            />
          </View>

          {canResend ? (
            <Pressable
              accessibilityRole="link"
              onPress={() => {
                void sendCode(true);
              }}
              disabled={resending}
            >
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BearCashColors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 32,
  },
  form: {
    alignSelf: 'stretch',
    gap: 24,
  },
  headerCopy: {
    gap: 4,
  },
  title: {
    ...BearCashTypography.h1,
    color: BearCashColors.text,
  },
  subtitle: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
  },
  phone: {
    ...BearCashTypography.h3,
    color: BearCashColors.text,
    marginTop: 8,
  },
  devHint: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
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
    color: BearCashColors.text,
    textDecorationLine: 'underline',
  },
});
