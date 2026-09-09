import {
  SubscriptionOfferScreen,
  type SubscriptionOfferContent,
} from '@/presentation/components/ui/subscription-offer-screen';
import { BearCashColors } from '@/presentation/constants/theme';

const PLAN_BADGE = '#2FB70D';

const PRO_CONTENT = {
  hero: require('@/assets/images/subscription/hero-paws.png'),
  heroLabel: 'BearCash Pro',
  title: 'Conheça o BearCash Pro',
  titleColor: BearCashColors.text,
  subtitle:
    'Mais bancos, respostas ilimitadas e mais clareza sobre seu dinheiro',
  accent: BearCashColors.primarySoft,
  ctaLabel: 'Testar grátis por 7 dias',
  ctaColor: BearCashColors.primary,
  yearly: {
    title: 'Anual',
    description: 'Melhor custo benefício - R$ 399,45 (cobrança única)',
    price: '33,33',
    strikethrough: 'R$ 45,45',
    badge: '-15%',
    badgeColor: PLAN_BADGE,
  },
  monthly: {
    title: 'Mensal',
    description: 'Flexível, cancele o plano quando quiser',
    price: '33,33',
    badge: '-15%',
    badgeColor: PLAN_BADGE,
  },
  features: [
    'Até 100 mensagens por dia;',
    'Conecte até 5 contas bancárias',
    'Veja onde seu dinheiro foi nos últimos meses',
    'Identifique gastos que passaram despercebidos',
    'Agentes que te avisam antes de ser tarde',
    'Cancele quando quiser',
  ],
  reviews: [
    {
      id: '1',
      title: 'Planejamento financeiro ficou muito mais simples',
      body: 'Sempre tive dificuldade para organizar minhas despesas, mas o aplicativo tornou tudo muito mais fácil.',
      author: 'Paulo Gustavo',
      place: 'Paraná',
    },
    {
      id: '2',
      title: 'Planejamento financeiro ficou muito mais simples',
      body: 'Sempre tive dificuldade para organizar minhas despesas, mas o aplicativo tornou tudo muito mais fácil.',
      author: 'Paulo Gustavo',
      place: 'Paraná',
    },
    {
      id: '3',
      title: 'Planejamento financeiro ficou muito mais simples',
      body: 'Sempre tive dificuldade para organizar minhas despesas, mas o aplicativo tornou tudo muito mais fácil.',
      author: 'Paulo Gustavo',
      place: 'Paraná',
    },
  ],
} satisfies SubscriptionOfferContent;

export function SubscriptionProPage() {
  return <SubscriptionOfferScreen content={PRO_CONTENT} />;
}
