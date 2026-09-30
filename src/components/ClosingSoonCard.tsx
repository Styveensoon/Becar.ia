import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HeartButton } from '@/components/HeartButton';
import { cardShadow, colors, radius, spacing, typography } from '@/constants/theme';
import { diasRestantes, fromDateKey } from '@/lib/fechas';
import { resumen, type Oportunidad } from '@/lib/oportunidades';

type ClosingSoonCardProps = {
  oportunidad: Oportunidad;
  onPress: () => void;
};

// Rojo solo para urgencia de fecha (<3 días); 3-7 días en `warning` (CLAUDE.md §1).
function tonoUrgencia(dias: number) {
  return dias < 3 ? colors.danger : colors.warning;
}

function cuentaRegresiva(dias: number): { numero: string; unidad: string } {
  if (dias === 0) return { numero: '¡Hoy!', unidad: 'último día' };
  if (dias === 1) return { numero: '1', unidad: 'día' };
  return { numero: String(dias), unidad: 'días' };
}

// Qué tanto del periodo de inscripción ya pasó (solo si se conoce cuándo abrió).
function avance(o: Oportunidad): number | null {
  if (!o.fecha_inicio_inscripcion || !o.fecha_limite) return null;
  const inicio = fromDateKey(o.fecha_inicio_inscripcion).getTime();
  const fin = fromDateKey(o.fecha_limite).getTime();
  if (fin <= inicio) return null;
  return Math.min(1, Math.max(0, (Date.now() - inicio) / (fin - inicio)));
}

export function ClosingSoonCard({ oportunidad: o, onPress }: ClosingSoonCardProps) {
  const dias = o.fecha_limite ? diasRestantes(o.fecha_limite) : 0;
  const tono = tonoUrgencia(dias);
  const { numero, unidad } = cuentaRegresiva(dias);
  const progreso = avance(o);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${o.titulo}. Cierra ${dias === 0 ? 'hoy' : `en ${dias} ${unidad}`}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {/* Tinte al 15% con el número en el semántico sólido, como los badges de urgencia. */}
      <View style={[styles.countdown, { backgroundColor: `${tono}26` }]}>
        <Text style={[styles.numero, { color: tono }, numero.length > 2 && styles.numeroTexto]}>{numero}</Text>
        <Text style={[styles.unidad, { color: tono }]}>{unidad}</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {o.titulo}
        </Text>
        {o.institucion && (
          <Text style={styles.institucion} numberOfLines={1}>
            {o.institucion}
          </Text>
        )}
        {progreso !== null && (
          <View style={styles.barra} accessibilityLabel={`Ya pasó el ${Math.round(progreso * 100)}% del plazo`}>
            <View style={[styles.relleno, { width: `${Math.round(progreso * 100)}%`, backgroundColor: tono }]} />
          </View>
        )}
      </View>

      <HeartButton oportunidad={resumen(o)} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...cardShadow,
  },
  pressed: { opacity: 0.85 },
  countdown: {
    width: 68,
    height: 68,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numero: { fontFamily: typography.display.fontFamily, fontSize: 26, lineHeight: 30 },
  numeroTexto: { fontSize: 16, lineHeight: 20 },
  unidad: { ...typography.captionMedium, fontSize: 11, lineHeight: 14 },
  body: { flex: 1, gap: 2 },
  title: { ...typography.bodyMedium, color: colors.text },
  institucion: { ...typography.caption, color: colors.textMuted },
  barra: {
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.secondaryTint,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  relleno: { height: '100%', borderRadius: radius.full },
});
