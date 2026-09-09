import { Image } from 'expo-image';
import { useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { AuthMethod } from '@/presentation/auth/auth-flow';
import { isValidEmail } from '@/presentation/auth/auth-flow';
import { AppleIcon, GoogleIcon } from '@/presentation/components/ui/brand-icons';
import { Button } from '@/presentation/components/ui/button';
import { ContentDivider } from '@/presentation/components/ui/content-divider';
import { PasswordField } from '@/presentation/components/ui/password-field';
import { formatBrazilPhoneDisplay } from '@/presentation/components/ui/phone-field';
import { TextField } from '@/presentation/components/ui/text-field';
import { getAvatarOption } from '@/presentation/constants/avatars';
import { BearCashColors, BearCashTypography } from '@/presentation/constants/theme';

const AVATAR_SIZE = 72;

export type ExistingAccountLoginProps = {
  method: AuthMethod;
  email: string;
  phone: string;
  password: string;
  avatarKey: string;
  loading: boolean;
  googleLoading?: boolean;
  appleLoading?: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (nextPassword?: string) => void;
  onGooglePress?: () => void;
  onApplePress?: () => void;
  onForgotPassword?: () => void;
};

export function ExistingAccountLogin({
  method,
  email,
  phone,
  password,
  avatarKey,
  loading,
  googleLoading = false,
  appleLoading = false,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onGooglePress,
  onApplePress,
  onForgotPassword,
}: ExistingAccountLoginProps) {
  const phoneDisplay = useMemo(() => formatBrazilPhoneDisplay(phone), [phone]);
  const avatar = useMemo(() => getAvatarOption(avatarKey), [avatarKey]);
  const identifierReady = method === 'phone' ? phone.length >= 10 : isValidEmail(email);
  const canContinue = identifierReady && password.length >= 6;
  const previousPassword = useRef(password);

  function looksLikeAutofill(previous: string, next: string) {
    return (
      next.length >= 6 &&
      (previous.length === 0 || next.length - previous.length > 1)
    );
  }

  function handlePasswordChange(value: string) {
    const previous = previousPassword.current;
    previousPassword.current = value;
    onPasswordChange(value);
    if (looksLikeAutofill(previous, value) && identifierReady) {
      onSubmit(value);
    }
  }

  return (
    <View style={styles.root}>
      <Image
        source={avatar.source}
        style={styles.avatar}
        contentFit="cover"
        accessibilityLabel="Foto de perfil"
      />

      <View style={styles.form}>
        <Text style={styles.title}>Boas-vindas!</Text>

        <View style={styles.fields}>
          {method === 'phone' ? (
            <TextField
              label="Telefone"
              placeholder="Telefone"
              value={phoneDisplay}
              editable={false}
              autoComplete="tel"
              textContentType="telephoneNumber"
            />
          ) : (
            <TextField
              label="E-mail"
              placeholder="E-mail"
              value={email}
              onChangeText={onEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              textContentType="username"
              importantForAutofill="yes"
              returnKeyType="next"
            />
          )}
          <PasswordField
            label="Senha"
            placeholder="Senha"
            value={password}
            onChangeText={handlePasswordChange}
            onChange={(event) => {
              const value = event.nativeEvent.text ?? '';
              if (value !== password) {
                handlePasswordChange(value);
              }
            }}
            autoComplete="password"
            textContentType="password"
            importantForAutofill="yes"
            returnKeyType="go"
            enablesReturnKeyAutomatically
            onSubmitEditing={() => onSubmit()}
          />
          {onForgotPassword ? (
            <Pressable
              accessibilityRole="link"
              onPress={onForgotPassword}
              hitSlop={8}
            >
              <Text style={styles.forgotLink}>Esqueci minha senha</Text>
            </Pressable>
          ) : null}
        </View>

        <Button
          label="Entrar"
          variant="filled"
          disabled={!canContinue || googleLoading || appleLoading}
          loading={loading}
          onPress={() => onSubmit()}
        />
      </View>

      <ContentDivider />

      <View style={styles.socialActions}>
        <Button
          label="Entrar com Google"
          variant="stroke"
          leftIcon={<GoogleIcon size={16} />}
          loading={googleLoading}
          disabled={loading || appleLoading}
          onPress={() => {
            onGooglePress?.();
          }}
        />
        <Button
          label="Entrar com Apple"
          variant="stroke"
          leftIcon={<AppleIcon size={16} />}
          loading={appleLoading}
          disabled={loading || googleLoading}
          onPress={() => {
            onApplePress?.();
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 32,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: BearCashColors.borderStrong,
  },
  form: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 24,
  },
  title: {
    ...BearCashTypography.h3,
    color: BearCashColors.text,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  fields: {
    alignSelf: 'stretch',
    gap: 16,
  },
  forgotLink: {
    ...BearCashTypography.bodySmall,
    color: BearCashColors.textSoft,
    textDecorationLine: 'underline',
    textAlign: 'right',
    alignSelf: 'stretch',
  },
  socialActions: {
    alignSelf: 'stretch',
    gap: 15,
  },
});
