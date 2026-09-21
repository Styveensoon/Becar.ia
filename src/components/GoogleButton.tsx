import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, typography } from '@/constants/theme';

type GoogleButtonProps = {
  onPress: () => void;
  loading?: boolean;
};

export function GoogleButton({ onPress, loading = false }: GoogleButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Continuar con Google"
      accessibilityState={{ busy: loading }}
      disabled={loading}
      onPress={onPress}
      style={styles.button}
    >
      {loading ? (
        <ActivityIndicator color={colors.secondary} />
      ) : (
        <>
          <Ionicons name="logo-google" size={18} color={colors.secondary} />
          <Text style={styles.label}>Continuar con Google</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  label: {
    ...typography.button,
    color: colors.secondary,
  },
});
