import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthDraft } from '@/presentation/auth/auth-draft-context';
import { useAuthSession } from '@/presentation/auth/auth-session-context';
import { Button } from '@/presentation/components/ui/button';
import { BearCashColors, BearCashTypography } from '@/presentation/constants/theme';

export function PlaceholderTabPage({
  title,
  subtitle,
  showLogout = false,
  showBankConnection = false,
}: {
  title: string;
  subtitle?: string;
  showLogout?: boolean;
  showBankConnection?: boolean;
}) {
  const router = useRouter();
  const { signOut } = useAuthSession();
  const { resetDraft } = useAuthDraft();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await signOut();
      resetDraft();
      // Stack.Protected no root troca para as telas de login ao limpar a sessão.
    } catch {
      Alert.alert('Erro', 'Não foi possível sair. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {showBankConnection ? (
          <Button
            label="Conectar conta"
            variant="filled"
            onPress={() => router.push('/bank-connection')}
          />
        ) : null}
        {showLogout ? (
          <Button
            label="Logout"
            variant="stroke"
            loading={loading}
            onPress={handleLogout}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BearCashColors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  title: {
    ...BearCashTypography.h1,
    color: BearCashColors.text,
  },
  subtitle: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
    textAlign: 'center',
  },
});
