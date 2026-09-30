import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { AvatarOption } from '@/components/AvatarOption';
import { Button } from '@/components/Button';
import { ColorFan } from '@/components/ColorFan';
import { ProgressBar } from '@/components/ProgressBar';
import { avatars, type ProfileColorId } from '@/constants/personalizacion';
import { colors, spacing, typography } from '@/constants/theme';

export default function OnboardingAvatar() {
  const insets = useSafeAreaInsets();
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [colorId, setColorId] = useState<ProfileColorId | null>(null);

  const onContinue = () => {
    if (!avatarId || !colorId) return;
    router.push({ pathname: '/onboarding-intereses', params: { avatar: avatarId, color: colorId } });
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xl },
      ]}
    >
      <ProgressBar step={1} total={2} />

      <Text style={styles.title}>Elige tu estilo</Text>
      <Text style={styles.subtitle}>Así te vamos a reconocer en la app</Text>

      <View style={styles.preview}>
        <Avatar avatarId={avatarId} colorId={colorId} size={120} />
      </View>

      <Text style={styles.label}>Color de tu perfil</Text>
      <ColorFan value={colorId} onChange={setColorId} />

      <View style={styles.grid}>
        {avatars.map((a, i) => (
          <AvatarOption
            key={a.id}
            avatarId={a.id}
            position={i + 1}
            total={avatars.length}
            selected={avatarId === a.id}
            onPress={() => setAvatarId(a.id)}
          />
        ))}
      </View>

      <Button
        label="Continuar"
        disabled={!avatarId || !colorId}
        onPress={onContinue}
        style={styles.button}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.screen },
  title: { ...typography.display, color: colors.text, marginTop: spacing.xl },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.xxl,
  },
  preview: { alignItems: 'center', marginBottom: spacing.xl },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.lg,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  button: { marginTop: spacing.xxl },
});
