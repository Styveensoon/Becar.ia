import AsyncStorage from '@react-native-async-storage/async-storage';

import { almacenSeguro } from './almacenSeguro';

// Caché para usar la app sin conexión. Dos zonas:
// - pública: catálogo de convocatorias publicadas (información pública) → AsyncStorage.
// - personal: perfil y favoritos del usuario → almacenamiento cifrado del dispositivo.
// Todo se versiona: si cambia la forma de los datos, se sube VERSION y la caché vieja se ignora.
const VERSION = 'v1';
const pub = (clave: string) => `becaria.${VERSION}.${clave}`;
const per = (userId: string, clave: string) => `becaria.${VERSION}.${userId}.${clave}`;

async function leer<T>(obtener: () => Promise<string | null>): Promise<T | null> {
  try {
    const raw = await obtener();
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null; // caché corrupta o almacenamiento no disponible: se trata como vacía
  }
}

export const cachePublica = {
  leer: <T>(clave: string) => leer<T>(() => AsyncStorage.getItem(pub(clave))),
  guardar: (clave: string, valor: unknown) => AsyncStorage.setItem(pub(clave), JSON.stringify(valor)).catch(() => {}),
};

export const cachePersonal = {
  leer: <T>(userId: string, clave: string) => leer<T>(() => almacenSeguro.getItem(per(userId, clave))),
  guardar: (userId: string, clave: string, valor: unknown) =>
    almacenSeguro.setItem(per(userId, clave), JSON.stringify(valor)).catch(() => {}),
  // Al cerrar sesión o borrar la cuenta no deben quedar datos personales en el teléfono.
  borrar: (userId: string, claves: string[]) =>
    Promise.all(claves.map((c) => almacenSeguro.removeItem(per(userId, c)).catch(() => {}))),
};

export const CLAVES_PERSONALES = ['perfil', 'favoritos', 'novedades', 'preferencias'] as const;

// Preferencias del usuario en este teléfono (derecho de oposición).
export type Preferencias = { avisosNovedades: boolean };
export const PREFERENCIAS_DEFAULT: Preferencias = { avisosNovedades: true };
