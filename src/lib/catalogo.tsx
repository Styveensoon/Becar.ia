import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { cachePublica } from './cache';
import { descargarCatalogo, esVigente, type Oportunidad } from './oportunidades';

// Catálogo local de convocatorias publicadas y vigentes. Es la fuente de Home, buscador, temas,
// dados, "Para ti", "Cierran esta semana" y novedades: todo funciona sin conexión con lo último
// que se descargó, y se actualiza solo cuando hay red.

type CatalogoState = {
  items: Oportunidad[];
  // true mientras no hay nada que mostrar (ni caché ni red todavía).
  cargando: boolean;
  // La última actualización falló: se está mostrando lo guardado en el teléfono.
  sinConexion: boolean;
  actualizadoAt: number | null;
  refrescar: () => Promise<void>;
  porId: (id: string) => Oportunidad | undefined;
};

const CatalogoContext = createContext<CatalogoState>({
  items: [],
  cargando: true,
  sinConexion: false,
  actualizadoAt: null,
  refrescar: async () => {},
  porId: () => undefined,
});

type EnCache = { items: Oportunidad[]; at: number };
const CLAVE = 'catalogo';
// Al volver a la app se actualiza si lo guardado tiene más de este tiempo.
const REFRESCO_MS = 10 * 60_000;

export function CatalogoProvider({ children }: { children: ReactNode }) {
  const [todos, setTodos] = useState<Oportunidad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [sinConexion, setSinConexion] = useState(false);
  const [actualizadoAt, setActualizadoAt] = useState<number | null>(null);
  const actualizadoRef = useRef<number | null>(null);

  const refrescar = useCallback(async () => {
    try {
      const items = await descargarCatalogo();
      const at = Date.now();
      setTodos(items);
      setActualizadoAt(at);
      actualizadoRef.current = at;
      setSinConexion(false);
      cachePublica.guardar(CLAVE, { items, at } satisfies EnCache);
    } catch {
      setSinConexion(true);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cache = await cachePublica.leer<EnCache>(CLAVE);
      if (cancelled) return;
      if (cache) {
        setTodos(cache.items);
        setActualizadoAt(cache.at);
        actualizadoRef.current = cache.at;
        setCargando(false);
      }
      await refrescar();
    })();
    return () => {
      cancelled = true;
    };
  }, [refrescar]);

  // Al volver a primer plano, trae lo nuevo (sin martillar la red en cada cambio de app).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (estado) => {
      if (estado !== 'active') return;
      const at = actualizadoRef.current;
      if (!at || Date.now() - at > REFRESCO_MS) refrescar();
    });
    return () => sub.remove();
  }, [refrescar]);

  // Lo guardado puede tener días: se filtra lo que ya cerró.
  const items = useMemo(() => todos.filter(esVigente), [todos]);
  const indice = useMemo(() => new Map(todos.map((o) => [o.id, o])), [todos]);
  const porId = useCallback((id: string) => indice.get(id), [indice]);

  const value = useMemo(
    () => ({ items, cargando, sinConexion, actualizadoAt, refrescar, porId }),
    [items, cargando, sinConexion, actualizadoAt, refrescar, porId],
  );

  return <CatalogoContext.Provider value={value}>{children}</CatalogoContext.Provider>;
}

export function useCatalogo() {
  return useContext(CatalogoContext);
}
