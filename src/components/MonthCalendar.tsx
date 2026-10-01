import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { cardShadow, colors, radius, spacing, typography } from '@/constants/theme';
import { MESES, toDateKey, urgencia } from '@/lib/fechas';

type MonthCalendarProps = {
  // Cualquier día del mes a mostrar.
  month: Date;
  onChangeMonth: (month: Date) => void;
  selected: string | null;
  onSelect: (dateKey: string) => void;
  // Días con fecha límite ('YYYY-MM-DD'); el punto toma el color de urgencia.
  deadlines: ReadonlySet<string>;
};

const DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as const;

const DOT_COLOR = {
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
  vencida: colors.textMuted,
} as const;

export function MonthCalendar({ month, onChangeMonth, selected, onSelect, deadlines }: MonthCalendarProps) {
  const year = month.getFullYear();
  const m = month.getMonth();
  const todayKey = toDateKey(new Date());

  // Semana inicia en lunes; huecos al inicio y al final para completar filas de 7.
  const cells = useMemo(() => {
    const offset = (new Date(year, m, 1).getDay() + 6) % 7;
    const total = new Date(year, m + 1, 0).getDate();
    const days: (Date | null)[] = Array.from({ length: offset }, () => null);
    for (let d = 1; d <= total; d++) days.push(new Date(year, m, d));
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [year, m]);

  const shift = (delta: number) => {
    Haptics.selectionAsync();
    onChangeMonth(new Date(year, m + delta, 1));
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mes anterior"
          hitSlop={8}
          onPress={() => shift(-1)}
          style={styles.navBtn}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.month}>
          {MESES[m]} {year}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mes siguiente"
          hitSlop={8}
          onPress={() => shift(1)}
          style={styles.navBtn}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.row}>
        {DIAS.map((d, i) => (
          <Text key={i} style={styles.weekday}>
            {d}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((date, i) => {
          if (!date) return <View key={i} style={styles.cell} />;
          const key = toDateKey(date);
          const isSelected = key === selected;
          const isToday = key === todayKey;
          const hasDeadline = deadlines.has(key);
          return (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={`${date.getDate()} de ${MESES[m]}${hasDeadline ? ', con fecha límite' : ''}`}
              accessibilityState={{ selected: isSelected }}
              onPress={() => onSelect(key)}
              style={styles.cell}
            >
              <View style={[styles.day, isToday && styles.today, isSelected && styles.selected]}>
                <Text style={[styles.dayText, (isToday || isSelected) && styles.dayTextStrong]}>
                  {date.getDate()}
                </Text>
              </View>
              {hasDeadline && <View style={[styles.dot, { backgroundColor: DOT_COLOR[urgencia(key)] }]} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...cardShadow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.bgAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  month: {
    ...typography.h2,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
  },
  weekday: {
    ...typography.captionMedium,
    flex: 1,
    textAlign: 'center',
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    // Fondo desde el inicio (igual al de la tarjeta): en Android, si el fondo aparece después de
    // montar (al seleccionar un día) se pierde el borderRadius y el día se veía cuadrado.
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  today: {
    backgroundColor: colors.primaryTint,
  },
  selected: {
    backgroundColor: colors.primary,
  },
  dayText: {
    ...typography.body,
    color: colors.text,
  },
  // Sobre `primary` y `primary-tint` el número va en navy SemiBold (nunca blanco sobre primary).
  dayTextStrong: {
    fontFamily: typography.button.fontFamily,
  },
  dot: {
    position: 'absolute',
    bottom: 2,
    width: 5,
    height: 5,
    borderRadius: radius.full,
  },
});
