import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { CategoryBadge } from '@/components/CategoryBadge';
import { DeadlineBadge } from '@/components/DeadlineBadge';
import { cardShadow, colors, radius, spacing, typography } from '@/constants/theme';
import { MESES } from '@/lib/fechas';
import type { ParaValidar } from '@/lib/validacion';

type ValidationCardProps = {
  item: ParaValidar;
  onPress: () => void;
};

function fechaCorta(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MESES[d.getMonth()].slice(0, 3).toLowerCase()}`;
}

export function ValidationCard({ item, onPress }: ValidationCardProps) {
  const pendiente = item.estado === 'pendiente_validar';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Revisar ${item.titulo}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.badges}>
        <CategoryBadge categoria={item.categoria} />
        {pendiente && item.fecha_limite && <DeadlineBadge fecha={item.fecha_limite} />}
        {!pendiente && (
          <Badge
            label={item.estado === 'publicado' ? 'Publicada' : 'Rechazada'}
            background={item.estado === 'publicado' ? `${colors.success}26` : colors.secondaryTint}
            color={item.estado === 'publicado' ? colors.success : colors.textMuted}
          />
        )}
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {item.titulo}
      </Text>
      {item.institucion && (
        <Text style={styles.meta} numberOfLines={1}>
          {item.institucion}
        </Text>
      )}

      {pendiente ? (
        <View style={styles.evidencia}>
          <Ionicons
            name={item.evidencia_verificada ? 'shield-checkmark' : 'eye-outline'}
            size={16}
            color={item.evidencia_verificada ? colors.success : colors.warning}
          />
          <Text style={[styles.evidenciaText, { color: item.evidencia_verificada ? colors.success : colors.warning }]}>
            {item.evidencia_verificada ? 'Fecha comprobada en la fuente' : 'Revisar la fuente a mano'}
          </Text>
          <Text style={styles.origen}>
            {item.origen === 'pipeline' ? 'Pipeline' : 'Manual'} · {fechaCorta(item.created_at)}
          </Text>
        </View>
      ) : (
        <Text style={styles.meta} numberOfLines={2}>
          {item.validado_at && `Decidida el ${fechaCorta(item.validado_at)}`}
          {item.motivo_rechazo && ` · ${item.motivo_rechazo}`}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    ...cardShadow,
  },
  pressed: { opacity: 0.85 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  title: { ...typography.h2, color: colors.text },
  meta: { ...typography.caption, color: colors.textMuted },
  evidencia: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.xs },
  evidenciaText: { ...typography.captionMedium, flex: 1 },
  origen: { ...typography.caption, color: colors.textMuted },
});
