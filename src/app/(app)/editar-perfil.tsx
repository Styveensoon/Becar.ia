import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { AvatarOption } from '@/components/AvatarOption';
import { BackHeader } from '@/components/BackHeader';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { ColorFan } from '@/components/ColorFan';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Input } from '@/components/Input';
import {
  avatars,
  intereses,
  rangoPermitido,
  MAX_MOTE,
  MIN_INTERESES,
  nivelesEducativos,
  profileColors,
  rangosEdad,
  type ProfileColorId,
} from '@/constants/personalizacion';
import { colors, spacing, typography } from '@/constants/theme';
import type { NivelEducativo, RangoEdad } from '@/lib/authActions';
import { PROFILE_FIELDS, useProfile, type Profile } from '@/lib/profile';
import { supabase } from '@/lib/supabase';

function colorValido(id: string | null | undefined): ProfileColorId | null {
  return profileColors.find((c) => c.id === id)?.id ?? null;
}

export default function EditarPerfil() {
  const insets = useSafeAreaInsets();
  const { profile, setProfile } = useProfile();

  const [avatarId, setAvatarId] = useState<string | null>(profile?.avatar_id ?? null);
  const [colorId, setColorId] = useState<ProfileColorId | null>(colorValido(profile?.color));
  const [mote, setMote] = useState(profile?.mote ?? '');
  const [rango, setRango] = useState<RangoEdad | null>(profile?.rango_edad ?? null);
  const [nivel, setNivel] = useState<NivelEducativo | null>(profile?.nivel_educativo ?? null);
  const [seleccion, setSeleccion] = useState<string[]>(profile?.intereses ?? []);
  const [institucion, setInstitucion] = useState(profile?.institucion ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const moteValido = mote.trim().length > 0;
  const suficientes = seleccion.length >= MIN_INTERESES;
  const puedeGuardar = Boolean(profile && avatarId && colorId && moteValido && rango && nivel && suficientes);

  const toggle = (id: string) =>
    setSeleccion((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const guardar = async () => {
    if (!puedeGuardar || !profile) return;
    setError(null);
    setSaving(true);
    const { data, error: dbError } = await supabase
      .from('profiles')
      .update({
        avatar_id: avatarId,
        color: colorId,
        mote: mote.trim(),
        rango_edad: rango,
        nivel_educativo: nivel,
        intereses: seleccion,
        institucion: institucion.trim() || null,
      })
      .eq('id', profile.id)
      .select(PROFILE_FIELDS)
      .single<Profile>();
    setSaving(false);

    if (dbError || !data) {
      setError('No pudimos guardar tus cambios. Intenta de nuevo');
      return;
    }
    setProfile(data);
    router.back();
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
        <BackHeader title="Editar perfil" />

        {/* Estilo: mismo diseño que el onboarding (preview + abanico + cuadrícula). */}
        <View style={styles.preview}>
          <Avatar avatarId={avatarId} colorId={colorId} size={120} />
        </View>

        <Text style={styles.centerLabel}>Color de tu perfil</Text>
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

        {/* Datos: mismos campos y reglas que el registro. */}
        <View style={styles.section}>
          <Input
            label="¿Cómo quieres que te llamen?"
            autoCorrect={false}
            maxLength={MAX_MOTE}
            value={mote}
            onChangeText={setMote}
            helper="Así te van a ver otros usuarios, no uses tu nombre completo"
            helperItalic
            error={!moteValido ? 'Elige un apodo' : undefined}
          />

          <View>
            <Text style={styles.groupLabel}>¿Cuál es tu rango de edad?</Text>
            <View style={styles.chips} accessibilityRole="radiogroup">
              {rangosEdad.map((r) => (
                <Chip
                  key={r.value}
                  label={r.label}
                  selected={rango === r.value}
                  disabled={!rangoPermitido(profile?.rango_edad, r.value)}
                  onPress={() => setRango(r.value)}
                />
              ))}
            </View>
            <Text style={styles.hint}>
              Tu rango de edad solo puede avanzar. Si te equivocaste al registrarte, escríbenos al correo del Aviso de Privacidad.
            </Text>
          </View>

          <View>
            <Text style={styles.groupLabel}>¿En qué nivel estás?</Text>
            <View style={styles.chips} accessibilityRole="radiogroup">
              {nivelesEducativos.map((n) => (
                <Chip key={n.value} label={n.label} selected={nivel === n.value} onPress={() => setNivel(n.value)} />
              ))}
            </View>
          </View>

          <View>
            <Text style={styles.groupLabel}>¿Qué te interesa?</Text>
            <View style={styles.chips}>
              {intereses.map((i) => (
                <Chip key={i.id} label={i.label} selected={seleccion.includes(i.id)} onPress={() => toggle(i.id)} />
              ))}
            </View>
            <Text style={[styles.hint, suficientes && { color: colors.success }]}>
              {suficientes ? `${seleccion.length} seleccionados` : `Selecciona al menos 2 (llevas ${seleccion.length})`}
            </Text>
          </View>

          <Input
            label="¿En qué institución estudias? (opcional)"
            placeholder="Nombre de tu escuela"
            maxLength={120}
            value={institucion}
            onChangeText={setInstitucion}
            autoCapitalize="words"
            returnKeyType="done"
          />
        </View>

        {error && (
          <View style={styles.banner}>
            <ErrorBanner message={error} />
          </View>
        )}

        <Button
          label="Guardar cambios"
          disabled={!puedeGuardar}
          loading={saving}
          onPress={guardar}
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
  preview: { alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.xl },
  centerLabel: {
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
  section: { marginTop: spacing.xxl, gap: spacing.xl },
  groupLabel: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  hint: { ...typography.caption, color: colors.textMuted, marginTop: spacing.md },
  banner: { marginTop: spacing.xl },
  button: { marginTop: spacing.xxl },
});
