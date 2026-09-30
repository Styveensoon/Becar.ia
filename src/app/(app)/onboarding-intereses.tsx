import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Input } from '@/components/Input';
import { ProgressBar } from '@/components/ProgressBar';
import { intereses, MIN_INTERESES } from '@/constants/personalizacion';
import { colors, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { PROFILE_FIELDS, useProfile, type Profile } from '@/lib/profile';
import { supabase } from '@/lib/supabase';

export default function OnboardingIntereses() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { setProfile } = useProfile();
  const { avatar, color } = useLocalSearchParams<{ avatar: string; color: string }>();

  const [selected, setSelected] = useState<string[]>([]);
  const [institucion, setInstitucion] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enough = selected.length >= MIN_INTERESES;

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const onFinish = async () => {
    if (!enough || !session) return;
    setError(null);
    setSaving(true);
    // UPDATE sobre la fila que creó el trigger del signup, no INSERT.
    const { data, error: dbError } = await supabase
      .from('profiles')
      .update({
        avatar_id: avatar,
        color,
        intereses: selected,
        institucion: institucion.trim() || null,
      })
      .eq('id', session.user.id)
      .select(PROFILE_FIELDS)
      .single<Profile>();
    setSaving(false);

    if (dbError || !data) {
      setError('No pudimos guardar tus preferencias. Intenta de nuevo');
      return;
    }
    // Al quedar el perfil completo, el guard de (app)/_layout reemplaza el onboarding por Home
    // (sin historial, "atrás" no regresa aquí).
    setProfile(data);
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.screen}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        <ProgressBar step={2} total={2} />

        <Text style={styles.title}>¿Qué te interesa?</Text>
        <Text style={styles.subtitle}>Elige al menos 2, así te sugerimos mejores oportunidades</Text>

        <View style={styles.chips}>
          {intereses.map((i) => (
            <Chip key={i.id} label={i.label} selected={selected.includes(i.id)} onPress={() => toggle(i.id)} />
          ))}
        </View>

        <Text style={[styles.hint, enough && { color: colors.success }]}>
          {enough ? 'Listo, puedes continuar' : `Selecciona al menos 2 (llevas ${selected.length})`}
        </Text>

        <View style={styles.institucion}>
          <Input
            label="¿En qué institución estudias? (opcional)"
            placeholder="Nombre de tu escuela"
            value={institucion}
            onChangeText={setInstitucion}
            autoCapitalize="words"
            returnKeyType="done"
          />
        </View>

        {error && <ErrorBanner message={error} />}

        <Button
          label="Empezar a explorar"
          disabled={!enough}
          loading={saving}
          onPress={onFinish}
          style={styles.button}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.screen },
  title: { ...typography.display, color: colors.text, marginTop: spacing.xl },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.xxl,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  hint: { ...typography.caption, color: colors.textMuted, marginTop: spacing.md },
  institucion: { marginTop: spacing.xxl },
  button: { marginTop: spacing.xxl },
});
