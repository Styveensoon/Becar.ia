import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import type { ComponentProps } from 'react';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackHeader } from '@/components/BackHeader';
import { Button } from '@/components/Button';
import { CategoryBadge } from '@/components/CategoryBadge';
import { DeadlineBadge } from '@/components/DeadlineBadge';
import { EmptyState } from '@/components/EmptyState';
import { HeartButton } from '@/components/HeartButton';
import { cardShadow, colors, radius, spacing, typography } from '@/constants/theme';
import { MESES, fromDateKey } from '@/lib/fechas';
import { useCatalogo } from '@/lib/catalogo';
import { obtenerOportunidad, type Oportunidad } from '@/lib/oportunidades';

type IconName = ComponentProps<typeof Ionicons>['name'];

const MODALIDAD_LABEL = { presencial: 'Presencial', en_linea: 'En línea', hibrida: 'Híbrida' } as const;
const NIVEL_LABEL: Record<string, string> = {
  secundaria: 'Secundaria',
  prepa: 'Prepa',
  universidad: 'Universidad',
  posgrado: 'Posgrado',
};

function fechaLarga(key: string): string {
  const d = fromDateKey(key);
  return `${d.getDate()} de ${MESES[d.getMonth()].toLowerCase()} de ${d.getFullYear()}`;
}

function rango(inicio: string | null, fin: string | null): string | null {
  if (inicio && fin && inicio !== fin) return `${fechaLarga(inicio)} al ${fechaLarga(fin)}`;
  return inicio || fin ? fechaLarga((inicio ?? fin) as string) : null;
}

function edades(min: number | null, max: number | null): string | null {
  if (min && max) return `De ${min} a ${max} años`;
  if (min) return `Desde ${min} años`;
  if (max) return `Hasta ${max} años`;
  return null;
}

type Estado = { tipo: 'cargando' } | { tipo: 'no-encontrada' } | { tipo: 'error' } | { tipo: 'listo'; o: Oportunidad };

export default function DetalleOportunidad() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { porId } = useCatalogo();
  // Primero el catálogo local (instantáneo, sin conexión); solo si no está se pide a la red
  // (p. ej. un favorito que ya cerró y salió del catálogo).
  const local = porId(id);
  const [remoto, setRemoto] = useState<Estado>({ tipo: 'cargando' });

  useEffect(() => {
    if (local) return;
    let vigente = true;
    obtenerOportunidad(id)
      .then((o) => vigente && setRemoto(o ? { tipo: 'listo', o } : { tipo: 'no-encontrada' }))
      .catch(() => vigente && setRemoto({ tipo: 'error' }));
    return () => {
      vigente = false;
    };
  }, [id, local]);

  const estado: Estado = local ? { tipo: 'listo', o: local } : remoto;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxl },
      ]}
    >
      <BackHeader right={estado.tipo === 'listo' && <HeartButton oportunidad={estado.o} size={24} />} />
      {estado.tipo === 'cargando' && <ActivityIndicator color={colors.primary} style={styles.loader} />}
      {estado.tipo === 'no-encontrada' && (
        <EmptyState icon="search-outline" title="Esta oportunidad ya no está disponible" body="Puede que haya cerrado o se haya retirado" />
      )}
      {estado.tipo === 'error' && (
        <EmptyState
          icon="cloud-offline-outline"
          title="No está guardada en tu teléfono"
          body="Conéctate a internet para verla. Las convocatorias abiertas sí se pueden ver sin conexión."
        />
      )}
      {estado.tipo === 'listo' && <Detalle o={estado.o} />}
    </ScrollView>
  );
}

function Detalle({ o }: { o: Oportunidad }) {
  const abrir = () => {
    // Doble candado: la BD ya exige https, pero nunca se abre otro esquema.
    if (o.url_fuente.startsWith('https://')) WebBrowser.openBrowserAsync(o.url_fuente);
  };

  const niveles = o.niveles.map((n) => NIVEL_LABEL[n] ?? n).join(', ');

  return (
    <View style={styles.detalle}>
      <View style={styles.badges}>
        <CategoryBadge categoria={o.categoria} />
        {o.fecha_limite && <DeadlineBadge fecha={o.fecha_limite} />}
      </View>
      <Text style={styles.title}>{o.titulo}</Text>
      {o.institucion && <Text style={styles.institucion}>{o.institucion}</Text>}
      {o.descripcion && <Text style={styles.body}>{o.descripcion}</Text>}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Fechas importantes</Text>
        <Dato icon="time-outline" label="Inscripción" value={rango(o.fecha_inicio_inscripcion, o.fecha_limite)} />
        <Dato icon="calendar-outline" label="Evento" value={rango(o.fecha_evento_inicio, o.fecha_evento_fin)} />
        <Dato icon="trophy-outline" label="Resultados" value={o.fecha_resultados && fechaLarga(o.fecha_resultados)} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>¿Para quién es?</Text>
        <Dato icon="people-outline" label="Dirigido a" value={o.dirigido_a} />
        <Dato icon="school-outline" label="Nivel" value={niveles || null} />
        <Dato icon="person-outline" label="Edad" value={edades(o.edad_minima, o.edad_maxima)} />
        <Dato
          icon="location-outline"
          label="Dónde"
          value={[o.modalidad && MODALIDAD_LABEL[o.modalidad], o.ubicacion].filter(Boolean).join(' · ') || null}
        />
      </View>

      {(o.monto || o.costo_inscripcion) && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Beneficio y costo</Text>
          <Dato icon="cash-outline" label="Qué obtienes" value={o.monto} />
          <Dato icon="pricetag-outline" label="Inscripción" value={o.costo_inscripcion} />
        </View>
      )}

      {o.requisitos && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Requisitos</Text>
          <Text style={styles.body}>{o.requisitos}</Text>
        </View>
      )}

      <Text style={styles.nota}>Verifica siempre los detalles en la convocatoria oficial antes de aplicar.</Text>
      <Button label="Ver convocatoria oficial" onPress={abrir} />
    </View>
  );
}

function Dato({ icon, label, value }: { icon: IconName; label: string; value: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.dato}>
      <Ionicons name={icon} size={20} color={colors.primaryText} style={styles.datoIcon} />
      <View style={styles.datoText}>
        <Text style={styles.datoLabel}>{label}</Text>
        <Text style={styles.datoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: spacing.screen,
    gap: spacing.lg,
  },
  loader: {
    marginTop: spacing.xxxl,
  },
  detalle: {
    gap: spacing.lg,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  title: {
    ...typography.display,
    color: colors.text,
  },
  institucion: {
    ...typography.bodyMedium,
    color: colors.textMuted,
    marginTop: -spacing.sm,
  },
  body: {
    ...typography.body,
    color: colors.text,
  },
  card: {
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...cardShadow,
  },
  cardTitle: {
    ...typography.h2,
    color: colors.text,
  },
  dato: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  datoIcon: {
    marginTop: 2,
  },
  datoText: {
    flex: 1,
  },
  datoLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  datoValue: {
    ...typography.body,
    color: colors.text,
  },
  nota: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
