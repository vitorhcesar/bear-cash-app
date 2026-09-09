import { Image } from "expo-image";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { getErrorMessage } from "@/infra/http/get-error-message";
import { useAuthDraft } from "@/presentation/auth/auth-draft-context";
import { type AuthMethod, isValidEmail, paramString, parseAuthMethod } from "@/presentation/auth/auth-flow";
import { useAuthSession } from "@/presentation/auth/auth-session-context";
import {
  authFadeIn,
  authFadeOut,
  useAuthSceneMotion,
} from "@/presentation/auth/auth-switch-transition";
import { ExistingAccountLogin } from "@/presentation/auth/existing-account-login";
import { useGoogleSignIn } from "@/presentation/auth/use-google-sign-in";
import { useAppleSignIn } from "@/presentation/auth/use-apple-sign-in";
import { BackButton } from "@/presentation/components/ui/back-button";
import {
  AppleIcon,
  EmailIcon,
  GoogleIcon,
  PhoneIcon,
} from "@/presentation/components/ui/brand-icons";
import { Button } from "@/presentation/components/ui/button";
import { ContentDivider } from "@/presentation/components/ui/content-divider";
import {
  getPhoneDigits,
  PhoneField,
} from "@/presentation/components/ui/phone-field";
import { TextField } from "@/presentation/components/ui/text-field";
import { BearCashColors, BearCashTypography } from "@/presentation/constants/theme";
import { useApiService } from "@/presentation/hooks/use-api-service";

type AuthPhase = "identify" | "password";

export function LoginEmailPage() {
  const router = useRouter();
  const api = useApiService();
  const { applyAuthResult } = useAuthSession();
  const { signIn: signInWithGoogle, loading: googleLoading } = useGoogleSignIn();
  const { signIn: signInWithApple, loading: appleLoading } = useAppleSignIn();
  const {
    setMethod,
    setEmail,
    setPhone,
    setOtpDevHint,
    setAvatarKey,
    resetDraft,
  } = useAuthDraft();
  const params = useLocalSearchParams<{
    resume?: string;
    email?: string;
    phone?: string;
    method?: string;
    avatarKey?: string;
  }>();
  const resumeLogin = paramString(params.resume) === "login";
  const resumedMethod: AuthMethod =
    resumeLogin && parseAuthMethod(params.method) === "phone" ? "phone" : "email";
  const [method, setMethodLocal] = useState<AuthMethod>(
    resumeLogin ? resumedMethod : "email",
  );
  const [phase, setPhase] = useState<AuthPhase>(
    resumeLogin ? "password" : "identify",
  );
  const [email, setEmailLocal] = useState(() =>
    resumeLogin ? paramString(params.email) : "",
  );
  const [phone, setPhoneLocal] = useState(() =>
    resumeLogin ? paramString(params.phone) : "",
  );
  const [password, setPassword] = useState("");
  const [avatarKey, setAvatarKeyLocal] = useState(() =>
    resumeLogin ? paramString(params.avatarKey) : "",
  );
  const [loading, setLoading] = useState(false);
  const [hasSwitchedMethod, setHasSwitchedMethod] = useState(false);
  const [hasLeftIdentify, setHasLeftIdentify] = useState(resumeLogin);
  const submittingRef = useRef(false);
  const departedToRegister = useRef(false);
  const insets = useSafeAreaInsets();
  const sceneMotion = useAuthSceneMotion();

  useEffect(() => {
    if (!resumeLogin) {
      return;
    }

    setMethod(resumedMethod);
    setEmail(paramString(params.email));
    setPhone(paramString(params.phone));
    setAvatarKey(paramString(params.avatarKey));
  }, [
    params.avatarKey,
    params.email,
    params.phone,
    resumeLogin,
    resumedMethod,
    setAvatarKey,
    setEmail,
    setMethod,
    setPhone,
  ]);

  const canContinue =
    method === "email"
      ? isValidEmail(email)
      : getPhoneDigits(phone).length >= 10;

  function switchMethod(next: AuthMethod) {
    if (next === method || phase !== "identify") {
      return;
    }

    Keyboard.dismiss();
    setHasSwitchedMethod(true);
    setMethodLocal(next);
    setMethod(next);
  }

  function goToPassword(nextAvatarKey: string | null | undefined) {
    Keyboard.dismiss();
    setAvatarKeyLocal(nextAvatarKey ?? "");
    setAvatarKey(nextAvatarKey ?? "");
    setHasLeftIdentify(true);
    setPhase("password");
  }

  function goBackToIdentify() {
    setPassword("");
    setPhase("identify");
  }

  useFocusEffect(
    useCallback(() => {
      if (!departedToRegister.current || phase !== "identify") {
        return;
      }

      departedToRegister.current = false;
      void sceneMotion.playEnter();
    }, [phase, sceneMotion.playEnter]),
  );

  async function handleContinue() {
    if (!canContinue || loading) {
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    try {
      if (method === "email") {
        const trimmed = email.trim();
        const result = await api.modules.auth.startEmail(trimmed);
        setMethod("email");
        setEmail(result.email);
        setEmailLocal(result.email);

        if (result.nextStep === "login") {
          setLoading(false);
          goToPassword(result.avatarKey);
          return;
        }

        departedToRegister.current = true;
        await sceneMotion.playExit();
        router.push({
          pathname: "/login-email-phone",
          params: {
            method: "email",
            email: result.email,
          },
        });
        return;
      }

      const phoneDigits = getPhoneDigits(phone);
      const result = await api.modules.auth.startPhone(phoneDigits);
      setMethod("phone");
      setPhone(result.phone);
      setEmail("");
      setEmailLocal("");

      if (result.nextStep === "login") {
        setLoading(false);
        goToPassword(result.avatarKey);
        return;
      }

      const otp = await api.modules.auth.sendOtp(result.phone);
      setOtpDevHint(otp.devHint ?? "");

      departedToRegister.current = true;
      await sceneMotion.playExit();
      router.push({
        pathname: "/login-email-code",
        params: {
          method: "phone",
          email: "",
          phone: result.phone,
        },
      });
    } catch (error) {
      Alert.alert(
        "Erro",
        getErrorMessage(error, "Não foi possível continuar. Tente novamente."),
      );
    } finally {
      setLoading(false);
    }
  }

  async function submitLogin(nextEmail: string, nextPassword: string) {
    if (submittingRef.current || nextPassword.length < 6) {
      return;
    }

    if (method === "phone") {
      if (getPhoneDigits(phone).length < 10 && phone.length < 10) {
        return;
      }
    } else if (!isValidEmail(nextEmail)) {
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    try {
      const result = await api.modules.auth.login(
        method === "phone"
          ? { phone, password: nextPassword }
          : { email: nextEmail.trim(), password: nextPassword },
      );
      await applyAuthResult(result);
      resetDraft();
    } catch (error) {
      Alert.alert(
        "Erro no login",
        getErrorMessage(error, "Não foi possível entrar. Tente novamente."),
      );
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      {phase === "password" ? (
        <Animated.View
          entering={authFadeIn("left")}
          exiting={authFadeOut("left")}
          style={[
            styles.backWrap,
            { top: insets.top + 8, left: insets.left + 24 },
          ]}
        >
          <BackButton onPress={goBackToIdentify} fallbackHref="/" />
        </Animated.View>
      ) : null}

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              key={phase}
              entering={
                phase === "identify" && !hasLeftIdentify
                  ? undefined
                  : authFadeIn(phase === "password" ? "right" : "left")
              }
              exiting={authFadeOut(phase === "password" ? "right" : "left")}
              style={[
                styles.scene,
                phase === "identify" ? sceneMotion.style : undefined,
              ]}
            >
              {phase === "password" ? (
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
                  onForgotPassword={() => {
                    router.push({
                      pathname: "/forgot-password",
                      params: {
                        method,
                        email,
                        phone,
                        avatarKey,
                      },
                    });
                  }}
                />
              ) : (
                <>
                  <Image
                    source={require("@/assets/images/auth/logo.png")}
                    style={styles.logo}
                    contentFit="contain"
                    accessibilityLabel="BearCash"
                  />

                  <View style={styles.form}>
                    <Animated.View
                      key={method}
                      entering={
                        hasSwitchedMethod
                          ? authFadeIn(method === "phone" ? "right" : "left")
                          : undefined
                      }
                      exiting={authFadeOut(
                        method === "phone" ? "right" : "left",
                      )}
                      style={styles.switchingFields}
                    >
                      <Text style={styles.title}>
                        {method === "email"
                          ? "Comece com seu E-mail"
                          : "Comece com seu número"}
                      </Text>

                      {method === "email" ? (
                        <TextField
                          label="Seu melhor E-mail"
                          placeholder="Seu melhor email"
                          value={email}
                          onChangeText={setEmailLocal}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          autoComplete="email"
                          textContentType="emailAddress"
                          returnKeyType="done"
                        />
                      ) : (
                        <PhoneField
                          value={phone}
                          onChangeText={setPhoneLocal}
                        />
                      )}
                    </Animated.View>

                    <Button
                      label="Continuar"
                      variant="filled"
                      disabled={!canContinue || googleLoading || appleLoading}
                      loading={loading}
                      onPress={handleContinue}
                    />
                  </View>

                  <ContentDivider />

                  <View style={styles.socialActions}>
                    <Button
                      label="Continuar com Apple"
                      variant="stroke"
                      leftIcon={<AppleIcon size={16} />}
                      loading={appleLoading}
                      disabled={loading || googleLoading}
                      onPress={() => {
                        void signInWithApple();
                      }}
                    />
                    <Button
                      label="Continuar com Google"
                      variant="stroke"
                      leftIcon={<GoogleIcon size={16} />}
                      loading={googleLoading}
                      disabled={loading || appleLoading}
                      onPress={() => {
                        void signInWithGoogle();
                      }}
                    />
                    <Animated.View
                      key={method}
                      entering={
                        hasSwitchedMethod
                          ? authFadeIn(method === "phone" ? "right" : "left")
                          : undefined
                      }
                      exiting={authFadeOut(
                        method === "phone" ? "right" : "left",
                      )}
                      style={styles.switchingAction}
                    >
                      {method === "email" ? (
                        <Button
                          label="Logar com seu número"
                          variant="stroke"
                          leftIcon={<PhoneIcon size={16} />}
                          onPress={() => switchMethod("phone")}
                        />
                      ) : (
                        <Button
                          label="Logar com seu E-mail"
                          variant="stroke"
                          leftIcon={<EmailIcon size={16} />}
                          onPress={() => switchMethod("email")}
                        />
                      )}
                    </Animated.View>
                  </View>

                  <View style={styles.terms}>
                    <Text style={styles.termsText}>
                      Ao continuar você concorda com os
                    </Text>
                    <Pressable
                      accessibilityRole="link"
                      onPress={() => {
                        // Terms link comes later
                      }}
                    >
                      <Text style={styles.termsLink}>Termos de uso</Text>
                    </Pressable>
                  </View>
                </>
              )}
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
  backWrap: {
    position: "absolute",
    top: 8,
    left: 24,
    zIndex: 2,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
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
  switchingFields: {
    alignSelf: "stretch",
    alignItems: "center",
    gap: 24,
  },
  switchingAction: {
    alignSelf: "stretch",
  },
  title: {
    ...BearCashTypography.h3,
    color: BearCashColors.text,
    textAlign: "center",
    alignSelf: "stretch",
  },
  socialActions: {
    alignSelf: "stretch",
    gap: 15,
  },
  terms: {
    alignItems: "center",
    gap: 2,
    maxWidth: 301,
  },
  termsText: {
    ...BearCashTypography.body,
    color: BearCashColors.textSoft,
    textAlign: "center",
  },
  termsLink: {
    ...BearCashTypography.body,
    color: BearCashColors.text,
    textDecorationLine: "underline",
  },
});
