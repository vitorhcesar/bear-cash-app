import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/infra/http/get-error-message';
import {
  getCategoryDisplay,
  getCategoryGroupLabel,
} from '@/presentation/components/ui/activities-category-catalog';
import { CategoryChipIcon } from '@/presentation/components/ui/activities-category-icons';
import { BackButton } from '@/presentation/components/ui/back-button';
import { Button } from '@/presentation/components/ui/button';
import { formatLongDate } from '@/presentation/components/ui/calendar';
import { CategoryPickerSheet } from '@/presentation/components/ui/category-picker-sheet';
import {
  DEFAULT_CURRENCY_CODE,
  getCurrencySymbol,
} from '@/presentation/components/ui/currencies';
import { CurrencyPicker } from '@/presentation/components/ui/currency-picker';
import { DatePickerSheet } from '@/presentation/components/ui/date-picker-sheet';
import {
  TransactionCalendarIcon,
  TransactionChevronRightIcon,
  TransactionEyeIcon,
  TransactionPencilIcon,
} from '@/presentation/components/ui/new-transaction-icons';
import { OutlineSelect } from '@/presentation/components/ui/outline-select';
import { TextField } from '@/presentation/components/ui/text-field';
import {
  OttoColors,
  OttoFonts,
  OttoTypography,
} from '@/presentation/constants/theme';
import { useApiService } from '@/presentation/hooks/use-api-service';

const ICON_WRAP_IDLE = '#171816';

function formatAmountMask(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function EditTransactionPage() {
  const router = useRouter();
  const api = useApiService();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const transactionId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [loading, setLoading] = useState(true);
  const [amountCents, setAmountCents] = useState(0);
  const [name, setName] = useState('');
  const [transactionDate, setTransactionDate] = useState(() => new Date());
  const [dateSheetOpen, setDateSheetOpen] = useState(false);
  const [currencyCode, setCurrencyCode] = useState(DEFAULT_CURRENCY_CODE);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [hiddenFromTotals, setHiddenFromTotals] = useState(false);
  const [type, setType] = useState<'CREDIT' | 'DEBIT'>('DEBIT');
  const [submitting, setSubmitting] = useState(false);
  const category = categoryId ? getCategoryDisplay(categoryId) : undefined;
  const amountLabel = formatAmountMask(amountCents);
  const canSubmit = name.trim().length > 0 && amountCents > 0;

  useEffect(() => {
    if (!transactionId) {
      setLoading(false);
      Alert.alert('Erro', 'Transação não encontrada.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const item = await api.modules.transactions.get(transactionId);
        if (cancelled) {
          return;
        }

        setType(item.type);
        setAmountCents(Math.round(Math.abs(item.amount) * 100));
        setName(item.description);
        setTransactionDate(new Date(item.date));
        setCurrencyCode(item.currencyCode);
        setCategoryId(item.categoryId);
        setHiddenFromTotals(Boolean(item.hiddenFromTotals));
      } catch (error) {
        Alert.alert(
          'Erro',
          getErrorMessage(error, 'Não foi possível carregar a transação.'),
          [{ text: 'OK', onPress: () => router.back() }],
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [api, router, transactionId]);

  function handleAmountChange(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 12);
    setAmountCents(Number(digits || '0'));
  }

  async function handleSubmit() {
    if (!canSubmit || submitting || !transactionId) {
      return;
    }

    setSubmitting(true);
    try {
      await api.modules.transactions.update(transactionId, {
        description: name.trim(),
        amount: amountCents / 100,
        type,
        date: transactionDate.toISOString(),
        currencyCode,
        categoryId,
        category: categoryId
          ? getCategoryGroupLabel(categoryId) ?? category?.label ?? null
          : null,
        hiddenFromTotals,
      });
      router.back();
    } catch (error) {
      Alert.alert(
        'Erro',
        getErrorMessage(error, 'Não foi possível salvar a transação.'),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.screen}>
          <BackButton fallbackHref="/(tabs)/activities" />
          <View style={styles.loading}>
            <ActivityIndicator color={OttoColors.text} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.screen}>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <BackButton fallbackHref="/(tabs)/activities" />
              <Text style={styles.title}>Editar transação</Text>
            </View>

            <View style={styles.amountRow}>
              <Text style={styles.amountText}>
                {getCurrencySymbol(currencyCode)}
              </Text>
              <TextInput
                style={styles.amountInput}
                value={amountLabel}
                onChangeText={handleAmountChange}
                onFocus={() => setCurrencyOpen(false)}
                keyboardType="number-pad"
                caretHidden
                accessibilityLabel="Valor da transação"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dados da Transação</Text>

              <TextField
                label="Nome da transação"
                value={name}
                onChangeText={setName}
                onFocus={() => setCurrencyOpen(false)}
                autoCorrect={false}
                autoCapitalize="sentences"
                returnKeyType="done"
                underlineColorAndroid="transparent"
              />

              <OutlineSelect
                label="Data"
                value={formatLongDate(transactionDate)}
                trailing={<TransactionCalendarIcon size={16} />}
                onPress={() => {
                  setCurrencyOpen(false);
                  setDateSheetOpen(true);
                }}
              />

              <CurrencyPicker
                label="Selecionar moeda"
                value={currencyCode}
                open={currencyOpen}
                onOpenChange={setCurrencyOpen}
                onChange={setCurrencyCode}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Selecionar categoria"
              onPress={() => {
                setCurrencyOpen(false);
                setCategorySheetOpen(true);
              }}
              style={styles.categoryRow}
            >
              <View style={styles.categoryLeft}>
                <View style={styles.categoryIconWrap}>
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
                <View style={styles.categoryCopy}>
                  <Text style={styles.categoryLabel}>Categoria</Text>
                  <Text style={styles.categoryValue}>
                    {category?.label ?? 'Selecionar'}
                  </Text>
                </View>
              </View>
              <View style={styles.categoryChevron}>
                <TransactionChevronRightIcon size={24} />
              </View>
            </Pressable>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Configurações da transação</Text>
              <View
                style={[
                  styles.toggleCard,
                  hiddenFromTotals && styles.toggleCardActive,
                ]}
              >
                <View
                  style={[
                    styles.toggleIconWrap,
                    hiddenFromTotals && styles.toggleIconWrapActive,
                  ]}
                >
                  <TransactionEyeIcon size={12} color={OttoColors.text} />
                </View>
                <View style={styles.toggleCopy}>
                  <Text style={styles.toggleTitle}>Ocultar do somatório</Text>
                  <Text style={styles.toggleDescription}>
                    Esta transação não será incluída nos totais nem nas análises.
                  </Text>
                </View>
                <Switch
                  value={hiddenFromTotals}
                  onValueChange={setHiddenFromTotals}
                  trackColor={{
                    false: OttoColors.borderStrong,
                    true: OttoColors.primary,
                  }}
                  thumbColor={OttoColors.background}
                  ios_backgroundColor={OttoColors.borderStrong}
                />
              </View>
            </View>
          </ScrollView>

          <Button
            label="Salvar alterações"
            disabled={!canSubmit}
            loading={submitting}
            onPress={() => {
              void handleSubmit();
            }}
          />
        </View>
      </KeyboardAvoidingView>

      <DatePickerSheet
        visible={dateSheetOpen}
        value={transactionDate}
        onClose={() => setDateSheetOpen(false)}
        onSelect={setTransactionDate}
      />
      <CategoryPickerSheet
        visible={categorySheetOpen}
        selectedId={categoryId}
        onClose={() => setCategorySheetOpen(false)}
        onSelect={setCategoryId}
      />
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
  screen: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 24,
  },
  content: {
    gap: 24,
    paddingBottom: 8,
  },
  header: {
    gap: 8,
  },
  title: {
    ...OttoTypography.h1,
    color: OttoColors.text,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: OttoColors.borderSoft,
  },
  amountText: {
    ...OttoTypography.h1,
    color: OttoColors.text,
  },
  amountInput: {
    flex: 1,
    ...OttoTypography.h1,
    color: OttoColors.text,
    padding: 0,
    margin: 0,
  },
  section: {
    gap: 16,
    alignSelf: 'stretch',
  },
  sectionTitle: {
    fontFamily: OttoFonts.semiBold,
    fontSize: 14,
    lineHeight: 22,
    color: OttoColors.text,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    padding: 12,
    borderRadius: 12,
  },
  toggleCardActive: {
    backgroundColor: OttoColors.surface,
  },
  toggleIconWrap: {
    backgroundColor: ICON_WRAP_IDLE,
    borderRadius: 8,
    padding: 6,
  },
  toggleIconWrapActive: {
    backgroundColor: OttoColors.borderSoft,
  },
  toggleCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  toggleTitle: {
    fontFamily: OttoFonts.semiBold,
    fontSize: 14,
    lineHeight: 22,
    color: OttoColors.text,
  },
  toggleDescription: {
    ...OttoTypography.caption,
    color: OttoColors.textSoft,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  categoryIconWrap: {
    backgroundColor: OttoColors.surface,
    borderRadius: 12,
    padding: 8,
  },
  categoryCopy: {
    gap: 2,
  },
  categoryLabel: {
    ...OttoTypography.caption,
    color: OttoColors.textSoft,
  },
  categoryValue: {
    ...OttoTypography.bodySmall,
    color: OttoColors.text,
  },
  categoryChevron: {
    padding: 8,
    borderRadius: 24,
  },
});
