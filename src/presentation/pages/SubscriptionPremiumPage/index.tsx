import {
  SubscriptionOfferScreen,
  type SubscriptionOfferContent,
} from '@/presentation/components/ui/subscription-offer-screen';
import { OttoColors } from '@/presentation/constants/theme';

const PLAN_BADGE = '#2FB70D';

const PREMIUM_CONTENT = {
  hero: require('@/assets/images/subscription/hero-premium.png'),
  heroLabel: 'Otto Premium',
  title: 'Conheça o Otto Premium',
  titleColor: OttoColors.premiumGold,
  subtitle:
    'Recursos exclusivos, prioridade total e o melhor da plataforma ao seu alcance.',
  accent: OttoColors.premiumGold,
  ctaLabel: 'Testar grátis por 14 dias',
  ctaColor: OttoColors.premiumGold,
  yearly: {
    title: 'Anual',
    description: 'Melhor custo benefício - R$ 718,80 (cobrança única)',
    price: '59,90',
    strikethrough: 'R$ 69,90',
    badge: '-14%',
    badgeColor: OttoColors.premiumGold,
  },
  monthly: {
    title: 'Mensal',
    description: 'Flexível, cancele o plano quando quiser',
    price: '69,90',
    badge: 'Padrão',
    badgeColor: PLAN_BADGE,
  },
  features: [
    'Mensagens ilimitadas por dia',
    'Conecte até 15 contas bancárias',
    'Relatórios financeiros detalhados mensais',
    'Suporte prioritário 24/7',
    'Agentes inteligentes personalizados',
    'Exportação de dados em PDF e Excel',
    'Cancele quando quiser',
  ],
  reviews: [
    {
      id: '1',
      title: 'A melhor decisão para minhas finanças',
      body: 'O Otto Premium mudou minha relação com o dinheiro. O suporte 24/7 e os relatórios em PDF são simplesmente fantásticos e muito práticos.',
      author: 'Gabriel Silveira',
      place: 'São Paulo',
    },
  ],
} satisfies SubscriptionOfferContent;

export function SubscriptionPremiumPage() {
  return <SubscriptionOfferScreen content={PREMIUM_CONTENT} />;
}
