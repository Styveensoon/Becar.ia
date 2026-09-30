import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Alert } from 'react-native';

import { useAuth } from './auth';
import { cachePersonal } from './cache';
import { CAMPOS_LISTA, resumen, type OportunidadResumen } from './oportunidades';
import { avisosDisponibles, pedirPermiso, permisoConcedido, sincronizarRecordatorios } from './recordatorios';
import { supabase } from './supabase';

type GuardadasState = {
  // Favoritos del usuario, en el orden en que se guardaron (más reciente primero).
  items: OportunidadResumen[];
  loading: boolean;
  isSaved: (id: string) => boolean;
  toggle: (oportunidad: OportunidadResumen) => void;
  // Permiso de notificaciones para los recordatorios de cierre (null = aún no se sabe).
  permisoAvisos: boolean | null;
  // 'bloqueado': el sistema ya no pregunta, hay que mandar a Ajustes.
  activarAvisos: () => Promise<'concedido' | 'negado' | 'bloqueado'>;
};

const GuardadasContext = createContext<GuardadasState>({
  items: [],
  loading: true,
  isSaved: () => false,
  toggle: () => {},
  permisoAvisos: null,
  activarAvisos: async () => 'negado',
});

type Fila = { oportunidades: OportunidadResumen | null };

export function GuardadasProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [items, setItems] = useState<OportunidadResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [permisoAvisos, setPermisoAvisos] = useState<boolean | null>(null);

  useEffect(() => {
    permisoConcedido()
      .then(setPermisoAvisos)
      .catch(() => setPermisoAvisos(false));
  }, []);

  // Cada cambio en favoritos (o al conceder permiso) deja los avisos programados al día.
  useEffect(() => {
    if (loading || !permisoAvisos) return;
    sincronizarRecordatorios(items);
  }, [items, loading, permisoAvisos]);

  const activarAvisos = useCallback(async () => {
    const resultado = await pedirPermiso().catch(() => 'negado' as const);
    setPermisoAvisos(resultado === 'concedido');
    return resultado;
  }, []);

  // Primero lo guardado en el teléfono (favoritos visibles sin conexión), luego la red.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const cache = await cachePersonal.leer<OportunidadResumen[]>(userId, 'favoritos');
      if (cancelled) return;
      if (cache) {
        setItems(cache);
        setLoading(false);
      }
      // RLS: solo filas propias; el embed solo trae oportunidades publicadas (las demás llegan null).
      const { data, error } = await supabase
        .from('guardadas')
        .select(`oportunidades(${CAMPOS_LISTA})`)
        .order('created_at', { ascending: false })
        .returns<Fila[]>();
      if (cancelled) return;
      if (!error) setItems((data ?? []).flatMap((f) => (f.oportunidades ? [f.oportunidades] : [])));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Cada cambio se guarda en el teléfono para la próxima vez que se abra sin conexión.
  useEffect(() => {
    if (userId && !loading) cachePersonal.guardar(userId, 'favoritos', items);
  }, [userId, loading, items]);

  const savedIds = useMemo(() => new Set(items.map((o) => o.id)), [items]);
  const isSaved = useCallback((id: string) => savedIds.has(id), [savedIds]);

  // Optimista: el corazón cambia al instante y se revierte si la BD falla.
  const toggle = useCallback(
    (entrada: OportunidadResumen) => {
      if (!userId) return;
      // Solo el resumen: las tarjetas pueden traer campos extra (p. ej. `motivo` de "Para ti").
      const o = resumen(entrada);
      const wasSaved = savedIds.has(o.id);
      setItems((prev) => (wasSaved ? prev.filter((x) => x.id !== o.id) : [o, ...prev]));
      // El permiso se pide en contexto: la primera vez que guarda algo.
      if (!wasSaved && avisosDisponibles && permisoAvisos === false) activarAvisos();

      const request = wasSaved
        ? supabase.from('guardadas').delete().eq('user_id', userId).eq('oportunidad_id', o.id)
        : supabase.from('guardadas').insert({ user_id: userId, oportunidad_id: o.id });

      request.then(({ error }) => {
        // 23505 = ya estaba guardada (p. ej. desde otro dispositivo): el estado final es el mismo.
        if (!error || error.code === '23505') return;
        setItems((prev) => (wasSaved ? [o, ...prev.filter((x) => x.id !== o.id)] : prev.filter((x) => x.id !== o.id)));
        Alert.alert(
          'Sin conexión',
          'Para guardar o quitar favoritos necesitas internet. Tus favoritos guardados sí se ven sin conexión.',
        );
      });
    },
    [userId, savedIds, permisoAvisos, activarAvisos],
  );

  const value = useMemo(
    () => ({ items, loading, isSaved, toggle, permisoAvisos, activarAvisos }),
    [items, loading, isSaved, toggle, permisoAvisos, activarAvisos],
  );

  return <GuardadasContext.Provider value={value}>{children}</GuardadasContext.Provider>;
}

export function useGuardadas() {
  return useContext(GuardadasContext);
}
