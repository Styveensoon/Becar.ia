import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';

import { profileColors, type ProfileColorId } from '@/constants/personalizacion';
import { colors, radius } from '@/constants/theme';

const SIZE = 48;
const FAN_RADIUS = 140;
const MAX_ANGLE = 40;
const HEIGHT = 96;

type ColorFanProps = {
  value: ProfileColorId | null;
  onChange: (id: ProfileColorId) => void;
};

type SwatchProps = {
  label: string;
  hex: string;
  index: number;
  selected: boolean;
  onPress: () => void;
};

function Swatch({ label, hex, index, selected, onPress }: SwatchProps) {
  const angle = -MAX_ANGLE + (index * 2 * MAX_ANGLE) / (profileColors.length - 1);
  const rad = (angle * Math.PI) / 180;
  const x = FAN_RADIUS * Math.sin(rad);
  const y = FAN_RADIUS * (1 - Math.cos(rad));

  const enter = useSharedValue(0);
  const pick = useSharedValue(selected ? 1 : 0);

  // Entrada en cascada, 40ms entre swatches.
  useEffect(() => {
    enter.set(withDelay(index * 40, withSpring(1, { damping: 14, stiffness: 140 })));
  }, [enter, index]);

  useEffect(() => {
    pick.set(withSpring(selected ? 1 : 0, { damping: 12, stiffness: 220 }));
  }, [selected, pick]);

  const style = useAnimatedStyle(() => ({
    opacity: enter.get(),
    transform: [
      { translateX: x },
      { translateY: y + (1 - enter.get()) * 24 },
      { rotate: `${angle}deg` },
      { scale: enter.get() * (1 + 0.15 * pick.get()) },
    ],
  }));

  return (
    <Animated.View style={[styles.swatchWrap, { zIndex: selected ? 10 : index }, style]}>
      <Pressable
        accessibilityRole="radio"
        accessibilityLabel={`Color ${label}`}
        accessibilityState={{ selected }}
        hitSlop={4}
        onPress={() => {
          Haptics.selectionAsync();
          onPress();
        }}
      >
        {/* Seleccionado: anillo blanco de 3px. Si no, el borde es del mismo color del swatch. */}
        <View style={[styles.swatch, { backgroundColor: hex, borderColor: selected ? colors.white : hex }]} />
      </Pressable>
    </Animated.View>
  );
}

export function ColorFan({ value, onChange }: ColorFanProps) {
  return (
    <View style={styles.fan}>
      {profileColors.map((c, i) => (
        <Swatch
          key={c.id}
          label={c.label}
          hex={c.hex}
          index={i}
          selected={value === c.id}
          onPress={() => onChange(c.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fan: {
    height: HEIGHT,
    alignItems: 'center',
  },
  swatchWrap: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -SIZE / 2,
  },
  swatch: {
    width: SIZE,
    height: SIZE,
    borderRadius: radius.full,
    borderWidth: 3,
  },
});
