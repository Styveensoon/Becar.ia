import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import { colors } from '@/constants/theme';

type CarouselDotProps = {
  index: number;
  width: number;
  scrollX: SharedValue<number>;
};

// El punto activo se estira a píldora y se tiñe de `primary` mientras se desliza.
export function CarouselDot({ index, width, scrollX }: CarouselDotProps) {
  const style = useAnimatedStyle(() => {
    const input = [(index - 1) * width, index * width, (index + 1) * width];
    return {
      width: interpolate(scrollX.value, input, [8, 28, 8], Extrapolation.CLAMP),
      backgroundColor: interpolateColor(scrollX.value, input, [
        colors.secondaryTint,
        colors.primary,
        colors.secondaryTint,
      ]),
    };
  });

  return <Animated.View style={[{ height: 8, borderRadius: 999 }, style]} />;
}
