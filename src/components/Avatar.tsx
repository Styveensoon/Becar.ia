import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { avatars, profileColorHex } from '@/constants/personalizacion';
import { colors, radius } from '@/constants/theme';

type AvatarProps = {
  avatarId: string | null;
  colorId: string | null;
  size: number;
  // Sin color de perfil (grid de selección: el avatar va sobre fondo neutro).
  plain?: boolean;
};

export function Avatar({ avatarId, colorId, size, plain = false }: AvatarProps) {
  const avatar = avatars.find((a) => a.id === avatarId);
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, backgroundColor: plain ? colors.bgAlt : profileColorHex(colorId) },
      ]}
    >
      {avatar && (
        <Ionicons name={avatar.icon} size={size * 0.5} color={plain ? colors.secondary : colors.white} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
