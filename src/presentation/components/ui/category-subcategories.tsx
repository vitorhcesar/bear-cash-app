import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { TransactionItem } from "@/infra/http/services/api/modules/transactions.module";
import { CategoriesChevronIcon } from "@/presentation/components/ui/categories-icons";
import { CategoryPercentDonut } from "@/presentation/components/ui/category-percent-donut";
import { getCurrencySymbol } from "@/presentation/components/ui/currencies";
import { HighlightCardBorder } from "@/presentation/components/ui/highlight-card-border";
import { TransactionListItem } from "@/presentation/components/ui/transaction-list-item";
import type { SubcategorySpend } from "@/presentation/components/ui/category-spend";
import {
  BearCashColors,
  BearCashFonts,
  BearCashTypography,
} from "@/presentation/constants/theme";

const PREVIEW_LIMIT = 5;

function formatAmount(amount: number) {
  return Math.abs(amount).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function CategorySubcategories({
  items,
  accent,
  groupLabel,
  onOpenTransaction,
  onSeeAll,
}: {
  items: SubcategorySpend[];
  accent: string;
  groupLabel: string;
  onOpenTransaction: (item: TransactionItem) => void;
  onSeeAll: (categoryId: string) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  const signature = items.map((item) => item.id).join("|");

  useEffect(() => {
    setOpenId(signature ? signature.split("|")[0] : null);
  }, [signature]);

  if (items.length === 0) {
    return (
      <Text style={styles.empty}>
        Nenhuma subcategoria com gastos neste mês
      </Text>
    );
  }

  return (
    <View style={styles.list}>
      {items.map((item) => {
        const expanded = item.id === openId;
        return (
          <View
            key={item.id}
            style={[styles.shell, expanded && styles.shellOpen]}
          >
            {expanded ? <HighlightCardBorder /> : null}
            <View style={styles.inner}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                onPress={() =>
                  setOpenId((current) => (current === item.id ? null : item.id))
                }
                style={({ pressed }) => [
                  styles.header,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.headerMain}>
                  <CategoryPercentDonut percent={item.percent} color={accent} />
                  <View style={styles.copy}>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.label}
                    </Text>
                    <View style={styles.amountRow}>
                      <Text style={styles.coin}>
                        {getCurrencySymbol("BRL")}
                      </Text>
                      <Text style={styles.amount}>
                        {formatAmount(item.amount)}
                      </Text>
                    </View>
                  </View>
                </View>
                <View
                  style={{
                    transform: [{ rotate: expanded ? "-90deg" : "90deg" }],
                  }}
                >
                  <CategoriesChevronIcon
                    size={28}
                    color={BearCashColors.textMid}
                  />
                </View>
              </Pressable>
              {expanded ? (
                <View style={styles.body}>
                  {item.transactions.slice(0, PREVIEW_LIMIT).map((tx) => (
                    <TransactionListItem
                      key={tx.id}
                      item={tx}
                      leading="mark"
                      iconKey={item.iconKey}
                      iconColor={accent}
                      categoryLabel={groupLabel}
                      onPress={() => onOpenTransaction(tx)}
                    />
                  ))}
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => onSeeAll(item.id)}
                    style={({ pressed }) => [
                      styles.seeAll,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.seeAllLabel}>
                      Ver todas as transações
                    </Text>
                    <CategoriesChevronIcon
                      size={16}
                      color={BearCashColors.textMid}
                    />
                  </Pressable>
                </View>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 16,
  },
  shell: {
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: BearCashColors.surface,
  },
  shellOpen: {
    padding: 1,
    backgroundColor: "transparent",
  },
  inner: {
    backgroundColor: BearCashColors.surface,
    borderRadius: 10,
    padding: 12,
    gap: 16,
  },
  pressed: {
    opacity: 0.85,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  headerMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    ...BearCashTypography.caption,
    color: BearCashColors.textMid,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  coin: {
    fontFamily: BearCashFonts.semiBold,
    fontSize: 10,
    lineHeight: 16,
    color: BearCashColors.text,
  },
  amount: {
    ...BearCashTypography.subheading,
    color: BearCashColors.text,
  },
  body: {
    gap: 10,
  },
  seeAll: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 4,
  },
  seeAllLabel: {
    ...BearCashTypography.caption,
    color: BearCashColors.textMid,
  },
  empty: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
  },
});
