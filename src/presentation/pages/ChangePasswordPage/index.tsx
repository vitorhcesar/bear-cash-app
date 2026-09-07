import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/infra/http/get-error-message';
import { useAuthDraft } from '@/presentation/auth/auth-draft-context';
import { InfoCircleIcon } from '@/presentation/components/ui/api-keys-icons';
import { BackButton } from '@/presentation/components/ui/back-button';
import { Button } from '@/presentation/components/ui/button';
import { PasswordField } from '@/presentation/components/ui/password-field';
import { VerifiedBadgeIcon } from '@/presentation/components/ui/profile-icons';
import { OttoColors, OttoTypography } from '@/presentation/constants/theme';
import { useApiService } from '@/presentation/hooks/use-api-service';

const MIN_PASSWORD_LENGTH = 8;

export function ChangePasswordPage() {
  const router = useRouter();
  const api = useApiService();
  const { draft, setVerificationToken, setOtpDevHint } = useAuthDraft();
  const [hasOtpToken] = useState(() => Boolean(draft.verificationToken));

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordValid = newPassword.length >= MIN_PASSWORD_LENGTH;
  const canChange =
    passwordValid && newPassword === confirmPassword && confirmPassword.length > 0;
  const verificationToken = draft.verificationToken;

  useEffect(() => {
    if (!hasOtpToken) {
      router.replace('/change-password-code');
    }
  }, [hasOtpToken, router]);

  function goToSettings() {
    setVerificationToken('');
    setOtpDevHint('');
    router.replace('/settings');
  }

  async function handleChangePassword() {
    if (!canChange || loading || !verificationToken) {
      return;
    }

    setLoading(true);
    try {
      await api.modules.auth.changePassword({
        newPassword,
        verificationToken,
      });
      setVerificationToken('');
      setOtpDevHint('');
      Alert.alert('Senha alterada', 'Sua senha foi atualizada com sucesso.', [
        {
          text: 'OK',
          onPress: () => {
            router.replace('/settings');
          },
        },
      ]);
    } catch (error) {
      Alert.alert(
        'Erro ao alterar senha',
        getErrorMessage(
          error,
          'Não foi possível alterar a senha. Tente novamente.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  const confirmError =
    confirmPassword.length > 0 && newPassword !== confirmPassword
      ? 'As senhas não coincidem'
      : undefined;

  if (!hasOtpToken) {
    return <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']} />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <BackButton onPress={goToSettings} fallbackHref="/settings" />

          <View style={styles.form}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>Alterar senha</Text>
              <Text style={styles.subtitle}>
                Defina uma nova senha para sua conta. Use 8 ou mais caracteres
                com uma mistura de letras, números e símbolos.
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
                    <VerifiedBadgeIcon size={16} color={OttoColors.primary} />
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
                onSubmitEditing={handleChangePassword}
              />
            </View>

            <View style={styles.hintRow}>
              <InfoCircleIcon size={16} />
              <Text style={styles.hintText}>Ao menos 8 caracteres</Text>
            </View>

            <Button
              label="Alterar senha"
              variant="filled"
              disabled={!canChange}
              loading={loading}
              onPress={handleChangePassword}
            />

            <Button
              label="Voltar para configurações"
              variant="stroke"
              disabled={loading}
              onPress={goToSettings}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: OttoColors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 24,
  },
  form: {
    alignSelf: 'stretch',
    gap: 24,
  },
  headerCopy: {
    gap: 4,
  },
  title: {
    ...OttoTypography.h1,
    color: OttoColors.text,
  },
  subtitle: {
    ...OttoTypography.caption,
    color: OttoColors.textSoft,
  },
  fields: {
    alignSelf: 'stretch',
    gap: 16,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hintText: {
    ...OttoTypography.caption,
    color: OttoColors.textSoft,
  },
});
