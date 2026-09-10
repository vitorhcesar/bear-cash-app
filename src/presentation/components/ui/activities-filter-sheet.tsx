import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { Easing, FadeInLeft, FadeInRight } from "react-native-reanimated";

import {
  ActivitiesCategoriesHeader,
  ActivitiesCategoriesSheet,
} from "@/presentation/components/ui/activities-categories-sheet";
import {
  FILTER_CATEGORY_CHIPS,
  getCategoryGroup,
  getCategoryLabel,
  type CategoryGroupId,
} from "@/presentation/components/ui/activities-category-catalog";
import { CategoryChipIcon } from "@/presentation/components/ui/activities-category-icons";
import {
  FilterCalendarIcon,
  FilterCheckboxOnIcon,
  FilterChevronIcon,
  FilterChipCloseIcon,
} from "@/presentation/components/ui/activities-filter-icons";
import { Button } from "@/presentation/components/ui/button";
import { InstitutionMark } from "@/presentation/components/ui/institution-mark";
import { Sheet } from "@/presentation/components/ui/sheet";
import {
  BearCashColors,
  BearCashFonts,
  BearCashTypography,
} from "@/presentation/constants/theme";

const PERIODS = [
  { id: "today", label: "Hoje" },
  { id: "yesterday", label: "Ontem" },
  { id: "7d", label: "Últimos 7 dias" },
  { id: "15d", label: "Últimos 15 dias" },
  { id: "current-month", label: "Mês atual" },
  { id: "last-month", label: "Mês passado" },
  { id: "6m", label: "Últimos 6 meses" },
  { id: "year", label: "Último ano" },
  { id: "custom", label: "Personalizado", icon: true },
] as const;

const SORTS = [
  { id: "newest", label: "Mais recentes" },
  { id: "oldest", label: "Mais antigas" },
  { id: "highest", label: "Maior valor" },
  { id: "lowest", label: "Menor valor" },
] as const;

const FALLBACK_BANKS = [
  { id: "santander", label: "Santander" },
  { id: "bb", label: "Banco do Brasil" },
  { id: "nubank", label: "Nubank" },
] as const;

export type PeriodId = (typeof PERIODS)[number]["id"];
export type SortId = (typeof SORTS)[number]["id"];
export type BankId = string;
export type CategoryId = CategoryGroupId;

export type ActivitiesBankOption = {
  id: string;
  label: string;
  logoUrl?: string | null;
};

export type ActivitiesFilters = {
  period: PeriodId;
  banks: BankId[];
  categories: string[];
  sort: SortId;
  showHidden: boolean;
};

export const DEFAULT_ACTIVITIES_FILTERS: ActivitiesFilters = {
  period: "current-month",
  banks: [],
  categories: [],
  sort: "newest",
  showHidden: false,
};

export type ActivitiesFilterSheetProps = {
  visible: boolean;
  value: ActivitiesFilters;
  banks?: ActivitiesBankOption[];
  onClose: () => void;
  onApply: (filters: ActivitiesFilters) => void;
};

function Chip({
  label,
  selected,
  onPress,
  icon,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      {icon}
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <View style={styles.checkboxOuter} accessibilityState={{ checked }}>
      {checked ? (
        <FilterCheckboxOnIcon size={20} />
      ) : (
        <View style={styles.checkboxBox}>
          <View style={styles.checkboxInner} />
        </View>
      )}
    </View>
  );
}

function RemovableChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Remover filtro ${label}`}
      onPress={onRemove}
      style={styles.selectedChip}
    >
      <Text style={styles.selectedChipText}>{label}</Text>
      <FilterChipCloseIcon size={12} />
    </Pressable>
  );
}

function BankMark({ bank }: { bank: ActivitiesBankOption }) {
  return <InstitutionMark name={bank.label} logoUrl={bank.logoUrl} size={24} />;
}

function FilterToggle({
  value,
  onValueChange,
}: {
  value: boolean;
  onValueChange: (next: boolean) => void;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      style={[styles.toggleTrack, value && styles.toggleTrackOn]}
    >
      <View style={[styles.toggleThumb, value && styles.toggleThumbOn]} />
    </Pressable>
  );
}

export function ActivitiesFilterSheet({
  visible,
  value,
  banks,
  onClose,
  onApply,
}: ActivitiesFilterSheetProps) {
  const { height } = useWindowDimensions();
  const [draft, setDraft] = useState<ActivitiesFilters>(value);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const didOpenCategories = useRef(false);

  const handleOpen = useCallback(() => {
    setDraft(value);
    setCategoriesOpen(false);
    didOpenCategories.current = false;
  }, [value]);

  const bankOptions = useMemo<ActivitiesBankOption[]>(
    () =>
      banks && banks.length > 0
        ? banks
        : FALLBACK_BANKS.map((bank) => ({ id: bank.id, label: bank.label })),
    [banks],
  );

  const categoryChips = useMemo(
    () =>
      FILTER_CATEGORY_CHIPS.map((id) => {
        const group = getCategoryGroup(id);
        return {
          id,
          label: group?.chipLabel ?? id,
          color: group?.color ?? BearCashColors.textMid,
          iconKey: group?.parentIconKey ?? "parent-food",
        };
      }),
    [],
  );

  function toggleBank(id: BankId) {
    setDraft((current) => {
      const selected = current.banks.includes(id);
      return {
        ...current,
        banks: selected
          ? current.banks.filter((bank) => bank !== id)
          : [...current.banks, id],
      };
    });
  }

  function handleClose() {
    setCategoriesOpen(false);
    onClose();
  }

  const toggleCategory = useCallback((id: string) => {
    setDraft((current) => {
      const selected = current.categories.includes(id);
      return {
        ...current,
        categories: selected
          ? current.categories.filter((category) => category !== id)
          : [...current.categories, id],
      };
    });
  }, []);

  const selectedChips = useMemo(() => {
    const chips: {
      key: string;
      label: string;
      kind: "bank" | "hidden" | "sort" | "category" | "period";
      id?: string;
    }[] = [];

    for (const bankId of draft.banks) {
      const bank = bankOptions.find((item) => item.id === bankId);
      if (bank) {
        chips.push({
          key: `bank-${bank.id}`,
          label: bank.label,
          kind: "bank",
          id: bank.id,
        });
      }
    }

    if (draft.showHidden) {
      chips.push({
        key: "showHidden",
        label: "Mostrar ocultos",
        kind: "hidden",
      });
    }

    if (draft.sort !== "newest") {
      const sort = SORTS.find((item) => item.id === draft.sort);
      if (sort) {
        chips.push({ key: "sort", label: sort.label, kind: "sort" });
      }
    }

    for (const categoryId of draft.categories) {
      const label = getCategoryLabel(categoryId);
      if (label) {
        chips.push({
          key: `category-${categoryId}`,
          label,
          kind: "category",
          id: categoryId,
        });
      }
    }

    if (draft.period !== "current-month") {
      const period = PERIODS.find((item) => item.id === draft.period);
      if (period) {
        chips.push({ key: "period", label: period.label, kind: "period" });
      }
    }

    return chips;
  }, [draft, bankOptions]);

  function removeSelectedChip(chip: (typeof selectedChips)[number]) {
    if (chip.kind === "bank" && chip.id) {
      toggleBank(chip.id as BankId);
      return;
    }
    if (chip.kind === "category" && chip.id) {
      toggleCategory(chip.id);
      return;
    }
    if (chip.kind === "hidden") {
      setDraft((current) => ({ ...current, showHidden: false }));
      return;
    }
    if (chip.kind === "sort") {
      setDraft((current) => ({ ...current, sort: "newest" }));
      return;
    }
    setDraft((current) => ({ ...current, period: "current-month" }));
  }

  return (
      <Sheet
        visible={visible}
        onClose={categoriesOpen ? () => setCategoriesOpen(false) : handleClose}
        onOpen={handleOpen}
        title={categoriesOpen ? undefined : "Filtros"}
        header={
          categoriesOpen ? (
            <ActivitiesCategoriesHeader
              onClose={() => setCategoriesOpen(false)}
            />
          ) : undefined
        }
        showCloseButton={!categoriesOpen}
        animateLayout
        contentStyle={[
          styles.sheet,
          categoriesOpen
            ? { height: height * 0.92 }
            : { maxHeight: height * 0.92 },
        ]}
      >
      {categoriesOpen ? (
        <Animated.View
          key="categories"
          entering={FadeInRight.duration(280).easing(Easing.out(Easing.cubic))}
          style={styles.categoriesBody}
        >
          <ActivitiesCategoriesSheet
            visible={categoriesOpen}
            selected={draft.categories}
            onClose={() => setCategoriesOpen(false)}
            onToggle={toggleCategory}
          />
        </Animated.View>
      ) : (
      <Animated.View
        key="filters"
        entering={
          didOpenCategories.current
            ? FadeInLeft.duration(260).easing(Easing.out(Easing.cubic))
            : undefined
        }
      >
      <ScrollView
        style={[styles.scroll, { maxHeight: height * 0.92 - 88 }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {selectedChips.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Filtros selecionados</Text>
            <View style={styles.chipWrap}>
              {selectedChips.map((chip) => (
                <RemovableChip
                  key={chip.key}
                  label={chip.label}
                  onRemove={() => removeSelectedChip(chip)}
                />
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Período</Text>
          <View style={styles.chipWrap}>
            {PERIODS.map((period) => (
              <Chip
                key={period.id}
                label={period.label}
                selected={draft.period === period.id}
                onPress={() =>
                  setDraft((current) => ({ ...current, period: period.id }))
                }
                icon={
                  "icon" in period && period.icon ? (
                    <FilterCalendarIcon size={12} />
                  ) : undefined
                }
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bancos</Text>
          <View style={styles.bankList}>
            {bankOptions.map((bank) => {
              const checked = draft.banks.includes(bank.id);
              return (
                <Pressable
                  key={bank.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked }}
                  onPress={() => toggleBank(bank.id)}
                  style={styles.bankRow}
                >
                  <Checkbox checked={checked} />
                  <BankMark bank={bank} />
                  <Text style={styles.bankLabel}>{bank.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categorias</Text>
          <View style={styles.chipWrap}>
            {categoryChips.map((category) => {
              const selected = draft.categories.includes(category.id);
              return (
                <Chip
                  key={category.id}
                  label={category.label}
                  selected={selected}
                  onPress={() => toggleCategory(category.id)}
                  icon={
                    <CategoryChipIcon
                      iconKey={category.iconKey}
                      color={
                        selected
                          ? BearCashColors.buttonFilledText
                          : category.color
                      }
                      size={12}
                    />
                  }
                />
              );
            })}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              didOpenCategories.current = true;
              setCategoriesOpen(true);
            }}
            style={styles.ghostRow}
          >
            <Text style={styles.ghostLabel}>Mostrar mais</Text>
            <FilterChevronIcon size={12} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ordenar por</Text>
          <View style={styles.chipWrap}>
            {SORTS.map((sort) => (
              <Chip
                key={sort.id}
                label={sort.label}
                selected={draft.sort === sort.id}
                onPress={() =>
                  setDraft((current) => ({ ...current, sort: sort.id }))
                }
              />
            ))}
          </View>
        </View>

        <View style={styles.toggleCard}>
          <View style={styles.toggleCopy}>
            <Text style={styles.toggleTitle}>Mostrar ocultos</Text>
            <Text style={styles.toggleDescription}>
              Exibe transações ocultadas no extrato
            </Text>
          </View>
          <FilterToggle
            value={draft.showHidden}
            onValueChange={(showHidden) =>
              setDraft((current) => ({ ...current, showHidden }))
            }
          />
        </View>

        <View style={styles.footer}>
          <Button
            label="Mostrar resultados"
            onPress={() => {
              onApply(draft);
              handleClose();
            }}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => setDraft(DEFAULT_ACTIVITIES_FILTERS)}
            style={[styles.ghostRow, styles.ghostCentered]}
          >
            <Text style={styles.ghostLabel}>Limpar filtros</Text>
          </Pressable>
        </View>
      </ScrollView>
      </Animated.View>
      )}
      </Sheet>
  );
}

const styles = StyleSheet.create({
  sheet: {
    paddingHorizontal: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  categoriesBody: {
    flex: 1,
    minHeight: 0,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    gap: 24,
    paddingBottom: 8,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    ...BearCashTypography.bodySmall,
    color: BearCashColors.text,
    fontFamily: BearCashFonts.semiBold,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 40,
    backgroundColor: BearCashColors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 34,
  },
  chipSelected: {
    backgroundColor: BearCashColors.text,
  },
  chipText: {
    ...BearCashTypography.bodySmall,
    color: BearCashColors.textMid,
    lineHeight: 22,
  },
  chipTextSelected: {
    color: BearCashColors.buttonFilledText,
  },
  selectedChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 40,
    backgroundColor: BearCashColors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 34,
  },
  selectedChipText: {
    ...BearCashTypography.bodySmall,
    color: BearCashColors.textMid,
    lineHeight: 22,
  },
  bankList: {
    gap: 12,
  },
  bankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bankLabel: {
    ...BearCashTypography.bodySmall,
    color: BearCashColors.textMid,
    flex: 1,
  },
  checkboxOuter: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: BearCashColors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxInner: {
    width: 13,
    height: 13,
    borderRadius: 2.6,
    backgroundColor: BearCashColors.background,
  },
  ghostRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
  },
  ghostCentered: {
    alignSelf: "center",
  },
  ghostLabel: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
  },
  toggleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
    padding: 12,
    borderRadius: 12,
  },
  toggleCopy: {
    flex: 1,
    gap: 2,
  },
  toggleTitle: {
    ...BearCashTypography.body,
    color: BearCashColors.text,
    fontFamily: BearCashFonts.semiBold,
  },
  toggleDescription: {
    ...BearCashTypography.bodySmall,
    color: BearCashColors.textSoft,
  },
  toggleTrack: {
    width: 32,
    height: 20,
    borderRadius: 10,
    backgroundColor: BearCashColors.borderStrong,
    padding: 2,
    justifyContent: "center",
  },
  toggleTrackOn: {
    backgroundColor: BearCashColors.primary,
  },
  toggleThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: BearCashColors.text,
  },
  toggleThumbOn: {
    alignSelf: "flex-end",
  },
  footer: {
    alignItems: "center",
    gap: 16,
  },
});
