import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { colors, radius, typography } from '@/constants/theme';

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  // Opción que no se puede elegir (se ve atenuada y no responde).
  disabled?: boolean;
};

export function Chip({ label, selected, onPress, disabled = false }: ChipProps) {
  const progress = useSharedValue(selected ? 1 : 0);
  const scale = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, { duration: 180 });
    if (selected) {
      scale.value = withSequence(withSpring(1.1, { damping: 6, stiffness: 400 }), withSpring(1));
    }
  }, [selected, progress, scale]);

  const chipStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: interpolateColor(progress.value, [0, 1], [colors.bg, colors.primaryTint]),
    borderColor: interpolateColor(progress.value, [0, 1], [colors.border, colors.primary]),
  }));

  const textColor = useDerivedValue(() =>
    interpolateColor(progress.value, [0, 1], [colors.textMuted, colors.primaryText]),
  );
  const textStyle = useAnimatedStyle(() => ({ color: textColor.value as string }));

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      style={disabled && styles.disabled}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
    >
      <Animated.View style={[styles.chip, chipStyle]}>
        <Animated.Text style={[styles.label, textStyle]}>{label}</Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: radius.full,
    borderWidth: 1.5,
  },
  label: {
    ...typography.captionMedium,
  },
  disabled: {
    opacity: 0.4,
  },
});
