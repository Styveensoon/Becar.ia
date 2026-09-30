import { router } from 'expo-router';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { OpportunityCard } from '@/components/OpportunityCard';
import { colors, spacing, typography } from '@/constants/theme';
import { useGuardadas } from '@/lib/guardadas';

export default function Favoritos() {
  const insets = useSafeAreaInsets();
  const { items, loading } = useGuardadas();

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.lg }]}>
      <Text style={styles.title}>Favoritos</Text>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(o) => o.id}
          contentContainerStyle={[styles.list, items.length === 0 && styles.listEmpty]}
          renderItem={({ item }) => (
            <OpportunityCard
              oportunidad={item}
              onPress={() => router.push({ pathname: '/oportunidad/[id]', params: { id: item.id } })}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="heart"
              title="Aún no tienes favoritos"
              body="Toca el corazón de una beca o programa para tenerlo a la mano y no perder su fecha límite"
              style={styles.empty}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  title: {
    ...typography.display,
    color: colors.text,
    paddingHorizontal: spacing.screen,
  },
  loader: {
    marginTop: spacing.xxxl,
  },
  list: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  listEmpty: {
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    paddingBottom: spacing.xxxl,
  },
});
