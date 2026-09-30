import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Avatar } from '@/components/Avatar';
import { colors, radius } from '@/constants/theme';

const SIZE = 72;

type AvatarOptionProps = {
  avatarId: string;
  position: number;
  total: number;
  selected: boolean;
  onPress: () => void;
};

export function AvatarOption({ avatarId, position, total, selected, onPress }: AvatarOptionProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.set(withSpring(selected ? 1.05 : 1, { damping: 12, stiffness: 220 }));
  }, [selected, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={`Avatar ${position} de ${total}`}
      accessibilityState={{ selected }}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
    >
      <Animated.View
        style={[
          styles.ring,
          { borderWidth: selected ? 3 : 1.5, borderColor: selected ? colors.primary : colors.border },
          style,
        ]}
      >
        <Avatar avatarId={avatarId} colorId={null} size={SIZE - 8} plain />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ring: {
    width: SIZE,
    height: SIZE,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
