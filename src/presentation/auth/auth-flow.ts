export type AuthMethod = 'email' | 'phone' | 'google';

export type AuthScreen = 'phone' | 'code' | 'profile' | 'data';

export type AuthStep = {
  current: number;
  total: number;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMAIL_STEPS: Record<AuthScreen, number> = {
  phone: 1,
  code: 2,
  profile: 3,
  data: 4,
};

const PHONE_STEPS: Record<Exclude<AuthScreen, 'phone'>, number> = {
  code: 1,
  profile: 2,
  data: 3,
};

const GOOGLE_STEPS: Record<AuthScreen, number> = {
  phone: 1,
  code: 2,
  profile: 2,
  data: 3,
};

export const SOCIAL_ONBOARDING_PATHS = [
  '/login-email-phone',
  '/login-email-whatsapp',
  '/login-email-code',
  '/login-email-data',
] as const;

export function isValidEmail(value: string) {
  return EMAIL_PATTERN.test(value.trim());
}

export function isOauthMethod(method: AuthMethod) {
  return method === 'google';
}

export function isSocialOnboardingPath(pathname: string) {
  return SOCIAL_ONBOARDING_PATHS.some(
    (path) => pathname === path || pathname.endsWith(path),
  );
}

export function parseAuthMethod(value: unknown): AuthMethod {
  if (value === 'phone' || value === 'whatsapp') {
    return 'phone';
  }
  if (value === 'google') {
    return 'google';
  }
  return 'email';
}

export function getAuthStep(method: AuthMethod, screen: AuthScreen): AuthStep {
  if (method === 'google') {
    return {
      current: GOOGLE_STEPS[screen],
      total: 3,
    };
  }

  if (method === 'phone') {
    if (screen === 'phone') {
      return { current: 1, total: 4 };
    }

    return {
      current: PHONE_STEPS[screen],
      total: 4,
    };
  }

  return {
    current: EMAIL_STEPS[screen],
    total: 5,
  };
}

export function paramString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}
