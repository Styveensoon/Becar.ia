import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Avatar } from '@/components/Avatar';
import { intereses, nivelesEducativos } from '@/constants/personalizacion';
import { cardShadow, colors, radius, spacing, typography } from '@/constants/theme';
import { MESES } from '@/lib/fechas';
import type { Profile } from '@/lib/profile';

type ProfileCardProps = {
  profile: Profile;
  favoritos: number;
  cierranPronto: number;
};

// "Credencial" de la comunidad: identidad (avatar, apodo, nivel), antigüedad e intereses.
export function ProfileCard({ profile, favoritos, cierranPronto }: ProfileCardProps) {
  const desde = new Date(profile.created_at);
  const nivel = nivelesEducativos.find((n) => n.value === profile.nivel_educativo)?.label;
  const misIntereses = intereses.filter((i) => profile.intereses?.includes(i.id));

  return (
    <Animated.View entering={FadeInDown.springify().damping(16)} style={styles.card}>
      <View style={styles.brandRow}>
        <Text style={styles.brand}>Becar.ia</Text>
        <View style={styles.memberPill}>
          <Ionicons name="sparkles" size={12} color={colors.accent} />
          <Text style={styles.memberText}>Comunidad</Text>
        </View>
      </View>

      <View style={styles.identity}>
        <View style={styles.avatarRing}>
          <Avatar avatarId={profile.avatar_id} colorId={profile.color} size={84} />
        </View>
        <View style={styles.identityText}>
          <Text style={styles.mote} numberOfLines={1}>
            {profile.mote}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {[nivel, profile.rango_edad && `${profile.rango_edad} años`].filter(Boolean).join(' · ')}
          </Text>
          {profile.institucion && (
            <Text style={styles.meta} numberOfLines={1}>
              {profile.institucion}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.stats}>
        <Stat value={favoritos} label="Favoritos" />
        <View style={styles.divider} />
        <Stat value={cierranPronto} label="Cierran pronto" />
        <View style={styles.divider} />
        <Stat value={misIntereses.length} label="Intereses" />
      </View>

      {misIntereses.length > 0 && (
        <View style={styles.chips}>
          {misIntereses.map((i) => (
            <View key={i.id} style={styles.chip}>
              <Text style={styles.chipText}>{i.label}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.since}>
        Parte de la comunidad desde {MESES[desde.getMonth()].toLowerCase()} de {desde.getFullYear()}
      </Text>
    </Animated.View>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// Tarjeta navy: texto blanco sobre `secondary` (contraste AAA); `accent` solo en el destello.
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.secondary,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.lg,
    ...cardShadow,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { ...typography.bodyMedium, color: colors.white, opacity: 0.8 },
  memberPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.full,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  memberText: { ...typography.captionMedium, color: colors.white },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  avatarRing: {
    padding: 4,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  identityText: { flex: 1, gap: 2 },
  mote: { ...typography.display, color: colors.white },
  meta: { ...typography.caption, color: colors.white, opacity: 0.8 },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { ...typography.h1, color: colors.white },
  statLabel: { ...typography.caption, color: colors.white, opacity: 0.8 },
  divider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.15)' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderRadius: radius.full,
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  chipText: { ...typography.captionMedium, color: colors.white },
  since: { ...typography.caption, color: colors.white, opacity: 0.7, textAlign: 'center' },
});
