import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/infra/http/get-error-message';
import type { OpenFinanceConnection } from '@/infra/http/services/api/modules/open-finance.module';
import { useAuthSession } from '@/presentation/auth/auth-session-context';
import { BackButton } from '@/presentation/components/ui/back-button';
import {
  BankCrownIcon,
  BankDashboardIcon,
  BankShieldIcon,
  BankSparkleIcon,
  BearCashMascotIcon,
} from '@/presentation/components/ui/bank-connection-icons';
import { Button } from '@/presentation/components/ui/button';
import { InstitutionMark } from '@/presentation/components/ui/institution-mark';
import { SettingsChevronIcon } from '@/presentation/components/ui/settings-icons';
import { BearCashColors, BearCashFonts, BearCashTypography } from '@/presentation/constants/theme';
import { useApiService } from '@/presentation/hooks/use-api-service';
import { reconnectOpenFinanceConsent } from '@/presentation/open-finance/connect-bank';

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

function consentStatusLabel(connection: OpenFinanceConnection) {
  if (connection.revokedAt) {
    return 'Desconectada';
  }
  if (connection.status === 'AUTHORISED') {
    if (connection.executionStatus === 'AWAITING_RESOURCES') {
      return 'Sincronizando';
    }
    return 'Conectada';
  }
  if (connection.status === 'AWAITING_AUTHORIZATION') {
    return 'Aguardando autorização';
  }
  if (connection.status === 'REJECTED') {
    return 'Recusada';
  }
  if (connection.status === 'EXPIRED') {
    return 'Expirada';
  }
  return connection.status;
}

export function BankConnectionPage() {
  const router = useRouter();
  const api = useApiService();
  const { profile, user } = useAuthSession();
  const [connections, setConnections] = useState<OpenFinanceConnection[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const firstName = useMemo(
    () =>
      firstNameFromSession(
        profile?.displayName,
        profile?.fullName,
        user?.name,
      ),
    [profile?.displayName, profile?.fullName, user?.name],
  );

  const loadConnections = useCallback(async () => {
    try {
      const response = await api.modules.openFinance.listConnections();
      setConnections(response.items);
    } catch {
      setConnections([]);
    }
  }, [api.modules.openFinance]);

  useFocusEffect(
    useCallback(() => {
      void loadConnections();
    }, [loadConnections]),
  );

  const activeConnections = connections.filter((item) => !item.revokedAt);

  async function handleReconnect(connection: OpenFinanceConnection) {
    setBusyId(connection.id);
    try {
      const updated = await reconnectOpenFinanceConsent(
        api.modules.openFinance,
        connection.id,
      );
      if (updated.status === 'AUTHORISED') {
        Alert.alert('Banco reconectado', 'A sincronização continua em segundo plano.');
      } else if (updated.status === 'REJECTED') {
        Alert.alert('Conexão recusada', 'A autorização no banco foi recusada.');
      }
      await loadConnections();
    } catch (error) {
      Alert.alert('Não foi possível reconectar', getErrorMessage(error, 'Tente novamente.'));
    } finally {
      setBusyId(null);
    }
  }

  function handleDisconnect(connection: OpenFinanceConnection) {
    Alert.alert(
      'Desconectar banco',
      `Revogar o acesso a ${connection.institutionName}? As transações ficam ocultas dos totais.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desconectar',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setBusyId(connection.id);
              try {
                await api.modules.openFinance.revokeConsent(connection.id);
                await loadConnections();
              } catch (error) {
                Alert.alert(
                  'Não foi possível desconectar',
                  getErrorMessage(error, 'Tente novamente.'),
                );
              } finally {
                setBusyId(null);
              }
            })();
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <BackButton />

        <View style={styles.hero}>
          <BearCashMascotIcon size={80} color={BearCashColors.buttonFilled} />
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
              color={BearCashColors.buttonFilledText}
            />
          }
          onPress={() => router.push('/bank-select')}
        />

        {activeConnections.length > 0 ? (
          <View style={styles.connections}>
            <Text style={styles.sectionTitle}>Contas conectadas</Text>
            {activeConnections.map((connection) => (
              <View key={connection.id} style={styles.connectionCard}>
                <View style={styles.connectionHeader}>
                  <InstitutionMark
                    name={connection.institutionName}
                    logoUrl={connection.institutionLogoUrl}
                    size={32}
                  />
                  <View style={styles.connectionCopy}>
                    <Text style={styles.connectionName}>{connection.institutionName}</Text>
                    <Text style={styles.connectionStatus}>
                      {consentStatusLabel(connection)}
                    </Text>
                  </View>
                </View>
                <View style={styles.connectionActions}>
                  {connection.status !== 'AUTHORISED' ? (
                    <Pressable
                      disabled={busyId === connection.id}
                      onPress={() => {
                        void handleReconnect(connection);
                      }}
                    >
                      <Text style={styles.connectionAction}>Reconectar</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    disabled={busyId === connection.id}
                    onPress={() => handleDisconnect(connection)}
                  >
                    <Text style={styles.connectionDanger}>Desconectar</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.grid}>
          <View style={styles.gridRow}>
            <FeatureCard
              title="Segurança bancária"
              description="Tecnologia oficial Open Finance - O mesmo padrão de grandes bancos"
              icon={
                <BankShieldIcon size={20} color={BearCashColors.textMid} />
              }
            />
            <FeatureCard
              title="Inteligência 24h"
              description="BearCash monitora suas finanças enquanto você vive, encontrando economia invisíveis"
              icon={
                <BankSparkleIcon size={20} color={BearCashColors.textMid} />
              }
            />
          </View>
          <View style={styles.gridRow}>
            <FeatureCard
              title="Vision Dashboard"
              description="Patrimônio completo, ritmo de gastos e parcelas futuras em gráficos inteligentes"
              badge="Novo"
              icon={
                <BankDashboardIcon size={20} color={BearCashColors.textMid} />
              }
            />
            <FeatureCard
              title="Você no comando"
              description="Seus dados só são acessados com sua permissão. Desconecte quando quiser"
              icon={
                <BankCrownIcon size={20} color={BearCashColors.textMid} />
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
    backgroundColor: BearCashColors.background,
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
    ...BearCashTypography.h1,
    color: BearCashColors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
    textAlign: 'center',
  },
  connections: {
    gap: 12,
  },
  sectionTitle: {
    fontFamily: BearCashFonts.semiBold,
    fontSize: 16,
    lineHeight: 26,
    color: BearCashColors.text,
  },
  connectionCard: {
    backgroundColor: BearCashColors.surface,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  connectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectionCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  connectionName: {
    fontFamily: BearCashFonts.semiBold,
    fontSize: 16,
    lineHeight: 26,
    color: BearCashColors.textMid,
  },
  connectionStatus: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
  },
  connectionActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  connectionAction: {
    ...BearCashTypography.caption,
    fontFamily: BearCashFonts.semiBold,
    color: BearCashColors.primary,
  },
  connectionDanger: {
    ...BearCashTypography.caption,
    fontFamily: BearCashFonts.semiBold,
    color: BearCashColors.textSoft,
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
    backgroundColor: BearCashColors.surface,
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
    backgroundColor: BearCashColors.neutralBlackSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: BearCashColors.primary,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    ...BearCashTypography.captionSmall,
    fontFamily: BearCashFonts.semiBold,
    color: BearCashColors.background,
  },
  cardCopy: {
    gap: 2,
  },
  cardTitle: {
    fontFamily: BearCashFonts.semiBold,
    fontSize: 14,
    lineHeight: 22,
    color: BearCashColors.text,
  },
  cardDescription: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
  },
});
