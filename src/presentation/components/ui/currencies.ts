export type Currency = {
  code: string;
  name: string;
};

const FEATURED_CODES = [
  'BRL',
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'CHF',
  'AUD',
  'CAD',
  'ARS',
  'MXN',
  'CLP',
  'COP',
  'PEN',
  'UYU',
  'PYG',
  'BOB',
  'CNY',
  'KRW',
  'INR',
  'NZD',
] as const;

const CURRENCY_NAMES: Record<string, string> = {
  AED: 'Dirham dos Emirados',
  AFN: 'Afegane Afegão',
  ALL: 'Lek Albanês',
  AMD: 'Dram Armênio',
  ANG: 'Florim das Antilhas',
  AOA: 'Kwanza Angolano',
  ARS: 'Peso Argentino',
  AUD: 'Dólar Australiano',
  AWG: 'Florim de Aruba',
  AZN: 'Manat Azerbaijano',
  BAM: 'Marco Conversível',
  BBD: 'Dólar de Barbados',
  BDT: 'Taka Bangladeshiano',
  BGN: 'Lev Búlgaro',
  BHD: 'Dinar Bareinita',
  BIF: 'Franco Burundiano',
  BMD: 'Dólar Bermudense',
  BND: 'Dólar de Brunei',
  BOB: 'Boliviano',
  BRL: 'Real Brasileiro',
  BSD: 'Dólar Bahamense',
  BTN: 'Ngultrum Butanês',
  BWP: 'Pula de Botsuana',
  BYN: 'Rublo Bielorrusso',
  BZD: 'Dólar de Belize',
  CAD: 'Dólar Canadense',
  CDF: 'Franco Congolês',
  CHF: 'Franco Suíço',
  CLP: 'Peso Chileno',
  CNY: 'Yuan Chinês',
  COP: 'Peso Colombiano',
  CRC: 'Colón Costarriquenho',
  CUP: 'Peso Cubano',
  CVE: 'Escudo Cabo-verdiano',
  CZK: 'Coroa Tcheca',
  DJF: 'Franco do Djibuti',
  DKK: 'Coroa Dinamarquesa',
  DOP: 'Peso Dominicano',
  DZD: 'Dinar Argelino',
  EGP: 'Libra Egípcia',
  ERN: 'Nakfa Eritreia',
  ETB: 'Birr Etíope',
  EUR: 'Euro',
  FJD: 'Dólar de Fiji',
  FKP: 'Libra das Malvinas',
  GBP: 'Libra Esterlina',
  GEL: 'Lari Georgiano',
  GHS: 'Cedi Ganês',
  GIP: 'Libra de Gibraltar',
  GMD: 'Dalasi Gambiano',
  GNF: 'Franco Guineense',
  GTQ: 'Quetzal Guatemalteco',
  GYD: 'Dólar da Guiana',
  HKD: 'Dólar de Hong Kong',
  HNL: 'Lempira Hondurenha',
  HTG: 'Gourde Haitiano',
  HUF: 'Forint Húngaro',
  IDR: 'Rupia Indonésia',
  ILS: 'Novo Shekel Israelense',
  INR: 'Rupia Indiana',
  IQD: 'Dinar Iraquiano',
  IRR: 'Rial Iraniano',
  ISK: 'Coroa Islandesa',
  JMD: 'Dólar Jamaicano',
  JOD: 'Dinar Jordaniano',
  JPY: 'Iene Japonês',
  KES: 'Xelim Queniano',
  KGS: 'Som Quirguiz',
  KHR: 'Riel Cambojano',
  KMF: 'Franco Comorense',
  KRW: 'Won Sul-coreano',
  KWD: 'Dinar Kuwaitiano',
  KYD: 'Dólar das Cayman',
  KZT: 'Tenge Cazaque',
  LAK: 'Kip Laosiano',
  LBP: 'Libra Libanesa',
  LKR: 'Rupia do Sri Lanka',
  LRD: 'Dólar Liberiano',
  LSL: 'Loti do Lesoto',
  LYD: 'Dinar Líbio',
  MAD: 'Dirham Marroquino',
  MDL: 'Leu Moldávio',
  MGA: 'Ariary Malgaxe',
  MKD: 'Dinar Macedônio',
  MMK: 'Kyat de Mianmar',
  MNT: 'Tugrik Mongol',
  MOP: 'Pataca de Macau',
  MRU: 'Ouguiya Mauritana',
  MUR: 'Rupia Mauriciana',
  MVR: 'Rupia das Maldivas',
  MWK: 'Kwacha Malawiana',
  MXN: 'Peso Mexicano',
  MYR: 'Ringgit Malaio',
  MZN: 'Metical Moçambicano',
  NAD: 'Dólar Namibiano',
  NGN: 'Naira Nigeriana',
  NIO: 'Córdoba Nicaraguense',
  NOK: 'Coroa Norueguesa',
  NPR: 'Rupia Nepalesa',
  NZD: 'Dólar Neozelandês',
  OMR: 'Rial Omanense',
  PAB: 'Balboa Panamenho',
  PEN: 'Sol Peruano',
  PGK: 'Kina Papua-Nova-Guiné',
  PHP: 'Peso Filipino',
  PKR: 'Rupia Paquistanesa',
  PLN: 'Zloty Polonês',
  PYG: 'Guarani Paraguaio',
  QAR: 'Rial Catariano',
  RON: 'Leu Romeno',
  RSD: 'Dinar Sérvio',
  RUB: 'Rublo Russo',
  RWF: 'Franco Ruandês',
  SAR: 'Rial Saudita',
  SBD: 'Dólar das Salomão',
  SCR: 'Rupia Seichelense',
  SDG: 'Libra Sudanesa',
  SEK: 'Coroa Sueca',
  SGD: 'Dólar de Singapura',
  SHP: 'Libra de Santa Helena',
  SLE: 'Leone de Serra Leoa',
  SOS: 'Xelim Somali',
  SRD: 'Dólar Surinamês',
  SSP: 'Libra Sul-sudanesa',
  STN: 'Dobra de São Tomé',
  SYP: 'Libra Síria',
  SZL: 'Lilangeni Suazi',
  THB: 'Baht Tailandês',
  TJS: 'Somoni Tajique',
  TMT: 'Manat Turcomeno',
  TND: 'Dinar Tunisiano',
  TOP: 'Paʻanga Tonganesa',
  TRY: 'Lira Turca',
  TTD: 'Dólar de Trinidad',
  TWD: 'Novo Dólar Taiwanês',
  TZS: 'Xelim Tanzaniano',
  UAH: 'Hryvnia Ucraniana',
  UGX: 'Xelim Ugandense',
  USD: 'Dólar Americano',
  UYU: 'Peso Uruguaio',
  UZS: 'Som Uzbeque',
  VES: 'Bolívar Venezuelano',
  VND: 'Dong Vietnamita',
  VUV: 'Vatu de Vanuatu',
  WST: 'Tala Samoana',
  XAF: 'Franco CFA (BEAC)',
  XCD: 'Dólar do Caribe Oriental',
  XOF: 'Franco CFA (BCEAO)',
  XPF: 'Franco CFP',
  YER: 'Rial Iemenita',
  ZAR: 'Rand Sul-africano',
  ZMW: 'Kwacha Zambiana',
  ZWG: 'Ouro do Zimbábue',
};

const featuredSet = new Set<string>(FEATURED_CODES);

export const CURRENCIES: Currency[] = [
  ...FEATURED_CODES.map((code) => ({
    code,
    name: CURRENCY_NAMES[code],
  })),
  ...Object.entries(CURRENCY_NAMES)
    .filter(([code]) => !featuredSet.has(code))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([code, name]) => ({ code, name })),
];

export const DEFAULT_CURRENCY_CODE = 'BRL';

const CURRENCY_SYMBOLS: Record<string, string> = {
  BRL: 'R$',
};

const currencyByCode = new Map(
  CURRENCIES.map((currency) => [currency.code, currency]),
);

const symbolCache = new Map<string, string>();

export function getCurrency(code: string) {
  return currencyByCode.get(code) ?? currencyByCode.get(DEFAULT_CURRENCY_CODE)!;
}

export function formatCurrencyLabel(currency: Currency) {
  return `${currency.code} — ${currency.name}`;
}

function resolveCurrencySymbol(code: string, candidate?: string) {
  const trimmed = candidate?.trim();
  if (trimmed && trimmed.toUpperCase() !== code.toUpperCase()) {
    return trimmed;
  }

  return CURRENCY_SYMBOLS[code] ?? trimmed ?? code;
}

export function getCurrencySymbol(code: string) {
  const cached = symbolCache.get(code);
  if (cached) {
    return cached;
  }

  try {
    const part = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: code,
      currencyDisplay: 'narrowSymbol',
    })
      .formatToParts(0)
      .find((item) => item.type === 'currency');

    const symbol = resolveCurrencySymbol(code, part?.value);
    symbolCache.set(code, symbol);
    return symbol;
  } catch {
    const symbol = resolveCurrencySymbol(code);
    symbolCache.set(code, symbol);
    return symbol;
  }
}

export function formatCurrencyAmount(
  amount: number,
  currencyCode = DEFAULT_CURRENCY_CODE,
) {
  const number = amount.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${getCurrencySymbol(currencyCode)} ${number}`;
}
