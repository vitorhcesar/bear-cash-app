import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

export default function OpenFinanceCallbackRoute() {
  const { consentId } = useLocalSearchParams<{ consentId?: string }>();

  useEffect(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(
      consentId
        ? { pathname: '/bank-connection', params: { consentId } }
        : '/bank-connection',
    );
  }, [consentId]);

  return null;
}
