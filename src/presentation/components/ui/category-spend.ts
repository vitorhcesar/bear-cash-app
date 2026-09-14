import type { TransactionItem } from "@/infra/http/services/api/modules/transactions.module";
import {
  CATEGORY_GROUPS,
  getCategoryDisplay,
  getCategoryGroup,
  getCategoryGroupLabel,
  resolveCategoryId,
} from "@/presentation/components/ui/activities-category-catalog";
import { BearCashColors } from "@/presentation/constants/theme";

export const CATEGORY_FIGMA_ACCENT: Record<string, string> = {
  FOOD_AND_DRINK: "#d47202",
  TRANSPORTATION: "#bc45bc",
  MEDICAL: "#42aeac",
  GENERAL_SERVICES: "#ceb138",
  ENTERTAINMENT: "#4c9bd8",
  TRAVEL: "#4c9bd8",
  GENERAL_MERCHANDISE: "#b7c623",
  RENT_AND_UTILITIES: "#3cb3c8",
  HOME_IMPROVEMENT: "#3cb3c8",
  PERSONAL_CARE: "#42aeac",
};

export function categoryAccentColor(id: string, fallback: string) {
  const resolved = resolveCategoryId(id);
  return CATEGORY_FIGMA_ACCENT[resolved] ?? fallback;
}

export function categoryListLabel(item: Pick<CategorySpend, "id" | "chipLabel">) {
  return item.chipLabel;
}

export type CategorySpend = {
  id: string;
  label: string;
  chipLabel: string;
  iconKey: string;
  color: string;
  amount: number;
};

export function inCalendarMonth(date: Date, year: number, month: number) {
  return date.getFullYear() === year && date.getMonth() === month;
}

export function summarizeCategorySpend(
  transactions: TransactionItem[],
  year: number,
  month: number,
): { total: number; items: CategorySpend[] } {
  const totals = new Map<string, CategorySpend>();

  for (const item of transactions) {
    if (item.hiddenFromTotals || item.type !== "DEBIT") {
      continue;
    }
    if (!inCalendarMonth(new Date(item.date), year, month)) {
      continue;
    }

    const display = item.categoryId
      ? getCategoryDisplay(item.categoryId)
      : undefined;
    const groupLabel =
      (item.categoryId
        ? getCategoryGroupLabel(item.categoryId)
        : undefined) ??
      item.category ??
      "Outros";
    const group = CATEGORY_GROUPS.find((entry) => entry.label === groupLabel);
    const key = group?.id ?? groupLabel;
    const current = totals.get(key);
    const amount = Math.abs(item.amount);

    if (current) {
      current.amount += amount;
      continue;
    }

    totals.set(key, {
      id: key,
      label: group?.label ?? groupLabel,
      chipLabel: group?.chipLabel ?? groupLabel,
      iconKey: group?.parentIconKey ?? display?.iconKey ?? "parent-food",
      color: group?.color ?? display?.color ?? BearCashColors.textMid,
      amount,
    });
  }

  const items = [...totals.values()].sort((a, b) => b.amount - a.amount);
  return {
    total: items.reduce((sum, item) => sum + item.amount, 0),
    items,
  };
}

export function transactionMatchesCategoryGroup(
  item: TransactionItem,
  groupId: string,
) {
  const resolvedGroupId = resolveCategoryId(groupId);
  const resolvedItemId = item.categoryId
    ? resolveCategoryId(item.categoryId)
    : "";
  const group =
    getCategoryGroup(resolvedGroupId) ??
    CATEGORY_GROUPS.find(
      (entry) =>
        entry.id === resolvedGroupId ||
        entry.label === groupId ||
        entry.chipLabel === groupId,
    );

  if (resolvedItemId) {
    if (resolvedItemId === resolvedGroupId || resolvedItemId === group?.id) {
      return true;
    }
    if (group?.children.some((child) => child.id === resolvedItemId)) {
      return true;
    }
  }

  const label = (item.category ?? "").trim().toLowerCase();
  if (!label) {
    return false;
  }
  if (group) {
    return (
      label === group.label.toLowerCase() ||
      label === group.chipLabel.toLowerCase() ||
      label.includes(group.chipLabel.toLowerCase())
    );
  }
  return label === groupId.toLowerCase();
}

export function categoryDebitTotal(
  transactions: TransactionItem[],
  groupId: string,
  year: number,
  month: number,
) {
  let total = 0;
  for (const item of transactions) {
    if (item.hiddenFromTotals || item.type !== "DEBIT") {
      continue;
    }
    if (!inCalendarMonth(new Date(item.date), year, month)) {
      continue;
    }
    if (!transactionMatchesCategoryGroup(item, groupId)) {
      continue;
    }
    total += Math.abs(item.amount);
  }
  return total;
}

export type SubcategorySpend = {
  id: string;
  label: string;
  iconKey: string;
  amount: number;
  percent: number;
  transactions: TransactionItem[];
};

export function summarizeSubcategorySpend(
  transactions: TransactionItem[],
  groupId: string,
  year: number,
  month: number,
): SubcategorySpend[] {
  const group = getCategoryGroup(groupId);
  if (!group) {
    return [];
  }

  const groupTotal = categoryDebitTotal(transactions, groupId, year, month);
  const buckets = new Map<string, TransactionItem[]>();

  for (const child of group.children) {
    buckets.set(child.id, []);
  }

  for (const item of transactions) {
    if (item.hiddenFromTotals || item.type !== "DEBIT") {
      continue;
    }
    if (!inCalendarMonth(new Date(item.date), year, month)) {
      continue;
    }
    const id = item.categoryId ? resolveCategoryId(item.categoryId) : "";
    const bucket = buckets.get(id);
    if (!bucket) {
      continue;
    }
    bucket.push(item);
  }

  return group.children
    .map((child) => {
      const items = (buckets.get(child.id) ?? []).sort(
        (left, right) =>
          new Date(right.date).getTime() - new Date(left.date).getTime(),
      );
      const amount = items.reduce(
        (sum, item) => sum + Math.abs(item.amount),
        0,
      );
      return {
        id: child.id,
        label: child.label,
        iconKey: child.iconKey,
        amount,
        percent: groupTotal > 0 ? (amount / groupTotal) * 100 : 0,
        transactions: items,
      };
    })
    .filter((item) => item.amount > 0)
    .sort((left, right) => right.amount - left.amount);
}
