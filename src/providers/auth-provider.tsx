import { isAuthRetryableFetchError, type Session } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { AppState } from 'react-native';

import {
  clearStoredIdentity,
  readStoredIdentity,
  saveStoredIdentity,
  type StoredIdentity,
} from '@/lib/auth-cache';
import { authErrorMessage, isValidEmail, normalizeEmail } from '@/lib/auth';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export interface AuthUser {
  id: string;
  email: string | null;
}

interface AuthContextValue {
  configured: boolean;
  initializing: boolean;
  user: AuthUser | null;
  offlineSession: boolean;
  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function identityFromSession(session: Session): AuthUser {
  return {
    id: session.user.id,
    email: session.user.email ?? null,
  };
}

function identityFromCache(cached: StoredIdentity): AuthUser {
  return {
    id: cached.id,
    email: cached.email,
  };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [initializing, setInitializing] = useState(isSupabaseConfigured);
  const [session, setSession] = useState<Session | null>(null);
  const [cachedIdentity, setCachedIdentity] = useState<AuthUser | null>(null);
  const [offlineSession, setOfflineSession] = useState(false);
  const signingOutRef = useRef(false);

  // When Supabase is not configured, create a local anonymous identity so the
  // app works fully offline without requiring authentication.
  useEffect(() => {
    if (isSupabaseConfigured) return;
    let active = true;
    (async () => {
      try {
        const stored = await readStoredIdentity();
        if (!active) return;
        if (stored) {
          setCachedIdentity(identityFromCache(stored));
        } else {
          const localId = 'local-' + Math.random().toString(36).slice(2, 10);
          const identity: AuthUser = { id: localId, email: null };
          setCachedIdentity(identity);
          await saveStoredIdentity(identity);
        }
      } catch {
        const localId = 'local-' + Math.random().toString(36).slice(2, 10);
        setCachedIdentity({ id: localId, email: null });
      } finally {
        if (active) setInitializing(false);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    let active = true;

    const remember = (nextSession: Session) => {
      if (!active || signingOutRef.current) return;
      const identity = identityFromSession(nextSession);
      setSession(nextSession);
      setCachedIdentity(identity);
      setOfflineSession(false);
      void saveStoredIdentity(identity);
    };

    const bootstrap = async () => {
      try {
        const stored = await readStoredIdentity();
        if (!active) return;
        if (stored) setCachedIdentity(identityFromCache(stored));

        const { data, error } = await client.auth.getSession();
        if (!active) return;

        if (data.session) {
          remember(data.session);
        } else if (error && isAuthRetryableFetchError(error) && stored) {
          // The access token could not be refreshed because there is no
          // connection. Let the last verified account keep using local data.
          setSession(null);
          setCachedIdentity(identityFromCache(stored));
          setOfflineSession(true);
        } else {
          setSession(null);
          setCachedIdentity(null);
          setOfflineSession(false);
          await clearStoredIdentity();
        }
      } catch {
        const stored = await readStoredIdentity();
        if (!active) return;
        if (stored) {
          setSession(null);
          setCachedIdentity(identityFromCache(stored));
          setOfflineSession(true);
        } else {
          setSession(null);
          setCachedIdentity(null);
          setOfflineSession(false);
        }
      } finally {
        if (active) setInitializing(false);
      }
    };

    const { data: listener } = client.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;

      if (nextSession) {
        remember(nextSession);
        return;
      }

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setCachedIdentity(null);
        setOfflineSession(false);
        void clearStoredIdentity();
      }
    });

    void bootstrap();

    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        client.auth.startAutoRefresh();
      } else {
        client.auth.stopAutoRefresh();
      }
    });
    client.auth.startAutoRefresh();

    return () => {
      active = false;
      appStateSubscription.remove();
      client.auth.stopAutoRefresh();
      listener.subscription.unsubscribe();
    };
  }, []);

  const sendOtp = useCallback(async (emailInput: string) => {
    const client = supabase;
    if (!client) {
      throw new Error('Supabase no está configurado en esta instalación.');
    }

    const email = normalizeEmail(emailInput);
    if (!isValidEmail(email)) {
      throw new Error('Escribe un correo válido, por ejemplo nombre@gmail.com.');
    }

    const { error } = await client.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

    if (error) throw new Error(authErrorMessage(error));
  }, []);

  const verifyOtp = useCallback(async (emailInput: string, tokenInput: string) => {
    const client = supabase;
    if (!client) {
      throw new Error('Supabase no está configurado en esta instalación.');
    }

    const email = normalizeEmail(emailInput);
    const token = tokenInput.replace(/\D/g, '');

    if (token.length !== 6) {
      throw new Error('Escribe el código de 6 dígitos que enviamos a tu correo.');
    }

    const { data, error } = await client.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) throw new Error(authErrorMessage(error));

    if (data.session) {
      const identity = identityFromSession(data.session);
      setSession(data.session);
      setCachedIdentity(identity);
      setOfflineSession(false);
      await saveStoredIdentity(identity);
    }
  }, []);

  const signOut = useCallback(async () => {
    const client = supabase;

    signingOutRef.current = true;
    setSession(null);
    setCachedIdentity(null);
    setOfflineSession(false);
    await clearStoredIdentity();

    if (client) {
      // Local sign-out must never depend on the network. `scope: 'local'`
      // removes the stored session before trying to revoke the refresh token.
      try {
        await client.auth.signOut({ scope: 'local' });
      } catch {
        // The local state is already cleared above, so the user is signed out
        // on this device even if the server could not be reached.
      }
    }

    signingOutRef.current = false;
  }, []);

  const user = useMemo<AuthUser | null>(() => {
    if (session) return identityFromSession(session);
    if (offlineSession) return cachedIdentity;
    // In local-only mode (no Supabase), use the cached local identity.
    if (!isSupabaseConfigured && cachedIdentity) return cachedIdentity;
    return null;
  }, [session, offlineSession, cachedIdentity]);

  const value = useMemo<AuthContextValue>(
    () => ({
      configured: isSupabaseConfigured,
      initializing,
      user,
      offlineSession,
      sendOtp,
      verifyOtp,
      signOut,
    }),
    [initializing, user, offlineSession, sendOtp, verifyOtp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider.');
  return context;
}
