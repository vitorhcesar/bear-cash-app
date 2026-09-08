import { useMemo, useState, type ComponentType } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthSession } from '@/presentation/auth/auth-session-context';
import { FilterChipCloseIcon } from '@/presentation/components/ui/activities-filter-icons';
import {
  FilterSlidersIcon,
  SearchIcon,
} from '@/presentation/components/ui/activities-icons';
import { BackButton } from '@/presentation/components/ui/back-button';
import { BankConnectSheet } from '@/presentation/components/ui/bank-connect-sheet';
import {
  BankFilterSheet,
  bankKindFilterLabel,
  type BankKindFilter,
} from '@/presentation/components/ui/bank-filter-sheet';
import {
  BancoDoBrasilLogo,
  C6Logo,
  CaixaLogo,
  ItauLogo,
  NubankLogo,
  SantanderLogo,
} from '@/presentation/components/ui/bank-logos';
import { SettingsChevronIcon } from '@/presentation/components/ui/settings-icons';
import { OttoColors, OttoFonts, OttoTypography } from '@/presentation/constants/theme';

type BankLogoProps = {
  size?: number;
};

type BankKind = 'bank' | 'broker';

type BankOption = {
  id: string;
  name: string;
  kind: BankKind;
  Logo: ComponentType<BankLogoProps>;
};

const BANKS: BankOption[] = [
  { id: 'nubank', name: 'Nubank', kind: 'bank', Logo: NubankLogo },
  { id: 'santander', name: 'Santander', kind: 'bank', Logo: SantanderLogo },
  { id: 'bb', name: 'Banco do Brasil', kind: 'bank', Logo: BancoDoBrasilLogo },
  { id: 'c6', name: 'C6 Bank', kind: 'bank', Logo: C6Logo },
  { id: 'caixa', name: 'Caixa', kind: 'bank', Logo: CaixaLogo },
  { id: 'itau', name: 'Itaú', kind: 'bank', Logo: ItauLogo },
];

const LOGO_SIZE = 32;
const LOGO_BORDER = '#212220';

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

function BankRow({
  bank,
  selected,
  onPress,
}: {
  bank: BankOption;
  selected: boolean;
  onPress: () => void;
}) {
  const { Logo, name } = bank;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Conectar ${name}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.bankRow,
        selected && styles.bankRowSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.bankRowLeft}>
        <View style={styles.logoFrame}>
          <Logo size={LOGO_SIZE} />
        </View>
        <Text style={styles.bankName}>{name}</Text>
      </View>
      <SettingsChevronIcon size={16} color={OttoColors.text} />
    </Pressable>
  );
}

function matchesKindFilter(bank: BankOption, filter: BankKindFilter) {
  if (filter === 'all') {
    return true;
  }
  if (filter === 'banks') {
    return bank.kind === 'bank';
  }
  return bank.kind === 'broker';
}

export function BankSelectPage() {
  const { profile, user } = useAuthSession();
  const [query, setQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<BankKindFilter>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<BankOption | null>(null);

  const hasQuery = query.trim().length > 0;
  const filterActive = kindFilter !== 'all';
  const filterLabel = bankKindFilterLabel(kindFilter);
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

  const banks = useMemo(() => {
    const normalizedQuery = normalizeSearch(query);
    const byKind = BANKS.filter((bank) =>
      matchesKindFilter(bank, kindFilter),
    );

    if (!normalizedQuery) {
      return byKind;
    }

    return byKind.filter((bank) =>
      normalizeSearch(bank.name).includes(normalizedQuery),
    );
  }, [kindFilter, query]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <View style={styles.header}>
          <BackButton />
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Selecione o seu banco</Text>
            <Text style={styles.subtitle}>
              Escolha uma instituição onde você é cliente para trazer seus dados
              de contas pessoa física (PF)
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
                placeholderTextColor={OttoColors.textSoft}
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

        <ScrollView
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {banks.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum banco encontrado</Text>
          ) : (
            banks.map((bank) => (
              <BankRow
                key={bank.id}
                bank={bank}
                selected={selectedBank?.id === bank.id}
                onPress={() => setSelectedBank(bank)}
              />
            ))
          )}
        </ScrollView>
      </View>

      <BankFilterSheet
        visible={filtersOpen}
        value={kindFilter}
        onClose={() => setFiltersOpen(false)}
        onApply={setKindFilter}
      />
      <BankConnectSheet
        visible={Boolean(selectedBank)}
        bank={selectedBank}
        userName={userName}
        cpfLabel={cpfLabel}
        onClose={() => setSelectedBank(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: OttoColors.background,
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
    ...OttoTypography.h1,
    color: OttoColors.text,
  },
  subtitle: {
    ...OttoTypography.caption,
    color: OttoColors.textSoft,
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
    borderColor: OttoColors.borderSoft,
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
    backgroundColor: OttoColors.background,
    paddingHorizontal: 4,
  },
  floatingLabel: {
    ...OttoTypography.captionSmall,
    color: OttoColors.text,
  },
  searchInput: {
    flex: 1,
    ...OttoTypography.body,
    color: OttoColors.text,
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
    backgroundColor: OttoColors.primarySoft,
  },
  filterHint: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
  },
  filterHintText: {
    ...OttoTypography.caption,
    color: OttoColors.textSoft,
  },
  listContent: {
    gap: 16,
    paddingBottom: 8,
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: OttoColors.surface,
    borderRadius: 12,
    padding: 12,
    overflow: 'hidden',
  },
  bankRowSelected: {
    backgroundColor: '#171816',
  },
  bankRowLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 8,
  },
  logoFrame: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
    overflow: 'hidden',
    borderWidth: 0.4,
    borderColor: LOGO_BORDER,
  },
  bankName: {
    flex: 1,
    fontFamily: OttoFonts.semiBold,
    fontSize: 16,
    lineHeight: 26,
    color: OttoColors.textMid,
  },
  pressed: {
    opacity: 0.85,
  },
  emptyText: {
    ...OttoTypography.bodySmall,
    color: OttoColors.textSoft,
    textAlign: 'center',
    paddingVertical: 24,
  },
});
