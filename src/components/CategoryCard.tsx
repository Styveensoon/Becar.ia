import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import type { Tema } from '@/constants/temas';
import { cardShadow, colors, radius, typography } from '@/constants/theme';

type CategoryCardProps = {
  tema: Tema;
  size: number;
  onPress: () => void;
  style?: ViewStyle;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const LABEL_PADDING = 6;
// Ancho promedio de un carácter de Poppins SemiBold, en múltiplos del tamaño de letra.
const CHAR_WIDTH = 0.64;

// Tamaño de letra para que la palabra más larga quepa completa en una línea. Se calcula a mano
// porque adjustsFontSizeToFit en Android a veces no encoge y corta la palabra ("Programació").
function labelFontSize(label: string, size: number): number {
  const longest = Math.max(...label.split(' ').map((w) => w.length));
  const fit = (size - LABEL_PADDING * 2) / (longest * CHAR_WIDTH);
  return Math.max(10, Math.min(typography.button.fontSize, Math.floor(fit)));
}

export function CategoryCard({ tema, size, onPress, style }: CategoryCardProps) {
  const fontSize = labelFontSize(tema.label, size);
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={tema.label}
      onPressIn={() => scale.set(withSpring(0.94, { damping: 15, stiffness: 300 }))}
      onPressOut={() => scale.set(withSpring(1, { damping: 15, stiffness: 300 }))}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={[styles.card, { width: size, height: size }, animatedStyle, style]}
    >
      <View style={[styles.clip, { backgroundColor: tema.tint }]}>
        {tema.image ? (
          // Blur a pedido del diseño de Home; el velo navy de abajo asegura el contraste del texto.
          <Image source={tema.image} style={StyleSheet.absoluteFill} resizeMode="cover" blurRadius={6} />
        ) : (
          <IconArt icons={tema.icons} size={size} />
        )}
        <View style={styles.scrim} />
        {/* Ninguna palabra se parte; con varias palabras se reparten en hasta 2 líneas. */}
        <Text
          style={[styles.label, { fontSize, lineHeight: Math.round(fontSize * 1.4) }]}
          numberOfLines={tema.label.includes(' ') ? 2 : 1}
          // El tamaño ya se ajustó al ancho del cuadro; si el sistema lo agranda se volvería a cortar.
          maxFontSizeMultiplier={1}
        >
          {tema.label}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

// Fondo provisional: íconos grandes y difusos que hacen de "imagen" del tema.
function IconArt({ icons, size }: { icons: Tema['icons']; size: number }) {
  const [main, second, third] = icons;
  return (
    <View style={StyleSheet.absoluteFill}>
      <Ionicons
        name={main}
        size={size * 0.75}
        color={colors.primary}
        style={{ position: 'absolute', right: -size * 0.12, bottom: -size * 0.12, opacity: 0.55 }}
      />
      <Ionicons
        name={second}
        size={size * 0.38}
        color={colors.secondary}
        style={{ position: 'absolute', left: size * 0.06, top: size * 0.06, opacity: 0.35 }}
      />
      <Ionicons
        name={third}
        size={size * 0.28}
        color={colors.accent}
        style={{ position: 'absolute', right: size * 0.1, top: size * 0.04, opacity: 0.7 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    backgroundColor: colors.bg,
    ...cardShadow,
  },
  clip: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Velo `secondary` uniforme: texto blanco legible sobre cualquier fondo.
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(43,45,66,0.55)',
  },
  label: {
    ...typography.button,
    color: colors.white,
    textAlign: 'center',
    paddingHorizontal: LABEL_PADDING,
  },
});
