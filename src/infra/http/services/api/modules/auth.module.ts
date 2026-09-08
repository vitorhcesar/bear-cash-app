import { BaseApiModule } from '@/infra/http/services/api/modules/base-api.module';

export type EmailStartResponse = {
  email: string;
  exists: boolean;
  nextStep: 'phone' | 'login';
  avatarKey: string | null;
};

export type PhoneStartResponse = {
  phone: string;
  exists: boolean;
  nextStep: 'otp' | 'login';
  avatarKey: string | null;
};

export type LoginInput = {
  email?: string;
  phone?: string;
  password: string;
};

export type OtpSendResponse = {
  phone: string;
  expiresIn: number;
  resendCooldown: number;
  devHint?: string;
};

export type OtpVerifyResponse = {
  phone: string;
  verificationToken: string;
  phoneRegistered: boolean;
  avatarKey: string | null;
};

export type AuthProfile = {
  fullName: string | null;
  displayName: string | null;
  city: string | null;
  birthDate: string | null;
  cpf: string | null;
  avatarKey: string | null;
  onboardingStep: number;
  onboardingCompleted: boolean;
};

export type PasswordRecoveryChannel = 'sms' | 'email';

export type PasswordRecoveryChannelOption = {
  available: boolean;
  masked: string | null;
};

export type PasswordRecoveryOptionsResponse = {
  sms: PasswordRecoveryChannelOption;
  email: PasswordRecoveryChannelOption;
};

export type PasswordRecoveryOtpSendResponse = {
  channel: PasswordRecoveryChannel;
  masked: string;
  expiresIn: number;
  resendCooldown: number;
  devHint?: string;
};

export type PasswordRecoveryOtpVerifyResponse = {
  resetToken: string;
  expiresIn: number;
};

export type EmailOtpSendResponse = {
  email: string;
  expiresIn: number;
  resendCooldown: number;
  devHint?: string;
};

export type AuthUser = {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  phoneNumber: string | null;
  phoneNumberVerified: boolean;
  role: 'client' | 'admin';
};

export type AuthSession = {
  token: string;
  expiresAt: string;
};

export type AuthResult = {
  user: AuthUser;
  session: AuthSession;
  profile: AuthProfile;
};

export type MeResponse = {
  authenticated: true;
  user: AuthUser;
  profile: AuthProfile;
};

export type RegisterInput = {
  email: string;
  password: string;
  phone: string;
  verificationToken: string;
  fullName: string;
  birthDate: string;
  cpf: string;
  avatarKey?: string;
};

export type CompleteOnboardingInput = {
  phone: string;
  verificationToken: string;
  fullName: string;
  birthDate: string;
  cpf: string;
  avatarKey?: string;
};

export interface IAuthModule {
  startEmail(email: string): Promise<EmailStartResponse>;
  startPhone(phone: string): Promise<PhoneStartResponse>;
  sendOtp(phone: string): Promise<OtpSendResponse>;
  verifyOtp(phone: string, code: string): Promise<OtpVerifyResponse>;
  register(input: RegisterInput): Promise<AuthResult>;
  completeOnboarding(input: CompleteOnboardingInput): Promise<AuthResult>;
  login(input: LoginInput): Promise<AuthResult>;
  logout(): Promise<void>;
  me(): Promise<MeResponse>;
  updateAvatar(avatarKey: string): Promise<MeResponse>;
  verifyPassword(password: string): Promise<{ ok: true }>;
  sendPasswordOtp(): Promise<OtpSendResponse>;
  verifyPasswordOtp(code: string): Promise<OtpVerifyResponse>;
  sendEmailOtp(): Promise<EmailOtpSendResponse>;
  verifyEmailOtp(code: string): Promise<MeResponse>;
  getPasswordRecoveryOptions(input: {
    email?: string;
    phone?: string;
  }): Promise<PasswordRecoveryOptionsResponse>;
  sendPasswordRecoveryOtp(input: {
    email?: string;
    phone?: string;
    channel: PasswordRecoveryChannel;
  }): Promise<PasswordRecoveryOtpSendResponse>;
  verifyPasswordRecoveryOtp(input: {
    email?: string;
    phone?: string;
    channel: PasswordRecoveryChannel;
    code: string;
  }): Promise<PasswordRecoveryOtpVerifyResponse>;
  resetPassword(input: {
    resetToken: string;
    newPassword: string;
  }): Promise<{ ok: true }>;
  changePassword(input: {
    newPassword: string;
    verificationToken: string;
  }): Promise<{ ok: true }>;
  deleteAccount(): Promise<void>;
}

export class AuthModule extends BaseApiModule implements IAuthModule {
  startEmail(email: string) {
    return this.http.post<EmailStartResponse>(
      '/api/v1/auth/email/start',
      { email },
      { skipAuth: true },
    );
  }

  startPhone(phone: string) {
    return this.http.post<PhoneStartResponse>(
      '/api/v1/auth/phone/start',
      { phone },
      { skipAuth: true },
    );
  }

  sendOtp(phone: string) {
    return this.http.post<OtpSendResponse>(
      '/api/v1/auth/otp/send',
      { phone },
      { skipAuth: true },
    );
  }

  verifyOtp(phone: string, code: string) {
    return this.http.post<OtpVerifyResponse>(
      '/api/v1/auth/otp/verify',
      { phone, code },
      { skipAuth: true },
    );
  }

  register(input: RegisterInput) {
    return this.http.post<AuthResult>('/api/v1/auth/register', input, { skipAuth: true });
  }

  completeOnboarding(input: CompleteOnboardingInput) {
    return this.http.post<AuthResult>('/api/v1/auth/complete-onboarding', input);
  }

  login(input: LoginInput) {
    return this.http.post<AuthResult>('/api/v1/auth/login', input, { skipAuth: true });
  }

  logout() {
    return this.http.post<void>('/api/v1/auth/logout');
  }

  me() {
    return this.http.get<MeResponse>('/api/v1/auth/me');
  }

  updateAvatar(avatarKey: string) {
    return this.http.patch<MeResponse>('/api/v1/auth/me/avatar', { avatarKey });
  }

  verifyPassword(password: string) {
    return this.http.post<{ ok: true }>('/api/v1/auth/me/verify-password', {
      password,
    });
  }

  sendPasswordOtp() {
    return this.http.post<OtpSendResponse>('/api/v1/auth/me/otp/send');
  }

  verifyPasswordOtp(code: string) {
    return this.http.post<OtpVerifyResponse>('/api/v1/auth/me/otp/verify', { code });
  }

  sendEmailOtp() {
    return this.http.post<EmailOtpSendResponse>('/api/v1/auth/me/email-otp/send');
  }

  verifyEmailOtp(code: string) {
    return this.http.post<MeResponse>('/api/v1/auth/me/email-otp/verify', { code });
  }

  getPasswordRecoveryOptions(input: { email?: string; phone?: string }) {
    return this.http.post<PasswordRecoveryOptionsResponse>(
      '/api/v1/auth/password/recovery/options',
      input,
      { skipAuth: true },
    );
  }

  sendPasswordRecoveryOtp(input: {
    email?: string;
    phone?: string;
    channel: PasswordRecoveryChannel;
  }) {
    return this.http.post<PasswordRecoveryOtpSendResponse>(
      '/api/v1/auth/password/recovery/otp/send',
      input,
      { skipAuth: true },
    );
  }

  verifyPasswordRecoveryOtp(input: {
    email?: string;
    phone?: string;
    channel: PasswordRecoveryChannel;
    code: string;
  }) {
    return this.http.post<PasswordRecoveryOtpVerifyResponse>(
      '/api/v1/auth/password/recovery/otp/verify',
      input,
      { skipAuth: true },
    );
  }

  resetPassword(input: { resetToken: string; newPassword: string }) {
    return this.http.post<{ ok: true }>(
      '/api/v1/auth/password/recovery/reset',
      input,
      { skipAuth: true },
    );
  }

  changePassword(input: { newPassword: string; verificationToken: string }) {
    return this.http.patch<{ ok: true }>('/api/v1/auth/me/password', input);
  }

  deleteAccount() {
    return this.http.delete<void>('/api/v1/auth/me');
  }
}
