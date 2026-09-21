import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInUp, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { CarouselDot } from '@/components/CarouselDot';
import { LandingCaption } from '@/components/LandingCaption';
import { LandingCarousel } from '@/components/LandingCarousel';
import { Wordmark } from '@/components/Wordmark';
import { getLandingLayout, PANEL_OVERLAP } from '@/constants/landingLayout';
import { landingSlides } from '@/constants/landingSlides';
import { colors, radius, spacing, typography } from '@/constants/theme';

// Dos líneas de `h1` (lineHeight 30).
const CAPTION_HEIGHT = 60;
const LINK_HEIGHT = 38;

// Efecto "boing" tranquilo: cada elemento sube un poco y se asienta con un rebote suave.
const boing = (delay: number) => FadeInUp.delay(delay).springify().damping(13).stiffness(130);

export default function Landing() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const scrollX = useSharedValue(0);

  // El panel blanco empieza donde termina el dibujo (el suelo del personaje) y llena el resto.
  const { imageHeight, stageHeight } = getLandingLayout(width, height);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={{ height: stageHeight }}>
        <LandingCarousel height={stageHeight} imageHeight={imageHeight} scrollX={scrollX} />
      </View>

      {/* Panel fijo: no se anima, solo lo que lleva dentro. */}
      <View style={[styles.panel, { paddingBottom: insets.bottom }]}>
        {/* Marca y leyenda arriba; las opciones de inicio quedan centradas en el espacio que sobra. */}
        <View>
          <View style={styles.brandRow}>
            <Animated.View entering={boing(150)}>
              <Wordmark />
            </Animated.View>
            <Animated.View
              entering={boing(250)}
              style={styles.dots}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              {landingSlides.map((slide, i) => (
                <CarouselDot key={slide.id} index={i} width={width} scrollX={scrollX} />
              ))}
            </Animated.View>
          </View>

          <Animated.View entering={boing(350)} style={styles.captions}>
            {landingSlides.map((slide, i) => (
              <LandingCaption key={slide.id} slide={slide} index={i} width={width} scrollX={scrollX} />
            ))}
          </Animated.View>
        </View>

        <View style={styles.options}>
          <Animated.View entering={boing(450)}>
            <Button label="Quiero unirme" onPress={() => router.push('/signup')} />
          </Animated.View>
          <Animated.View entering={boing(550)}>
            <Link href="/login" asChild>
              <Text accessibilityRole="link" style={styles.link}>
                ¿Ya tienes cuenta? <Text style={styles.linkAction}>Iniciar sesión</Text>
              </Text>
            </Link>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  panel: {
    flex: 1,
    marginTop: -PANEL_OVERLAP,
    paddingTop: 36,
    paddingHorizontal: spacing.screen,
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    // Elemento flotante: sombra de elevación alta del design system.
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  options: {
    flex: 1,
    justifyContent: 'center',
    // Empuja el centro hacia arriba (la mitad de este valor).
    paddingBottom: 40,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  captions: {
    height: CAPTION_HEIGHT,
    marginTop: 48,
  },
  link: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    height: LINK_HEIGHT,
    paddingVertical: 8,
    marginTop: 12,
  },
  linkAction: {
    ...typography.bodyMedium,
    color: colors.primaryText,
  },
});
