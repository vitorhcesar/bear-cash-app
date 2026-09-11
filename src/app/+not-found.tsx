import { Redirect } from 'expo-router';

import { useAuthSession } from '@/presentation/auth/auth-session-context';
import { HomeLoading } from '@/presentation/pages/HomePage';

export default function UnmatchedRoute() {
  const { isLoading, isAuthenticated, hasCompletedOnboarding } = useAuthSession();

  if (isLoading) {
    return <HomeLoading />;
  }

  if (isAuthenticated && hasCompletedOnboarding) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/" />;
}
