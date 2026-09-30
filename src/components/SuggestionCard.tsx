import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { CategoryBadge } from '@/components/CategoryBadge';
import { DeadlineBadge } from '@/components/DeadlineBadge';
import { HeartButton } from '@/components/HeartButton';
import { temas } from '@/constants/temas';
import { cardShadow, colors, radius, spacing, typography } from '@/constants/theme';
import type { Categoria } from '@/lib/oportunidades';
import type { Sugerencia } from '@/lib/sugerencias';

type IconName = ComponentProps<typeof Ionicons>['name'];

type SuggestionCardProps = {
  sugerencia: Sugerencia;
  width: number;
  onPress: () => void;
};

// Sin tema, la ilustración sale de la categoría.
const ARTE_CATEGORIA: Record<Categoria, { icons: readonly [IconName, IconName]; tint: string }> = {
  beca: { icons: ['school', 'cash-outline'], tint: colors.primaryTint },
  movilidad: { icons: ['airplane', 'globe-outline'], tint: '#DCEAF7' },
  concurso: { icons: ['trophy', 'medal-outline'], tint: '#FFF0C7' },
  certificacion: { icons: ['ribbon', 'document-text-outline'], tint: '#DCF1E3' },
  evento: { icons: ['calendar', 'people-outline'], tint: '#EDE8FB' },
};

const ART_HEIGHT = 92;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function SuggestionCard({ sugerencia, width, onPress }: SuggestionCardProps) {
  const tema = temas.find((t) => sugerencia.temas.includes(t.id));
  const arte = tema
    ? { icons: [tema.icons[0], tema.icons[1]] as const, tint: tema.tint }
    : ARTE_CATEGORIA[sugerencia.categoria];

  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={`${sugerencia.titulo}. ${sugerencia.motivo}`}
      onPressIn={() => scale.set(withSpring(0.97, { damping: 15, stiffness: 300 }))}
      onPressOut={() => scale.set(withSpring(1, { damping: 15, stiffness: 300 }))}
      onPress={onPress}
      style={[styles.card, { width }, pressStyle]}
    >
      <View style={[styles.art, { backgroundColor: arte.tint }]}>
        <Ionicons name={arte.icons[0]} size={84} color={colors.primary} style={styles.artMain} />
        <Ionicons name={arte.icons[1]} size={30} color={colors.secondary} style={styles.artSecond} />
        <View style={styles.artTop}>
          <CategoryBadge categoria={sugerencia.categoria} />
          <HeartButton oportunidad={sugerencia} />
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.motivo}>
          <Ionicons name="sparkles" size={12} color={colors.primaryText} />
          <Text style={styles.motivoText} numberOfLines={1}>
            {sugerencia.motivo}
          </Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {sugerencia.titulo}
        </Text>
        {sugerencia.institucion && (
          <Text style={styles.institucion} numberOfLines={1}>
            {sugerencia.institucion}
          </Text>
        )}
        <View style={styles.footer}>
          {sugerencia.fecha_limite && <DeadlineBadge fecha={sugerencia.fecha_limite} />}
          <Ionicons name="arrow-forward-circle" size={28} color={colors.primary} />
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    ...cardShadow,
  },
  art: {
    height: ART_HEIGHT,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    overflow: 'hidden',
  },
  artMain: { position: 'absolute', right: -10, bottom: -18, opacity: 0.9 },
  artSecond: { position: 'absolute', right: 86, bottom: 10, opacity: 0.35 },
  artTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  body: {
    padding: spacing.lg,
    gap: spacing.xs,
    flex: 1,
  },
  motivo: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    borderRadius: radius.full,
    paddingVertical: 2,
    paddingHorizontal: 10,
    backgroundColor: colors.primaryTint,
    marginBottom: spacing.xs,
  },
  motivoText: { ...typography.captionMedium, color: colors.primaryText },
  title: {
    ...typography.h2,
    color: colors.text,
    // Siempre ocupa 2 líneas para que todas las tarjetas del carrusel midan lo mismo.
    minHeight: typography.h2.lineHeight * 2,
  },
  institucion: { ...typography.caption, color: colors.textMuted },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
});
