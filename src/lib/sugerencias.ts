import { intereses, nivelesEducativos } from '@/constants/personalizacion';
import { temas, type Tema } from '@/constants/temas';

import { diasRestantes } from './fechas';
import { resumen, type Oportunidad, type OportunidadResumen } from './oportunidades';
import type { Profile } from './profile';

// Todo se calcula en el teléfono sobre el catálogo local: funciona sin conexión.

// Edad mínima y máxima que puede tener alguien de cada rango autodeclarado.
const EDADES: Record<string, [number, number]> = {
  '13-15': [13, 15],
  '16-17': [16, 17],
  '18+': [18, 99],
};

export function temasDeInteres(profile: Profile): Set<Tema['id']> {
  return new Set(intereses.filter((i) => profile.intereses?.includes(i.id)).flatMap((i) => i.temas));
}

// ¿Esta persona puede participar? Nunca se sugiere algo para lo que no da la edad o el nivel
// (audiencia con menores de 18).
export function esParaPerfil(o: Oportunidad, profile: Profile): boolean {
  const rango = profile.rango_edad ? EDADES[profile.rango_edad] : null;
  if (rango && o.edad_minima && o.edad_minima > rango[1]) return false;
  if (rango && o.edad_maxima && o.edad_maxima < rango[0]) return false;
  const nivel = profile.nivel_educativo;
  if (nivel && o.niveles.length) {
    return o.niveles.includes(nivel) || (nivel === 'universidad' && o.niveles.includes('posgrado'));
  }
  return true;
}

// Motor de sugerencias (CLAUDE.md): score simple cruzando nivel, intereses y edad del perfil.
function puntuar(o: Oportunidad, profile: Profile, temasInteres: Set<Tema['id']>): number {
  if (!esParaPerfil(o, profile)) return -1;
  let score = 0;
  const nivel = profile.nivel_educativo;
  if (nivel && o.niveles.includes(nivel)) score += 3;
  else if (nivel && o.niveles.length) score += 1; // universidad → posgrado
  for (const t of o.temas) if (temasInteres.has(t)) score += 2;
  // Empujón a lo que cierra en las próximas 2 semanas.
  if (o.fecha_limite && diasRestantes(o.fecha_limite) <= 14) score += 1;
  return score;
}

export type Sugerencia = OportunidadResumen & {
  // Por qué se sugiere, en lenguaje de la persona ("Te interesa Programación").
  motivo: string;
};

export function motivo(o: Oportunidad, profile: Profile, temasInteres: Set<Tema['id']>): string {
  const tema = o.temas.find((t) => temasInteres.has(t));
  if (tema) return `Te interesa ${temas.find((t) => t.id === tema)?.label ?? tema}`;
  if (o.fecha_limite && diasRestantes(o.fecha_limite) <= 14) return 'Cierra pronto';
  const nivel = nivelesEducativos.find((n) => n.value === profile.nivel_educativo)?.label;
  return nivel ? `Para ${nivel.toLowerCase()}` : 'Para ti';
}

export function sugerir(items: Oportunidad[], profile: Profile, limite = 8): Sugerencia[] {
  const temasInteres = temasDeInteres(profile);
  return items
    .map((o) => ({ o, score: puntuar(o, profile, temasInteres) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || (a.o.fecha_limite ?? '9999').localeCompare(b.o.fecha_limite ?? '9999'))
    .slice(0, limite)
    .map(({ o }) => ({ ...resumen(o), motivo: motivo(o, profile, temasInteres) }));
}

// "Cierran esta semana": lo que cierra de hoy a 7 días y que esta persona sí puede aplicar,
// aunque no coincida con sus intereses.
export function cierranPronto(items: Oportunidad[], profile: Profile | null, dias = 7): Oportunidad[] {
  return items
    .filter((o) => {
      if (!o.fecha_limite) return false;
      const d = diasRestantes(o.fecha_limite);
      return d >= 0 && d <= dias && (!profile || esParaPerfil(o, profile));
    })
    .sort((a, b) => (a.fecha_limite ?? '').localeCompare(b.fecha_limite ?? ''));
}
