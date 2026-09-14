import type { TransactionItem } from '@/infra/http/services/api/modules/transactions.module';
import {
  getCategoryGroupLabel,
  getCategoryLabel,
} from '@/presentation/components/ui/activities-category-catalog';

function normalizeDescription(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function descriptionKey(item: TransactionItem) {
  return normalizeDescription(item.descriptionRaw || item.description);
}

export function isSimilarTransaction(
  current: TransactionItem,
  candidate: TransactionItem,
) {
  if (candidate.id === current.id) {
    return false;
  }

  const needle = descriptionKey(current);
  if (!needle) {
    return false;
  }

  return descriptionKey(candidate) === needle;
}

export function filterSimilarTransactions(
  current: TransactionItem,
  items: TransactionItem[],
) {
  return items
    .filter((candidate) => isSimilarTransaction(current, candidate))
    .sort(
      (left, right) =>
        new Date(right.date).getTime() - new Date(left.date).getTime(),
    );
}

export function countSimilarTransactions(
  current: TransactionItem,
  items: TransactionItem[],
) {
  return filterSimilarTransactions(current, items).length;
}

export function similarCategorySubtitle(item: TransactionItem) {
  if (!item.categoryId) {
    return item.category?.trim() || 'Sem categoria';
  }

  const group = getCategoryGroupLabel(item.categoryId);
  const label = getCategoryLabel(item.categoryId);
  if (group && label && group !== label) {
    return `${group} — ${label}`;
  }

  return group ?? label ?? item.category ?? 'Sem categoria';
}
