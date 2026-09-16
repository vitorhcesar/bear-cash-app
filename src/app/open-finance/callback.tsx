import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';

WebBrowser.maybeCompleteAuthSession();

export default function OpenFinanceCallbackRoute() {
  const { consentId } = useLocalSearchParams<{ consentId?: string }>();

  useEffect(() => {
    try {
      WebBrowser.dismissAuthSession();
    } catch {
      // Android polyfill uses dismissBrowser instead.
    }
    void WebBrowser.dismissBrowser().catch(() => undefined);

    // Deep link after bank auth should not yank the in-flight connect flow
    // off BankSelectPage / BankConnectionPage.
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
