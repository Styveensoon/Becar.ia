import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cardShadow, colors, radius, spacing, typography } from '@/constants/theme';
import { escucharAvisosEnApp } from '@/lib/avisoEnApp';
import type { AvisoInmediato } from '@/lib/recordatorios';

const DURACION_MS = 4500;

// Aviso con forma de notificación que baja desde arriba. Tocarlo abre la convocatoria.
export function InAppNotice() {
  const insets = useSafeAreaInsets();
  const [aviso, setAviso] = useState<(AvisoInmediato & { key: number }) | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const quitar = escucharAvisosEnApp((nuevo) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAviso({ ...nuevo, key: Date.now() });
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setAviso(null), DURACION_MS);
    });
    return () => {
      quitar();
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (!aviso) return null;

  const abrir = () => {
    setAviso(null);
    if (aviso.oportunidadId) router.push({ pathname: '/oportunidad/[id]', params: { id: aviso.oportunidadId } });
  };

  return (
    <Animated.View
      key={aviso.key}
      // Resorte con amortiguamiento alto: rebote suave (la mitad del que tenía con damping 18).
      entering={SlideInUp.springify().damping(30).stiffness(220)}
      exiting={SlideOutUp.duration(200)}
      style={[styles.wrap, { top: insets.top + spacing.sm }]}
      pointerEvents="box-none"
    >
      <Pressable accessibilityRole="alert" onPress={abrir} style={styles.card}>
        <View style={styles.icon}>
          <Ionicons name="school" size={20} color={colors.secondary} />
        </View>
        <View style={styles.text}>
          <Text style={styles.app}>Becar.ia · ahora</Text>
          <Text style={styles.title} numberOfLines={1}>
            {aviso.titulo}
          </Text>
          {aviso.subtitulo && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {aviso.subtitulo}
            </Text>
          )}
          <Text style={styles.body} numberOfLines={2}>
            {aviso.cuerpo}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: spacing.md, right: spacing.md, zIndex: 100 },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.bg,
    ...cardShadow,
    // Elemento flotante: sombra de flotante (CLAUDE.md §5).
    shadowOpacity: 0.12,
    elevation: 6,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  app: { ...typography.caption, color: colors.textMuted },
  title: { ...typography.bodyMedium, color: colors.text },
  subtitle: { ...typography.caption, color: colors.primaryText },
  body: { ...typography.caption, color: colors.text },
});
