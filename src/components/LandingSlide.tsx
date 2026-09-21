import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import { Floaty } from '@/components/Floaty';
import { ASPECT, RAISE } from '@/constants/landingLayout';
import type { LandingSlide as Slide } from '@/constants/landingSlides';

type LandingSlideProps = {
  slide: Slide;
  index: number;
  width: number;
  height: number;
  imageHeight: number;
  scrollX: SharedValue<number>;
};

// Ancho del difuminado con el que los bordes de la imagen se funden con el fondo del slide.
const FADE = 28;

export function LandingSlide({ slide, index, width, height, imageHeight, scrollX }: LandingSlideProps) {
  const imageWidth = imageHeight * ASPECT;

  // La ilustración se desplaza más lento que el slide: efecto de profundidad.
  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          scrollX.value,
          [(index - 1) * width, index * width, (index + 1) * width],
          [-width * 0.14, 0, width * 0.14],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  // `multiply` funde el crema de la imagen con el tinte del slide, pero deja el rectángulo un poco
  // más oscuro que el fondo: los bordes se difuminan con el tinte para que no se note.
  const solid = slide.tint;
  const clear = `${slide.tint}00`;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={slide.caption}
      style={{
        width,
        height,
        backgroundColor: slide.tint,
        overflow: 'hidden',
        // Aísla el mezclado: el multiply solo funde la imagen con el tinte de este slide.
        isolation: 'isolate',
      }}
    >
      <Floaty
        amplitude={5}
        duration={3200}
        style={{
          position: 'absolute',
          left: (width - imageWidth) / 2,
          top: -imageHeight * RAISE,
          width: imageWidth,
          height: imageHeight,
        }}
      >
        <Animated.View style={[StyleSheet.absoluteFill, { mixBlendMode: 'multiply' }, imageStyle]}>
          <Image source={slide.image} style={{ flex: 1, width: '100%' }} resizeMode="contain" />
        </Animated.View>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, imageStyle]}>
          <LinearGradient colors={[solid, clear]} style={styles.top} />
          <LinearGradient
            colors={[solid, clear]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.left}
          />
          <LinearGradient
            colors={[clear, solid]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.right}
          />
        </Animated.View>
      </Floaty>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { position: 'absolute', top: 0, left: 0, right: 0, height: FADE },
  left: { position: 'absolute', top: 0, bottom: 0, left: 0, width: FADE },
  right: { position: 'absolute', top: 0, bottom: 0, right: 0, width: FADE },
});
