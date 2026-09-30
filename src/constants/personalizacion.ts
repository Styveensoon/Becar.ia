import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import type { Tema } from '@/constants/temas';
import type { NivelEducativo, RangoEdad } from '@/lib/authActions';

type IconName = ComponentProps<typeof Ionicons>['name'];

// Colores de perfil: solo para el fondo del avatar (CLAUDE.md §1). No usar en otro contexto.
export const profileColors = [
  { id: 'orange', label: 'Naranja', hex: '#FF7A33' },
  { id: 'yellow', label: 'Amarillo', hex: '#FFC145' },
  { id: 'green', label: 'Verde', hex: '#6BC28C' },
  { id: 'blue', label: 'Azul', hex: '#5B9BD5' },
  { id: 'pink', label: 'Rosa', hex: '#F2789A' },
  { id: 'purple', label: 'Morado', hex: '#9B8AE0' },
] as const;

export type ProfileColorId = (typeof profileColors)[number]['id'];

export function profileColorHex(id: string | null | undefined): string {
  return profileColors.find((c) => c.id === id)?.hex ?? profileColors[0].hex;
}

// TODO: reemplazar los íconos por las 12 ilustraciones 2D reales (fondo transparente).
// Basta con cambiar `icon` por `image: require(...)` aquí y en `Avatar`.
export const avatars = [
  { id: 'avatar-1', icon: 'rocket-outline' },
  { id: 'avatar-2', icon: 'planet-outline' },
  { id: 'avatar-3', icon: 'paw-outline' },
  { id: 'avatar-4', icon: 'leaf-outline' },
  { id: 'avatar-5', icon: 'flash-outline' },
  { id: 'avatar-6', icon: 'bulb-outline' },
  { id: 'avatar-7', icon: 'musical-notes-outline' },
  { id: 'avatar-8', icon: 'game-controller-outline' },
  { id: 'avatar-9', icon: 'telescope-outline' },
  { id: 'avatar-10', icon: 'flask-outline' },
  { id: 'avatar-11', icon: 'basketball-outline' },
  { id: 'avatar-12', icon: 'color-palette-outline' },
] as const satisfies readonly { id: string; icon: IconName }[];

// `temas`: temas de convocatoria (Home) que alimentan las sugerencias de cada interés.
export const intereses = [
  { id: 'ciencia-tecnologia', label: 'Ciencias y Tecnología', temas: ['iot', 'ia', 'robotica', 'programacion'] },
  { id: 'artes-humanidades', label: 'Artes y Humanidades', temas: ['arte-diseno'] },
  { id: 'negocios-emprendimiento', label: 'Negocios y Emprendimiento', temas: ['negocios'] },
  { id: 'salud-bienestar', label: 'Salud y Bienestar', temas: ['salud'] },
  { id: 'idiomas-comunicacion', label: 'Idiomas y Comunicación', temas: ['idiomas'] },
  { id: 'deportes-voluntariado-ambiente', label: 'Deportes, Voluntariado y Medio Ambiente', temas: ['medio-ambiente'] },
] as const satisfies readonly { id: string; label: string; temas: readonly Tema['id'][] }[];

export const MIN_INTERESES = 2;

// Opciones de registro, reutilizadas al editar el perfil.
export const rangosEdad: { value: RangoEdad; label: string }[] = [
  { value: '13-15', label: '13-15' },
  { value: '16-17', label: '16-17' },
  { value: '18+', label: '18+' },
];

export const nivelesEducativos: { value: NivelEducativo; label: string }[] = [
  { value: 'secundaria', label: 'Secundaria' },
  { value: 'prepa', label: 'Prepa' },
  { value: 'universidad', label: 'Universidad' },
];

export const MAX_MOTE = 30;

export function esMenorDeEdad(rango: RangoEdad | null | undefined): boolean {
  return rango === '13-15' || rango === '16-17';
}

// La edad solo avanza: al editar el perfil el rango puede subir (13-15 → 16-17 → 18+), nunca
// bajar. Así una cuenta registrada como adulta no puede volverse "menor" sin el consentimiento
// del tutor que se da en el registro. Espejo del trigger profiles_rango_edad_guard en la BD.
export function rangoPermitido(actual: RangoEdad | null | undefined, nuevo: RangoEdad): boolean {
  if (!actual) return !esMenorDeEdad(nuevo);
  const orden = rangosEdad.map((r) => r.value);
  return orden.indexOf(nuevo) >= orden.indexOf(actual);
}
