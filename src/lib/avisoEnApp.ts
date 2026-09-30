import type { AvisoInmediato } from './recordatorios';

// Canal mínimo para mostrar un aviso tipo notificación dentro de la app (InAppNotice).
// Se usa cuando el sistema no puede mostrar la notificación: Expo Go en Android o sin permiso.
type Oyente = (aviso: AvisoInmediato) => void;
const oyentes = new Set<Oyente>();

export function mostrarAvisoEnApp(aviso: AvisoInmediato) {
  oyentes.forEach((o) => o(aviso));
}

export function escucharAvisosEnApp(oyente: Oyente): () => void {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}
