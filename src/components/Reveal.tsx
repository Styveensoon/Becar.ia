import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

type RevealProps = {
  children: ReactNode;
  // Posición en la secuencia: cada paso retrasa la entrada 70 ms.
  step?: number;
  style?: ViewStyle;
};

export function Reveal({ children, step = 0, style }: RevealProps) {
  return (
    <Animated.View entering={FadeInDown.delay(120 + step * 70).springify().damping(16)} style={style}>
      {children}
    </Animated.View>
  );
}
