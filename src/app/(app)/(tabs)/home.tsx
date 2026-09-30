import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { CategoryCard } from '@/components/CategoryCard';
import { ClosingSoonCard } from '@/components/ClosingSoonCard';
import { DiceButton } from '@/components/DiceButton';
import { OfflineBanner } from '@/components/OfflineBanner';
import { Reveal } from '@/components/Reveal';
import { SearchBar } from '@/components/SearchBar';
import { SuggestionCard } from '@/components/SuggestionCard';
import { temas, type Tema } from '@/constants/temas';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useCatalogo } from '@/lib/catalogo';
import { useProfile } from '@/lib/profile';
import { cierranPronto, sugerir } from '@/lib/sugerencias';

const GAP = spacing.md;
const COLUMNS = 3;

export default function Home() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { profile } = useProfile();
  const { items, cargando, sinConexion, refrescar } = useCatalogo();
  const [query, setQuery] = useState('');
  const [refrescando, setRefrescando] = useState(false);
  const ultima = useRef<string | null>(null);

  // Todo sale del catálogo local: aparece al instante y funciona sin conexión.
  const paraTi = useMemo(() => (profile ? sugerir(items, profile) : []), [items, profile]);
  const urgentes = useMemo(() => cierranPronto(items, profile), [items, profile]);

  // Cuadrícula de 3 columnas: floor evita que el redondeo mande la tercera tarjeta a otra fila.
  // Tarjetas de "Para ti": dejan asomar la siguiente para invitar a deslizar.
  const cardWidth = Math.min(280, Math.round(width * 0.74));
  const cellSize = Math.floor((width - spacing.screen * 2 - GAP * (COLUMNS - 1)) / COLUMNS);

  const buscar = () => router.push({ pathname: '/resultados', params: { q: query.trim() } });
  const abrirTema = (id: Tema['id']) => router.push({ pathname: '/resultados', params: { tema: id } });
  const abrir = (id: string) => router.push({ pathname: '/oportunidad/[id]', params: { id } });

  const alAzar = () => {
    if (!items.length) {
      Alert.alert('Aún no hay convocatorias abiertas', 'Vuelve pronto, estamos agregando más.');
      return;
    }
    // Evita repetir la misma dos veces seguidas cuando hay más de una.
    const opciones = items.length > 1 ? items.filter((o) => o.id !== ultima.current) : items;
    const elegida = opciones[Math.floor(Math.random() * opciones.length)];
    ultima.current = elegida.id;
    abrir(elegida.id);
  };

  const onRefresh = async () => {
    setRefrescando(true);
    await refrescar();
    setRefrescando(false);
  };

  return (
    <ScrollView
      style={styles.screen}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
      refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <Reveal step={0} style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.hello} numberOfLines={1}>
            Hola, {profile?.mote ?? 'de nuevo'}
          </Text>
          <Text style={styles.title}>¿Qué quieres encontrar hoy?</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Ir a tu perfil" onPress={() => router.navigate('/perfil')}>
          <Avatar avatarId={profile?.avatar_id ?? null} colorId={profile?.color ?? null} size={48} />
        </Pressable>
      </Reveal>

      <Reveal step={1} style={styles.searchRow}>
        <DiceButton onPress={alAzar} loading={cargando} />
        <View style={styles.searchField}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Busca becas, concursos…"
            onSubmitEditing={buscar}
          />
        </View>
      </Reveal>

      {sinConexion && <OfflineBanner />}

      <Reveal step={2}>
        <Text style={styles.section}>Explora por tema</Text>
      </Reveal>

      <View style={styles.grid}>
        {temas.map((t, i) => (
          <Reveal key={t.id} step={3 + i}>
            <CategoryCard tema={t} size={cellSize} onPress={() => abrirTema(t.id)} />
          </Reveal>
        ))}
      </View>

      {paraTi.length > 0 && (
        <Reveal step={3 + temas.length}>
          <View style={styles.paraTiHeader}>
            <View style={styles.paraTiIcon}>
              <Ionicons name="sparkles" size={18} color={colors.secondary} />
            </View>
            <View style={styles.paraTiText}>
              <Text style={styles.paraTiTitle}>Para ti, {profile?.mote}</Text>
              <Text style={styles.sectionHint}>Elegidas por tu nivel y lo que te interesa</Text>
            </View>
          </View>
          <FlatList
            horizontal
            data={paraTi}
            keyExtractor={(o) => o.id}
            showsHorizontalScrollIndicator={false}
            // Imán por tarjeta: el carrusel se detiene siempre con una tarjeta alineada al margen.
            snapToInterval={cardWidth + spacing.md}
            decelerationRate="fast"
            // Sangra hasta los bordes de la pantalla; la primera tarjeta queda alineada al margen.
            style={styles.carousel}
            contentContainerStyle={styles.carouselContent}
            renderItem={({ item }) => (
              <SuggestionCard
                sugerencia={item}
                width={cardWidth}
                onPress={() => abrir(item.id)}
              />
            )}
          />
        </Reveal>
      )}

      {!cargando && (
        <Reveal step={4 + temas.length} style={styles.urgentes}>
          <View style={styles.paraTiHeader}>
            <View style={[styles.paraTiIcon, styles.urgentesIcon]}>
              <Ionicons name="hourglass" size={18} color={colors.white} />
            </View>
            <View style={styles.paraTiText}>
              <Text style={styles.paraTiTitle}>Última llamada</Text>
              <Text style={styles.sectionHint}>
                {urgentes.length
                  ? `${urgentes.length === 1 ? 'Cierra' : 'Cierran'} esta semana. Si te late alguna, no la dejes para mañana`
                  : 'Lo que cierra en los próximos 7 días'}
              </Text>
            </View>
          </View>
          {urgentes.length ? (
            urgentes.map((o) => <ClosingSoonCard key={o.id} oportunidad={o} onPress={() => abrir(o.id)} />)
          ) : (
            <View style={styles.calma}>
              <Text style={styles.calmaEmoji}>😮‍💨</Text>
              <View style={styles.paraTiText}>
                <Text style={styles.calmaTitle}>Semana tranquila</Text>
                <Text style={styles.sectionHint}>
                  Nada de lo tuyo cierra en estos días. Buen momento para preparar documentos con calma.
                </Text>
              </View>
            </View>
          )}
        </Reveal>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  hello: {
    ...typography.bodyMedium,
    color: colors.textMuted,
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
  sectionHint: {
    ...typography.caption,
    color: colors.textMuted,
  },
  paraTiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  paraTiIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paraTiText: { flex: 1 },
  urgentes: { gap: spacing.md },
  // Navy: se distingue de "Para ti" (amarillo) sin usar el rojo, reservado a las fechas.
  urgentesIcon: { backgroundColor: colors.secondary },
  calma: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.bgAlt,
  },
  calmaEmoji: { fontSize: 32 },
  calmaTitle: { ...typography.bodyMedium, color: colors.text },
  paraTiTitle: { ...typography.h1, color: colors.text },
  carousel: {
    marginHorizontal: -spacing.screen,
  },
  carouselContent: {
    paddingHorizontal: spacing.screen,
    // Espacio para que la sombra de las cards no se corte.
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchField: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
});
