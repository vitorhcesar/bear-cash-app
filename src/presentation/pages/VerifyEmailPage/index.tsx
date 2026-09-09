import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getErrorMessage, isApiError } from '@/infra/http/get-error-message';
import { useAuthDraft } from '@/presentation/auth/auth-draft-context';
import { useAuthSession } from '@/presentation/auth/auth-session-context';
import {
  authFadeIn,
  authFadeOut,
} from '@/presentation/auth/auth-switch-transition';
import { BackButton } from '@/presentation/components/ui/back-button';
import { EmailIcon } from '@/presentation/components/ui/brand-icons';
import { Button } from '@/presentation/components/ui/button';
import { OtpField } from '@/presentation/components/ui/otp-field';
import { VerifiedBadgeIcon } from '@/presentation/components/ui/profile-icons';
import { StepGroup } from '@/presentation/components/ui/step-group';
import { TimerIcon } from '@/presentation/components/ui/timer-icon';
import { BearCashColors, BearCashTypography } from '@/presentation/constants/theme';
import { useApiService } from '@/presentation/hooks/use-api-service';

const RESEND_SECONDS = 21;
const CODE_LENGTH = 6;

type Phase = 'prompt' | 'otp' | 'success';

function stepForPhase(phase: Phase) {
  if (phase === 'prompt') {
    return 1;
  }
  if (phase === 'otp') {
    return 2;
  }
  return 3;
}

export function VerifyEmailPage() {
  const router = useRouter();
  const api = useApiService();
  const { user, refreshSession } = useAuthSession();
  const { setOtpDevHint, draft } = useAuthDraft();

  const [phase, setPhase] = useState<Phase>('prompt');
  const [hasLeftPrompt, setHasLeftPrompt] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [resending, setResending] = useState(false);

  const email = user?.email?.trim() ?? '';
  const canContinue = code.replace(/\D/g, '').length === CODE_LENGTH;
  const canResend = secondsLeft <= 0 && !sending;

  useEffect(() => {
    if (user?.emailVerified && phase === 'prompt') {
      router.replace('/settings');
    }
  }, [phase, router, user?.emailVerified]);

  useEffect(() => {
    if (phase !== 'otp' || secondsLeft <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setSecondsLeft((current) => current - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [phase, secondsLeft]);

  const sendCode = useCallback(
    async (isResend = false) => {
      if (isResend) {
        setResending(true);
      } else {
        setSending(true);
      }

      try {
        const otp = await api.modules.auth.sendEmailOtp();
        setOtpDevHint(otp.devHint ?? '');
        setSecondsLeft(otp.resendCooldown || RESEND_SECONDS);
        setError(undefined);
        if (isResend) {
          setCode('');
        }
        return true;
      } catch (err) {
        if (isApiError(err) && err.code === 'OTP_RESEND_COOLDOWN') {
          setSecondsLeft(RESEND_SECONDS);
          return true;
        }

        if (isApiError(err) && err.code === 'EMAIL_ALREADY_VERIFIED') {
          await refreshSession();
          router.replace('/settings');
          return false;
        }

        Alert.alert(
          'Erro',
          getErrorMessage(err, 'Não foi possível enviar o código. Tente novamente.'),
        );
        return false;
      } finally {
        setSending(false);
        setResending(false);
      }
    },
    [api.modules.auth, refreshSession, router, setOtpDevHint],
  );

  async function handleSendCode() {
    if (sending || loading) {
      return;
    }

    const sent = await sendCode();
    if (!sent) {
      return;
    }

    setHasLeftPrompt(true);
    setPhase('otp');
  }

  function handleCodeChange(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
    if (error) {
      setError(undefined);
    }
  }

  async function handleVerify() {
    if (!canContinue || loading) {
      return;
    }

    setLoading(true);
    setError(undefined);
    try {
      await api.modules.auth.verifyEmailOtp(code);
      await refreshSession();
      setOtpDevHint('');
      setPhase('success');
    } catch (err) {
      setError(getErrorMessage(err, 'Código inválido'));
    } finally {
      setLoading(false);
    }
  }

  function handleBack() {
    if (phase === 'otp') {
      setPhase('prompt');
      return;
    }

    setOtpDevHint('');
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/settings');
  }

  function goToSettings() {
    setOtpDevHint('');
    router.replace('/settings');
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {phase !== 'success' ? (
          <View style={styles.topBar}>
            <BackButton onPress={handleBack} fallbackHref="/settings" />
          </View>
        ) : (
          <View style={styles.topBarSpacer} />
        )}

        <StepGroup total={3} current={stepForPhase(phase)} style={styles.steps} />

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              key={phase}
              entering={authFadeIn(
                phase === 'prompt' && hasLeftPrompt ? 'left' : 'right',
              )}
              exiting={authFadeOut(phase === 'prompt' ? 'left' : 'right')}
              style={styles.scene}
            >
              {phase === 'prompt' ? (
                <>
                  <View style={styles.mailBadge}>
                    <EmailIcon size={28} color={BearCashColors.warningText} />
                  </View>

                  <View style={styles.headerCopy}>
                    <Text style={styles.title}>Verifique seu e-mail</Text>
                    <Text style={styles.subtitle}>
                      Vamos enviar um código OTP para confirmar que este e-mail é
                      seu:
                    </Text>
                    <Text style={styles.highlight}>{email || '—'}</Text>
                  </View>

                  <Button
                    label="Enviar código"
                    variant="filled"
                    loading={sending}
                    onPress={() => {
                      void handleSendCode();
                    }}
                  />
                </>
              ) : null}

              {phase === 'otp' ? (
                <>
                  <Image
                    source={require('@/assets/images/auth/logo.png')}
                    style={styles.logo}
                    contentFit="contain"
                    accessibilityLabel="BearCash"
                  />

                  <View style={styles.headerCopy}>
                    <Text style={styles.title}>Código por e-mail</Text>
                    <Text style={styles.subtitle}>
                      Enviamos um código de 6 dígitos para:
                    </Text>
                    <Text style={styles.highlight}>{email || '—'}</Text>
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
                    loading={loading}
                    onPress={() => {
                      void handleVerify();
                    }}
                  />

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
                        Reenviar em {secondsLeft}{' '}
                        {secondsLeft === 1 ? 'segundo' : 'segundos'}
                      </Text>
                    </View>
                  )}
                </>
              ) : null}

              {phase === 'success' ? (
                <>
                  <VerifiedBadgeIcon size={72} color={BearCashColors.primary} />

                  <View style={styles.headerCopy}>
                    <Text style={styles.title}>E-mail confirmado</Text>
                    <Text style={styles.subtitle}>
                      Seu e-mail {email} foi verificado com sucesso.
                    </Text>
                  </View>

                  <View style={styles.successAction}>
                    <Button label="Voltar" variant="filled" onPress={goToSettings} />
                  </View>
                </>
              ) : null}
            </Animated.View>
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
  topBar: {
    paddingHorizontal: 24,
    paddingTop: 8,
    alignSelf: 'stretch',
  },
  topBarSpacer: {
    height: 36,
  },
  steps: {
    marginTop: 8,
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
  scene: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 24,
  },
  mailBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: BearCashColors.warning,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 57,
    height: 59,
  },
  headerCopy: {
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
  highlight: {
    ...BearCashTypography.h3,
    color: BearCashColors.text,
    textAlign: 'center',
    alignSelf: 'stretch',
    marginTop: 8,
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
    color: BearCashColors.text,
    textDecorationLine: 'underline',
  },
  successAction: {
    alignSelf: 'stretch',
  },
});
