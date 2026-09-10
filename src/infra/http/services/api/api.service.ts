import { HttpClient, type IHttpClient } from '@/infra/http/http-client';
import { API_BASE_URL } from '@/infra/http/services/api/api-env';
import { AiModule, type IAiModule } from '@/infra/http/services/api/modules/ai.module';
import {
  ApiKeysModule,
  type IApiKeysModule,
} from '@/infra/http/services/api/modules/api-keys.module';
import { AuthModule, type IAuthModule } from '@/infra/http/services/api/modules/auth.module';
import {
  PushModule,
  type IPushModule,
} from '@/infra/http/services/api/modules/push.module';
import {
  SupportModule,
  type ISupportModule,
} from '@/infra/http/services/api/modules/support.module';
import {
  TransactionsModule,
  type ITransactionsModule,
} from '@/infra/http/services/api/modules/transactions.module';

export interface IApiServiceModules {
  ai: IAiModule;
  auth: IAuthModule;
  support: ISupportModule;
  apiKeys: IApiKeysModule;
  push: IPushModule;
  transactions: ITransactionsModule;
}

export interface IApiService {
  modules: IApiServiceModules;
}

export class ApiService implements IApiService {
  public readonly modules: IApiServiceModules;

  constructor(httpClient: IHttpClient = new HttpClient(API_BASE_URL)) {
    this.modules = {
      ai: new AiModule(httpClient),
      auth: new AuthModule(httpClient),
      support: new SupportModule(httpClient),
      apiKeys: new ApiKeysModule(httpClient),
      push: new PushModule(httpClient),
      transactions: new TransactionsModule(httpClient),
    };
  }
}

export const apiService = new ApiService();
