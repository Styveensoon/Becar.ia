import type { Oportunidad } from './oportunidades';
import { supabase } from './supabase';

// Solo para cuentas del equipo: RLS les deja leer pendientes/rechazadas y la RPC
// validar_oportunidad es la única forma de cambiar el estado.

export type ParaValidar = Oportunidad & {
  estado: 'pendiente_validar' | 'publicado' | 'rechazado';
  origen: 'manual' | 'pipeline';
  evidencia_cita: string | null;
  evidencia_verificada: boolean;
  notas_validacion: string | null;
  motivo_rechazo: string | null;
  validado_at: string | null;
  created_at: string;
};

export type Bandeja = 'pendientes' | 'historial';

export async function listarBandeja(bandeja: Bandeja): Promise<ParaValidar[]> {
  const base = supabase.from('oportunidades').select('*');
  const query =
    bandeja === 'pendientes'
      ? base
          .eq('estado', 'pendiente_validar')
          // Primero lo que tiene evidencia comprobada y lo que cierra antes.
          .order('evidencia_verificada', { ascending: false })
          .order('fecha_limite', { ascending: true, nullsFirst: false })
      : base
          .in('estado', ['publicado', 'rechazado'])
          .not('validado_at', 'is', null)
          .order('validado_at', { ascending: false })
          .limit(50);
  const { data, error } = await query.returns<ParaValidar[]>();
  if (error) throw error;
  return data ?? [];
}

export async function obtenerParaValidar(id: string): Promise<ParaValidar | null> {
  const { data, error } = await supabase.from('oportunidades').select('*').eq('id', id).maybeSingle<ParaValidar>();
  if (error) throw error;
  return data;
}

export async function decidir(id: string, decision: 'publicado' | 'rechazado', motivo?: string) {
  const { error } = await supabase.rpc('validar_oportunidad', {
    p_id: id,
    p_decision: decision,
    p_motivo: motivo ?? null,
  });
  if (error) throw error;
}

export const MOTIVOS_RECHAZO = [
  'Ya cerró',
  'La fuente no es oficial',
  'Fecha límite incorrecta',
  'Datos no coinciden con la fuente',
  'Duplicada',
  'No aplica a estudiantes en México',
] as const;
