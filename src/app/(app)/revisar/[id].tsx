import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackHeader } from '@/components/BackHeader';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { CategoryBadge } from '@/components/CategoryBadge';
import { Checkbox } from '@/components/Checkbox';
import { Chip } from '@/components/Chip';
import { DeadlineBadge } from '@/components/DeadlineBadge';
import { EmptyState } from '@/components/EmptyState';
import { ErrorBanner } from '@/components/ErrorBanner';
import { temas } from '@/constants/temas';
import { cardShadow, colors, radius, spacing, typography } from '@/constants/theme';
import { MESES, fromDateKey } from '@/lib/fechas';
import { decidir, MOTIVOS_RECHAZO, obtenerParaValidar, type ParaValidar } from '@/lib/validacion';

// Lo que se confirma contra la fuente antes de publicar (CLAUDE.md: campo por campo,
// contra la fuente citada, no contra el resumen del modelo).
const CHECKLIST = [
  'La fuente es la página o el PDF oficial del convocante',
  'La fecha límite coincide con la fuente',
  'Las demás fechas (inicio, evento, resultados) coinciden o están vacías',
  'Niveles, edades y requisitos coinciden con la fuente',
  'El beneficio y el costo coinciden o están vacíos',
] as const;

function fecha(key: string | null): string {
  if (!key) return '—';
  const d = fromDateKey(key);
  return `${d.getDate()} de ${MESES[d.getMonth()].toLowerCase()} de ${d.getFullYear()}`;
}

type Carga = { tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'listo'; o: ParaValidar | null };

export default function RevisarOportunidad() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [carga, setCarga] = useState<Carga>({ tipo: 'cargando' });

  useEffect(() => {
    let vigente = true;
    obtenerParaValidar(id)
      .then((o) => vigente && setCarga({ tipo: 'listo', o }))
      .catch(() => vigente && setCarga({ tipo: 'error' }));
    return () => {
      vigente = false;
    };
  }, [id]);

  return (
    <ScrollView
      style={styles.screen}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxl },
      ]}
    >
      <BackHeader title="Revisar convocatoria" />
      {carga.tipo === 'cargando' && <ActivityIndicator color={colors.primary} style={styles.loader} />}
      {carga.tipo === 'error' && (
        <EmptyState icon="cloud-offline-outline" title="No pudimos cargarla" body="Revisa tu conexión" />
      )}
      {carga.tipo === 'listo' && !carga.o && (
        <EmptyState icon="search-outline" title="No existe" body="Puede que alguien la haya borrado" />
      )}
      {carga.tipo === 'listo' && carga.o && <Revision o={carga.o} />}
    </ScrollView>
  );
}

function Revision({ o }: { o: ParaValidar }) {
  const [revisado, setRevisado] = useState<boolean[]>(CHECKLIST.map(() => false));
  const [rechazando, setRechazando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState<'publicado' | 'rechazado' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const todoRevisado = revisado.every(Boolean);
  const temasLabel = o.temas.map((t) => temas.find((x) => x.id === t)?.label ?? t).join(', ');

  const confirmar = async (decision: 'publicado' | 'rechazado') => {
    setError(null);
    setEnviando(decision);
    try {
      await decidir(o.id, decision, decision === 'rechazado' ? motivo.trim() : undefined);
      router.back();
    } catch {
      setError('No se guardó la decisión. Revisa tu conexión e inténtalo otra vez');
      setEnviando(null);
    }
  };

  return (
    <View style={styles.revision}>
      <View style={styles.badges}>
        <CategoryBadge categoria={o.categoria} />
        {o.fecha_limite && <DeadlineBadge fecha={o.fecha_limite} />}
        {o.estado !== 'pendiente_validar' && (
          <Badge
            label={o.estado === 'publicado' ? 'Ya publicada' : 'Ya rechazada'}
            background={colors.secondaryTint}
            color={colors.text}
          />
        )}
      </View>
      <Text style={styles.title}>{o.titulo}</Text>
      {o.institucion && <Text style={styles.institucion}>{o.institucion}</Text>}

      {/* Evidencia primero: es lo que decide si vale la pena seguir revisando. */}
      <View style={[styles.card, styles.evidencia]}>
        <View style={styles.row}>
          <Ionicons
            name={o.evidencia_verificada ? 'shield-checkmark' : 'eye-outline'}
            size={22}
            color={o.evidencia_verificada ? colors.success : colors.warning}
          />
          <Text style={styles.cardTitle}>
            {o.evidencia_verificada ? 'Fecha comprobada en la fuente' : 'Revisa la fuente a mano'}
          </Text>
        </View>
        {o.evidencia_cita && (
          <View style={styles.cita}>
            <Text style={styles.citaText}>“{o.evidencia_cita}”</Text>
          </View>
        )}
        {o.notas_validacion && <Text style={styles.muted}>{o.notas_validacion}</Text>}
        <Text style={styles.url} numberOfLines={2}>
          {o.url_fuente}
        </Text>
        <Button
          label="Abrir fuente oficial"
          variant="secondary"
          onPress={() => o.url_fuente.startsWith('https://') && WebBrowser.openBrowserAsync(o.url_fuente)}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Fechas</Text>
        <Campo label="Abre inscripción" valor={fecha(o.fecha_inicio_inscripcion)} />
        <Campo label="Cierra inscripción" valor={fecha(o.fecha_limite)} destacado />
        <Campo label="Evento" valor={`${fecha(o.fecha_evento_inicio)} → ${fecha(o.fecha_evento_fin)}`} />
        <Campo label="Resultados" valor={fecha(o.fecha_resultados)} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Para quién</Text>
        <Campo label="Niveles" valor={o.niveles.join(', ') || '—'} destacado />
        <Campo label="Edad" valor={`${o.edad_minima ?? '—'} a ${o.edad_maxima ?? '—'} años`} />
        <Campo label="Carreras" valor={o.carreras.join(', ') || '—'} />
        <Campo label="Dirigido a" valor={o.dirigido_a ?? '—'} />
        <Campo label="Modalidad · ubicación" valor={`${o.modalidad ?? '—'} · ${o.ubicacion ?? '—'}`} />
        <Campo label="Temas (Home)" valor={temasLabel || '—'} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Contenido</Text>
        <Campo label="Descripción" valor={o.descripcion ?? '—'} />
        <Campo label="Beneficio" valor={o.monto ?? '—'} />
        <Campo label="Costo de inscripción" valor={o.costo_inscripcion ?? '—'} />
        <Campo label="Requisitos" valor={o.requisitos ?? '—'} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Antes de publicar, confirma</Text>
        {CHECKLIST.map((texto, i) => (
          <Checkbox
            key={texto}
            checked={revisado[i]}
            onToggle={() => setRevisado((r) => r.map((v, j) => (j === i ? !v : v)))}
            accessibilityLabel={texto}
          >
            <Text style={styles.checkText}>{texto}</Text>
          </Checkbox>
        ))}
      </View>

      {error && <ErrorBanner message={error} />}

      {!rechazando ? (
        <>
          <Button
            label={todoRevisado ? 'Publicar para los estudiantes' : `Confirma los ${CHECKLIST.length} puntos para publicar`}
            disabled={!todoRevisado || enviando !== null}
            loading={enviando === 'publicado'}
            onPress={() => confirmar('publicado')}
          />
          <Button label="Rechazar" variant="ghost" onPress={() => setRechazando(true)} />
        </>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>¿Por qué se rechaza?</Text>
          <View style={styles.badges}>
            {MOTIVOS_RECHAZO.map((m) => (
              <Chip key={m} label={m} selected={motivo === m} onPress={() => setMotivo(m)} />
            ))}
          </View>
          <TextInput
            value={motivo}
            onChangeText={setMotivo}
            placeholder="O escribe el motivo"
            placeholderTextColor={colors.textMuted}
            maxLength={500}
            multiline
            style={styles.input}
          />
          <Button
            label="Confirmar rechazo"
            variant="secondary"
            disabled={!motivo.trim() || enviando !== null}
            loading={enviando === 'rechazado'}
            onPress={() => confirmar('rechazado')}
          />
          <Button label="Cancelar" variant="ghost" onPress={() => setRechazando(false)} />
        </View>
      )}
    </View>
  );
}

function Campo({ label, valor, destacado = false }: { label: string; valor: string; destacado?: boolean }) {
  return (
    <View style={styles.campo}>
      <Text style={styles.campoLabel}>{label}</Text>
      <Text style={[styles.campoValor, destacado && styles.campoDestacado]}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgAlt },
  content: { paddingHorizontal: spacing.screen, gap: spacing.lg },
  loader: { marginTop: spacing.xxxl },
  revision: { gap: spacing.lg },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  title: { ...typography.h1, color: colors.text },
  institucion: { ...typography.bodyMedium, color: colors.textMuted, marginTop: -spacing.sm },
  card: {
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...cardShadow,
  },
  evidencia: { borderWidth: 1.5, borderColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardTitle: { ...typography.h2, color: colors.text, flexShrink: 1 },
  cita: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    backgroundColor: colors.bgAlt,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  citaText: { ...typography.body, color: colors.text, fontStyle: 'italic' },
  muted: { ...typography.caption, color: colors.textMuted },
  url: { ...typography.caption, color: colors.info },
  campo: { gap: 2 },
  campoLabel: { ...typography.caption, color: colors.textMuted },
  campoValor: { ...typography.body, color: colors.text },
  campoDestacado: { ...typography.bodyMedium },
  checkText: { ...typography.body, color: colors.text, flex: 1 },
  input: {
    ...typography.body,
    color: colors.text,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
