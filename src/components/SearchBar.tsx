import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, type TextInputProps } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { colors, radius, typography } from '@/constants/theme';

type SearchBarProps = Omit<TextInputProps, 'style' | 'value' | 'onChangeText'> & {
  value: string;
  onChangeText: (text: string) => void;
};

export function SearchBar({ value, onChangeText, onFocus, onBlur, ...rest }: SearchBarProps) {
  const focus = useSharedValue(0);

  const fieldStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(focus.value, [0, 1], [colors.border, colors.primary]),
  }));

  return (
    <Animated.View style={[styles.field, fieldStyle]}>
      <Ionicons name="search" size={20} color={colors.textMuted} />
      <TextInput
        {...rest}
        value={value}
        onChangeText={onChangeText}
        accessibilityLabel="Buscar oportunidades"
        placeholderTextColor={colors.textMuted}
        returnKeyType="search"
        onFocus={(e) => {
          focus.set(withTiming(1, { duration: 180 }));
          onFocus?.(e);
        }}
        onBlur={(e) => {
          focus.set(withTiming(0, { duration: 180 }));
          onBlur?.(e);
        }}
        style={styles.input}
      />
      {value.length > 0 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Borrar búsqueda"
          hitSlop={12}
          onPress={() => onChangeText('')}
        >
          <Ionicons name="close-circle" size={20} color={colors.textMuted} />
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    paddingHorizontal: 16,
  },
  input: {
    ...typography.body,
    flex: 1,
    color: colors.text,
    paddingVertical: 12,
  },
});
