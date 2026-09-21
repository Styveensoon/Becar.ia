import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated';

import { colors } from '@/constants/theme';

type CheckboxProps = {
  checked: boolean;
  onToggle: () => void;
  accessibilityLabel: string;
  children: ReactNode;
};

export function Checkbox({ checked, onToggle, accessibilityLabel, children }: CheckboxProps) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ checked }}
        hitSlop={10}
        onPress={() => {
          Haptics.selectionAsync();
          onToggle();
        }}
        style={[styles.box, checked && styles.boxChecked]}
      >
        {checked && (
          <Animated.View entering={ZoomIn.springify().damping(8)} exiting={ZoomOut.duration(120)}>
            <Ionicons name="checkmark" size={16} color={colors.white} />
          </Animated.View>
        )}
      </Pressable>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  box: {
    width: 22,
    height: 22,
    marginTop: 1,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  content: {
    flex: 1,
  },
});
