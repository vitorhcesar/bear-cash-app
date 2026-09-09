import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ListRenderItem,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";

import {
  CATEGORY_GROUPS,
  type CategoryChild,
  type CategoryGroup,
} from "@/presentation/components/ui/activities-category-catalog";
import {
  CategoryChildIcon,
  CategoryParentIcon,
} from "@/presentation/components/ui/activities-category-icons";
import { FilterCheckboxOnIcon } from "@/presentation/components/ui/activities-filter-icons";
import { SearchIcon } from "@/presentation/components/ui/activities-icons";
import { BackButton } from "@/presentation/components/ui/back-button";
import {
  BearCashColors,
  BearCashFonts,
  BearCashTypography,
} from "@/presentation/constants/theme";

export type ActivitiesCategoriesSheetProps = {
  visible: boolean;
  selected: string[];
  onClose: () => void;
  onToggle: (id: string) => void;
};

type ListRow =
  | { key: string; kind: "parent"; group: CategoryGroup }
  | {
      key: string;
      kind: "child";
      group: CategoryGroup;
      item: CategoryChild;
      isFirst: boolean;
      isLast: boolean;
    };

const LIST_REVEAL_MS = 160;
const ROW_ENTER_MS = 280;
const ROW_STAGGER_MS = 36;
const ROW_STAGGER_MAX = 12;

function rowEntering(index: number, animate: boolean) {
  if (!animate) {
    return undefined;
  }

  return FadeInDown.duration(ROW_ENTER_MS)
    .delay(Math.min(index, ROW_STAGGER_MAX) * ROW_STAGGER_MS)
    .easing(Easing.out(Easing.cubic))
    .withInitialValues({
      opacity: 0,
      transform: [{ translateY: 10 }],
    });
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

function matchesQuery(label: string, query: string) {
  return label.toLowerCase().includes(query);
}

function flattenGroups(
  groups: { group: CategoryGroup; children: CategoryChild[] }[],
): ListRow[] {
  const rows: ListRow[] = [];

  for (const { group, children } of groups) {
    rows.push({ key: `parent-${group.id}`, kind: "parent", group });

    children.forEach((item, index) => {
      rows.push({
        key: `child-${item.id}`,
        kind: "child",
        group,
        item,
        isFirst: index === 0,
        isLast: index === children.length - 1,
      });
    });
  }

  return rows;
}

export function ActivitiesCategoriesHeader({ onClose }: { onClose: () => void }) {
  return (
    <Animated.View
      entering={FadeIn.duration(220).easing(Easing.out(Easing.cubic))}
      style={styles.header}
    >
      <BackButton onPress={onClose} />
      <Text style={styles.title}>Categorias</Text>
    </Animated.View>
  );
}

/** Category picker body — rendered inside the filters Modal (iOS cannot stack Modals). */
export function ActivitiesCategoriesSheet({
  visible,
  selected,
  onClose: _onClose,
  onToggle,
}: ActivitiesCategoriesSheetProps) {
  const [query, setQuery] = useState("");
  const [listReady, setListReady] = useState(false);
  const staggerRef = useRef(true);

  useEffect(() => {
    if (!visible) {
      setQuery("");
      setListReady(false);
      staggerRef.current = true;
      return;
    }

    const showList = setTimeout(() => {
      staggerRef.current = true;
      setListReady(true);
    }, LIST_REVEAL_MS);

    const endStagger = setTimeout(
      () => {
        staggerRef.current = false;
      },
      LIST_REVEAL_MS + ROW_STAGGER_MAX * ROW_STAGGER_MS + ROW_ENTER_MS,
    );

    return () => {
      clearTimeout(showList);
      clearTimeout(endStagger);
    };
  }, [visible]);

  const normalizedQuery = query.trim().toLowerCase();

  const rows = useMemo(() => {
    const groups = !normalizedQuery
      ? CATEGORY_GROUPS.map((group) => ({
          group,
          children: group.children,
        }))
      : CATEGORY_GROUPS.flatMap((group) => {
          const groupMatches = matchesQuery(group.label, normalizedQuery);
          const children = groupMatches
            ? group.children
            : group.children.filter((item) =>
                matchesQuery(item.label, normalizedQuery),
              );

          if (!groupMatches && children.length === 0) {
            return [];
          }

          return [{ group, children }];
        });

    return flattenGroups(groups);
  }, [normalizedQuery]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const renderItem = useCallback<ListRenderItem<ListRow>>(
    ({ item, index }) => {
      const entering = rowEntering(index, staggerRef.current);

      if (item.kind === "parent") {
        return (
          <ParentRow
            group={item.group}
            checked={selectedSet.has(item.group.id)}
            entering={entering}
            onToggle={onToggle}
          />
        );
      }

      return (
        <ChildRow
          group={item.group}
          item={item.item}
          checked={selectedSet.has(item.item.id)}
          isFirst={item.isFirst}
          isLast={item.isLast}
          entering={entering}
          onToggle={onToggle}
        />
      );
    },
    [onToggle, selectedSet],
  );

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.panel}>
      <View style={styles.searchField}>
        <SearchIcon size={16} />
        <TextInput
          style={styles.searchInput}
          placeholder="Procurar por categorias"
          placeholderTextColor={BearCashColors.textSoft}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      {listReady ? (
        <FlatList
          data={rows}
          extraData={selected}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={8}
          maxToRenderPerBatch={6}
          updateCellsBatchingPeriod={32}
          windowSize={7}
          removeClippedSubviews
        />
      ) : (
        <View style={styles.scroll} />
      )}
    </View>
  );
}

const ParentRow = memo(function ParentRow({
  group,
  checked,
  entering,
  onToggle,
}: {
  group: CategoryGroup;
  checked: boolean;
  entering?: ReturnType<typeof rowEntering>;
  onToggle: (id: string) => void;
}) {
  return (
    <Animated.View entering={entering}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        onPress={() => onToggle(group.id)}
        style={styles.parentRow}
      >
        <View style={styles.rowMain}>
          <CategoryParentIcon
            iconKey={group.parentIconKey}
            color={group.color}
          />
          <Text style={styles.parentLabel}>{group.label}</Text>
        </View>
        <Checkbox checked={checked} />
      </Pressable>
    </Animated.View>
  );
});

const ChildRow = memo(function ChildRow({
  group,
  item,
  checked,
  isFirst,
  isLast,
  entering,
  onToggle,
}: {
  group: CategoryGroup;
  item: CategoryChild;
  checked: boolean;
  isFirst: boolean;
  isLast: boolean;
  entering?: ReturnType<typeof rowEntering>;
  onToggle: (id: string) => void;
}) {
  return (
    <Animated.View entering={entering}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        onPress={() => onToggle(item.id)}
        style={[
          styles.childRow,
          isFirst && styles.childFirst,
          isLast && styles.childLast,
        ]}
      >
        <View style={styles.rowMain}>
          <CategoryChildIcon iconKey={item.iconKey} color={group.color} />
          <Text style={styles.childLabel}>{item.label}</Text>
        </View>
        <Checkbox checked={checked} />
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    gap: 16,
    marginHorizontal: -16,
    minHeight: 0,
  },
  header: {
    gap: 8,
  },
  title: {
    ...BearCashTypography.h1,
    color: BearCashColors.text,
  },
  searchField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: BearCashColors.borderSoft,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    ...BearCashTypography.body,
    color: BearCashColors.text,
    padding: 0,
  },
  scroll: {
    flex: 1,
    overflow: "hidden",
  },
  scrollContent: {
    paddingBottom: 8,
  },
  parentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: BearCashColors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  childRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  childFirst: {
    marginTop: 16,
  },
  childLast: {
    marginBottom: 24,
  },
  rowMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },
  parentLabel: {
    ...BearCashTypography.bodySmall,
    color: BearCashColors.textMid,
    fontFamily: BearCashFonts.semiBold,
    flex: 1,
  },
  childLabel: {
    ...BearCashTypography.bodySmall,
    color: BearCashColors.textSoft,
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
});
