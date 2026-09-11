import {
  SubscriptionOfferScreen,
  type SubscriptionOfferContent,
} from "@/presentation/components/ui/subscription-offer-screen";
import { BearCashColors } from "@/presentation/constants/theme";

const PREMIUM_ACCENT = "#B385E0";
const PREMIUM_BADGE = "#BF99E5";
const PREMIUM_CTA = "#CCADEB";

const PREMIUM_CONTENT = {
  hero: require("@/assets/images/subscription/hero-premium.png"),
  heroLabel: "BearCash Premium",
  title: "Conheça o BearCash Premium",
  titleColor: BearCashColors.text,
  subtitle:
    "Recursos exclusivos, prioridade total e o melhor da plataforma ao seu alcance.",
  accent: PREMIUM_ACCENT,
  ctaLabel: "Testar grátis por 7 dias",
  ctaColor: PREMIUM_CTA,
  yearly: {
    title: "Anual",
    description: "Melhor custo benefício - R$ 718,80 (cobrança única)",
    price: "59,90",
    strikethrough: "R$ 69,90",
    badge: "-14%",
    badgeColor: PREMIUM_BADGE,
  },
  monthly: {
    title: "Mensal",
    description: "Flexível, cancele o plano quando quiser",
    price: "69,90",
    badge: "Padrão",
    badgeColor: PREMIUM_BADGE,
  },
  features: [
    "Mensagens ilimitadas por dia",
    "Conecte até 15 contas bancárias",
    "Relatórios financeiros detalhados mensais",
    "Suporte prioritário 24/7",
    "Agentes inteligentes personalizados",
    "Exportação de dados em PDF e Excel",
    "Cancele quando quiser",
  ],
  reviews: [],
} satisfies SubscriptionOfferContent;

export function SubscriptionPremiumPage() {
  return <SubscriptionOfferScreen content={PREMIUM_CONTENT} />;
}
