import { BaseApiModule } from '@/infra/http/services/api/modules/base-api.module';

export const TRANSACTION_TYPES = ['CREDIT', 'DEBIT'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export type TransactionItem = {
  id: string;
  accountId: string | null;
  date: string;
  description: string;
  descriptionRaw: string | null;
  type: TransactionType;
  amount: number;
  amountInAccountCurrency: number | null;
  balance: number | null;
  currencyCode: string;
  category: string | null;
  categoryId: string | null;
  status: 'PENDING' | 'POSTED';
  providerCode: string | null;
  providerId: string | null;
  operationType: string | null;
  operationTypeAdditionalInfo: string | null;
  paymentData: unknown;
  creditCardMetadata: unknown;
  merchant: unknown;
  source: 'MANUAL' | 'OPEN_FINANCE';
  bankName: string | null;
  bankCode: string | null;
  recurring: boolean;
  hiddenFromTotals: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TransactionListResponse = {
  items: TransactionItem[];
};

export type CreateTransactionInput = {
  description: string;
  amount: number;
  type: TransactionType;
  date: string;
  currencyCode: string;
  categoryId?: string | null;
  category?: string | null;
};

export type UpdateTransactionInput = Partial<CreateTransactionInput> & {
  recurring?: boolean;
  hiddenFromTotals?: boolean;
};

export interface ITransactionsModule {
  list(query?: string): Promise<TransactionListResponse>;
  get(id: string): Promise<TransactionItem>;
  create(input: CreateTransactionInput): Promise<TransactionItem>;
  update(id: string, input: UpdateTransactionInput): Promise<TransactionItem>;
  remove(id: string): Promise<void>;
}

export class TransactionsModule extends BaseApiModule implements ITransactionsModule {
  list(query?: string) {
    return this.http.get<TransactionListResponse>('/api/v1/transactions', {
      params: query?.trim() ? { q: query.trim() } : undefined,
    });
  }

  get(id: string) {
    return this.http.get<TransactionItem>(`/api/v1/transactions/${id}`);
  }

  create(input: CreateTransactionInput) {
    return this.http.post<TransactionItem>('/api/v1/transactions', input);
  }

  update(id: string, input: UpdateTransactionInput) {
    return this.http.patch<TransactionItem>(`/api/v1/transactions/${id}`, input);
  }

  remove(id: string) {
    return this.http.delete<void>(`/api/v1/transactions/${id}`);
  }
}
