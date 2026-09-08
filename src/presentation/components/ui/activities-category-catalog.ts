export type CategoryGroupId =
  | "food"
  | "shopping"
  | "education"
  | "health"
  | "digital"
  | "transport"
  | "housing"
  | "leisure"
  | "betting"
  | "finance"
  | "income"
  | "insurance"
  | "donations";

export type CategoryChild = {
  id: string;
  label: string;
  iconKey: string;
};

export type CategoryGroup = {
  id: CategoryGroupId;
  label: string;
  chipLabel: string;
  color: string;
  parentIconKey: string;
  children: CategoryChild[];
};

function child(id: string, label: string, iconKey: string): CategoryChild {
  return { id, label, iconKey };
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: "food",
    label: "Alimentação",
    chipLabel: "Alimentação",
    color: "#e57830",
    parentIconKey: "parent-food",
    children: [
      child("food-supermarket", "Supermercado", "child-supermarket"),
      child("food-drinks", "Bebidas", "child-drinks"),
      child(
        "food-restaurants",
        "Restaurantes, lanchonetes e padarias",
        "child-restaurants",
      ),
      child("food-delivery", "Delivery de alimentos", "child-delivery"),
    ],
  },
  {
    id: "shopping",
    label: "Compras",
    chipLabel: "Compras",
    color: "#d062cf",
    parentIconKey: "parent-shopping",
    children: [
      child("shopping-online", "Compras online", "child-online"),
      child("shopping-electronics", "Eletrônicos", "child-electronics"),
      child("shopping-pets", "Pet Shops e Veterinários", "child-pets"),
      child("shopping-clothing", "Vestuário", "child-clothing"),
      child("shopping-beauty", "Produtos de beleza", "child-beauty"),
      child("shopping-kids", "Artigos infantis", "child-kids"),
      child("shopping-bookstore", "Livraria", "child-bookstore"),
      child("shopping-sports", "Artigos esportivos", "child-sports"),
      child("shopping-stationery", "Papelaria", "child-stationery"),
      child("shopping-refund", "Reembolso", "child-refund"),
    ],
  },
  {
    id: "education",
    label: "Educação",
    chipLabel: "Educação",
    color: "#ceb138",
    parentIconKey: "parent-education",
    children: [
      child("education-online", "Cursos online", "child-education"),
      child("education-university", "Universidade", "child-education"),
      child("education-school", "Escola", "child-education"),
      child("education-daycare", "Creche", "child-education"),
    ],
  },
  {
    id: "health",
    label: "Saúde e Bem-Estar",
    chipLabel: "Saúde",
    color: "#209d5e",
    parentIconKey: "parent-health",
    children: [
      child("health-wellness", "Bem-Estar", "child-wellness"),
      child("health-gym", "Academia e centros de lazer", "child-gym"),
      child("health-sport", "Prática de Esporte", "child-sport-practice"),
      child("health-dentist", "Dentista", "child-dentist"),
      child("health-optical", "Ótica", "child-optical"),
      child(
        "health-hospitals",
        "Hospitais, clínicas e laboratórios",
        "child-dentist",
      ),
      child("health-meds", "Medicações", "child-dentist"),
    ],
  },
  {
    id: "digital",
    label: "Serviços Digitais",
    chipLabel: "Serviços digitais",
    color: "#8a78e0",
    parentIconKey: "parent-digital",
    children: [
      child("digital-games", "Jogos e Videogames", "child-games"),
      child("digital-streaming-video", "Streaming de vídeo", "child-streaming"),
      child(
        "digital-streaming-audio",
        "Streaming de áudio",
        "child-streaming-audio",
      ),
    ],
  },
  {
    id: "transport",
    label: "Transporte",
    chipLabel: "Transporte",
    color: "#ac8d5b",
    parentIconKey: "parent-transport",
    children: [
      child("transport-taxi", "Táxi e transporte privado urbano", "child-taxi"),
      child("transport-public", "Transporte público", "child-taxi"),
      child("transport-car-rental", "Aluguel de veículos", "child-auto"),
      child(
        "transport-bike-rental",
        "Aluguel de bicicleta e patins",
        "child-bike",
      ),
      child("transport-auto-services", "Serviços automotivos", "child-auto"),
      child("transport-gas", "Posto de gasolina", "child-auto"),
      child("transport-parking", "Estacionamento", "child-auto"),
      child(
        "transport-tolls",
        "Pedágios e pagamentos no veículos",
        "child-taxes",
      ),
      child("transport-fines", "Multas e trânsito", "child-taxes"),
      child("transport-maintenance", "Manutenção de veículos", "child-auto"),
      child("transport-taxes", "Taxas e impostos", "child-taxes"),
    ],
  },
  {
    id: "housing",
    label: "Moradia",
    chipLabel: "Moradia",
    color: "#3cb3c8",
    parentIconKey: "parent-housing",
    children: [
      child("housing-rent", "Aluguel", "child-rent"),
      child("housing-water", "Água", "child-water"),
      child("housing-electricity", "Eletricidade", "child-water"),
      child("housing-gas", "Gás", "child-water"),
      child("housing-utensils", "Utensílios de casa", "child-rent"),
      child("housing-tax", "Impostos sobre moradia", "child-housing-tax"),
      child("housing-internet", "Internet", "child-phone"),
      child("housing-phone", "Celular", "child-phone"),
      child("housing-tv", "Televisão", "child-tv"),
      child("housing-maintenance", "Manutenção", "child-rent"),
    ],
  },
  {
    id: "leisure",
    label: "Lazer e entretenimento",
    chipLabel: "Lazer e entretenimento",
    color: "#3e95fa",
    parentIconKey: "parent-leisure",
    children: [
      child("leisure-travel", "Viagens", "child-travel"),
      child("leisure-airports", "Aeroportos e Cias. Aéreas", "child-airports"),
      child("leisure-passages", "Passagens", "child-passages"),
      child("leisure-tickets", "Bilhetes", "child-tickets"),
      child("leisure-mileage", "Programa de Milhagem", "child-mileage"),
      child("leisure-stadiums", "Estádios e Arenas", "child-stadiums"),
      child("leisure-museums", "Museus e pontos turísticos", "child-museums"),
      child("leisure-cinema", "Cinema, teatro e concertos", "child-cinema"),
    ],
  },
  {
    id: "betting",
    label: "Apostas",
    chipLabel: "Apostas",
    color: "#cd4648",
    parentIconKey: "parent-betting",
    children: [
      child("betting-bets", "Apostas", "child-betting"),
      child("betting-lottery", "Loteria", "child-betting"),
      child("betting-online", "BET online", "child-betting"),
    ],
  },
  {
    id: "finance",
    label: "Finanças",
    chipLabel: "Finanças",
    color: "#bffd5d",
    parentIconKey: "parent-finance",
    children: [
      child("finance-investments", "Investimentos", "child-finance"),
      child(
        "finance-auto-investments",
        "Investimentos automáticos",
        "child-finance",
      ),
      child("finance-fixed-income", "Renda Fixa", "child-finance"),
      child("finance-multimarket", "Fundos multimercado", "child-finance"),
      child("finance-variable-income", "Renda variável", "child-finance"),
      child("finance-margin", "Ajuste de margem", "child-finance"),
      child(
        "finance-dividends",
        "Juro de rendimentos de dividendos",
        "child-finance",
      ),
      child("finance-pension", "Pensão", "child-finance"),
      child(
        "finance-same-holder",
        "Transferência mesma titularidade",
        "child-finance",
      ),
      child("finance-same-holder-cash", "Dinheiro", "child-finance"),
      child("finance-same-holder-pix", "PIX", "child-finance"),
      child("finance-same-holder-ted", "TED", "child-finance"),
      child("finance-transfers", "Transferências", "child-finance"),
      child("finance-transfer-boleto", "Boleto", "child-finance"),
      child("finance-transfer-cash", "Dinheiro", "child-finance"),
      child("finance-transfer-check", "Cheque", "child-finance"),
      child("finance-transfer-doc", "DOC", "child-finance"),
      child("finance-transfer-fx", "Câmbio", "child-finance"),
      child("finance-transfer-same-bank", "Mesma instituição", "child-finance"),
      child("finance-transfer-pix", "PIX", "child-finance"),
      child("finance-transfer-ted", "TED", "child-finance"),
      child(
        "finance-third-party",
        "Transferência para terceiros",
        "child-finance",
      ),
      child("finance-third-boleto", "Boleto", "child-finance"),
      child("finance-third-debit", "Débito", "child-finance"),
      child("finance-third-doc", "DOC", "child-finance"),
      child("finance-third-pix", "PIX", "child-finance"),
      child("finance-third-ted", "TED", "child-finance"),
      child(
        "finance-credit-card",
        "Pagamento de cartão de crédito",
        "child-finance",
      ),
      child("finance-invoice", "Parcela da fatura", "child-finance"),
      child(
        "finance-loans-financing",
        "Empréstimos e financiamentos",
        "child-finance",
      ),
      child(
        "finance-overdraft",
        "Custos de cheque especial e atrasos",
        "child-finance",
      ),
      child("finance-interest", "Juros cobrados", "child-finance"),
      child("finance-financing", "Financiamento", "child-finance"),
      child("finance-home-loan", "Financiamento imobiliário", "child-finance"),
      child("finance-auto-loan", "Financiamento de veículos", "child-finance"),
      child("finance-student-loan", "Empréstimo estudantil", "child-finance"),
      child("finance-loans", "Empréstimos", "child-finance"),
      child("finance-legal", "Obrigações legais", "child-finance"),
      child("finance-alimony", "Pensão alimentícia", "child-finance"),
    ],
  },
  {
    id: "income",
    label: "Renda",
    chipLabel: "Renda",
    color: "#2fb70d",
    parentIconKey: "parent-income",
    children: [
      child("income-salary", "Salário", "child-income"),
      child("income-retirement", "Aposentadoria", "child-income"),
      child("income-entrepreneur", "Empreendedorismo", "child-income"),
      child("income-aid", "Auxílio governamental", "child-income"),
      child("income-non-recurring", "Renda não-recorrente", "child-income"),
    ],
  },
  {
    id: "insurance",
    label: "Seguros",
    chipLabel: "Seguros",
    color: "#c6b5e4",
    parentIconKey: "parent-insurance",
    children: [
      child("insurance-life", "Seguro de vida", "child-insurance"),
      child("insurance-home", "Seguro residencial", "child-insurance"),
      child("insurance-health", "Seguro de saúde", "child-insurance"),
      child("insurance-auto", "Seguro de veículos", "child-insurance"),
    ],
  },
  {
    id: "donations",
    label: "Doações",
    chipLabel: "Doações",
    color: "#f7d1ef",
    parentIconKey: "parent-donations",
    children: [
      child("donations-online", "Doações online", "child-donations"),
      child("donations-in-person", "Doações presencial", "child-donations"),
    ],
  },
];

export const FILTER_CATEGORY_CHIPS = [
  "food",
  "shopping",
  "health",
  "housing",
  "digital",
  "transport",
  "education",
  "leisure",
  "betting",
] as const satisfies readonly CategoryGroupId[];

const GROUP_BY_ID = new Map(
  CATEGORY_GROUPS.map((group) => [group.id, group] as const),
);

const LABEL_BY_ID = new Map<string, string>();

for (const group of CATEGORY_GROUPS) {
  LABEL_BY_ID.set(group.id, group.chipLabel);
  for (const item of group.children) {
    LABEL_BY_ID.set(item.id, item.label);
  }
}

export function getCategoryGroup(id: string): CategoryGroup | undefined {
  return GROUP_BY_ID.get(id as CategoryGroupId);
}

export function getCategoryLabel(id: string): string | undefined {
  return LABEL_BY_ID.get(id);
}

export function getCategoryGroupLabel(id: string): string | undefined {
  const group = GROUP_BY_ID.get(id as CategoryGroupId);
  if (group) {
    return group.label;
  }

  for (const itemGroup of CATEGORY_GROUPS) {
    if (itemGroup.children.some((child) => child.id === id)) {
      return itemGroup.label;
    }
  }

  return undefined;
}

export type CategoryDisplay = {
  id: string;
  label: string;
  iconKey: string;
  color: string;
};

export function getCategoryDisplay(id: string): CategoryDisplay | undefined {
  const group = GROUP_BY_ID.get(id as CategoryGroupId);
  if (group) {
    return {
      id: group.id,
      label: group.label,
      iconKey: group.parentIconKey,
      color: group.color,
    };
  }

  for (const itemGroup of CATEGORY_GROUPS) {
    const item = itemGroup.children.find((child) => child.id === id);
    if (item) {
      return {
        id: item.id,
        label: item.label,
        iconKey: item.iconKey,
        color: itemGroup.color,
      };
    }
  }

  return undefined;
}

export function isFilterCategoryChip(id: string): id is CategoryGroupId {
  return (FILTER_CATEGORY_CHIPS as readonly string[]).includes(id);
}
