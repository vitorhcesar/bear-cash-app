import { peekInstitutionsCache } from '@/infra/open-finance/institutions-cache';
import { BearCashMarkBadge } from '@/presentation/components/ui/figma-tab-icons';
import { InstitutionMark } from '@/presentation/components/ui/institution-mark';

function normalizeName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function logoUrlFromInstitutionsCache(bankName: string) {
  const items = peekInstitutionsCache()?.items ?? [];
  if (items.length === 0) {
    return null;
  }

  const normalized = normalizeName(bankName);
  const exact = items.find((item) => normalizeName(item.name) === normalized);
  if (exact?.logoUrl) {
    return exact.logoUrl;
  }

  const partial = items.find((item) => {
    const name = normalizeName(item.name);
    return name.includes(normalized) || normalized.includes(name);
  });
  return partial?.logoUrl ?? null;
}

export function TransactionBankBadge({
  bankName,
  bankCode,
  bankLogoUrl,
  source,
  size = 20,
}: {
  bankName: string | null;
  bankCode?: string | null;
  bankLogoUrl?: string | null;
  source?: 'MANUAL' | 'OPEN_FINANCE' | string | null;
  size?: number;
}) {
  const name = bankName?.trim() || '';
  const createdInBearCash = !source || source === 'MANUAL';
  const accountMissing = !name && !bankCode && !bankLogoUrl;

  if (createdInBearCash || accountMissing) {
    return <BearCashMarkBadge size={size} />;
  }

  return (
    <InstitutionMark
      name={name || bankCode || 'Banco'}
      logoUrl={bankLogoUrl || logoUrlFromInstitutionsCache(name)}
      size={size}
    />
  );
}
