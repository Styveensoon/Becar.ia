import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing, typography } from '@/constants/theme';

type LegalScreenProps = {
  title: string;
  body: string;
};

export function LegalScreen({ title, body }: LegalScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        paddingTop: insets.top + 8,
        paddingBottom: insets.bottom + spacing.screen,
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
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  back: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    marginLeft: -8,
  },
  title: {
    ...typography.display,
    color: colors.text,
    marginTop: 24,
    marginBottom: 16,
  },
  body: {
    ...typography.body,
    color: colors.text,
  },
});
