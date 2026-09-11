import {
  SubscriptionOfferScreen,
  type SubscriptionOfferContent,
} from '@/presentation/components/ui/subscription-offer-screen';
import { BearCashColors } from '@/presentation/constants/theme';

const PRO_ACCENT = '#B385E0';
const PRO_BADGE = '#BF99E5';
const PRO_CTA = '#CCADEB';

const PRO_CONTENT = {
  hero: require('@/assets/images/subscription/hero-paws.png'),
  heroLabel: 'BearCash Pro',
  title: 'Conheça o BearCash Pro',
  titleColor: BearCashColors.text,
  subtitle:
    'Mais bancos, respostas ilimitadas e mais clareza sobre seu dinheiro',
  accent: PRO_ACCENT,
  ctaLabel: 'Testar grátis por 7 dias',
  ctaColor: PRO_CTA,
  yearly: {
    title: 'Anual',
    description: 'Melhor custo benefício - R$ 399,45 (cobrança única)',
    price: '33,33',
    strikethrough: 'R$ 45,00',
    badge: '-15%',
    badgeColor: PRO_BADGE,
  },
  monthly: {
    title: 'Mensal',
    description: 'Flexível, cancele o plano quando quiser',
    price: '33,33',
    badge: '-15%',
    badgeColor: PRO_BADGE,
  },
  features: [
    'Até 100 mensagens por dia;',
    'Conecte até 5 contas bancárias',
    'Veja onde seu dinheiro foi nos últimos meses',
    'Identifique gastos que passaram despercebidos',
    'Agentes que te avisam antes de ser tarde',
    'Cancele quando quiser',
  ],
  reviews: [],
} satisfies SubscriptionOfferContent;

export function SubscriptionProPage() {
  return <SubscriptionOfferScreen content={PRO_CONTENT} />;
}
