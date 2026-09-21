import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { Floaty } from '@/components/Floaty';
import { cardShadow, colors, radius } from '@/constants/theme';

type AuthArtProps = {
  icon: keyof typeof Ionicons.glyphMap;
};

// Ilustración 2D flat del encabezado: formas de la paleta flotando alrededor de un ícono.
export function AuthArt({ icon }: AuthArtProps) {
  return (
    <View style={styles.wrap} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Floaty amplitude={6} duration={3200} style={styles.blob} />
      <Floaty amplitude={10} duration={2400} delay={300} style={styles.dotAccent} />
      <Floaty amplitude={7} rotate={12} duration={2800} delay={600} style={styles.square} />
      <Floaty amplitude={5} duration={3600} delay={150} style={styles.ring} />

      <Animated.View entering={ZoomIn.delay(200).springify().damping(9)} style={styles.tileWrap}>
        <Floaty amplitude={4} rotate={5} duration={2800}>
          <View style={styles.tile}>
            <Ionicons name={icon} size={30} color={colors.primaryText} />
          </View>
        </Floaty>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 150,
    height: 120,
  },
  blob: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 96,
    height: 96,
    borderRadius: radius.full,
    backgroundColor: colors.primaryTint,
  },
  dotAccent: {
    position: 'absolute',
    top: 0,
    right: 96,
    width: 16,
    height: 16,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
  },
  square: {
    position: 'absolute',
    top: 92,
    right: 92,
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  ring: {
    position: 'absolute',
    top: 100,
    right: 18,
    width: 20,
    height: 20,
    borderRadius: radius.full,
    borderWidth: 3,
    borderColor: colors.secondary,
  },
  tileWrap: {
    position: 'absolute',
    top: 22,
    right: 22,
  },
  tile: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
  },
});
