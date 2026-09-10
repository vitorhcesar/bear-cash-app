import { BaseApiModule } from '@/infra/http/services/api/modules/base-api.module';

export type PushPlatform = 'ios' | 'android';

export type PushDevice = {
  id: string;
  token: string;
  platform: PushPlatform;
  enabled: boolean;
};

export interface IPushModule {
  registerDevice(token: string, platform: PushPlatform): Promise<PushDevice>;
  unregisterDevice(token: string): Promise<void>;
}

export class PushModule extends BaseApiModule implements IPushModule {
  registerDevice(token: string, platform: PushPlatform) {
    return this.http.put<PushDevice, { token: string; platform: PushPlatform }>(
      '/api/v1/push/devices',
      { token, platform },
    );
  }

  unregisterDevice(token: string) {
    return this.http.delete<void>('/api/v1/push/devices', {
      data: { token },
    });
  }
}
