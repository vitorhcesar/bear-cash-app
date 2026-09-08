import { useRouter } from 'expo-router';
import { useMemo, type ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthSession } from '@/presentation/auth/auth-session-context';
import { BackButton } from '@/presentation/components/ui/back-button';
import {
  BankCrownIcon,
  BankDashboardIcon,
  BankShieldIcon,
  BankSparkleIcon,
  OttoMascotIcon,
} from '@/presentation/components/ui/bank-connection-icons';
import { Button } from '@/presentation/components/ui/button';
import { SettingsChevronIcon } from '@/presentation/components/ui/settings-icons';
import { OttoColors, OttoFonts, OttoTypography } from '@/presentation/constants/theme';

type FeatureCardProps = {
  title: string;
  description: string;
  icon: ReactNode;
  badge?: string;
};

function FeatureCard({ title, description, icon, badge }: FeatureCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconWrap}>{icon}</View>
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.cardCopy}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
      </View>
    </View>
  );
}

function firstNameFromSession(
  displayName?: string | null,
  fullName?: string | null,
  userName?: string | null,
) {
  const raw =
    displayName?.trim() || fullName?.trim() || userName?.trim() || '';
  if (!raw) {
    return 'você';
  }
  return raw.split(/\s+/)[0];
}

export function BankConnectionPage() {
  const router = useRouter();
  const { profile, user } = useAuthSession();
  const firstName = useMemo(
    () =>
      firstNameFromSession(
        profile?.displayName,
        profile?.fullName,
        user?.name,
      ),
    [profile?.displayName, profile?.fullName, user?.name],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <BackButton />

        <View style={styles.hero}>
          <OttoMascotIcon size={80} color={OttoColors.buttonFilled} />
          <View style={styles.heroCopy}>
            <Text style={styles.title}>Olá, {firstName}!</Text>
            <Text style={styles.subtitle}>
              Para eu encontrar oportunidades de economia, preciso acessar os
              seus gastos
            </Text>
          </View>
        </View>

        <Button
          label="Conectar uma nova conta"
          variant="filled"
          rightIcon={
            <SettingsChevronIcon
              size={16}
              color={OttoColors.buttonFilledText}
            />
          }
          onPress={() => router.push('/bank-select')}
        />

        <View style={styles.grid}>
          <View style={styles.gridRow}>
            <FeatureCard
              title="Segurança bancária"
              description="Tecnologia oficial Open Finance - O mesmo padrão de grandes bancos"
              icon={
                <BankShieldIcon size={20} color={OttoColors.textMid} />
              }
            />
            <FeatureCard
              title="Inteligência 24h"
              description="Otto monitora suas finanças enquanto você vive, encontrando economia invisíveis"
              icon={
                <BankSparkleIcon size={20} color={OttoColors.textMid} />
              }
            />
          </View>
          <View style={styles.gridRow}>
            <FeatureCard
              title="Vision Dashboard"
              description="Patrimônio completo, ritmo de gastos e parcelas futuras em gráficos inteligentes"
              badge="Novo"
              icon={
                <BankDashboardIcon size={20} color={OttoColors.textMid} />
              }
            />
            <FeatureCard
              title="Você no comando"
              description="Seus dados só são acessados com sua permissão. Desconecte quando quiser"
              icon={
                <BankCrownIcon size={20} color={OttoColors.textMid} />
              }
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: OttoColors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 24,
  },
  hero: {
    alignItems: 'center',
    gap: 16,
  },
  heroCopy: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  title: {
    ...OttoTypography.h1,
    color: OttoColors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...OttoTypography.caption,
    color: OttoColors.textSoft,
    textAlign: 'center',
  },
  grid: {
    gap: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: OttoColors.surface,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: OttoColors.neutralBlackSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: OttoColors.primary,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    ...OttoTypography.captionSmall,
    fontFamily: OttoFonts.semiBold,
    color: OttoColors.background,
  },
  cardCopy: {
    gap: 2,
  },
  cardTitle: {
    fontFamily: OttoFonts.semiBold,
    fontSize: 14,
    lineHeight: 22,
    color: OttoColors.text,
  },
  cardDescription: {
    ...OttoTypography.caption,
    color: OttoColors.textSoft,
  },
});
