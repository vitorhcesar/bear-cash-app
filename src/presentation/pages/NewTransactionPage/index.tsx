import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/infra/http/get-error-message';
import type { TransactionType } from '@/infra/http/services/api/modules/transactions.module';
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
  TransactionPencilIcon,
} from '@/presentation/components/ui/new-transaction-icons';
import { TransactionTypeSwitch } from '@/presentation/components/ui/transaction-type-switch';
import {
  BearCashColors,
  BearCashFonts,
  BearCashTypography,
} from '@/presentation/constants/theme';
import { useApiService } from '@/presentation/hooks/use-api-service';

function formatAmountMask(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function NewTransactionPage() {
  const router = useRouter();
  const api = useApiService();
  const [type, setType] = useState<TransactionType>('CREDIT');
  const [amountCents, setAmountCents] = useState(0);
  const [name, setName] = useState('');
  const [transactionDate, setTransactionDate] = useState(() => new Date());
  const [dateSheetOpen, setDateSheetOpen] = useState(false);
  const [currencyCode, setCurrencyCode] = useState(DEFAULT_CURRENCY_CODE);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const category = categoryId ? getCategoryDisplay(categoryId) : undefined;
  const amountLabel = formatAmountMask(amountCents);
  const canSubmit = name.trim().length > 0 && amountCents > 0;

  const amountColor = useMemo(() => {
    if (amountCents <= 0) {
      return BearCashColors.textMid;
    }
    return type === 'CREDIT' ? BearCashColors.income : BearCashColors.dangerBase;
  }, [amountCents, type]);

  function handleAmountChange(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 12);
    setAmountCents(Number(digits || '0'));
  }

  async function handleSubmit() {
    if (!canSubmit || submitting) {
      return;
    }

    setSubmitting(true);
    try {
      await api.modules.transactions.create({
        description: name.trim(),
        amount: amountCents / 100,
        type,
        date: transactionDate.toISOString(),
        currencyCode,
        ...(categoryId
          ? {
              categoryId,
              category:
                getCategoryGroupLabel(categoryId) ?? category?.label ?? null,
            }
          : {}),
      });
      router.back();
    } catch (error) {
      Alert.alert(
        'Erro',
        getErrorMessage(error, 'Não foi possível criar a transação.'),
      );
    } finally {
      setSubmitting(false);
    }
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
              <Text style={styles.title}>Nova Transação</Text>
            </View>

            <TransactionTypeSwitch value={type} onChange={setType} />

            <View style={styles.amountRow}>
              <Text style={[styles.amountText, { color: amountColor }]}>
                {getCurrencySymbol(currencyCode)}
              </Text>
              <TextInput
                style={[styles.amountInput, { color: amountColor }]}
                value={amountLabel}
                onChangeText={handleAmountChange}
                onFocus={() => setCurrencyOpen(false)}
                keyboardType="number-pad"
                caretHidden
                accessibilityLabel="Valor da transação"
              />
            </View>

            <View style={styles.details}>
              <Text style={styles.sectionTitle}>Dados da Transação</Text>

              <View style={styles.inputShell}>
                <TextInput
                  style={styles.nameInput}
                  placeholder="Nome da transação"
                  placeholderTextColor={BearCashColors.textSoft}
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setCurrencyOpen(false)}
                  autoCorrect={false}
                  autoCapitalize="sentences"
                  returnKeyType="done"
                  underlineColorAndroid="transparent"
                />
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Selecionar data"
                onPress={() => {
                  setCurrencyOpen(false);
                  setDateSheetOpen(true);
                }}
                style={styles.inputShell}
              >
                <Text style={styles.inputValue}>
                  {formatLongDate(transactionDate)}
                </Text>
                <View style={styles.trailingIcon}>
                  <TransactionCalendarIcon size={16} />
                </View>
              </Pressable>

              <CurrencyPicker
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
          </ScrollView>

          <Button
            label="Adicionar transação"
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
  content: {
    gap: 24,
  },
  header: {
    gap: 8,
  },
  title: {
    ...BearCashTypography.h1,
    color: BearCashColors.text,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: BearCashColors.borderSoft,
  },
  amountText: {
    ...BearCashTypography.h1,
  },
  amountInput: {
    flex: 1,
    ...BearCashTypography.h1,
    padding: 0,
    margin: 0,
  },
  details: {
    gap: 16,
  },
  sectionTitle: {
    fontFamily: BearCashFonts.semiBold,
    fontSize: 14,
    lineHeight: 22,
    color: BearCashColors.text,
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: BearCashColors.borderSoft,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 46,
  },
  nameInput: {
    flex: 1,
    ...BearCashTypography.body,
    color: BearCashColors.text,
    padding: 0,
    margin: 0,
  },
  inputValue: {
    flex: 1,
    ...BearCashTypography.body,
    color: BearCashColors.textSoft,
  },
  trailingIcon: {
    width: 16,
    height: 16,
    overflow: 'hidden',
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
    backgroundColor: BearCashColors.surface,
    borderRadius: 12,
    padding: 8,
  },
  categoryCopy: {
    gap: 2,
  },
  categoryLabel: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
  },
  categoryValue: {
    ...BearCashTypography.bodySmall,
    color: BearCashColors.text,
  },
  categoryChevron: {
    padding: 8,
    borderRadius: 24,
  },
});
