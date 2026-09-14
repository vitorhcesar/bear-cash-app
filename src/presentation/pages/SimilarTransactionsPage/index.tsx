import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/infra/http/get-error-message';
import type { TransactionItem } from '@/infra/http/services/api/modules/transactions.module';
import { BackButton } from '@/presentation/components/ui/back-button';
import {
  filterSimilarTransactions,
  similarCategorySubtitle,
} from '@/presentation/components/ui/similar-transactions';
import { TransactionListItem } from '@/presentation/components/ui/transaction-list-item';
import {
  BearCashColors,
  BearCashTypography,
} from '@/presentation/constants/theme';
import { useApiService } from '@/presentation/hooks/use-api-service';

export function SimilarTransactionsPage() {
  const router = useRouter();
  const api = useApiService();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const transactionId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [item, setItem] = useState<TransactionItem | null>(null);
  const [similar, setSimilar] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!transactionId) {
      setLoading(false);
      return;
    }

    try {
      const current = await api.modules.transactions.get(transactionId);
      const list = await api.modules.transactions.list();
      setItem(current);
      setSimilar(filterSimilarTransactions(current, list.items));
    } catch (error) {
      Alert.alert(
        'Erro',
        getErrorMessage(error, 'Não foi possível carregar as transações similares.'),
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } finally {
      setLoading(false);
    }
  }, [api, router, transactionId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const subtitle = item ? similarCategorySubtitle(item) : '';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <BackButton fallbackHref="/(tabs)/activities" />
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Transações similares</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={BearCashColors.text} />
          </View>
        ) : (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          >
            {similar.length === 0 ? (
              <Text style={styles.empty}>Nenhuma transação similar encontrada</Text>
            ) : (
              similar.map((entry) => (
                <TransactionListItem
                  key={entry.id}
                  item={entry}
                  leading="mark"
                  onPress={() =>
                    router.push({
                      pathname: '/transaction/[id]',
                      params: { id: entry.id },
                    })
                  }
                />
              ))
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BearCashColors.background,
  },
  flex: {
    flex: 1,
  },
  screen: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 24,
  },
  header: {
    gap: 8,
  },
  headerCopy: {
    gap: 8,
  },
  title: {
    ...BearCashTypography.h1,
    color: BearCashColors.text,
  },
  subtitle: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    gap: 10,
    paddingBottom: 16,
  },
  empty: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
  },
});
