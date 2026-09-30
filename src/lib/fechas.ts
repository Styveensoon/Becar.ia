// Fechas como 'YYYY-MM-DD' en hora local, mismo formato que `oportunidades.fecha_limite` (date).
export function toDateKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export type Urgencia = 'success' | 'warning' | 'danger' | 'vencida';

// Días naturales de hoy a la fecha (negativo si ya pasó).
export function diasRestantes(fecha: string, hoy = new Date()): number {
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return Math.round((fromDateKey(fecha).getTime() - inicioHoy.getTime()) / 86_400_000);
}

// Regla del badge de fecha límite (CLAUDE.md §7): >7 días success, 3-7 warning, <3 danger.
export function urgencia(fechaLimite: string, hoy = new Date()): Urgencia {
  const dias = diasRestantes(fechaLimite, hoy);
  if (dias < 0) return 'vencida';
  if (dias < 3) return 'danger';
  if (dias <= 7) return 'warning';
  return 'success';
}

export const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;
