import { BaseApiModule } from '@/infra/http/services/api/modules/base-api.module';

export type OpenFinanceInstitution = {
  id: string;
  name: string;
  logoUrl: string | null;
  status: string;
  type: string;
  credentials: string[];
  kind: 'bank' | 'broker';
  available: boolean;
};

export type OpenFinanceConsentStatus =
  | 'AWAITING_AUTHORIZATION'
  | 'AUTHORISED'
  | 'REJECTED'
  | 'EXPIRED'
  | string;

export type OpenFinanceConsent = {
  id: string;
  polpConsentId: string;
  institutionId: string;
  institutionName: string;
  institutionLogoUrl: string | null;
  products: string[];
  status: OpenFinanceConsentStatus;
  executionStatus: string | null;
  flags: string[];
  urlToAuthenticate: string | null;
  urlToAuthenticateExpiresAt: string | null;
  lastSyncedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OpenFinanceBill = {
  id: string;
  dueDate: string | null;
  billClosingDate: string | null;
  isInstalment: boolean;
  minimumAmount: number | null;
  totalAmount: number | null;
  currency: string | null;
};

/** Fatura do ciclo aberto, derivada das transações do cartão (`billForecastDate`). */
export type OpenFinanceCurrentInvoice = {
  month: string;
  amount: number;
};

export type CreditCardBillStatus = 'open' | 'closed';

export type CreditCardMonthPoint = {
  month: string;
  amount: number;
  hasData: boolean;
};

export type CreditCardOverviewItem = {
  id: string;
  consentId: string;
  institutionId: string;
  institutionName: string;
  institutionLogoUrl: string | null;
  accountLast4: string | null;
  name: string | null;
  network: string | null;
  last4: string | null;
  availableLimit: number | null;
  usedAmount: number | null;
  limitAmount: number | null;
  currentInvoice: OpenFinanceCurrentInvoice | null;
  currentBill: OpenFinanceBill | null;
  billStatus: CreditCardBillStatus | null;
  dueDate: string | null;
  months: CreditCardMonthPoint[];
};

export type OpenFinanceConnection = OpenFinanceConsent & {
  accounts: Array<{
    id: string;
    type: string | null;
    number: string | null;
    currency: string | null;
    availableAmount: number | null;
    hasReservedBalance: boolean;
  }>;
  creditCards: Array<{
    id: string;
    name: string | null;
    network: string | null;
    last4: string | null;
    availableLimit: number | null;
    usedAmount?: number | null;
    limitAmount?: number | null;
    currentBill: OpenFinanceBill | null;
    currentInvoice?: OpenFinanceCurrentInvoice | null;
  }>;
};

export type CreditCardInstallmentPlan = {
  id: string;
  creditCardId: string;
  institutionName: string;
  institutionLogoUrl: string | null;
  merchantName: string;
  merchantLogoUrl: string | null;
  categoryId: string | null;
  category: string | null;
  current: number;
  total: number;
  installmentAmount: number;
  paidAmount: number;
  remainingAmount: number;
  lastInstallmentMonth: string | null;
};

export interface IOpenFinanceModule {
  listInstitutions(): Promise<{ items: OpenFinanceInstitution[] }>;
  listConnections(): Promise<{ items: OpenFinanceConnection[] }>;
  syncConnections(): Promise<{ items: OpenFinanceConnection[] }>;
  syncConnection(id: string): Promise<OpenFinanceConnection>;
  getConnection(id: string): Promise<OpenFinanceConnection>;
  listCreditCards(): Promise<{ items: CreditCardOverviewItem[] }>;
  listCreditCardInstallments(): Promise<{ items: CreditCardInstallmentPlan[] }>;
  listCreditCardBills(creditCardId: string): Promise<{ items: OpenFinanceBill[] }>;
  createConsent(input: { institutionId: string }): Promise<OpenFinanceConsent>;
  getConsent(id: string): Promise<OpenFinanceConsent>;
  refreshConsent(id: string): Promise<OpenFinanceConsent>;
  recreateConsent(id: string): Promise<OpenFinanceConsent>;
  revokeConsent(id: string): Promise<void>;
}

export class OpenFinanceModule extends BaseApiModule implements IOpenFinanceModule {
  listInstitutions() {
    return this.http.get<{ items: OpenFinanceInstitution[] }>(
      '/api/v1/open-finance/institutions',
    );
  }

  listConnections() {
    return this.http.get<{ items: OpenFinanceConnection[] }>(
      '/api/v1/open-finance/connections',
    );
  }

  syncConnections() {
    return this.http.post<{ items: OpenFinanceConnection[] }>(
      '/api/v1/open-finance/sync',
    );
  }

  syncConnection(id: string) {
    return this.http.post<OpenFinanceConnection>(
      `/api/v1/open-finance/connections/${id}/sync`,
    );
  }

  getConnection(id: string) {
    return this.http.get<OpenFinanceConnection>(
      `/api/v1/open-finance/connections/${id}`,
    );
  }

  listCreditCards() {
    return this.http.get<{ items: CreditCardOverviewItem[] }>(
      '/api/v1/open-finance/credit-cards',
    );
  }

  listCreditCardInstallments() {
    return this.http.get<{ items: CreditCardInstallmentPlan[] }>(
      '/api/v1/open-finance/credit-cards/installments',
    );
  }

  listCreditCardBills(creditCardId: string) {
    return this.http.get<{ items: OpenFinanceBill[] }>(
      `/api/v1/open-finance/credit-cards/${creditCardId}/bills`,
    );
  }

  createConsent(input: { institutionId: string }) {
    return this.http.post<OpenFinanceConsent>('/api/v1/open-finance/consents', input);
  }

  getConsent(id: string) {
    return this.http.get<OpenFinanceConsent>(`/api/v1/open-finance/consents/${id}`);
  }

  refreshConsent(id: string) {
    return this.http.post<OpenFinanceConsent>(
      `/api/v1/open-finance/consents/${id}/refresh`,
    );
  }

  recreateConsent(id: string) {
    return this.http.post<OpenFinanceConsent>(
      `/api/v1/open-finance/consents/${id}/recreate`,
    );
  }

  revokeConsent(id: string) {
    return this.http.delete<void>(`/api/v1/open-finance/consents/${id}`);
  }
}
