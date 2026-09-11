import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
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
import type { PasswordRecoveryChannel } from '@/infra/http/services/api/modules/auth.module';
import { useAuthDraft } from '@/presentation/auth/auth-draft-context';
import {
  paramString,
  parseAuthMethod,
} from '@/presentation/auth/auth-flow';
import {
  authFadeIn,
  authFadeOut,
} from '@/presentation/auth/auth-switch-transition';
import { InfoCircleIcon } from '@/presentation/components/ui/api-keys-icons';
import { AuthFlowHeader } from '@/presentation/components/ui/auth-flow-header';
import {
  EmailIcon,
  PhoneIcon,
} from '@/presentation/components/ui/brand-icons';
import { Button } from '@/presentation/components/ui/button';
import { OtpField } from '@/presentation/components/ui/otp-field';
import { PasswordField } from '@/presentation/components/ui/password-field';
import { VerifiedBadgeIcon } from '@/presentation/components/ui/profile-icons';
import { PlanRadioIcon } from '@/presentation/components/ui/subscription-icons';
import { TimerIcon } from '@/presentation/components/ui/timer-icon';
import { BearCashColors, BearCashTypography } from '@/presentation/constants/theme';
import { useApiService } from '@/presentation/hooks/use-api-service';

const RESEND_SECONDS = 21;
const CODE_LENGTH = 6;
const MIN_PASSWORD_LENGTH = 8;

type Phase = 'methods' | 'otp' | 'reset';

type RecoveryOptions = {
  sms: { available: boolean; masked: string | null };
  email: { available: boolean; masked: string | null };
};

function stepForPhase(phase: Phase) {
  if (phase === 'methods') {
    return 1;
  }
  if (phase === 'otp') {
    return 2;
  }
  return 3;
}

export function ForgotPasswordPage() {
  const router = useRouter();
  const api = useApiService();
  const { setOtpDevHint, draft } = useAuthDraft();
  const params = useLocalSearchParams<{
    email?: string;
    phone?: string;
    method?: string;
    avatarKey?: string;
    avatarUrl?: string;
  }>();

  const method = parseAuthMethod(params.method) === 'phone' ? 'phone' : 'email';
  const email = paramString(params.email);
  const phone = paramString(params.phone);
  const avatarKey = paramString(params.avatarKey);
  const avatarUrl = paramString(params.avatarUrl);

  const identifier = useMemo(
    () => (method === 'phone' ? { phone } : { email }),
    [email, method, phone],
  );

  const [phase, setPhase] = useState<Phase>('methods');
  const [hasLeftMethods, setHasLeftMethods] = useState(false);
  const [options, setOptions] = useState<RecoveryOptions | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [channel, setChannel] = useState<PasswordRecoveryChannel>('sms');
  const [maskedDestination, setMaskedDestination] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [sending, setSending] = useState(false);
  const [resending, setResending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const canContinueOtp = code.replace(/\D/g, '').length === CODE_LENGTH;
  const canResend = secondsLeft <= 0 && !sending;
  const passwordValid = newPassword.length >= MIN_PASSWORD_LENGTH;
  const canChangePassword =
    passwordValid && newPassword === confirmPassword && confirmPassword.length > 0;
  const selectedAvailable =
    channel === 'sms' ? Boolean(options?.sms.available) : Boolean(options?.email.available);

  const loadOptions = useCallback(async () => {
    setLoadingOptions(true);
    try {
      const result = await api.modules.auth.getPasswordRecoveryOptions(identifier);
      setOptions(result);
      if (result.sms.available) {
        setChannel('sms');
      } else if (result.email.available) {
        setChannel('email');
      }
    } catch (err) {
      Alert.alert(
        'Erro',
        getErrorMessage(err, 'Não foi possível carregar as opções de recuperação.'),
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } finally {
      setLoadingOptions(false);
    }
  }, [api.modules.auth, identifier, router]);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

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
        const otp = await api.modules.auth.sendPasswordRecoveryOtp({
          ...identifier,
          channel,
        });
        setMaskedDestination(otp.masked);
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
    [api.modules.auth, channel, identifier, setOtpDevHint],
  );

  async function handleSendCode() {
    if (!selectedAvailable || sending) {
      return;
    }

    const sent = await sendCode();
    if (!sent) {
      return;
    }

    setHasLeftMethods(true);
    setCode('');
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
    if (!canContinueOtp || verifying) {
      return;
    }

    setVerifying(true);
    setError(undefined);
    try {
      const result = await api.modules.auth.verifyPasswordRecoveryOtp({
        ...identifier,
        channel,
        code,
      });
      setResetToken(result.resetToken);
      setOtpDevHint('');
      setPhase('reset');
    } catch (err) {
      setError(getErrorMessage(err, 'Código inválido'));
    } finally {
      setVerifying(false);
    }
  }

  function goBackToLogin() {
    setOtpDevHint('');
    router.replace({
      pathname: '/login-email',
      params: {
        resume: 'login',
        method,
        email,
        phone,
        avatarKey,
        avatarUrl,
      },
    });
  }

  async function handleResetPassword() {
    if (!canChangePassword || saving || !resetToken) {
      return;
    }

    setSaving(true);
    try {
      await api.modules.auth.resetPassword({
        resetToken,
        newPassword,
      });
      setOtpDevHint('');
      Alert.alert('Senha alterada', 'Entre com a nova senha para continuar.', [
        { text: 'OK', onPress: goBackToLogin },
      ]);
    } catch (err) {
      Alert.alert(
        'Erro ao alterar senha',
        getErrorMessage(err, 'Não foi possível alterar a senha. Tente novamente.'),
      );
    } finally {
      setSaving(false);
    }
  }

  function handleBack() {
    if (phase === 'otp') {
      setPhase('methods');
      return;
    }

    if (phase === 'reset') {
      setPhase('otp');
      return;
    }

    setOtpDevHint('');
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/login-email');
  }

  const confirmError =
    confirmPassword.length > 0 && newPassword !== confirmPassword
      ? 'As senhas não coincidem'
      : undefined;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <AuthFlowHeader
          total={3}
          current={stepForPhase(phase)}
          fallbackHref="/login-email"
          onBack={handleBack}
        />

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
              entering={
                phase === 'methods' && !hasLeftMethods
                  ? authFadeIn('right')
                  : authFadeIn(phase === 'methods' ? 'left' : 'right')
              }
              exiting={authFadeOut(phase === 'methods' ? 'left' : 'right')}
              style={styles.scene}
            >
              {phase === 'methods' ? (
                <>
                  <Image
                    source={require('@/assets/images/auth/logo.png')}
                    style={styles.logo}
                    contentFit="contain"
                    accessibilityLabel="BearCash"
                  />

                  <View style={styles.headerCopy}>
                    <Text style={styles.title}>Esqueci minha senha</Text>
                    <Text style={styles.subtitle}>
                      Escolha como receber o código para redefinir sua senha.
                    </Text>
                  </View>

                  {loadingOptions || !options ? (
                    <ActivityIndicator color={BearCashColors.text} />
                  ) : (
                    <View style={styles.channels}>
                      <ChannelCard
                        title="Código OTP via SMS"
                        masked={options.sms.masked}
                        available={options.sms.available}
                        selected={channel === 'sms'}
                        icon={<PhoneIcon size={16} />}
                        onPress={() => setChannel('sms')}
                      />
                      <ChannelCard
                        title="Código OTP via E-mail"
                        masked={options.email.masked}
                        available={options.email.available}
                        selected={channel === 'email'}
                        disabledHint="E-mail não confirmado"
                        icon={<EmailIcon size={16} />}
                        onPress={() => setChannel('email')}
                      />
                    </View>
                  )}

                  <Button
                    label="Enviar código"
                    variant="filled"
                    disabled={!selectedAvailable || loadingOptions}
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
                    <Text style={styles.title}>Código de recuperação</Text>
                    <Text style={styles.subtitle}>
                      Enviamos um código de 6 dígitos para:
                    </Text>
                    <Text style={styles.highlight}>{maskedDestination || '—'}</Text>
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
                    disabled={!canContinueOtp}
                    loading={verifying}
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

              {phase === 'reset' ? (
                <>
                  <View style={styles.headerCopy}>
                    <Text style={styles.title}>Alterar senha</Text>
                    <Text style={styles.subtitle}>
                      Defina uma nova senha para sua conta. Use 8 ou mais
                      caracteres com uma mistura de letras, números e símbolos.
                    </Text>
                  </View>

                  <View style={styles.fields}>
                    <PasswordField
                      label="Digite sua senha"
                      placeholder="Digite sua senha"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      autoComplete="new-password"
                      textContentType="newPassword"
                      returnKeyType="next"
                      showToggle={false}
                      trailing={
                        passwordValid ? (
                          <VerifiedBadgeIcon size={16} color={BearCashColors.primary} />
                        ) : undefined
                      }
                    />
                    <PasswordField
                      label="Confirmar senha"
                      placeholder="Confirmar senha"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      autoComplete="new-password"
                      textContentType="newPassword"
                      returnKeyType="done"
                      error={confirmError}
                      onSubmitEditing={() => {
                        void handleResetPassword();
                      }}
                    />
                  </View>

                  <View style={styles.hintRow}>
                    <InfoCircleIcon size={16} />
                    <Text style={styles.hintText}>Ao menos 8 caracteres</Text>
                  </View>

                  <Button
                    label="Confirmar"
                    variant="filled"
                    disabled={!canChangePassword}
                    loading={saving}
                    onPress={() => {
                      void handleResetPassword();
                    }}
                  />
                </>
              ) : null}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function ChannelCard({
  title,
  masked,
  available,
  selected,
  disabledHint,
  icon,
  onPress,
}: {
  title: string;
  masked: string | null;
  available: boolean;
  selected: boolean;
  disabledHint?: string;
  icon: ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled: !available }}
      disabled={!available}
      onPress={onPress}
      style={({ pressed }) => [
        styles.channel,
        selected && available && styles.channelSelected,
        !available && styles.channelDisabled,
        pressed && available && styles.pressed,
      ]}
    >
      <View style={styles.channelIcon}>{icon}</View>
      <View style={styles.channelCopy}>
        <Text style={[styles.channelTitle, !available && styles.channelMuted]}>
          {title}
        </Text>
        <Text style={[styles.channelMasked, !available && styles.channelMuted]}>
          {masked || '—'}
        </Text>
        {!available && disabledHint ? (
          <Text style={styles.channelHint}>{disabledHint}</Text>
        ) : null}
      </View>
      <PlanRadioIcon selected={selected && available} />
    </Pressable>
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
  channels: {
    alignSelf: 'stretch',
    gap: 12,
  },
  channel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: BearCashColors.borderStrong,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: BearCashColors.surface,
  },
  channelSelected: {
    borderColor: BearCashColors.primarySoft,
  },
  channelDisabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.85,
  },
  channelIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelCopy: {
    flex: 1,
    gap: 2,
  },
  channelTitle: {
    ...BearCashTypography.bodySmall,
    color: BearCashColors.text,
    fontFamily: BearCashTypography.h3.fontFamily,
  },
  channelMasked: {
    ...BearCashTypography.caption,
    color: BearCashColors.textMid,
  },
  channelMuted: {
    color: BearCashColors.textSoft,
  },
  channelHint: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
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
  fields: {
    alignSelf: 'stretch',
    gap: 16,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: 6,
  },
  hintText: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
  },
});
