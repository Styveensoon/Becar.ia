import { useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radius, typography } from '@/constants/theme';
import { LONGITUD_CODIGO } from '@/lib/authActions';

type CodeInputProps = {
  value: string;
  onChange: (codigo: string) => void;
  // Se llama al completar los dígitos (para verificar sin tocar otro botón).
  onComplete?: (codigo: string) => void;
  length?: number;
  error?: boolean;
};

// Casillas de código de un solo uso. Por dentro es un solo TextInput invisible: así funcionan
// pegar el código completo, el autocompletado del teclado y borrar hacia atrás.
export function CodeInput({ value, onChange, onComplete, length = LONGITUD_CODIGO, error = false }: CodeInputProps) {
  const input = useRef<TextInput>(null);

  const cambiar = (texto: string) => {
    const limpio = texto.replace(/\D/g, '').slice(0, length);
    onChange(limpio);
    if (limpio.length === length) onComplete?.(limpio);
  };

  return (
    <Pressable onPress={() => input.current?.focus()} accessibilityLabel={`Código de ${length} dígitos`}>
      <View style={styles.row}>
        {Array.from({ length }, (_, i) => {
          const activa = i === value.length || (i === length - 1 && value.length === length);
          return (
            <View
              key={i}
              style={[styles.box, value[i] && styles.boxLlena, activa && styles.boxActiva, error && styles.boxError]}
            >
              <Text style={styles.digit}>{value[i] ?? ''}</Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={input}
        value={value}
        onChangeText={cambiar}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={length}
        autoFocus
        caretHidden
        style={styles.hidden}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  box: {
    flex: 1,
    aspectRatio: 0.85,
    maxWidth: 56,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxLlena: { borderColor: colors.secondary },
  boxActiva: { borderColor: colors.primary },
  boxError: { borderColor: colors.danger },
  digit: { ...typography.h1, color: colors.text },
  // Fuera de pantalla pero enfocable (opacity 0 rompe el pegado en algunos Android).
  hidden: { position: 'absolute', width: 1, height: 1, opacity: 0.01 },
});
