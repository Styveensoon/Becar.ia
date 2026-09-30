import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { cardShadow, colors, radius, spacing, typography } from '@/constants/theme';
import { useCatalogo } from '@/lib/catalogo';
import { MESES } from '@/lib/fechas';
import { useGuardadas } from '@/lib/guardadas';
import { nuevasParaTi } from '@/lib/novedades';
import type { Oportunidad } from '@/lib/oportunidades';
import { useProfile } from '@/lib/profile';
import { avisosDisponibles, planDeAvisos, type Aviso } from '@/lib/recordatorios';

// Historial: avisos de las últimas 2 semanas.
const HISTORIAL_MS = 14 * 86_400_000;

export default function Notificaciones() {
  const insets = useSafeAreaInsets();
  const { items, permisoAvisos, activarAvisos } = useGuardadas();
  const { items: catalogo } = useCatalogo();
  const { profile } = useProfile();
  // "Ahora" se congela al entrar a la pestaña para separar próximos de recientes.
  const [ahora, setAhora] = useState(() => Date.now());
  useFocusEffect(useCallback(() => setAhora(Date.now()), []));

  // Lo publicado en las últimas 2 semanas de tus temas (lo mismo que dispara los avisos).
  const nuevas = useMemo(
    () => (profile ? nuevasParaTi(catalogo, profile, ahora - HISTORIAL_MS) : []),
    [catalogo, profile, ahora],
  );

  const { proximos, recientes } = useMemo(() => {
    const plan = planDeAvisos(items);
    return {
      proximos: plan.filter((a) => a.fecha.getTime() > ahora).sort((a, b) => a.fecha.getTime() - b.fecha.getTime()),
      recientes: plan
        .filter((a) => a.fecha.getTime() <= ahora && ahora - a.fecha.getTime() < HISTORIAL_MS)
        .sort((a, b) => b.fecha.getTime() - a.fecha.getTime()),
    };
  }, [items, ahora]);

  const activar = async () => {
    // Si ya lo negó antes, Android/iOS no vuelven a preguntar: se abre Ajustes.
    if ((await activarAvisos()) === 'bloqueado') Linking.openSettings();
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
    >
      <Text style={styles.title}>Notificaciones</Text>

      {!avisosDisponibles && (
        <View style={styles.permiso}>
          <Ionicons name="information-circle-outline" size={24} color={colors.info} />
          <View style={styles.permisoText}>
            <Text style={styles.permisoTitle}>Recordatorios no disponibles en Expo Go</Text>
            <Text style={styles.permisoBody}>
              En Android, Expo Go no permite notificaciones. Funcionan en la app instalada (build de desarrollo o
              Play Store). Mientras tanto, aquí ves cuándo te avisaríamos.
            </Text>
          </View>
        </View>
      )}

      {avisosDisponibles && permisoAvisos === false && (
        <View style={styles.permiso}>
          <Ionicons name="notifications-off-outline" size={24} color={colors.info} />
          <View style={styles.permisoText}>
            <Text style={styles.permisoTitle}>Activa los recordatorios</Text>
            <Text style={styles.permisoBody}>
              Te avisamos 7, 3 y 1 día antes de que cierre cada favorito, a las 10 a. m.
            </Text>
          </View>
          <Button label="Activar" onPress={activar} style={styles.permisoButton} />
        </View>
      )}

      {nuevas.length > 0 && (
        <>
          <Text style={styles.section}>Nuevas para ti ✨</Text>
          {nuevas.map((o) => (
            <NovedadRow key={o.id} oportunidad={o} />
          ))}
        </>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon="notifications"
          title="Sin recordatorios todavía"
          body="Guarda becas y programas con el corazón y te avisaremos antes de que cierren"
          style={styles.empty}
        />
      ) : (
        <>
          <Text style={styles.section}>Próximos</Text>
          {proximos.length ? (
            proximos.map((a) => <AvisoRow key={a.identifier} aviso={a} />)
          ) : (
            <Text style={styles.muted}>No hay avisos pendientes para tus favoritos.</Text>
          )}

          {recientes.length > 0 && (
            <>
              <Text style={styles.section}>Recientes</Text>
              {recientes.map((a) => (
                <AvisoRow key={a.identifier} aviso={a} pasado />
              ))}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

function NovedadRow({ oportunidad: o }: { oportunidad: Oportunidad }) {
  const d = o.publicado_at ? new Date(o.publicado_at) : null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Nueva: ${o.titulo}`}
      onPress={() => router.push({ pathname: '/oportunidad/[id]', params: { id: o.id } })}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.rowIcon, styles.rowIconNueva]}>
        <Ionicons name="sparkles" size={20} color={colors.secondary} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>Nueva convocatoria</Text>
        <Text style={styles.rowBody} numberOfLines={2}>
          {o.titulo}
        </Text>
        {d && <Text style={styles.rowWhen}>Publicada el {d.getDate()} de {MESES[d.getMonth()].toLowerCase()}</Text>}
      </View>
    </Pressable>
  );
}

function AvisoRow({ aviso, pasado = false }: { aviso: Aviso; pasado?: boolean }) {
  const cuando = `${aviso.fecha.getDate()} de ${MESES[aviso.fecha.getMonth()].toLowerCase()}, 10:00`;
  const texto = aviso.dias === 1 ? 'Cierra mañana' : `Cierra en ${aviso.dias} días`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${texto}: ${aviso.oportunidad.titulo}`}
      onPress={() => router.push({ pathname: '/oportunidad/[id]', params: { id: aviso.oportunidad.id } })}
      style={({ pressed }) => [styles.row, pasado && styles.rowPasado, pressed && styles.pressed]}
    >
      <View style={[styles.rowIcon, pasado && styles.rowIconPasado]}>
        <Ionicons name={pasado ? 'notifications-outline' : 'alarm-outline'} size={20} color={colors.primaryText} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{texto}</Text>
        <Text style={styles.rowBody} numberOfLines={2}>
          {aviso.oportunidad.titulo}
        </Text>
        <Text style={styles.rowWhen}>{pasado ? `Enviado el ${cuando}` : cuando}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.screen, paddingBottom: spacing.xxl, gap: spacing.md },
  title: { ...typography.display, color: colors.text, marginBottom: spacing.sm },
  permiso: {
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...cardShadow,
  },
  permisoText: { gap: spacing.xs },
  permisoTitle: { ...typography.h2, color: colors.text },
  permisoBody: { ...typography.body, color: colors.textMuted },
  permisoButton: { alignSelf: 'stretch' },
  empty: { paddingTop: spacing.xxxl },
  section: { ...typography.h1, color: colors.text, marginTop: spacing.lg },
  muted: { ...typography.body, color: colors.textMuted },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...cardShadow,
  },
  rowPasado: { backgroundColor: colors.bgAlt, elevation: 0, shadowOpacity: 0 },
  pressed: { opacity: 0.85 },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconPasado: { backgroundColor: colors.secondaryTint },
  rowIconNueva: { backgroundColor: colors.accent },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { ...typography.bodyMedium, color: colors.text },
  rowBody: { ...typography.body, color: colors.text },
  rowWhen: { ...typography.caption, color: colors.textMuted },
});
