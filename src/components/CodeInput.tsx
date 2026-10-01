import { useEffect, useRef, type RefObject } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radius, typography } from '@/constants/theme';
import { LONGITUD_CODIGO } from '@/lib/authActions';

type CodeInputProps = {
  value: string;
  onChange: (codigo: string) => void;
  // Se llama al completar los dígitos (para verificar sin tocar otro botón).
  onComplete?: (codigo: string) => void;
  length?: number;
  error?: boolean;
  // ScrollView que contiene las casillas: al abrir el teclado se desplaza para que queden a la vista.
  scrollRef?: RefObject<ScrollView | null>;
};

// Espacio libre entre las casillas y el teclado (deja ver también el botón de confirmar).
const MARGEN_TECLADO = 88;

// El TextInput real mide 1x1 y está escondido, así que el sistema no sabe qué subir al abrir el
// teclado. Aquí se mide la fila de casillas y se desplaza el ScrollView lo necesario.
function useVisibleConTeclado(fila: RefObject<View | null>, scrollRef?: RefObject<ScrollView | null>) {
  useEffect(() => {
    if (!scrollRef) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const sub = Keyboard.addListener('keyboardDidShow', (e) => {
      const tecladoY = e.endCoordinates.screenY;
      clearTimeout(timer);
      // Espera a que KeyboardAvoidingView reacomode la pantalla antes de medir.
      timer = setTimeout(() => {
        const scroll = scrollRef.current;
        // getInnerViewRef existe en ScrollView pero falta en sus tipos; getInnerViewNode devuelve un
        // número y measureLayout ya no lo acepta (warning en la nueva arquitectura).
        const contenido = (scroll as (ScrollView & { getInnerViewRef?: () => View | null }) | null)?.getInnerViewRef?.();
        const marco = scroll?.getNativeScrollRef();
        if (!scroll || !contenido || !marco || !fila.current) return;
        marco.measureInWindow((_x, scrollTop) => {
          fila.current?.measureLayout(contenido, (_x2, y, _w, h) => {
            const visible = tecladoY - scrollTop;
            const destino = y + h + MARGEN_TECLADO - visible;
            if (destino > 0) scroll.scrollTo({ y: destino, animated: true });
          });
        });
      }, 120);
    });
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, [fila, scrollRef]);
}

// Casillas de código de un solo uso. Por dentro es un solo TextInput invisible: así funcionan
// pegar el código completo, el autocompletado del teclado y borrar hacia atrás.
export function CodeInput({
  value,
  onChange,
  onComplete,
  length = LONGITUD_CODIGO,
  error = false,
  scrollRef,
}: CodeInputProps) {
  const input = useRef<TextInput>(null);
  const fila = useRef<View>(null);
  useVisibleConTeclado(fila, scrollRef);

  const cambiar = (texto: string) => {
    const limpio = texto.replace(/\D/g, '').slice(0, length);
    onChange(limpio);
    if (limpio.length === length) onComplete?.(limpio);
  };

  return (
    <Pressable onPress={() => input.current?.focus()} accessibilityLabel={`Código de ${length} dígitos`}>
      <View ref={fila} style={styles.row}>
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
