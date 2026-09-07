import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getErrorMessage } from "@/infra/http/get-error-message";
import {
  getAuthStep,
  isOauthMethod,
  paramString,
  parseAuthMethod,
} from "@/presentation/auth/auth-flow";
import { AuthScene } from "@/presentation/auth/auth-switch-transition";
import { useAuthDraft } from "@/presentation/auth/auth-draft-context";
import { useAuthSession } from "@/presentation/auth/auth-session-context";
import { AuthFlowHeader } from "@/presentation/components/ui/auth-flow-header";
import { ShieldCheckIcon } from "@/presentation/components/ui/auth-icons";
import { Button } from "@/presentation/components/ui/button";
import { ProfileAvatarControl } from "@/presentation/components/ui/profile-avatar-control";
import { TextField } from "@/presentation/components/ui/text-field";
import {
  DEFAULT_AVATARS,
  type IAvatarOption,
} from "@/presentation/constants/avatars";
import { OttoColors, OttoTypography } from "@/presentation/constants/theme";
import { useApiService } from "@/presentation/hooks/use-api-service";

/** Formats digits as DD/MM/YYYY */
export function formatBirthDate(digits: string) {
  const cleaned = digits.replace(/\D/g, "").slice(0, 8);

  if (cleaned.length <= 2) {
    return cleaned;
  }

  if (cleaned.length <= 4) {
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
  }

  return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4)}`;
}

/** Formats digits as XXX.XXX.XXX-XX */
export function formatCpf(digits: string) {
  const cleaned = digits.replace(/\D/g, "").slice(0, 11);

  if (cleaned.length <= 3) {
    return cleaned;
  }

  if (cleaned.length <= 6) {
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
  }

  if (cleaned.length <= 9) {
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
  }

  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
}

function isCompleteBirthDate(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 8) {
    return false;
  }

  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));

  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900) {
    return false;
  }

  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    date.getTime() <= Date.now()
  );
}

function isCompleteCpf(value: string) {
  return value.replace(/\D/g, "").length === 11;
}

export function LoginEmailDataPage() {
  const api = useApiService();
  const { applyAuthResult, user, profile, isAuthenticated } = useAuthSession();
  const { draft, resetDraft } = useAuthDraft();
  const params = useLocalSearchParams<{
    email?: string;
    phone?: string;
    method?: string;
  }>();
  const method = parseAuthMethod(params.method);
  const isOauthOnboarding =
    isOauthMethod(method) || (isAuthenticated && !profile?.onboardingCompleted);
  const email = paramString(params.email) || draft.email || user?.email || "";
  const phone = paramString(params.phone) || draft.phone;
  const step = getAuthStep(isOauthOnboarding ? (isOauthMethod(method) ? method : "google") : method, "data");

  const [fullName, setFullName] = useState(user?.name ?? "");
  const [birthDate, setBirthDate] = useState("");
  const [cpf, setCpf] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<IAvatarOption>(
    DEFAULT_AVATARS[5],
  );
  const [loading, setLoading] = useState(false);

  const canContinue =
    fullName.trim().length >= 2 &&
    isCompleteBirthDate(birthDate) &&
    isCompleteCpf(cpf) &&
    Boolean(draft.verificationToken) &&
    (isOauthOnboarding || Boolean(draft.password));

  async function handleCreateAccount() {
    if (!canContinue || loading) {
      return;
    }

    if (!draft.verificationToken || (!isOauthOnboarding && !draft.password)) {
      Alert.alert(
        "Sessão incompleta",
        isOauthOnboarding
          ? "Volte e conclua a verificação do código enviado por SMS."
          : "Volte e conclua a verificação do código e a senha.",
      );
      return;
    }

    setLoading(true);
    try {
      const result = isOauthOnboarding
        ? await api.modules.auth.completeOnboarding({
            phone,
            verificationToken: draft.verificationToken,
            fullName: fullName.trim(),
            birthDate,
            cpf: cpf.replace(/\D/g, ""),
            avatarKey: selectedAvatar.id,
          })
        : await api.modules.auth.register({
            email: email.trim(),
            password: draft.password,
            phone,
            verificationToken: draft.verificationToken,
            fullName: fullName.trim(),
            birthDate,
            cpf: cpf.replace(/\D/g, ""),
            avatarKey: selectedAvatar.id,
          });
      await applyAuthResult(result);
      resetDraft();
    } catch (error) {
      Alert.alert(
        "Erro ao criar conta",
        getErrorMessage(error, "Não foi possível criar a conta. Tente novamente."),
      );
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
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <AuthScene kind="register" style={styles.scene}>
            <ProfileAvatarControl
              avatar={selectedAvatar}
              onChange={setSelectedAvatar}
            />

            <View style={styles.form}>
              <View style={styles.headerCopy}>
                <Text style={styles.title}>Seus dados</Text>
                <Text style={styles.subtitle}>
                  Essas informações mantêm sua conta segura
                </Text>
              </View>

              <View style={styles.fields}>
                <TextField
                  label="Nome completo"
                  placeholder="Nome completo"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  autoComplete="name"
                  textContentType="name"
                  returnKeyType="next"
                />
                <TextField
                  label="Data de nascimento"
                  placeholder="Data de nascimento"
                  value={birthDate}
                  onChangeText={(text) => setBirthDate(formatBirthDate(text))}
                  keyboardType="number-pad"
                  returnKeyType="next"
                  maxLength={10}
                />
                <TextField
                  label="CPF"
                  placeholder="CPF"
                  value={cpf}
                  onChangeText={(text) => setCpf(formatCpf(text))}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  maxLength={14}
                />
              </View>

              <View style={styles.securityRow}>
                <ShieldCheckIcon size={16} color={OttoColors.primary} />
                <Text style={styles.securityText}>
                  Dados seguros pela LGPD com criptografia
                </Text>
              </View>

              <Button
                label={isOauthOnboarding ? "Concluir cadastro" : "Criar conta"}
                variant="filled"
                disabled={!canContinue}
                loading={loading}
                onPress={handleCreateAccount}
              />
            </View>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 48,
    gap: 32,
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  scene: {
    alignSelf: "stretch",
    alignItems: "center",
    gap: 32,
  },
  form: {
    alignSelf: "stretch",
    alignItems: "center",
    gap: 24,
  },
  headerCopy: {
    alignSelf: "stretch",
    alignItems: "center",
    gap: 4,
  },
  title: {
    ...OttoTypography.h3,
    color: OttoColors.text,
    textAlign: "center",
    alignSelf: "stretch",
  },
  subtitle: {
    ...OttoTypography.caption,
    color: OttoColors.textSoft,
    textAlign: "center",
    alignSelf: "stretch",
  },
  fields: {
    alignSelf: "stretch",
    gap: 16,
  },
  securityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    alignSelf: "stretch",
  },
  securityText: {
    ...OttoTypography.caption,
    color: OttoColors.textSoft,
  },
});
