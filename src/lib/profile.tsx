import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { NivelEducativo, RangoEdad } from './authActions';
import { useAuth } from './auth';
import { cachePersonal } from './cache';
import { supabase } from './supabase';

export type Profile = {
  id: string;
  mote: string | null;
  avatar_id: string | null;
  color: string | null;
  intereses: string[] | null;
  rango_edad: RangoEdad | null;
  nivel_educativo: NivelEducativo | null;
  institucion: string | null;
  created_at: string;
};

// Columnas que la app lee de `profiles` (solo la fila propia, por RLS).
export const PROFILE_FIELDS = 'id, mote, avatar_id, color, intereses, rango_edad, nivel_educativo, institucion, created_at';

type ProfileState = {
  profile: Profile | null;
  loading: boolean;
  // Onboarding de personalización completo (avatar + intereses guardados).
  onboarded: boolean;
  // Cuenta del equipo de validación: solo ve el panel para aprobar convocatorias.
  esValidador: boolean;
  // No se pudo cargar el perfil ni de la red ni de la caché (primer arranque sin conexión).
  sinConexion: boolean;
  reintentar: () => void;
  setProfile: (profile: Profile) => void;
};

const ProfileContext = createContext<ProfileState>({
  profile: null,
  loading: true,
  onboarded: false,
  esValidador: false,
  sinConexion: false,
  reintentar: () => {},
  setProfile: () => {},
});

type PerfilEnCache = { profile: Profile | null; esValidador: boolean };

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [esValidador, setEsValidador] = useState(false);
  const [sinConexion, setSinConexion] = useState(false);
  const [intento, setIntento] = useState(0);

  // Primero la caché (la app abre al instante y sin conexión), luego la red la actualiza.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      const cache = await cachePersonal.leer<PerfilEnCache>(userId, 'perfil');
      if (cancelled) return;
      if (cache) {
        setProfileState(cache.profile);
        setEsValidador(cache.esValidador);
        setLoading(false);
      }

      const [perfil, equipo] = await Promise.all([
        supabase.from('profiles').select(PROFILE_FIELDS).eq('id', userId).maybeSingle<Profile>(),
        supabase.from('equipo').select('rol').eq('user_id', userId).maybeSingle(),
      ]);
      if (cancelled) return;
      if (perfil.error || equipo.error) {
        // Sin red: con caché se sigue normal; sin caché se muestra la pantalla de reintento.
        if (!cache) setSinConexion(true);
        setLoading(false);
        return;
      }
      const validador = equipo.data?.rol === 'validador';
      setProfileState(perfil.data);
      setEsValidador(validador);
      setSinConexion(false);
      setLoading(false);
      cachePersonal.guardar(userId, 'perfil', { profile: perfil.data, esValidador: validador });
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, intento]);

  const reintentar = useCallback(() => {
    setSinConexion(false);
    setLoading(true);
    setIntento((n) => n + 1);
  }, []);

  const setProfile = useCallback(
    (next: Profile) => {
      setProfileState(next);
      if (userId) cachePersonal.guardar(userId, 'perfil', { profile: next, esValidador });
    },
    [userId, esValidador],
  );

  const value = useMemo(
    () => ({
      profile,
      loading,
      onboarded: Boolean(profile?.avatar_id && profile.intereses && profile.intereses.length > 0),
      esValidador,
      sinConexion,
      reintentar,
      setProfile,
    }),
    [profile, loading, esValidador, sinConexion, reintentar, setProfile],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  return useContext(ProfileContext);
}
