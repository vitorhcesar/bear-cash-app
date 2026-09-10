import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getAuthStep,
  isOauthMethod,
  isValidEmail,
  paramString,
  parseAuthMethod,
} from "@/presentation/auth/auth-flow";
import { AuthScene } from "@/presentation/auth/auth-switch-transition";
import { useAuthDraft } from "@/presentation/auth/auth-draft-context";
import { useAuthSession } from "@/presentation/auth/auth-session-context";
import { AuthFlowHeader } from "@/presentation/components/ui/auth-flow-header";
import { Button } from "@/presentation/components/ui/button";
import { PasswordField } from "@/presentation/components/ui/password-field";
import { TextField } from "@/presentation/components/ui/text-field";
import { BearCashColors, BearCashTypography } from "@/presentation/constants/theme";

const MIN_PASSWORD_LENGTH = 6;

export function LoginEmailProfilePage() {
  const router = useRouter();
  const { setEmail, setPassword, setPhone, setMethod, draft } = useAuthDraft();
  const { user, profile, isAuthenticated } = useAuthSession();
  const params = useLocalSearchParams<{
    email?: string;
    phone?: string;
    method?: string;
  }>();
  const methodFromParams = parseAuthMethod(params.method);
  const isOauthOnboarding =
    isOauthMethod(methodFromParams) ||
    isOauthMethod(draft.method) ||
    (isAuthenticated && !profile?.onboardingCompleted);
  const method = isOauthOnboarding
    ? isOauthMethod(methodFromParams)
      ? methodFromParams
      : isOauthMethod(draft.method)
        ? draft.method
        : "google"
    : methodFromParams;
  const phone = paramString(params.phone) || draft.phone;
  const providerEmail =
    paramString(params.email) || draft.email || user?.email || "";
  const step = getAuthStep(method, "profile");

  const [email, setEmailLocal] = useState(providerEmail);
  const [password, setPasswordLocal] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const resolvedEmail = isOauthOnboarding ? providerEmail : email;
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const canContinue =
    isValidEmail(resolvedEmail) &&
    password.length >= MIN_PASSWORD_LENGTH &&
    passwordsMatch;

  function handleContinue() {
    if (!canContinue) {
      return;
    }

    const nextEmail = resolvedEmail.trim();
    setMethod(method);
    setEmail(nextEmail);
    setPassword(password);
    setPhone(phone);

    router.push({
      pathname: "/login-email-data",
      params: {
        method,
        email: nextEmail,
        phone,
      },
    });
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
            <Image
              source={require("@/assets/images/auth/logo.png")}
              style={styles.logo}
              contentFit="contain"
              accessibilityLabel="BearCash"
            />

            <View style={styles.form}>
              <View style={styles.headerCopy}>
                <Text style={styles.title}>Comece por aqui</Text>
                <Text style={styles.subtitle}>
                  {isOauthOnboarding
                    ? "Defina uma senha para entrar também com e-mail"
                    : "Só mais alguns dados e você está dentro"}
                </Text>
              </View>

              <View style={styles.fields}>
                {isOauthOnboarding ? null : (
                  <TextField
                    label="Digite seu E-mail"
                    placeholder="Digite seu E-mail"
                    value={email}
                    onChangeText={setEmailLocal}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    textContentType="emailAddress"
                    returnKeyType="next"
                  />
                )}
                <PasswordField
                  label="Digite sua senha"
                  placeholder="Digite sua senha"
                  value={password}
                  onChangeText={setPasswordLocal}
                  autoComplete="new-password"
                  returnKeyType="next"
                />
                <PasswordField
                  label="Confirmar senha"
                  placeholder="Confirmar senha"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  autoComplete="new-password"
                  returnKeyType="done"
                />
              </View>

              <Button
                label="Continuar"
                variant="filled"
                disabled={!canContinue}
                onPress={handleContinue}
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
  logo: {
    width: 57,
    height: 59,
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
    ...BearCashTypography.h3,
    color: BearCashColors.text,
    textAlign: "center",
    alignSelf: "stretch",
  },
  subtitle: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
    textAlign: "center",
    alignSelf: "stretch",
  },
  fields: {
    alignSelf: "stretch",
    gap: 16,
  },
});
