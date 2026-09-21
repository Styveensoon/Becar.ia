import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import Animated, {
  FadeIn,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { colors, radius, typography } from '@/constants/theme';

type InputProps = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string;
  helper?: string;
  helperItalic?: boolean;
  isPassword?: boolean;
};

export function Input({
  label,
  error,
  helper,
  helperItalic = false,
  isPassword = false,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const [visible, setVisible] = useState(false);
  const focus = useSharedValue(0);
  const shake = useSharedValue(0);
  const hasError = Boolean(error);

  // Sacudida corta cuando aparece un error.
  useEffect(() => {
    if (hasError) {
      shake.value = withSequence(
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 80 }),
        withTiming(-4, { duration: 80 }),
        withTiming(0, { duration: 50 }),
      );
    }
  }, [hasError, shake]);

  const fieldStyle = useAnimatedStyle(() => ({
    borderColor: hasError
      ? colors.danger
      : interpolateColor(focus.value, [0, 1], [colors.border, colors.primary]),
    transform: [{ translateX: shake.value }],
  }));

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <Animated.View style={[styles.field, fieldStyle]}>
        <TextInput
          {...rest}
          accessibilityLabel={label}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={isPassword && !visible}
          onFocus={(e) => {
            focus.set(withTiming(1, { duration: 180 }));
            onFocus?.(e);
          }}
          onBlur={(e) => {
            focus.set(withTiming(0, { duration: 180 }));
            onBlur?.(e);
          }}
          style={[styles.input, isPassword && { paddingRight: 44 }]}
        />
        {isPassword && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            hitSlop={12}
            onPress={() => setVisible((v) => !v)}
            style={styles.eye}
          >
            <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.textMuted} />
          </Pressable>
        )}
      </Animated.View>
      {error ? (
        <Animated.Text entering={FadeIn.duration(200)} style={[styles.help, { color: colors.danger }]}>
          {error}
        </Animated.Text>
      ) : helper ? (
        <Text style={[styles.help, helperItalic && { fontStyle: 'italic' }]}>{helper}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 4,
  },
  field: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    justifyContent: 'center',
  },
  input: {
    ...typography.body,
    color: colors.text,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  eye: {
    position: 'absolute',
    right: 12,
  },
  help: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
});
