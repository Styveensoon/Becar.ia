import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { ValidationCard } from '@/components/ValidationCard';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useProfile } from '@/lib/profile';
import { supabase } from '@/lib/supabase';
import { listarBandeja, type Bandeja, type ParaValidar } from '@/lib/validacion';

// Panel del equipo: lo único que ven las cuentas de validación.
export default function PanelValidacion() {
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const [bandeja, setBandeja] = useState<Bandeja>('pendientes');
  const [items, setItems] = useState<ParaValidar[] | null>(null);
  const [error, setError] = useState(false);
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(async (b: Bandeja) => {
    try {
      setItems(await listarBandeja(b));
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  // Al volver de revisar una, la lista se actualiza sola.
  useFocusEffect(
    useCallback(() => {
      cargar(bandeja);
    }, [bandeja, cargar]),
  );

  const cambiar = (b: Bandeja) => {
    setItems(null);
    setBandeja(b);
  };

  const refrescar = async () => {
    setRefrescando(true);
    await cargar(bandeja);
    setRefrescando(false);
  };

  const verificadas = items?.filter((i) => i.evidencia_verificada).length ?? 0;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.lg }]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>Equipo Becar.ia · {profile?.mote}</Text>
          <Text style={styles.title}>Validación</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
          hitSlop={8}
          onPress={() => supabase.auth.signOut()}
          style={styles.logout}
        >
          <Ionicons name="log-out-outline" size={22} color={colors.text} />
        </Pressable>
      </View>
      <Text style={styles.lead}>
        Lo que publiques aquí es lo que ven los estudiantes. Revisa cada dato contra la fuente oficial.
      </Text>

      <View style={styles.tabs} accessibilityRole="tablist">
        {(['pendientes', 'historial'] as const).map((b) => (
          <Pressable
            key={b}
            accessibilityRole="tab"
            accessibilityState={{ selected: bandeja === b }}
            onPress={() => cambiar(b)}
            style={[styles.tab, bandeja === b && styles.tabActive]}
          >
            <Text style={[styles.tabText, bandeja === b && styles.tabTextActive]}>
              {b === 'pendientes' ? `Pendientes${bandeja === 'pendientes' && items ? ` (${items.length})` : ''}` : 'Historial'}
            </Text>
          </Pressable>
        ))}
      </View>

      {bandeja === 'pendientes' && items && items.length > 0 && (
        <Text style={styles.resumen}>
          {verificadas} con fecha comprobada · {items.length - verificadas} por revisar a mano
        </Text>
      )}

      {error && (
        <EmptyState
          icon="cloud-offline-outline"
          title="No pudimos cargar la lista"
          body="Revisa tu conexión y toca para reintentar"
          onPress={() => cargar(bandeja)}
          style={styles.empty}
        />
      )}
      {!error && !items && <ActivityIndicator color={colors.primary} style={styles.loader} />}
      {!error && items && (
        <FlatList
          data={items}
          keyExtractor={(o) => o.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + spacing.xxl }]}
          refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={colors.primary} />}
          renderItem={({ item }) => (
            <ValidationCard
              item={item}
              onPress={() => router.push({ pathname: '/revisar/[id]', params: { id: item.id } })}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={bandeja === 'pendientes' ? 'checkmark-done' : 'time-outline'}
              title={bandeja === 'pendientes' ? '¡Todo al día!' : 'Aún no hay decisiones'}
              body={
                bandeja === 'pendientes'
                  ? 'No hay convocatorias por revisar. El pipeline busca nuevas cada lunes.'
                  : 'Aquí verás lo último que el equipo publicó o rechazó.'
              }
              style={styles.empty}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgAlt },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.screen },
  headerText: { flex: 1 },
  kicker: { ...typography.captionMedium, color: colors.primaryText },
  title: { ...typography.display, color: colors.text },
  logout: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lead: { ...typography.body, color: colors.textMuted, paddingHorizontal: spacing.screen, marginTop: spacing.xs },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: spacing.screen,
    marginTop: spacing.lg,
    padding: 4,
    borderRadius: radius.md,
    backgroundColor: colors.secondaryTint,
  },
  tab: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm, alignItems: 'center' },
  tabActive: { backgroundColor: colors.bg },
  tabText: { ...typography.captionMedium, color: colors.textMuted },
  tabTextActive: { color: colors.text },
  resumen: { ...typography.caption, color: colors.textMuted, paddingHorizontal: spacing.screen, marginTop: spacing.md },
  loader: { marginTop: spacing.xxxl },
  list: { paddingHorizontal: spacing.screen, paddingTop: spacing.md, gap: spacing.md },
  empty: { paddingTop: spacing.xxxl, paddingHorizontal: spacing.screen },
});
