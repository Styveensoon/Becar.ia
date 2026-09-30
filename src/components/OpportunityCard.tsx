import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { CategoryBadge } from '@/components/CategoryBadge';
import { DeadlineBadge } from '@/components/DeadlineBadge';
import { HeartButton } from '@/components/HeartButton';
import { cardShadow, colors, radius, spacing, typography } from '@/constants/theme';
import type { OportunidadResumen } from '@/lib/oportunidades';

type OpportunityCardProps = {
  oportunidad: OportunidadResumen;
  onPress: () => void;
  style?: ViewStyle;
};

export function OpportunityCard({ oportunidad, onPress, style }: OpportunityCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={oportunidad.titulo}
      onPress={onPress}
      style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        <CategoryBadge categoria={oportunidad.categoria} />
        <HeartButton oportunidad={oportunidad} />
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {oportunidad.titulo}
      </Text>
      {oportunidad.institucion && (
        <Text style={styles.institucion} numberOfLines={1}>
          {oportunidad.institucion}
        </Text>
      )}
      {oportunidad.fecha_limite && (
        <View style={styles.footer}>
          <DeadlineBadge fecha={oportunidad.fecha_limite} />
        </View>
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
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -spacing.xs,
    marginRight: -spacing.xs,
  },
  pressed: {
    opacity: 0.85,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  institucion: {
    ...typography.caption,
    color: colors.textMuted,
  },
  footer: {
    marginTop: spacing.xs,
  },
});
