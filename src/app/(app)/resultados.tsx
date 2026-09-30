import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackHeader } from '@/components/BackHeader';
import { EmptyState } from '@/components/EmptyState';
import { OfflineBanner } from '@/components/OfflineBanner';
import { OpportunityCard } from '@/components/OpportunityCard';
import { SearchBar } from '@/components/SearchBar';
import { temas } from '@/constants/temas';
import { colors, spacing } from '@/constants/theme';
import { useCatalogo } from '@/lib/catalogo';
import { buscarEn } from '@/lib/oportunidades';

export default function Resultados() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ q?: string; tema?: string }>();
  // Solo se aceptan ids de tema conocidos; cualquier otro valor en la URL se ignora.
  const tema = temas.find((t) => t.id === params.tema);
  const { items: catalogo, cargando, sinConexion } = useCatalogo();
  const [texto, setTexto] = useState(params.q ?? '');
  const [busqueda, setBusqueda] = useState(params.q ?? '');

  // Búsqueda local sobre el catálogo: instantánea y sin conexión.
  const resultados = useMemo(
    () => buscarEn(catalogo, { texto: busqueda, tema: tema?.id }),
    [catalogo, busqueda, tema?.id],
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.lg }]}>
      <View style={styles.top}>
        <BackHeader title={tema?.label ?? 'Resultados'} />
        <SearchBar
          value={texto}
          onChangeText={setTexto}
          placeholder={tema ? `Buscar en ${tema.label}…` : 'Busca becas, concursos, instituciones…'}
          onSubmitEditing={() => setBusqueda(texto.trim())}
          autoFocus={!tema && !params.q}
        />
        {sinConexion && <OfflineBanner />}
      </View>

      {cargando ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={resultados}
          keyExtractor={(o) => o.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + spacing.xxl }]}
          renderItem={({ item }) => (
            <OpportunityCard
              oportunidad={item}
              onPress={() => router.push({ pathname: '/oportunidad/[id]', params: { id: item.id } })}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title="Sin resultados por ahora"
              body={
                busqueda
                  ? 'Prueba con otras palabras o revisa la ortografía'
                  : 'Aún no hay convocatorias abiertas aquí. Vuelve pronto'
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
  screen: { flex: 1, backgroundColor: colors.bg },
  top: { paddingHorizontal: spacing.screen, gap: spacing.lg, paddingBottom: spacing.lg },
  loader: { marginTop: spacing.xxxl },
  list: { paddingHorizontal: spacing.screen, paddingTop: spacing.xs, gap: spacing.md },
  empty: { paddingHorizontal: spacing.screen, paddingTop: spacing.xxxl },
});
