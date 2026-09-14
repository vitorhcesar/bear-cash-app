/**
 * Transaction category catalog aligned to Polp Celcoin taxonomy
 * (GET /categories — `{ ref, description, parent_id }`).
 * Icons are reused from the closest previous BearCash category.
 * @see https://polp.com.br/docs/celcoin/categories
 */

export type CategoryGroupId =
  | "INCOME"
  | "TRANSFER_IN"
  | "TRANSFER_OUT"
  | "LOAN_DISBURSEMENTS"
  | "LOAN_PAYMENTS"
  | "BANK_FEES"
  | "ENTERTAINMENT"
  | "FOOD_AND_DRINK"
  | "GENERAL_MERCHANDISE"
  | "HOME_IMPROVEMENT"
  | "MEDICAL"
  | "PERSONAL_CARE"
  | "GENERAL_SERVICES"
  | "GOVERNMENT_AND_NON_PROFIT"
  | "TRANSPORTATION"
  | "TRAVEL"
  | "RENT_AND_UTILITIES"
  | "OTHER";

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
    id: "FOOD_AND_DRINK",
    label: "Alimentação e bebidas",
    chipLabel: "Alimentação",
    color: "#e57830",
    parentIconKey: "parent-food",
    children: [
      child(
        "FOOD_AND_DRINK_BEER_WINE_AND_LIQUOR",
        "Bebidas alcoólicas",
        "child-drinks",
      ),
      child("FOOD_AND_DRINK_COFFEE", "Cafeterias", "child-drinks"),
      child(
        "FOOD_AND_DRINK_FAST_FOOD",
        "Fast food e lanches",
        "child-delivery",
      ),
      child(
        "FOOD_AND_DRINK_GROCERIES",
        "Supermercado e mercearia",
        "child-supermarket",
      ),
      child("FOOD_AND_DRINK_RESTAURANT", "Restaurantes", "child-restaurants"),
      child(
        "FOOD_AND_DRINK_VENDING_MACHINES",
        "Máquinas de autoatendimento",
        "child-delivery",
      ),
      child(
        "FOOD_AND_DRINK_OTHER_FOOD_AND_DRINK",
        "Outras despesas com alimentação",
        "parent-food",
      ),
    ],
  },
  {
    id: "GENERAL_MERCHANDISE",
    label: "Compras e mercadorias",
    chipLabel: "Compras",
    color: "#d062cf",
    parentIconKey: "parent-shopping",
    children: [
      child(
        "GENERAL_MERCHANDISE_BOOKSTORES_AND_NEWSSTANDS",
        "Livrarias e bancas",
        "child-bookstore",
      ),
      child(
        "GENERAL_MERCHANDISE_CLOTHING_AND_ACCESSORIES",
        "Roupas e acessórios",
        "child-clothing",
      ),
      child(
        "GENERAL_MERCHANDISE_CONVENIENCE_STORES",
        "Lojas de conveniência",
        "child-supermarket",
      ),
      child(
        "GENERAL_MERCHANDISE_DEPARTMENT_STORES",
        "Lojas de departamento",
        "parent-shopping",
      ),
      child(
        "GENERAL_MERCHANDISE_DISCOUNT_STORES",
        "Lojas de desconto e variedades",
        "parent-shopping",
      ),
      child("GENERAL_MERCHANDISE_ELECTRONICS", "Eletrônicos", "child-electronics"),
      child(
        "GENERAL_MERCHANDISE_GIFTS_AND_NOVELTIES",
        "Presentes e novidades",
        "parent-shopping",
      ),
      child(
        "GENERAL_MERCHANDISE_OFFICE_SUPPLIES",
        "Material de escritório",
        "child-stationery",
      ),
      child(
        "GENERAL_MERCHANDISE_ONLINE_MARKETPLACES",
        "Marketplaces e compras online",
        "child-online",
      ),
      child(
        "GENERAL_MERCHANDISE_PET_SUPPLIES",
        "Produtos para pets",
        "child-pets",
      ),
      child(
        "GENERAL_MERCHANDISE_SPORTING_GOODS",
        "Artigos esportivos",
        "child-sports",
      ),
      child(
        "GENERAL_MERCHANDISE_SUPERSTORES",
        "Hipermercados e atacarejos",
        "child-supermarket",
      ),
      child(
        "GENERAL_MERCHANDISE_TOBACCO_AND_VAPE",
        "Tabaco e cigarros eletrônicos",
        "parent-shopping",
      ),
      child(
        "GENERAL_MERCHANDISE_OTHER_GENERAL_MERCHANDISE",
        "Outras compras e mercadorias",
        "parent-shopping",
      ),
    ],
  },
  {
    id: "MEDICAL",
    label: "Saúde",
    chipLabel: "Saúde",
    color: "#209d5e",
    parentIconKey: "parent-health",
    children: [
      child("MEDICAL_DENTAL_CARE", "Dentista", "child-dentist"),
      child("MEDICAL_EYE_CARE", "Oftalmologia e ótica", "child-optical"),
      child(
        "MEDICAL_NURSING_CARE",
        "Cuidados de enfermagem e cuidadores",
        "child-wellness",
      ),
      child(
        "MEDICAL_PHARMACIES_AND_SUPPLEMENTS",
        "Farmácias e suplementos",
        "child-dentist",
      ),
      child(
        "MEDICAL_PRIMARY_CARE",
        "Consultas e atendimento médico",
        "parent-health",
      ),
      child(
        "MEDICAL_VETERINARY_SERVICES",
        "Serviços veterinários",
        "child-pets",
      ),
      child("MEDICAL_OTHER_MEDICAL", "Outras despesas de saúde", "parent-health"),
    ],
  },
  {
    id: "PERSONAL_CARE",
    label: "Cuidados pessoais",
    chipLabel: "Cuidados pessoais",
    color: "#42aeac",
    parentIconKey: "parent-health",
    children: [
      child(
        "PERSONAL_CARE_GYMS_AND_FITNESS_CENTERS",
        "Academias e centros de fitness",
        "child-gym",
      ),
      child(
        "PERSONAL_CARE_HAIR_AND_BEAUTY",
        "Cabelo e beleza",
        "child-beauty",
      ),
      child("PERSONAL_CARE_LAUNDRY_AND_DRY_CLEANING", "Lavanderia", "child-rent"),
      child(
        "PERSONAL_CARE_OTHER_PERSONAL_CARE",
        "Outros cuidados pessoais",
        "child-wellness",
      ),
    ],
  },
  {
    id: "RENT_AND_UTILITIES",
    label: "Aluguel e contas",
    chipLabel: "Moradia",
    color: "#3cb3c8",
    parentIconKey: "parent-housing",
    children: [
      child(
        "RENT_AND_UTILITIES_GAS_AND_ELECTRICITY",
        "Gás e energia elétrica",
        "child-water",
      ),
      child(
        "RENT_AND_UTILITIES_INTERNET_AND_CABLE",
        "Internet e TV a cabo",
        "child-tv",
      ),
      child("RENT_AND_UTILITIES_RENT", "Aluguel", "child-rent"),
      child(
        "RENT_AND_UTILITIES_SEWAGE_AND_WASTE_MANAGEMENT",
        "Esgoto e coleta de lixo",
        "child-water",
      ),
      child("RENT_AND_UTILITIES_TELEPHONE", "Telefone", "child-phone"),
      child("RENT_AND_UTILITIES_WATER", "Água", "child-water"),
      child(
        "RENT_AND_UTILITIES_OTHER_UTILITIES",
        "Outras contas e serviços",
        "parent-housing",
      ),
    ],
  },
  {
    id: "HOME_IMPROVEMENT",
    label: "Casa e reformas",
    chipLabel: "Casa",
    color: "#3cb3c8",
    parentIconKey: "parent-housing",
    children: [
      child("HOME_IMPROVEMENT_FURNITURE", "Móveis", "child-rent"),
      child(
        "HOME_IMPROVEMENT_HARDWARE",
        "Materiais de construção e ferragens",
        "child-rent",
      ),
      child(
        "HOME_IMPROVEMENT_REPAIR_AND_MAINTENANCE",
        "Reparos e manutenção",
        "child-rent",
      ),
      child("HOME_IMPROVEMENT_SECURITY", "Segurança residencial", "child-housing-tax"),
      child(
        "HOME_IMPROVEMENT_OTHER_HOME_IMPROVEMENT",
        "Outras despesas com a casa",
        "parent-housing",
      ),
    ],
  },
  {
    id: "ENTERTAINMENT",
    label: "Entretenimento",
    chipLabel: "Entretenimento",
    color: "#3e95fa",
    parentIconKey: "parent-leisure",
    children: [
      child(
        "ENTERTAINMENT_CASINOS_AND_GAMBLING",
        "Cassinos e apostas",
        "child-betting",
      ),
      child(
        "ENTERTAINMENT_MUSIC_AND_AUDIO",
        "Música e áudio (streaming, shows)",
        "child-streaming-audio",
      ),
      child(
        "ENTERTAINMENT_SPORTING_EVENTS_AMUSEMENT_PARKS_AND_MUSEUMS",
        "Eventos esportivos, parques e museus",
        "child-stadiums",
      ),
      child(
        "ENTERTAINMENT_TV_AND_MOVIES",
        "TV e filmes (streaming, cinema)",
        "child-cinema",
      ),
      child("ENTERTAINMENT_VIDEO_GAMES", "Jogos eletrônicos", "child-games"),
      child(
        "ENTERTAINMENT_OTHER_ENTERTAINMENT",
        "Outros entretenimentos",
        "parent-leisure",
      ),
    ],
  },
  {
    id: "TRAVEL",
    label: "Viagens",
    chipLabel: "Viagens",
    color: "#4c9bd8",
    parentIconKey: "parent-leisure",
    children: [
      child("TRAVEL_FLIGHTS", "Passagens aéreas", "child-airports"),
      child("TRAVEL_LODGING", "Hospedagem", "child-travel"),
      child("TRAVEL_RENTAL_CARS", "Aluguel de carros", "child-auto"),
      child("TRAVEL_OTHER_TRAVEL", "Outras despesas de viagem", "child-travel"),
    ],
  },
  {
    id: "TRANSPORTATION",
    label: "Transporte",
    chipLabel: "Transporte",
    color: "#ac8d5b",
    parentIconKey: "parent-transport",
    children: [
      child(
        "TRANSPORTATION_BIKES_AND_SCOOTERS",
        "Bicicletas e patinetes",
        "child-bike",
      ),
      child("TRANSPORTATION_GAS", "Combustível", "child-auto"),
      child("TRANSPORTATION_PARKING", "Estacionamento", "child-auto"),
      child(
        "TRANSPORTATION_PUBLIC_TRANSIT",
        "Transporte público",
        "child-taxi",
      ),
      child(
        "TRANSPORTATION_TAXIS_AND_RIDE_SHARES",
        "Táxi e aplicativos de transporte",
        "child-taxi",
      ),
      child("TRANSPORTATION_TOLLS", "Pedágios", "child-taxes"),
      child(
        "TRANSPORTATION_OTHER_TRANSPORTATION",
        "Outras despesas de transporte",
        "parent-transport",
      ),
    ],
  },
  {
    id: "GENERAL_SERVICES",
    label: "Serviços gerais",
    chipLabel: "Serviços",
    color: "#ceb138",
    parentIconKey: "parent-education",
    children: [
      child(
        "GENERAL_SERVICES_ACCOUNTING_AND_FINANCIAL_PLANNING",
        "Contabilidade e planejamento financeiro",
        "child-finance",
      ),
      child("GENERAL_SERVICES_AUTOMOTIVE", "Serviços automotivos", "child-auto"),
      child(
        "GENERAL_SERVICES_CHILDCARE",
        "Creche e cuidado infantil",
        "child-education",
      ),
      child(
        "GENERAL_SERVICES_CONSULTING_AND_LEGAL",
        "Consultoria e serviços jurídicos",
        "child-finance",
      ),
      child(
        "GENERAL_SERVICES_EDUCATION",
        "Educação (escola, faculdade, cursos)",
        "child-education",
      ),
      child("GENERAL_SERVICES_INSURANCE", "Seguros", "child-insurance"),
      child(
        "GENERAL_SERVICES_POSTAGE_AND_SHIPPING",
        "Correios e fretes",
        "child-stationery",
      ),
      child("GENERAL_SERVICES_STORAGE", "Armazenamento e guarda-móveis", "child-rent"),
      child(
        "GENERAL_SERVICES_OTHER_GENERAL_SERVICES",
        "Outros serviços gerais",
        "parent-education",
      ),
    ],
  },
  {
    id: "GOVERNMENT_AND_NON_PROFIT",
    label: "Governo e doações",
    chipLabel: "Doações",
    color: "#f7d1ef",
    parentIconKey: "parent-donations",
    children: [
      child(
        "GOVERNMENT_AND_NON_PROFIT_DONATIONS",
        "Doações e contribuições",
        "child-donations",
      ),
      child(
        "GOVERNMENT_AND_NON_PROFIT_GOVERNMENT_DEPARTMENTS_AND_AGENCIES",
        "Órgãos e taxas governamentais",
        "child-taxes",
      ),
      child(
        "GOVERNMENT_AND_NON_PROFIT_TAX_PAYMENT",
        "Pagamento de impostos",
        "child-housing-tax",
      ),
      child(
        "GOVERNMENT_AND_NON_PROFIT_OTHER_GOVERNMENT_AND_NON_PROFIT",
        "Outras despesas com governo e doações",
        "parent-donations",
      ),
    ],
  },
  {
    id: "INCOME",
    label: "Receitas",
    chipLabel: "Receitas",
    color: "#2fb70d",
    parentIconKey: "parent-income",
    children: [
      child(
        "INCOME_CHILD_SUPPORT",
        "Pensão alimentícia recebida (determinada judicialmente)",
        "child-income",
      ),
      child(
        "INCOME_CONTRACTOR",
        "Renda de trabalho autônomo ou freelance",
        "child-income",
      ),
      child("INCOME_DIVIDENDS", "Dividendos de investimentos", "child-finance"),
      child(
        "INCOME_GIG_ECONOMY",
        "Renda de aplicativos e economia gig (Uber, 99, iFood etc.)",
        "child-income",
      ),
      child(
        "INCOME_INTEREST_EARNED",
        "Juros recebidos de contas e poupança",
        "child-finance",
      ),
      child(
        "INCOME_LONG_TERM_DISABILITY",
        "Auxílio por incapacidade ou invalidez",
        "child-income",
      ),
      child("INCOME_MILITARY", "Renda militar e benefícios de veteranos", "child-income"),
      child("INCOME_RENTAL", "Renda de aluguéis e locações", "child-rent"),
      child(
        "INCOME_RETIREMENT_PENSION",
        "Aposentadoria e pensão (INSS e previdência)",
        "child-income",
      ),
      child("INCOME_SALARY", "Salário e ordenados", "child-income"),
      child("INCOME_TAX_REFUND", "Restituição de imposto", "child-income"),
      child(
        "INCOME_UNEMPLOYMENT",
        "Seguro-desemprego e benefícios afins",
        "child-income",
      ),
      child("INCOME_OTHER", "Outras receitas", "parent-income"),
    ],
  },
  {
    id: "TRANSFER_IN",
    label: "Transferências recebidas",
    chipLabel: "Entradas",
    color: "#bffd5d",
    parentIconKey: "parent-finance",
    children: [
      child(
        "TRANSFER_IN_ACCOUNT_TRANSFER",
        "Transferência recebida entre contas próprias",
        "child-finance",
      ),
      child(
        "TRANSFER_IN_DEPOSIT",
        "Depósito recebido (dinheiro, cheque ou caixa eletrônico)",
        "child-finance",
      ),
      child(
        "TRANSFER_IN_INVESTMENT_AND_RETIREMENT_FUNDS",
        "Resgate de investimentos e previdência",
        "child-finance",
      ),
      child("TRANSFER_IN_SAVINGS", "Resgate de poupança", "child-finance"),
      child(
        "TRANSFER_IN_TRANSFER_IN_FROM_APPS",
        "Transferência recebida via apps (PIX, carteiras digitais)",
        "child-finance",
      ),
      child(
        "TRANSFER_IN_WIRE",
        "Transferência bancária recebida (TED/DOC)",
        "child-finance",
      ),
      child(
        "TRANSFER_IN_OTHER_TRANSFER_IN",
        "Outras transferências recebidas",
        "parent-finance",
      ),
    ],
  },
  {
    id: "TRANSFER_OUT",
    label: "Transferências enviadas",
    chipLabel: "Transferências",
    color: "#bffd5d",
    parentIconKey: "parent-finance",
    children: [
      child(
        "TRANSFER_OUT_ACCOUNT_TRANSFER",
        "Transferência enviada entre contas próprias",
        "child-finance",
      ),
      child(
        "TRANSFER_OUT_CRYPTO",
        "Transferência para corretoras de criptomoedas",
        "child-finance",
      ),
      child(
        "TRANSFER_OUT_INVESTMENT_AND_RETIREMENT_FUNDS",
        "Aporte em investimentos e previdência",
        "child-finance",
      ),
      child("TRANSFER_OUT_SAVINGS", "Depósito em poupança", "child-finance"),
      child(
        "TRANSFER_OUT_TRANSFER_OUT_FROM_APPS",
        "Transferência enviada via apps (PIX, carteiras digitais)",
        "child-finance",
      ),
      child(
        "TRANSFER_OUT_WIRE",
        "Transferência bancária enviada (TED/DOC)",
        "child-finance",
      ),
      child("TRANSFER_OUT_WITHDRAWAL", "Saque", "child-finance"),
      child(
        "TRANSFER_OUT_OTHER_TRANSFER_OUT",
        "Outras transferências enviadas",
        "parent-finance",
      ),
    ],
  },
  {
    id: "LOAN_DISBURSEMENTS",
    label: "Empréstimos recebidos",
    chipLabel: "Empréstimos",
    color: "#bffd5d",
    parentIconKey: "parent-finance",
    children: [
      child(
        "LOAN_DISBURSEMENTS_AUTO",
        "Liberação de financiamento de veículo",
        "child-finance",
      ),
      child(
        "LOAN_DISBURSEMENTS_CASH_ADVANCES",
        "Adiantamento de dinheiro e empréstimo rápido",
        "child-finance",
      ),
      child("LOAN_DISBURSEMENTS_EWA", "Antecipação de salário", "child-income"),
      child(
        "LOAN_DISBURSEMENTS_MORTGAGE",
        "Liberação de financiamento imobiliário",
        "child-finance",
      ),
      child(
        "LOAN_DISBURSEMENTS_PERSONAL",
        "Liberação de empréstimo pessoal",
        "child-finance",
      ),
      child(
        "LOAN_DISBURSEMENTS_STUDENT",
        "Liberação de financiamento estudantil",
        "child-education",
      ),
      child(
        "LOAN_DISBURSEMENTS_OTHER_DISBURSEMENT",
        "Outros empréstimos recebidos",
        "parent-finance",
      ),
    ],
  },
  {
    id: "LOAN_PAYMENTS",
    label: "Pagamento de empréstimos",
    chipLabel: "Parcelas",
    color: "#bffd5d",
    parentIconKey: "parent-finance",
    children: [
      child(
        "LOAN_PAYMENTS_BNPL",
        "Pagamento de compra parcelada (compre agora, pague depois)",
        "child-finance",
      ),
      child(
        "LOAN_PAYMENTS_CAR_PAYMENT",
        "Parcela de financiamento de veículo",
        "child-finance",
      ),
      child(
        "LOAN_PAYMENTS_CASH_ADVANCES",
        "Pagamento de adiantamento de dinheiro",
        "child-finance",
      ),
      child(
        "LOAN_PAYMENTS_CREDIT_CARD_PAYMENT",
        "Pagamento de fatura de cartão de crédito",
        "child-finance",
      ),
      child(
        "LOAN_PAYMENTS_EWA",
        "Pagamento de antecipação de salário",
        "child-income",
      ),
      child(
        "LOAN_PAYMENTS_MORTGAGE_PAYMENT",
        "Parcela de financiamento imobiliário",
        "child-finance",
      ),
      child(
        "LOAN_PAYMENTS_PERSONAL_LOAN_PAYMENT",
        "Parcela de empréstimo pessoal",
        "child-finance",
      ),
      child(
        "LOAN_PAYMENTS_STUDENT_LOAN_PAYMENT",
        "Parcela de financiamento estudantil",
        "child-education",
      ),
      child(
        "LOAN_PAYMENTS_OTHER_PAYMENT",
        "Outros pagamentos de empréstimos",
        "parent-finance",
      ),
    ],
  },
  {
    id: "BANK_FEES",
    label: "Tarifas bancárias",
    chipLabel: "Tarifas",
    color: "#bffd5d",
    parentIconKey: "parent-finance",
    children: [
      child("BANK_FEES_ATM_FEES", "Tarifa de caixa eletrônico", "child-finance"),
      child(
        "BANK_FEES_INSUFFICIENT_FUNDS",
        "Tarifa por saldo insuficiente",
        "child-finance",
      ),
      child("BANK_FEES_INTEREST_CHARGE", "Cobrança de juros", "child-finance"),
      child(
        "BANK_FEES_FOREIGN_TRANSACTION_FEES",
        "Tarifa de transação internacional (IOF)",
        "child-finance",
      ),
      child("BANK_FEES_OVERDRAFT_FEES", "Tarifa de cheque especial", "child-finance"),
      child("BANK_FEES_LATE_FEES", "Multa por atraso", "child-taxes"),
      child(
        "BANK_FEES_CASH_ADVANCE",
        "Tarifa de saque com cartão de crédito",
        "child-finance",
      ),
      child("BANK_FEES_OTHER_BANK_FEES", "Outras tarifas bancárias", "parent-finance"),
    ],
  },
  {
    id: "OTHER",
    label: "Outros",
    chipLabel: "Outros",
    color: "#78737d",
    parentIconKey: "parent-finance",
    children: [
      child("OTHER_OTHER", "Não categorizado", "parent-finance"),
    ],
  },
];

export const FILTER_CATEGORY_CHIPS = [
  "FOOD_AND_DRINK",
  "GENERAL_MERCHANDISE",
  "MEDICAL",
  "RENT_AND_UTILITIES",
  "ENTERTAINMENT",
  "TRANSPORTATION",
  "GENERAL_SERVICES",
  "TRAVEL",
  "PERSONAL_CARE",
] as const satisfies readonly CategoryGroupId[];

/**
 * Old BearCash ids that still match a Polp category (same meaning or clearly similar).
 * Invented ids with no Polp counterpart are not aliased.
 */
const LEGACY_CATEGORY_IDS: Record<string, string> = {
  food: "FOOD_AND_DRINK",
  "food-supermarket": "FOOD_AND_DRINK_GROCERIES",
  "food-drinks": "FOOD_AND_DRINK_BEER_WINE_AND_LIQUOR",
  "food-restaurants": "FOOD_AND_DRINK_RESTAURANT",
  shopping: "GENERAL_MERCHANDISE",
  "shopping-online": "GENERAL_MERCHANDISE_ONLINE_MARKETPLACES",
  "shopping-electronics": "GENERAL_MERCHANDISE_ELECTRONICS",
  "shopping-pets": "GENERAL_MERCHANDISE_PET_SUPPLIES",
  "shopping-clothing": "GENERAL_MERCHANDISE_CLOTHING_AND_ACCESSORIES",
  "shopping-beauty": "PERSONAL_CARE_HAIR_AND_BEAUTY",
  "shopping-bookstore": "GENERAL_MERCHANDISE_BOOKSTORES_AND_NEWSSTANDS",
  "shopping-sports": "GENERAL_MERCHANDISE_SPORTING_GOODS",
  "shopping-stationery": "GENERAL_MERCHANDISE_OFFICE_SUPPLIES",
  education: "GENERAL_SERVICES_EDUCATION",
  "education-online": "GENERAL_SERVICES_EDUCATION",
  "education-university": "GENERAL_SERVICES_EDUCATION",
  "education-school": "GENERAL_SERVICES_EDUCATION",
  "education-daycare": "GENERAL_SERVICES_CHILDCARE",
  health: "MEDICAL",
  "health-gym": "PERSONAL_CARE_GYMS_AND_FITNESS_CENTERS",
  "health-dentist": "MEDICAL_DENTAL_CARE",
  "health-optical": "MEDICAL_EYE_CARE",
  "health-hospitals": "MEDICAL_PRIMARY_CARE",
  "health-meds": "MEDICAL_PHARMACIES_AND_SUPPLEMENTS",
  "digital-games": "ENTERTAINMENT_VIDEO_GAMES",
  "digital-streaming-video": "ENTERTAINMENT_TV_AND_MOVIES",
  "digital-streaming-audio": "ENTERTAINMENT_MUSIC_AND_AUDIO",
  transport: "TRANSPORTATION",
  "transport-taxi": "TRANSPORTATION_TAXIS_AND_RIDE_SHARES",
  "transport-public": "TRANSPORTATION_PUBLIC_TRANSIT",
  "transport-car-rental": "TRAVEL_RENTAL_CARS",
  "transport-bike-rental": "TRANSPORTATION_BIKES_AND_SCOOTERS",
  "transport-auto-services": "GENERAL_SERVICES_AUTOMOTIVE",
  "transport-gas": "TRANSPORTATION_GAS",
  "transport-parking": "TRANSPORTATION_PARKING",
  "transport-tolls": "TRANSPORTATION_TOLLS",
  "transport-maintenance": "GENERAL_SERVICES_AUTOMOTIVE",
  "transport-taxes": "GOVERNMENT_AND_NON_PROFIT_TAX_PAYMENT",
  housing: "RENT_AND_UTILITIES",
  "housing-rent": "RENT_AND_UTILITIES_RENT",
  "housing-water": "RENT_AND_UTILITIES_WATER",
  "housing-electricity": "RENT_AND_UTILITIES_GAS_AND_ELECTRICITY",
  "housing-gas": "RENT_AND_UTILITIES_GAS_AND_ELECTRICITY",
  "housing-tax": "GOVERNMENT_AND_NON_PROFIT_TAX_PAYMENT",
  "housing-internet": "RENT_AND_UTILITIES_INTERNET_AND_CABLE",
  "housing-phone": "RENT_AND_UTILITIES_TELEPHONE",
  "housing-tv": "RENT_AND_UTILITIES_INTERNET_AND_CABLE",
  "housing-maintenance": "HOME_IMPROVEMENT_REPAIR_AND_MAINTENANCE",
  leisure: "ENTERTAINMENT",
  "leisure-travel": "TRAVEL",
  "leisure-airports": "TRAVEL_FLIGHTS",
  "leisure-passages": "TRAVEL_FLIGHTS",
  "leisure-stadiums": "ENTERTAINMENT_SPORTING_EVENTS_AMUSEMENT_PARKS_AND_MUSEUMS",
  "leisure-museums": "ENTERTAINMENT_SPORTING_EVENTS_AMUSEMENT_PARKS_AND_MUSEUMS",
  "leisure-cinema": "ENTERTAINMENT_TV_AND_MOVIES",
  betting: "ENTERTAINMENT_CASINOS_AND_GAMBLING",
  "betting-bets": "ENTERTAINMENT_CASINOS_AND_GAMBLING",
  "betting-lottery": "ENTERTAINMENT_CASINOS_AND_GAMBLING",
  "betting-online": "ENTERTAINMENT_CASINOS_AND_GAMBLING",
  "finance-investments": "TRANSFER_OUT_INVESTMENT_AND_RETIREMENT_FUNDS",
  "finance-dividends": "INCOME_DIVIDENDS",
  "finance-pension": "INCOME_RETIREMENT_PENSION",
  "finance-same-holder": "TRANSFER_OUT_ACCOUNT_TRANSFER",
  "finance-same-holder-pix": "TRANSFER_OUT_TRANSFER_OUT_FROM_APPS",
  "finance-same-holder-ted": "TRANSFER_OUT_WIRE",
  "finance-transfers": "TRANSFER_OUT",
  "finance-transfer-cash": "TRANSFER_OUT_WITHDRAWAL",
  "finance-transfer-pix": "TRANSFER_OUT_TRANSFER_OUT_FROM_APPS",
  "finance-transfer-ted": "TRANSFER_OUT_WIRE",
  "finance-third-pix": "TRANSFER_OUT_TRANSFER_OUT_FROM_APPS",
  "finance-third-ted": "TRANSFER_OUT_WIRE",
  "finance-credit-card": "LOAN_PAYMENTS_CREDIT_CARD_PAYMENT",
  "finance-invoice": "LOAN_PAYMENTS_CREDIT_CARD_PAYMENT",
  "finance-overdraft": "BANK_FEES_OVERDRAFT_FEES",
  "finance-interest": "BANK_FEES_INTEREST_CHARGE",
  "finance-home-loan": "LOAN_PAYMENTS_MORTGAGE_PAYMENT",
  "finance-auto-loan": "LOAN_PAYMENTS_CAR_PAYMENT",
  "finance-student-loan": "LOAN_PAYMENTS_STUDENT_LOAN_PAYMENT",
  "finance-loans": "LOAN_PAYMENTS_PERSONAL_LOAN_PAYMENT",
  income: "INCOME",
  "income-salary": "INCOME_SALARY",
  "income-retirement": "INCOME_RETIREMENT_PENSION",
  "income-entrepreneur": "INCOME_CONTRACTOR",
  insurance: "GENERAL_SERVICES_INSURANCE",
  "insurance-life": "GENERAL_SERVICES_INSURANCE",
  "insurance-home": "GENERAL_SERVICES_INSURANCE",
  "insurance-health": "GENERAL_SERVICES_INSURANCE",
  "insurance-auto": "GENERAL_SERVICES_INSURANCE",
  donations: "GOVERNMENT_AND_NON_PROFIT_DONATIONS",
  "donations-online": "GOVERNMENT_AND_NON_PROFIT_DONATIONS",
  "donations-in-person": "GOVERNMENT_AND_NON_PROFIT_DONATIONS",
};

export function resolveCategoryId(id: string) {
  return LEGACY_CATEGORY_IDS[id] ?? id;
}

/** Toggle a category in a multi-select: parents also select/deselect every child. */
export function toggleCategorySelection(selected: string[], id: string) {
  const next = new Set(selected);
  const group = GROUP_BY_ID.get(resolveCategoryId(id) as CategoryGroupId);

  if (group) {
    const ids = [group.id, ...group.children.map((child) => child.id)];
    const allOn = ids.every((item) => next.has(item));
    for (const item of ids) {
      if (allOn) {
        next.delete(item);
      } else {
        next.add(item);
      }
    }
    return [...next];
  }

  const resolved = resolveCategoryId(id);
  const parent = CATEGORY_GROUPS.find((item) =>
    item.children.some((child) => child.id === resolved),
  );

  if (next.has(resolved) || next.has(id)) {
    next.delete(resolved);
    next.delete(id);
    if (parent) {
      next.delete(parent.id);
    }
  } else {
    next.add(resolved);
    if (
      parent &&
      parent.children.every((child) => next.has(child.id))
    ) {
      next.add(parent.id);
    }
  }

  return [...next];
}

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
  return GROUP_BY_ID.get(resolveCategoryId(id) as CategoryGroupId);
}

export function getCategoryLabel(id: string): string | undefined {
  return LABEL_BY_ID.get(resolveCategoryId(id));
}

export function getCategoryGroupLabel(id: string): string | undefined {
  const resolved = resolveCategoryId(id);
  const group = GROUP_BY_ID.get(resolved as CategoryGroupId);
  if (group) {
    return group.label;
  }

  for (const itemGroup of CATEGORY_GROUPS) {
    if (itemGroup.children.some((child) => child.id === resolved)) {
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
  const resolved = resolveCategoryId(id);
  const group = GROUP_BY_ID.get(resolved as CategoryGroupId);
  if (group) {
    return {
      id: group.id,
      label: group.label,
      iconKey: group.parentIconKey,
      color: group.color,
    };
  }

  for (const itemGroup of CATEGORY_GROUPS) {
    const item = itemGroup.children.find((child) => child.id === resolved);
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
  return (FILTER_CATEGORY_CHIPS as readonly string[]).includes(
    resolveCategoryId(id),
  );
}
