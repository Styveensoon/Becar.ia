import { useEffect, type ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type FloatyProps = {
  children?: ReactNode;
  style?: ViewStyle;
  amplitude?: number;
  rotate?: number;
  duration?: number;
  delay?: number;
};

// Flota suavemente arriba/abajo (y oscila un poco) en bucle infinito.
export function Floaty({ children, style, amplitude = 8, rotate = 0, duration = 2600, delay = 0 }: FloatyProps) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
  }, [t, delay, duration]);

  const animated = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(t.value, [0, 1], [-amplitude, amplitude]) },
      { rotate: `${interpolate(t.value, [0, 1], [-rotate, rotate])}deg` },
    ],
  }));

  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}
