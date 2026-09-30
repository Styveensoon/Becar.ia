import { StyleSheet, Text, View } from 'react-native';

import { radius, typography } from '@/constants/theme';

type BadgeProps = {
  label: string;
  background: string;
  color: string;
};

// Chip píldora de solo lectura (CLAUDE.md §7 Chips / badges).
export function Badge({ label, background, color }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: background }]}>
      <Text style={[styles.text, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  text: {
    ...typography.captionMedium,
  },
});
