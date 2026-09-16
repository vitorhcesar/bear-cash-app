import { useEffect, useState } from 'react';

import type {
  OpenFinanceConsent,
  OpenFinanceConnection,
} from '@/infra/http/services/api/modules/open-finance.module';

type Listener = () => void;

let snapshot: OpenFinanceConnection[] | null = null;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

export function getOpenFinanceConnections() {
  return snapshot;
}

export function setOpenFinanceConnections(items: OpenFinanceConnection[]) {
  snapshot = items;
  emit();
}

export function patchOpenFinanceConsent(consent: OpenFinanceConsent) {
  const current = snapshot ?? [];
  const index = current.findIndex((item) => item.id === consent.id);
  if (index === -1) {
    snapshot = [{ ...consent, accounts: [], creditCards: [] }, ...current];
  } else {
    snapshot = current.map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...consent } : item,
    );
  }
  emit();
}

export function useOpenFinanceConnections() {
  const [items, setItems] = useState<OpenFinanceConnection[] | null>(() => snapshot);

  useEffect(() => {
    const listener = () => setItems(snapshot);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return items;
}
