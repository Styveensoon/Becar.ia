import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { MonthCalendar } from '@/components/MonthCalendar';
import { OpportunityCard } from '@/components/OpportunityCard';
import { colors, spacing, typography } from '@/constants/theme';
import { MESES, fromDateKey, toDateKey } from '@/lib/fechas';
import { useGuardadas } from '@/lib/guardadas';

export default function Calendario() {
  const insets = useSafeAreaInsets();
  const { items } = useGuardadas();
  const [month, setMonth] = useState(() => new Date());
  const [selected, setSelected] = useState(() => toDateKey(new Date()));

  // Cierres de los favoritos: puntos en el calendario y lista del día elegido.
  const deadlines = useMemo(
    () => new Set(items.flatMap((o) => (o.fecha_limite ? [o.fecha_limite] : []))),
    [items],
  );
  const delDia = items.filter((o) => o.fecha_limite === selected);
  const selectedDate = fromDateKey(selected);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
    >
      <Text style={styles.title}>Calendario</Text>

      <MonthCalendar
        month={month}
        onChangeMonth={setMonth}
        selected={selected}
        onSelect={setSelected}
        deadlines={deadlines}
      />

      <Text style={styles.section}>
        {selectedDate.getDate()} de {MESES[selectedDate.getMonth()].toLowerCase()}
      </Text>

      {delDia.length > 0 ? (
        <View style={styles.list}>
          {delDia.map((o) => (
            <OpportunityCard
              key={o.id}
              oportunidad={o}
              onPress={() => router.push({ pathname: '/oportunidad/[id]', params: { id: o.id } })}
            />
          ))}
        </View>
      ) : (
        <EmptyState
          icon="calendar"
          title="Sin cierres este día"
          body={
            items.length
              ? 'Los días con punto de color son cuando cierra alguno de tus favoritos'
              : 'Guarda becas y programas con el corazón y aquí verás cuándo cierran'
          }
          style={styles.empty}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  title: {
    ...typography.display,
    color: colors.text,
  },
  section: {
    ...typography.h1,
    color: colors.text,
    marginTop: spacing.lg,
  },
  list: {
    gap: spacing.md,
  },
  empty: {
    paddingVertical: spacing.xl,
  },
});
