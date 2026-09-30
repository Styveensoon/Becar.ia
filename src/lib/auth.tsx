import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { cachePersonal, CLAVES_PERSONALES } from './cache';
import { cancelarRecordatorios } from './recordatorios';
import { supabase } from './supabase';

type AuthState = {
  session: Session | null;
  loading: boolean;
};

const AuthContext = createContext<AuthState>({ session: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Quién tenía la sesión, para borrar SUS datos del teléfono al salir (el evento ya no lo trae).
    let usuarioActual: string | null = null;

    supabase.auth.getSession().then(({ data }) => {
      usuarioActual = data.session?.user.id ?? null;
      setSession(data.session);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === 'SIGNED_OUT') {
        // Los avisos y la caché personal son del usuario que salió; no deben quedar para el siguiente.
        cancelarRecordatorios().catch(() => {});
        if (usuarioActual) cachePersonal.borrar(usuarioActual, [...CLAVES_PERSONALES]);
      }
      usuarioActual = next?.user.id ?? null;
      setSession(next);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo(() => ({ session, loading }), [session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
