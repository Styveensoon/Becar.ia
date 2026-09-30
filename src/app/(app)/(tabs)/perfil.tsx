import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DeleteAccountModal } from '@/components/DeleteAccountModal';
import { ProfileCard } from '@/components/ProfileCard';
import { cardShadow, colors, radius, spacing, typography } from '@/constants/theme';
import { diasRestantes } from '@/lib/fechas';
import { useGuardadas } from '@/lib/guardadas';
import { useProfile } from '@/lib/profile';
import { supabase } from '@/lib/supabase';

type IconName = ComponentProps<typeof Ionicons>['name'];

export default function Perfil() {
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const { items } = useGuardadas();
  const [borrarVisible, setBorrarVisible] = useState(false);

  const cierranPronto = items.filter((o) => {
    if (!o.fecha_limite) return false;
    const dias = diasRestantes(o.fecha_limite);
    return dias >= 0 && dias <= 7;
  }).length;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
    >
      <Text style={styles.title}>Perfil</Text>

      {profile && <ProfileCard profile={profile} favoritos={items.length} cierranPronto={cierranPronto} />}

      <View style={styles.menu}>
        <Opcion icon="create-outline" label="Editar perfil" onPress={() => router.push('/editar-perfil')} />
        <View style={styles.separator} />
        <Opcion icon="shield-checkmark-outline" label="Mis datos y privacidad" onPress={() => router.push('/mis-datos')} />
        <View style={styles.separator} />
        <Opcion icon="document-text-outline" label="Aviso de Privacidad" onPress={() => router.push('/privacidad')} />
        <View style={styles.separator} />
        <Opcion icon="reader-outline" label="Términos y Condiciones" onPress={() => router.push('/terminos')} />
        <View style={styles.separator} />
        <Opcion icon="log-out-outline" label="Cerrar sesión" onPress={() => supabase.auth.signOut()} />
        <View style={styles.separator} />
        <Opcion icon="trash-outline" label="Eliminar cuenta" onPress={() => setBorrarVisible(true)} muted />
      </View>

      <DeleteAccountModal visible={borrarVisible} onClose={() => setBorrarVisible(false)} />
    </ScrollView>
  );
}

function Opcion({
  icon,
  label,
  onPress,
  muted = false,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  muted?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.opcion, pressed && styles.pressed]}
    >
      <View style={styles.opcionIcon}>
        <Ionicons name={icon} size={20} color={muted ? colors.textMuted : colors.primaryText} />
      </View>
      <Text style={[styles.opcionLabel, muted && styles.opcionMuted]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.screen, paddingBottom: spacing.xxl, gap: spacing.xl },
  title: { ...typography.display, color: colors.text },
  menu: {
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    ...cardShadow,
  },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  pressed: { backgroundColor: colors.bgAlt },
  opcionIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.bgAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  opcionLabel: { ...typography.bodyMedium, color: colors.text, flex: 1 },
  opcionMuted: { color: colors.textMuted },
  separator: { height: 1, backgroundColor: colors.border, marginLeft: 64 },
});
