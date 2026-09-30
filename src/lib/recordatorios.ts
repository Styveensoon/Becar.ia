import { isRunningInExpoGo } from 'expo';
import type * as NotificationsModule from 'expo-notifications';
import { Platform } from 'react-native';

import { fromDateKey } from './fechas';
import type { OportunidadResumen } from './oportunidades';

// En Android dentro de Expo Go, el solo hecho de IMPORTAR expo-notifications truena: el paquete
// registra al cargarse un listener de tokens push (DevicePushTokenAutoRegistration.fx) y Expo Go
// lanza error porque quitó push en Android desde el SDK 53. Como este archivo se importa desde
// auth.tsx, eso tumbaba la app al arrancar. Por eso el módulo se carga bajo demanda y solo donde
// funciona: build de desarrollo / Play Store (Android) y iOS.
export const avisosDisponibles = !(isRunningInExpoGo() && Platform.OS === 'android');

const Notifications: typeof NotificationsModule | null = avisosDisponibles
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports -- import condicional (ver arriba)
    require('expo-notifications')
  : null;

// Días antes del cierre en que se avisa, y hora local del aviso.
export const DIAS_AVISO = [7, 3, 1] as const;
const HORA_AVISO = 10;
const CANAL = 'fechas-limite';
const CANAL_NOVEDADES = 'novedades';
const NARANJA = '#FF7A33';
// Prefijo de los ids de notificación de esta app, para no tocar otras programadas.
const PREFIJO = 'cierre:';

export type Aviso = {
  identifier: string;
  fecha: Date;
  dias: (typeof DIAS_AVISO)[number];
  oportunidad: OportunidadResumen;
};

// Notificaciones locales (sin servidor): funcionan con la app cerrada.
Notifications?.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function prepararCanal() {
  if (!Notifications || Platform.OS !== 'android') return;
  // Dos canales: el usuario puede apagar las novedades sin perder los recordatorios de cierre.
  await Notifications.setNotificationChannelAsync(CANAL, {
    name: 'Fechas límite',
    description: 'Avisos antes de que cierre una convocatoria guardada',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 120, 200],
    lightColor: NARANJA,
  });
  await Notifications.setNotificationChannelAsync(CANAL_NOVEDADES, {
    name: 'Convocatorias nuevas para ti',
    description: 'Cuando se publica algo de tus temas y tu nivel',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 120],
    lightColor: NARANJA,
  });
}

// Todos los avisos (pasados y futuros) que corresponden a los favoritos. Es cálculo puro,
// así que la pestaña de Avisos funciona aunque las notificaciones no estén disponibles.
export function planDeAvisos(items: OportunidadResumen[]): Aviso[] {
  return items.flatMap((o) => {
    if (!o.fecha_limite) return [];
    const cierre = fromDateKey(o.fecha_limite);
    return DIAS_AVISO.map((dias) => {
      const fecha = new Date(cierre.getFullYear(), cierre.getMonth(), cierre.getDate() - dias, HORA_AVISO);
      return { identifier: `${PREFIJO}${o.id}:${dias}`, fecha, dias, oportunidad: o };
    });
  });
}

export async function permisoConcedido(): Promise<boolean> {
  if (!Notifications) return false;
  const { granted } = await Notifications.getPermissionsAsync();
  return granted;
}

// Se pide en contexto (al guardar el primer favorito), no al abrir la app.
// Devuelve 'bloqueado' cuando el sistema ya no deja volver a preguntar (hay que ir a Ajustes).
export async function pedirPermiso(): Promise<'concedido' | 'negado' | 'bloqueado'> {
  if (!Notifications) return 'negado';
  const actual = await Notifications.getPermissionsAsync();
  if (actual.granted) return 'concedido';
  if (!actual.canAskAgain) return 'bloqueado';
  // Android 13+: el canal debe existir antes de pedir el permiso.
  await prepararCanal();
  const { granted } = await Notifications.requestPermissionsAsync();
  return granted ? 'concedido' : 'negado';
}

export function textoAviso(dias: number): { titulo: string; cierre: string } {
  if (dias <= 0) return { titulo: '🔥 ¡Hoy es el último día!', cierre: 'Cierra hoy' };
  if (dias === 1) return { titulo: '⏰ Cierra mañana', cierre: 'Última llamada' };
  if (dias === 3) return { titulo: '⏳ Faltan 3 días', cierre: 'Aún estás a tiempo' };
  return { titulo: `📅 Faltan ${dias} días`, cierre: 'Ve preparando tus documentos' };
}

// Las sincronizaciones se encadenan: dos cambios seguidos de favoritos no deben leer la lista de
// programadas al mismo tiempo (se duplicarían avisos o se cancelaría uno recién creado).
let cola: Promise<void> = Promise.resolve();

export function sincronizarRecordatorios(items: OportunidadResumen[]): Promise<void> {
  cola = cola.then(() => sincronizar(items)).catch(() => {});
  return cola;
}

// Deja programados exactamente los avisos futuros de los favoritos: cancela los que sobran
// (favorito quitado) y programa los que faltan.
async function sincronizar(items: OportunidadResumen[]) {
  if (!Notifications || !(await permisoConcedido())) return;
  await prepararCanal();

  const ahora = Date.now();
  const deseados = new Map(
    planDeAvisos(items)
      .filter((a) => a.fecha.getTime() > ahora)
      .map((a) => [a.identifier, a]),
  );
  const programados = (await Notifications.getAllScheduledNotificationsAsync()).filter((n) =>
    n.identifier.startsWith(PREFIJO),
  );

  const actuales = new Set<string>();
  for (const n of programados) {
    if (deseados.has(n.identifier)) actuales.add(n.identifier);
    else await Notifications.cancelScheduledNotificationAsync(n.identifier);
  }

  for (const aviso of deseados.values()) {
    if (actuales.has(aviso.identifier)) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: aviso.identifier,
      content: {
        title: textoAviso(aviso.dias).titulo,
        body: `${aviso.oportunidad.titulo}. ${textoAviso(aviso.dias).cierre} 💪`,
        data: { oportunidadId: aviso.oportunidad.id },
        color: NARANJA,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: aviso.fecha,
        channelId: CANAL,
      },
    });
  }
}

export type AvisoInmediato = {
  titulo: string;
  cuerpo: string;
  // Solo iOS: línea gris bajo el título (p. ej. "Porque te interesa IA").
  subtitulo?: string;
  oportunidadId?: string;
  canal?: 'novedades' | 'fechas-limite';
};

// Notificación inmediata (novedades y pruebas). Devuelve false si no se pudo mostrar como
// notificación del sistema (Expo Go en Android o sin permiso): quien llama decide el plan B.
export async function notificarAhora(aviso: AvisoInmediato): Promise<boolean> {
  if (!Notifications || !(await permisoConcedido())) return false;
  await prepararCanal();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: aviso.titulo,
      body: aviso.cuerpo,
      subtitle: aviso.subtitulo,
      data: aviso.oportunidadId ? { oportunidadId: aviso.oportunidadId } : {},
      color: NARANJA,
    },
    trigger: Platform.OS === 'android' ? { channelId: aviso.canal ?? CANAL_NOVEDADES } : null,
  });
  return true;
}

// Al cerrar sesión o borrar la cuenta no deben quedar avisos del usuario anterior.
export function cancelarRecordatorios(): Promise<void> {
  cola = cola
    .then(async () => {
      if (!Notifications) return;
      const programados = await Notifications.getAllScheduledNotificationsAsync();
      await Promise.all(
        programados
          .filter((n) => n.identifier.startsWith(PREFIJO))
          .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
      );
    })
    .catch(() => {});
  return cola;
}

// Tocar un recordatorio: incluye el caso de app cerrada (la abre la notificación).
// Devuelve la función para dejar de escuchar.
export function escucharToques(abrir: (oportunidadId: string) => void): () => void {
  if (!Notifications) return () => {};
  const manejar = (response: NotificationsModule.NotificationResponse | null) => {
    const id = response?.notification.request.content.data?.oportunidadId;
    if (typeof id !== 'string') return;
    // Se limpia para que al volver a montar no se reabra la misma.
    Notifications.clearLastNotificationResponse();
    abrir(id);
  };
  manejar(Notifications.getLastNotificationResponse());
  const sub = Notifications.addNotificationResponseReceivedListener(manejar);
  return () => sub.remove();
}
