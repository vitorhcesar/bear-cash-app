import { useFocusEffect } from 'expo-router';
import { memo, useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/infra/http/get-error-message';
import type { OpenFinanceConsent, OpenFinanceConnection, OpenFinanceInstitution } from '@/infra/http/services/api/modules/open-finance.module';
import {
  isInstitutionsCacheFresh,
  peekInstitutionsCache,
  readInstitutionsCache,
  writeInstitutionsCache,
} from '@/infra/open-finance/institutions-cache';
import { useAuthSession } from '@/presentation/auth/auth-session-context';
import { FilterChipCloseIcon } from '@/presentation/components/ui/activities-filter-icons';
import {
  FilterSlidersIcon,
  SearchIcon,
} from '@/presentation/components/ui/activities-icons';
import { BackButton } from '@/presentation/components/ui/back-button';
import { BankConnectSheet } from '@/presentation/components/ui/bank-connect-sheet';
import { BankSyncSheet } from '@/presentation/components/ui/bank-sync-sheet';
import {
  BankFilterSheet,
  bankKindFilterLabel,
  type BankKindFilter,
} from '@/presentation/components/ui/bank-filter-sheet';
import { InstitutionMark } from '@/presentation/components/ui/institution-mark';
import { SettingsChevronIcon } from '@/presentation/components/ui/settings-icons';
import { BearCashColors, BearCashFonts, BearCashTypography } from '@/presentation/constants/theme';
import { useApiService } from '@/presentation/hooks/use-api-service';
import {
  connectOpenFinanceInstitution,
  isOpenFinanceConnectionLimitReached,
  openFinanceConnectionLimitMessage,
  reconnectOpenFinanceConsent,
} from '@/presentation/open-finance/connect-bank';

const BANK_ROW_HEIGHT = 56;
const BANK_ROW_GAP = 16;
const BANK_ITEM_HEIGHT = BANK_ROW_HEIGHT + BANK_ROW_GAP;

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function maskCpf(value: string | null | undefined) {
  if (!value) {
    return 'CPF: —';
  }

  const digits = value.replace(/\D/g, '');
  if (digits.length < 5) {
    return `CPF: ${digits || '—'}`;
  }

  return `CPF: ${digits.slice(0, 3)}.***.***-${digits.slice(-2)}`;
}

function displayNameFromSession(
  fullName?: string | null,
  displayName?: string | null,
  userName?: string | null,
) {
  return (
    fullName?.trim() ||
    displayName?.trim() ||
    userName?.trim() ||
    'você'
  );
}

const BankRow = memo(function BankRow({
  bank,
  selected,
  onPress,
}: {
  bank: OpenFinanceInstitution;
  selected: boolean;
  onPress: (bank: OpenFinanceInstitution) => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        bank.available ? `Conectar ${bank.name}` : `${bank.name} indisponível`
      }
      onPress={() => onPress(bank)}
      style={({ pressed }) => [
        styles.bankRow,
        selected && styles.bankRowSelected,
        !bank.available && styles.bankRowDisabled,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.bankRowLeft}>
        <InstitutionMark name={bank.name} logoUrl={bank.logoUrl} size={32} />
        <Text style={styles.bankName} numberOfLines={1}>
          {bank.name}
        </Text>
      </View>
      <SettingsChevronIcon size={16} color={BearCashColors.text} />
    </Pressable>
  );
});

function matchesKindFilter(bank: OpenFinanceInstitution, filter: BankKindFilter) {
  if (filter === 'all') {
    return true;
  }
  if (filter === 'banks') {
    return bank.kind === 'bank';
  }
  return bank.kind === 'broker';
}

const FEATURED_HINTS = [
  'nubank',
  'itau',
  'bradesco pessoa fisica',
  'banco do brasil',
  'santander pessoa fisica',
  'caixa',
  'c6 bank',
  'inter pf',
  'picpay',
  'mercado pago',
];

function featuredIndex(name: string) {
  const normalized = normalizeSearch(name);
  const exact = FEATURED_HINTS.findIndex((hint) => normalized === hint);
  if (exact !== -1) {
    return exact;
  }
  return FEATURED_HINTS.findIndex((hint) => normalized.includes(hint));
}

function sortInstitutions(left: OpenFinanceInstitution, right: OpenFinanceInstitution) {
  const leftFeatured = featuredIndex(left.name);
  const rightFeatured = featuredIndex(right.name);
  const leftRank = leftFeatured === -1 ? Number.MAX_SAFE_INTEGER : leftFeatured;
  const rightRank = rightFeatured === -1 ? Number.MAX_SAFE_INTEGER : rightFeatured;
  if (leftRank !== rightRank) {
    return leftRank - rightRank;
  }
  if (left.available !== right.available) {
    return left.available ? -1 : 1;
  }
  return left.name.localeCompare(right.name, 'pt-BR');
}

export function BankSelectPage() {
  const api = useApiService();
  const { profile, user } = useAuthSession();
  const [query, setQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<BankKindFilter>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<OpenFinanceInstitution | null>(null);
  const [institutions, setInstitutions] = useState<OpenFinanceInstitution[]>(
    () => peekInstitutionsCache()?.items ?? [],
  );
  const [loading, setLoading] = useState(() => !peekInstitutionsCache()?.items.length);
  const [connecting, setConnecting] = useState(false);
  const [syncConsent, setSyncConsent] = useState<OpenFinanceConsent | null>(null);
  const [connections, setConnections] = useState<OpenFinanceConnection[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const hasQuery = query.trim().length > 0;
  const filterActive = kindFilter !== 'all';
  const filterLabel = bankKindFilterLabel(kindFilter);
  const missingCpf = !profile?.cpf?.replace(/\D/g, '');
  const userName = useMemo(
    () =>
      displayNameFromSession(
        profile?.fullName,
        profile?.displayName,
        user?.name,
      ),
    [profile?.displayName, profile?.fullName, user?.name],
  );
  const cpfLabel = useMemo(() => maskCpf(profile?.cpf), [profile?.cpf]);

  const refreshInstitutions = useCallback(
    async (force = false) => {
      const cached = await readInstitutionsCache();
      if (cached?.items.length) {
        setInstitutions(cached.items);
        setLoadError(null);
        setLoading(false);
        if (!force && isInstitutionsCacheFresh(cached.savedAt)) {
          return;
        }
      } else {
        setLoading(true);
      }

      try {
        const response = await api.modules.openFinance.listInstitutions();
        const items = response.items ?? [];
        setInstitutions(items);
        setLoadError(null);
        await writeInstitutionsCache(items);
      } catch (error) {
        if (!cached?.items.length) {
          setInstitutions([]);
          setLoadError(getErrorMessage(error, 'Tente novamente.'));
        }
      } finally {
        setLoading(false);
      }
    },
    [api.modules.openFinance],
  );

  const refreshConnections = useCallback(async () => {
    try {
      const response = await api.modules.openFinance.listConnections();
      setConnections(response.items);
    } catch {
      setConnections([]);
    }
  }, [api.modules.openFinance]);

  useFocusEffect(
    useCallback(() => {
      void refreshInstitutions();
      void refreshConnections();
    }, [refreshInstitutions, refreshConnections]),
  );

  const banks = useMemo(() => {
    const normalizedQuery = normalizeSearch(query);
    const byKind = institutions
      .filter((bank) => matchesKindFilter(bank, kindFilter))
      .sort(sortInstitutions);

    if (!normalizedQuery) {
      return byKind;
    }

    return byKind.filter((bank) => normalizeSearch(bank.name).includes(normalizedQuery));
  }, [institutions, kindFilter, query]);

  const handlePressBank = useCallback((bank: OpenFinanceInstitution) => {
    if (!bank.available) {
      Alert.alert(
        'Instituição indisponível',
        'Este banco está temporariamente fora do Open Finance. Tente outro ou volte mais tarde.',
      );
      return;
    }
    setSelectedBank(bank);
  }, []);

  const renderBank: ListRenderItem<OpenFinanceInstitution> = useCallback(
    ({ item }) => (
      <BankRow
        bank={item}
        selected={selectedBank?.id === item.id}
        onPress={handlePressBank}
      />
    ),
    [handlePressBank, selectedBank?.id],
  );

  async function handleConnect() {
    if (!selectedBank) {
      return;
    }
    if (missingCpf) {
      Alert.alert('CPF necessário', 'Complete seu CPF no perfil para conectar um banco.');
      return;
    }
    if (isOpenFinanceConnectionLimitReached(connections, selectedBank.id)) {
      Alert.alert('Limite de conexões', openFinanceConnectionLimitMessage());
      return;
    }

    setConnecting(true);
    try {
      const consent = await connectOpenFinanceInstitution(
        api.modules.openFinance,
        selectedBank.id,
        { onUpdate: setSyncConsent },
      );
      setSyncConsent(consent);
    } catch (error) {
      setSyncConsent(null);
      Alert.alert('Não foi possível conectar', getErrorMessage(error, 'Tente novamente.'));
    } finally {
      setConnecting(false);
    }
  }

  const listEmpty = loading && institutions.length === 0 ? (
    <Text style={styles.emptyText}>Carregando instituições…</Text>
  ) : loadError && institutions.length === 0 ? (
    <Pressable onPress={() => void refreshInstitutions(true)}>
      <Text style={styles.emptyText}>
        {loadError} Toque para tentar de novo.
      </Text>
    </Pressable>
  ) : (
    <Text style={styles.emptyText}>Nenhum banco encontrado</Text>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <View style={styles.header}>
          <BackButton />
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Selecione o seu banco</Text>
            <Text style={styles.subtitle}>
              {institutions.length > 0
                ? `${institutions.length} instituições Open Finance. Escolha onde você é cliente para trazer os dados de PF.`
                : 'Escolha uma instituição onde você é cliente para trazer seus dados de contas pessoa física (PF)'}
            </Text>
          </View>
        </View>

        <View style={styles.searchBlock}>
          <View style={styles.searchRow}>
            <View style={styles.searchField}>
              {hasQuery ? (
                <View style={styles.floatingLabelRow} pointerEvents="none">
                  <View style={styles.floatingLabelBackground}>
                    <Text style={styles.floatingLabel}>Buscar por bancos</Text>
                  </View>
                </View>
              ) : null}
              <SearchIcon size={16} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar bancos"
                placeholderTextColor={BearCashColors.textSoft}
                value={query}
                onChangeText={setQuery}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
                accessibilityLabel="Buscar bancos"
              />
              {hasQuery ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Limpar busca"
                  hitSlop={8}
                  onPress={() => setQuery('')}
                >
                  <FilterChipCloseIcon size={16} />
                </Pressable>
              ) : null}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Filtros"
              hitSlop={8}
              onPress={() => setFiltersOpen(true)}
            >
              <View style={styles.filterButton}>
                <FilterSlidersIcon size={28} />
                {filterActive ? <View style={styles.filterDot} /> : null}
              </View>
            </Pressable>
          </View>

          {filterActive ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remover filtro ${filterLabel}`}
              onPress={() => setKindFilter('all')}
              style={({ pressed }) => [
                styles.filterHint,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.filterHintText}>
                Filtrado por: {filterLabel}
              </Text>
              <FilterChipCloseIcon size={12} />
            </Pressable>
          ) : null}
        </View>

        <FlatList
          style={styles.list}
          data={banks}
          extraData={selectedBank?.id}
          keyExtractor={(item) => item.id}
          renderItem={renderBank}
          getItemLayout={(_, index) => ({
            length: BANK_ROW_HEIGHT,
            offset: BANK_ITEM_HEIGHT * index,
            index,
          })}
          ItemSeparatorComponent={BankRowSeparator}
          ListEmptyComponent={listEmpty}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          updateCellsBatchingPeriod={40}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
          contentContainerStyle={styles.listContent}
        />
      </View>

      <BankFilterSheet
        visible={filtersOpen}
        value={kindFilter}
        onClose={() => setFiltersOpen(false)}
        onApply={setKindFilter}
      />
      <BankConnectSheet
        visible={Boolean(selectedBank) && !syncConsent}
        bank={selectedBank}
        userName={userName}
        cpfLabel={cpfLabel}
        connecting={connecting}
        missingCpf={missingCpf}
        onClose={() => {
          if (!connecting) {
            setSelectedBank(null);
          }
        }}
        onConnect={() => {
          void handleConnect();
        }}
      />
      <BankSyncSheet
        visible={Boolean(syncConsent)}
        bankName={syncConsent?.institutionName ?? selectedBank?.name}
        consent={syncConsent}
        loading={connecting}
        onClose={() => {
          setSyncConsent(null);
          setSelectedBank(null);
        }}
        onRecreate={() => {
          if (!syncConsent) {
            return;
          }
          void (async () => {
            setConnecting(true);
            try {
              const next = await reconnectOpenFinanceConsent(
                api.modules.openFinance,
                syncConsent.id,
                { onUpdate: setSyncConsent },
              );
              setSyncConsent(next);
            } catch (error) {
              Alert.alert(
                'Não foi possível reconectar',
                getErrorMessage(error, 'Tente novamente.'),
              );
            } finally {
              setConnecting(false);
            }
          })();
        }}
      />
    </SafeAreaView>
  );
}

function BankRowSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BearCashColors.background,
  },
  body: {
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
  searchBlock: {
    gap: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchField: {
    flex: 1,
    minWidth: 0,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: BearCashColors.borderSoft,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  floatingLabelRow: {
    position: 'absolute',
    top: -8,
    left: 13,
    zIndex: 2,
  },
  floatingLabelBackground: {
    backgroundColor: BearCashColors.background,
    paddingHorizontal: 4,
  },
  floatingLabel: {
    ...BearCashTypography.captionSmall,
    color: BearCashColors.text,
  },
  searchInput: {
    flex: 1,
    ...BearCashTypography.body,
    color: BearCashColors.text,
    padding: 0,
  },
  filterButton: {
    width: 28,
    height: 28,
  },
  filterDot: {
    position: 'absolute',
    top: 3,
    left: 13,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BearCashColors.primarySoft,
  },
  filterHint: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
  },
  filterHintText: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 8,
    flexGrow: 1,
  },
  separator: {
    height: BANK_ROW_GAP,
  },
  bankRow: {
    height: BANK_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BearCashColors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  bankRowSelected: {
    backgroundColor: '#171816',
  },
  bankRowDisabled: {
    opacity: 0.45,
  },
  bankRowLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 8,
  },
  bankName: {
    flex: 1,
    fontFamily: BearCashFonts.semiBold,
    fontSize: 16,
    lineHeight: 26,
    color: BearCashColors.textMid,
  },
  pressed: {
    opacity: 0.85,
  },
  emptyText: {
    ...BearCashTypography.bodySmall,
    color: BearCashColors.textSoft,
    textAlign: 'center',
    paddingVertical: 24,
  },
});
