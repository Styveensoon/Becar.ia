import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, typography } from '@/constants/theme';

export function Wordmark() {
  return (
    <View accessibilityRole="header" accessibilityLabel="Becar.ia" style={styles.pill}>
      <Text style={styles.text}>
        Becar<Text style={styles.dot}>.</Text>ia
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    backgroundColor: colors.secondary,
  },
  text: {
    ...typography.h2,
    color: colors.white,
  },
  dot: {
    color: colors.primary,
  },
});
