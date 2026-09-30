import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { colors, radius } from '@/constants/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

type TabIconProps = {
  focused: boolean;
  // Relleno cuando está activo, outline cuando no.
  active: IconName;
  inactive: IconName;
};

export function TabIcon({ focused, active, inactive }: TabIconProps) {
  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    progress.set(withSpring(focused ? 1 : 0, { damping: 14, stiffness: 220 }));
  }, [focused, progress]);

  // Píldora `primary-tint` detrás del ícono activo.
  const pillStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scaleX: 0.6 + progress.value * 0.4 }],
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.pill, pillStyle]} />
      <Ionicons
        name={focused ? active : inactive}
        size={22}
        color={focused ? colors.primary : colors.textMuted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 56,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    ...StyleSheet.absoluteFill,
    borderRadius: radius.full,
    backgroundColor: colors.primaryTint,
  },
});
