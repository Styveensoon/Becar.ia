import { StyleSheet, Text } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import { colors, typography } from '@/constants/theme';
import type { LandingSlide } from '@/constants/landingSlides';

type LandingCaptionProps = {
  slide: LandingSlide;
  index: number;
  width: number;
  scrollX: SharedValue<number>;
};

// Todas las leyendas viven apiladas; cada una aparece al llegar a su slide y se desvanece al salir.
export function LandingCaption({ slide, index, width, scrollX }: LandingCaptionProps) {
  const style = useAnimatedStyle(() => {
    const input = [(index - 0.6) * width, index * width, (index + 0.6) * width];
    return {
      opacity: interpolate(scrollX.value, input, [0, 1, 0], Extrapolation.CLAMP),
      transform: [{ translateY: interpolate(scrollX.value, input, [24, 0, -24], Extrapolation.CLAMP) }],
    };
  });

  const [before, after] = slide.caption.split(slide.highlight);

  return (
    <Animated.Text
      style={[styles.caption, style]}
      numberOfLines={2}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {before}
      <Text style={styles.highlight}>{slide.highlight}</Text>
      {after}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  caption: {
    ...typography.h1,
    color: colors.text,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  highlight: {
    color: colors.primaryText,
  },
});
