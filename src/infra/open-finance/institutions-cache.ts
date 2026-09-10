import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import type { OpenFinanceInstitution } from '@/infra/http/services/api/modules/open-finance.module';

const STORAGE_KEY = 'bear-cash.open-finance.institutions.v1';

export const INSTITUTIONS_FRESH_TTL_MS = 6 * 60 * 60 * 1000;

export type InstitutionsCache = {
  savedAt: number;
  items: OpenFinanceInstitution[];
};

let memoryCache: InstitutionsCache | null = null;

export function peekInstitutionsCache() {
  return memoryCache;
}

export function isInstitutionsCacheFresh(savedAt: number) {
  return Date.now() - savedAt < INSTITUTIONS_FRESH_TTL_MS;
}

function isInstitution(value: unknown): value is OpenFinanceInstitution {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const row = value as Partial<OpenFinanceInstitution>;
  return typeof row.id === 'string' && typeof row.name === 'string';
}

function normalizeInstitution(row: OpenFinanceInstitution): OpenFinanceInstitution {
  return {
    id: row.id,
    name: row.name,
    logoUrl: row.logoUrl ?? null,
    status: row.status ?? 'OPERATIONAL',
    type: row.type ?? 'PERSONAL',
    credentials: Array.isArray(row.credentials) ? row.credentials : [],
    kind: row.kind === 'broker' ? 'broker' : 'bank',
    available: row.available !== false,
  };
}

function parseCache(value: unknown): InstitutionsCache | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const savedAt = (value as { savedAt?: unknown }).savedAt;
  const items = (value as { items?: unknown }).items;
  if (typeof savedAt !== 'number' || !Array.isArray(items)) {
    return null;
  }

  const normalized = items.filter(isInstitution).map(normalizeInstitution);
  if (normalized.length === 0) {
    return null;
  }

  return { savedAt, items: normalized };
}

async function readPersistedCache() {
  try {
    const raw =
      Platform.OS === 'web'
        ? (globalThis.localStorage?.getItem(STORAGE_KEY) ?? null)
        : await AsyncStorage.getItem(STORAGE_KEY);

    return raw ? parseCache(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

async function writePersistedCache(payload: InstitutionsCache) {
  const raw = JSON.stringify(payload);

  try {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(STORAGE_KEY, raw);
      return;
    }

    await AsyncStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // Persistence is best-effort; memory still serves the session.
  }
}

export async function readInstitutionsCache() {
  if (memoryCache?.items.length) {
    return memoryCache;
  }

  const persisted = await readPersistedCache();
  if (persisted) {
    memoryCache = persisted;
  }
  return persisted;
}

export async function writeInstitutionsCache(items: OpenFinanceInstitution[]) {
  if (items.length === 0) {
    return;
  }

  const payload: InstitutionsCache = {
    savedAt: Date.now(),
    items,
  };
  memoryCache = payload;
  await writePersistedCache(payload);
}
