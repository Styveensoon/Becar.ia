import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';

import { colors, radius, typography } from '@/constants/theme';

export function ErrorBanner({ message }: { message: string }) {
  return (
    <Animated.View
      accessibilityRole="alert"
      entering={FadeInDown.springify().damping(12)}
      exiting={FadeOutUp.duration(150)}
      style={styles.banner}
    >
      <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(229, 72, 77, 0.1)',
  },
  text: {
    ...typography.caption,
    color: colors.danger,
    flex: 1,
  },
});
