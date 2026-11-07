import Storage from 'expo-sqlite/kv-store';

const IDENTITY_KEY = 'deuda-clara.auth.identity.v1';

export interface StoredIdentity {
  id: string;
  email: string | null;
  savedAt: string;
}

function isStoredIdentity(value: unknown): value is StoredIdentity {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<StoredIdentity>;
  return (
    typeof candidate.id === 'string' &&
    candidate.id.length > 0 &&
    (candidate.email === null || typeof candidate.email === 'string') &&
    typeof candidate.savedAt === 'string'
  );
}

export async function readStoredIdentity(): Promise<StoredIdentity | null> {
  try {
    const raw = await Storage.getItem(IDENTITY_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isStoredIdentity(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveStoredIdentity(identity: {
  id: string;
  email: string | null;
}): Promise<void> {
  const value: StoredIdentity = {
    ...identity,
    savedAt: new Date().toISOString(),
  };

  try {
    await Storage.setItem(IDENTITY_KEY, JSON.stringify(value));
  } catch {
    // The Supabase session remains the primary auth source; the cache only
    // enables offline startup if the access token cannot be refreshed.
  }
}

export async function clearStoredIdentity(): Promise<void> {
  try {
    await Storage.removeItem(IDENTITY_KEY);
  } catch {
    // Nothing else to do: the next successful read will ignore invalid data.
  }
}
