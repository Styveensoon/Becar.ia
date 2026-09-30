import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';

import { colors, radius, spacing, typography } from '@/constants/theme';

// Aviso discreto: sin conexión la app sigue funcionando con lo último que se descargó.
export function OfflineBanner() {
  return (
    <Animated.View
      entering={FadeInDown.springify().damping(16)}
      exiting={FadeOutUp.duration(150)}
      accessibilityRole="alert"
      style={styles.banner}
    >
      <Ionicons name="cloud-offline-outline" size={18} color={colors.info} />
      <View style={styles.text}>
        <Text style={styles.title}>Sin conexión</Text>
        <Text style={styles.body}>Estás viendo lo último que se guardó en tu teléfono.</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    // `info` al 12%: informativo, no alarma.
    backgroundColor: `${colors.info}1F`,
  },
  text: { flex: 1 },
  title: { ...typography.captionMedium, color: colors.text },
  body: { ...typography.caption, color: colors.textMuted },
});
