import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { SeccionLegal } from '@/constants/legal';
import { colors, spacing, typography } from '@/constants/theme';

type LegalScreenProps = {
  title: string;
  updated: string;
  intro?: string;
  sections: SeccionLegal[];
};

export function LegalScreen({ title, updated, intro, sections }: LegalScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        paddingTop: insets.top + 8,
        paddingBottom: insets.bottom + spacing.xxl,
        paddingHorizontal: spacing.screen,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Volver"
        hitSlop={12}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        style={styles.back}
      >
        <Ionicons name="arrow-back" size={24} color={colors.secondary} />
      </Pressable>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.updated}>Última actualización: {updated}</Text>
      {intro && <Text style={[styles.body, styles.intro]}>{intro}</Text>}

      {sections.map((s) => (
        <View key={s.titulo} style={styles.section}>
          <Text style={styles.heading} accessibilityRole="header">
            {s.titulo}
          </Text>
          {s.parrafos.map((p, i) =>
            p.startsWith('• ') ? (
              <View key={i} style={styles.bulletRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={[styles.body, styles.bulletText]}>{p.slice(2)}</Text>
              </View>
            ) : (
              <Text key={i} style={styles.body}>
                {p}
              </Text>
            ),
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  back: { width: 44, height: 44, justifyContent: 'center', marginLeft: -8 },
  title: { ...typography.display, color: colors.text, marginTop: spacing.xl },
  updated: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  intro: { marginTop: spacing.lg },
  section: { marginTop: spacing.xl, gap: spacing.sm },
  heading: { ...typography.h2, color: colors.text },
  body: { ...typography.body, color: colors.text },
  bulletRow: { flexDirection: 'row', gap: spacing.sm, paddingLeft: spacing.xs },
  bullet: { ...typography.body, color: colors.primaryText },
  bulletText: { flex: 1 },
});
