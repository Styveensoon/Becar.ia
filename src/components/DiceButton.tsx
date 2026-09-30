import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { colors, radius } from '@/constants/theme';

type DiceButtonProps = {
  onPress: () => void;
  loading?: boolean;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Botón "sorpréndeme": muestra una oportunidad al azar.
export function DiceButton({ onPress, loading = false }: DiceButtonProps) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel="Ver una oportunidad al azar"
      disabled={loading}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        rotation.set(withTiming(rotation.value + 360, { duration: 450 }));
        scale.set(withSequence(withSpring(0.85, { damping: 10, stiffness: 400 }), withSpring(1)));
        onPress();
      }}
      style={[styles.button, style]}
    >
      {loading ? (
        <ActivityIndicator color={colors.secondary} />
      ) : (
        <Ionicons name="dice" size={24} color={colors.secondary} />
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  // Mismo alto que SearchBar (input 12+22+12 + borde); fondo `primary` con ícono navy.
  button: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
