import { StyleSheet, View } from 'react-native';

import { colors, radius } from '@/constants/theme';

type ProgressBarProps = { step: number; total: number };

export function ProgressBar({ step, total }: ProgressBarProps) {
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={`Paso ${step} de ${total}`} style={styles.row}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[styles.segment, { backgroundColor: i < step ? colors.primary : colors.secondaryTint }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '60%',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: radius.full,
  },
});
