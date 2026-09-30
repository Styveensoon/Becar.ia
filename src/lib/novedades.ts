import { useEffect } from 'react';

import { temas } from '@/constants/temas';

import { mostrarAvisoEnApp } from './avisoEnApp';
import { cachePersonal, type Preferencias } from './cache';
import { useCatalogo } from './catalogo';
import { diasRestantes, fromDateKey, MESES } from './fechas';
import { CATEGORIA_LABEL, type Oportunidad } from './oportunidades';
import type { Profile } from './profile';
import { notificarAhora, textoAviso, type AvisoInmediato } from './recordatorios';
import { esParaPerfil, temasDeInteres } from './sugerencias';

// Una convocatoria es "nueva para ti" si se publicó hace poco, puedes aplicar (nivel/edad) y
// toca alguno de tus temas.
export function nuevasParaTi(items: Oportunidad[], profile: Profile, desde: number): Oportunidad[] {
  const mios = temasDeInteres(profile);
  return items
    .filter(
      (o) =>
        o.publicado_at !== null &&
        Date.parse(o.publicado_at) > desde &&
        esParaPerfil(o, profile) &&
        o.temas.some((t) => mios.has(t)),
    )
    .sort((a, b) => Date.parse(b.publicado_at ?? '') - Date.parse(a.publicado_at ?? ''));
}

function fechaCorta(key: string): string {
  const d = fromDateKey(key);
  return `${d.getDate()} de ${MESES[d.getMonth()].toLowerCase()}`;
}

export function avisoDeNovedad(o: Oportunidad, profile: Profile): AvisoInmediato {
  const mios = temasDeInteres(profile);
  const tema = temas.find((t) => o.temas.includes(t.id) && mios.has(t.id));
  const categoria = CATEGORIA_LABEL[o.categoria].toLowerCase();
  return {
    titulo: `✨ Nueva ${categoria} para ti`,
    subtitulo: tema ? `Porque te interesa ${tema.label}` : undefined,
    cuerpo: o.fecha_limite ? `${o.titulo} · Cierra el ${fechaCorta(o.fecha_limite)}` : o.titulo,
    oportunidadId: o.id,
    canal: 'novedades',
  };
}

// Notificación del sistema si se puede; si no (Expo Go en Android, sin permiso), aviso en la app.
export async function avisar(aviso: AvisoInmediato) {
  const enviada = await notificarAhora(aviso).catch(() => false);
  if (!enviada) mostrarAvisoEnApp(aviso);
}

type Registro = { desde: number };

// Cada vez que el catálogo se actualiza con red, avisa de lo publicado desde la última revisión.
// Sin servidor de push: se revisa al abrir la app y al volver a ella.
export function useAvisarNovedades(profile: Profile | null, activo: boolean) {
  const { items, actualizadoAt, sinConexion } = useCatalogo();

  useEffect(() => {
    if (!activo || !profile || !actualizadoAt || sinConexion) return;
    let cancelled = false;
    (async () => {
      const registro = await cachePersonal.leer<Registro>(profile.id, 'novedades');
      if (cancelled) return;
      // Primera vez en este teléfono: se marca el punto de partida sin avisar de todo lo existente.
      if (!registro) {
        await cachePersonal.guardar(profile.id, 'novedades', { desde: actualizadoAt } satisfies Registro);
        return;
      }
      const nuevas = nuevasParaTi(items, profile, registro.desde);
      await cachePersonal.guardar(profile.id, 'novedades', { desde: actualizadoAt } satisfies Registro);
      if (!nuevas.length || cancelled) return;
      // Derecho de oposición: si apagó los avisos de novedades en "Mis datos", no se avisa.
      const pref = await cachePersonal.leer<Preferencias>(profile.id, 'preferencias');
      if (pref?.avisosNovedades === false || cancelled) return;

      if (nuevas.length <= 2) {
        for (const o of nuevas) await avisar(avisoDeNovedad(o, profile));
      } else {
        // Muchas a la vez: un solo aviso que resume, para no saturar.
        await avisar({
          titulo: `✨ ${nuevas.length} convocatorias nuevas para ti`,
          cuerpo: `${nuevas[0].titulo} y ${nuevas.length - 1} más de tus temas. Échales un ojo 👀`,
          oportunidadId: nuevas[0].id,
          canal: 'novedades',
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activo, profile, actualizadoAt, sinConexion, items]);
}

// Solo en desarrollo: cada toque a Inicio manda una notificación de muestra, rotando entre los
// tipos reales (novedad, recordatorio, último día) con convocatorias reales del catálogo.
let turnoPrueba = 0;
export function avisoDePrueba(items: Oportunidad[], profile: Profile): AvisoInmediato | null {
  if (!items.length) return null;
  const o = items[turnoPrueba % items.length];
  const tipo = turnoPrueba % 3;
  turnoPrueba++;
  if (tipo === 0) return avisoDeNovedad(o, profile);
  const dias = tipo === 1 ? 3 : o.fecha_limite ? Math.min(diasRestantes(o.fecha_limite), 0) : 0;
  const texto = textoAviso(dias);
  return {
    titulo: texto.titulo,
    cuerpo: `${o.titulo}. ${texto.cierre} 💪`,
    oportunidadId: o.id,
    canal: 'fechas-limite',
  };
}
