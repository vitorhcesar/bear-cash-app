import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/infra/http/get-error-message';
import type { TransactionItem } from '@/infra/http/services/api/modules/transactions.module';
import {
  getCategoryDisplay,
  getCategoryGroupLabel,
} from '@/presentation/components/ui/activities-category-catalog';
import { CategoryChipIcon } from '@/presentation/components/ui/activities-category-icons';
import { BackButton } from '@/presentation/components/ui/back-button';
import { Button } from '@/presentation/components/ui/button';
import { formatTransactionDetailsDate } from '@/presentation/components/ui/calendar';
import { ConfirmationSheet } from '@/presentation/components/ui/confirmation-sheet';
import { getCurrencySymbol } from '@/presentation/components/ui/currencies';
import {
  TransactionCardIcon,
  TransactionPencilIcon,
  TransactionTrashIcon,
} from '@/presentation/components/ui/new-transaction-icons';
import { SettingsEditIcon } from '@/presentation/components/ui/settings-icons';
import { TransactionBankBadge } from '@/presentation/components/ui/transaction-bank-badge';
import {
  BearCashColors,
  BearCashFonts,
  BearCashTypography,
} from '@/presentation/constants/theme';
import { useApiService } from '@/presentation/hooks/use-api-service';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function firstString(record: Record<string, unknown> | null, keys: string[]) {
  if (!record) {
    return null;
  }

  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function firstNumber(record: Record<string, unknown> | null, keys: string[]) {
  if (!record) {
    return null;
  }

  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim()) {
      const numeric = Number(value);
      if (Number.isFinite(numeric)) {
        return numeric;
      }
    }
  }

  return null;
}

function getInstallmentLabel(item: TransactionItem) {
  const card = asRecord(item.creditCardMetadata);
  const current = firstNumber(card, ['chargeIdentificator', 'charge_identificator']);
  const total = firstNumber(card, ['chargeNumber', 'charge_number']);
  if (current == null || total == null || total <= 1) {
    return null;
  }
  return `${current}/${total}`;
}

function getPaymentMethodLabel(item: TransactionItem) {
  const payment = asRecord(item.paymentData);
  const receiver = asRecord(payment?.receiver);
  const card = asRecord(item.creditCardMetadata);

  return (
    firstString(payment, ['paymentMethod', 'receiverName', 'holderName']) ??
    firstString(receiver, ['name']) ??
    firstString(card, ['holder', 'cardNetwork', 'brand']) ??
    (item.source === 'MANUAL' ? 'Lançamento manual' : 'Não informado')
  );
}

function formatAbsoluteAmount(amount: number) {
  return Math.abs(amount).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function FactRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.factRow}>
      {icon}
      <View style={styles.factCopy}>
        <Text style={styles.factLabel}>{label}</Text>
        <Text style={styles.factValue}>{value}</Text>
      </View>
    </View>
  );
}

export function TransactionDetailsPage() {
  const router = useRouter();
  const api = useApiService();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const transactionId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [item, setItem] = useState<TransactionItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteSheetOpen, setDeleteSheetOpen] = useState(false);
  const [savingRecurring, setSavingRecurring] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!transactionId) {
      setLoading(false);
      return;
    }

    try {
      const next = await api.modules.transactions.get(transactionId);
      setItem(next);
    } catch (error) {
      Alert.alert(
        'Erro',
        getErrorMessage(error, 'Não foi possível carregar a transação.'),
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

  const category = item?.categoryId
    ? getCategoryDisplay(item.categoryId)
    : undefined;
  const categoryLabel =
    (item?.categoryId ? getCategoryGroupLabel(item.categoryId) : undefined) ??
    category?.label ??
    item?.category ??
    'Sem categoria';

  async function handleRecurringChange(recurring: boolean) {
    if (!item || savingRecurring) {
      return;
    }

    const previous = item;
    setItem({ ...item, recurring });
    setSavingRecurring(true);

    try {
      const updated = await api.modules.transactions.update(item.id, { recurring });
      setItem(updated);
    } catch (error) {
      setItem(previous);
      Alert.alert(
        'Erro',
        getErrorMessage(error, 'Não foi possível atualizar a cobrança recorrente.'),
      );
    } finally {
      setSavingRecurring(false);
    }
  }

  async function confirmDelete() {
    if (!item) {
      return;
    }

    setDeleting(true);
    try {
      await api.modules.transactions.remove(item.id);
      setDeleteSheetOpen(false);
      router.back();
    } catch (error) {
      Alert.alert(
        'Erro',
        getErrorMessage(error, 'Não foi possível excluir a transação.'),
      );
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.screen}>
          <BackButton fallbackHref="/(tabs)/activities" />
          <View style={styles.loading}>
            <ActivityIndicator color={BearCashColors.text} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.screen}>
          <BackButton fallbackHref="/(tabs)/activities" />
          <Text style={styles.title}>Dados da transação</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isCredit = item.type === 'CREDIT';
  const symbol = getCurrencySymbol(item.currencyCode);
  const accountLabel = item.bankName?.trim() || 'BearCash';
  const installmentLabel = getInstallmentLabel(item);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.screen}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <BackButton fallbackHref="/(tabs)/activities" />
            <Text style={styles.title}>Dados da transação</Text>
          </View>

          <View style={styles.body}>
            <View style={styles.summary}>
              <View style={styles.iconStack}>
                <View style={styles.categoryBox}>
                  {category ? (
                    <CategoryChipIcon
                      iconKey={category.iconKey}
                      color={category.color}
                      size={24}
                    />
                  ) : (
                    <TransactionPencilIcon size={24} />
                  )}
                </View>
                <View style={styles.bankBadge}>
                  <TransactionBankBadge
                    bankName={item.bankName}
                    bankCode={item.bankCode}
                    bankLogoUrl={item.bankLogoUrl}
                    source={item.source}
                  />
                </View>
              </View>

              <View style={styles.summaryCopy}>
                <Text style={styles.name}>{item.description}</Text>
                <View style={styles.amountRow}>
                  <Text style={styles.amountText}>
                    {isCredit ? '+' : '-'}
                    {symbol}{' '}
                  </Text>
                  <Text style={styles.amountText}>
                    {formatAbsoluteAmount(item.amount)}
                  </Text>
                </View>
                <Text style={styles.date}>
                  {formatTransactionDetailsDate(new Date(item.date))}
                </Text>
              </View>
            </View>

            <View style={styles.facts}>
              <FactRow
                icon={
                  <View style={styles.categoryBox}>
                    {category ? (
                      <CategoryChipIcon
                        iconKey={category.iconKey}
                        color={category.color}
                        size={24}
                      />
                    ) : (
                      <TransactionPencilIcon size={24} />
                    )}
                  </View>
                }
                label="Categoria"
                value={categoryLabel}
              />

              <FactRow
                icon={
                  <TransactionBankBadge
                    bankName={item.bankName}
                    bankCode={item.bankCode}
                    bankLogoUrl={item.bankLogoUrl}
                    source={item.source}
                    size={40}
                  />
                }
                label="Conta"
                value={accountLabel}
              />

              <FactRow
                icon={
                  <View style={styles.categoryBox}>
                    <TransactionCardIcon size={24} color={BearCashColors.text} />
                  </View>
                }
                label="Forma de Pagamento"
                value={getPaymentMethodLabel(item)}
              />

              {installmentLabel ? (
                <FactRow
                  icon={
                    <View style={styles.categoryBox}>
                      <TransactionCardIcon size={24} color={BearCashColors.text} />
                    </View>
                  }
                  label="Parcela"
                  value={installmentLabel}
                />
              ) : null}
            </View>

            <View style={styles.recurringCard}>
              <View style={styles.recurringCopy}>
                <Text style={styles.recurringTitle}>Cobrança Recorrente</Text>
                <Text style={styles.recurringDescription}>
                  A cobrança será realizada nesta mesma data nos próximos meses.
                </Text>
              </View>
              <Switch
                value={Boolean(item.recurring)}
                onValueChange={(value) => {
                  void handleRecurringChange(value);
                }}
                disabled={savingRecurring}
                trackColor={{
                  false: BearCashColors.borderStrong,
                  true: BearCashColors.primary,
                }}
                thumbColor={BearCashColors.background}
                ios_backgroundColor={BearCashColors.borderStrong}
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.actions}>
          <Button
            label="Editar Registro"
            rightIcon={
              <SettingsEditIcon size={16} color={BearCashColors.buttonFilledText} />
            }
            onPress={() =>
              router.push({
                pathname: '/edit-transaction',
                params: { id: item.id },
              })
            }
          />
          <Button
            label="Excluir Registro"
            variant="stroke"
            rightIcon={<TransactionTrashIcon size={16} color={BearCashColors.text} />}
            onPress={() => setDeleteSheetOpen(true)}
          />
        </View>
      </View>

      <ConfirmationSheet
        visible={deleteSheetOpen}
        loading={deleting}
        title="Tem certeza que deseja excluir essa transação?"
        description="Ao excluir, todos os dados serão perdidos e não poderão ser recuperados."
        confirmLabel="Excluir"
        onClose={() => setDeleteSheetOpen(false)}
        onConfirm={() => {
          void confirmDelete();
        }}
      />
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
    gap: 16,
  },
  content: {
    gap: 24,
    paddingBottom: 16,
  },
  header: {
    gap: 8,
  },
  title: {
    ...BearCashTypography.h1,
    color: BearCashColors.text,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    gap: 24,
  },
  summary: {
    gap: 12,
  },
  iconStack: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    alignSelf: 'flex-start',
  },
  categoryBox: {
    backgroundColor: BearCashColors.surface,
    borderRadius: 12,
    padding: 8,
  },
  bankBadge: {
    marginLeft: -11,
    zIndex: 1,
  },
  summaryCopy: {
    gap: 8,
  },
  name: {
    ...BearCashTypography.body,
    color: BearCashColors.text,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  amountText: {
    ...BearCashTypography.h1,
    color: BearCashColors.text,
  },
  date: {
    ...BearCashTypography.bodySmall,
    color: BearCashColors.textSoft,
  },
  facts: {
    gap: 16,
  },
  factRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  factCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  factLabel: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
  },
  factValue: {
    ...BearCashTypography.bodySmall,
    color: BearCashColors.text,
  },
  recurringCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    backgroundColor: BearCashColors.surface,
    borderRadius: 12,
    padding: 12,
  },
  recurringCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  recurringTitle: {
    fontFamily: BearCashFonts.semiBold,
    fontSize: 14,
    lineHeight: 22,
    color: BearCashColors.text,
  },
  recurringDescription: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
  },
  actions: {
    gap: 16,
  },
});
