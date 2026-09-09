import {
  BancoDoBrasilLogo,
  C6Logo,
  CaixaLogo,
  ItauLogo,
  NubankLogo,
  SantanderLogo,
} from '@/presentation/components/ui/bank-logos';
import { BearCashMarkBadge } from '@/presentation/components/ui/figma-tab-icons';

export function TransactionBankBadge({
  bankName,
  bankCode,
  size = 20,
}: {
  bankName: string | null;
  bankCode: string | null;
  size?: number;
}) {
  const key = `${bankCode ?? ''} ${bankName ?? ''}`.toLowerCase();

  if (key.includes('nubank')) {
    return <NubankLogo size={size} />;
  }
  if (key.includes('itaú') || key.includes('itau')) {
    return <ItauLogo size={size} />;
  }
  if (key.includes('caixa')) {
    return <CaixaLogo size={size} />;
  }
  if (key.includes('c6')) {
    return <C6Logo size={size} />;
  }
  if (key.includes('brasil')) {
    return <BancoDoBrasilLogo size={size} />;
  }
  if (key.includes('santander')) {
    return <SantanderLogo size={size} />;
  }

  return <BearCashMarkBadge size={size} />;
}
