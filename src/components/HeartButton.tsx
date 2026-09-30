import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';

import { colors, radius } from '@/constants/theme';
import { useGuardadas } from '@/lib/guardadas';
import type { OportunidadResumen } from '@/lib/oportunidades';

type HeartButtonProps = {
  oportunidad: OportunidadResumen;
  size?: number;
};

// Guardar en favoritos. Se toca sin abrir la card que lo contiene.
export function HeartButton({ oportunidad, size = 22 }: HeartButtonProps) {
  const { isSaved, toggle } = useGuardadas();
  const saved = isSaved(oportunidad.id);
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={saved ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      accessibilityState={{ selected: saved }}
      hitSlop={10}
      onPress={() => {
        Haptics.impactAsync(saved ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
        scale.set(withSequence(withSpring(1.3, { damping: 6, stiffness: 400 }), withSpring(1)));
        toggle(oportunidad);
      }}
      style={styles.button}
    >
      <Animated.View style={style}>
        <Ionicons
          name={saved ? 'heart' : 'heart-outline'}
          size={size}
          color={saved ? colors.primary : colors.textMuted}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.bgAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
