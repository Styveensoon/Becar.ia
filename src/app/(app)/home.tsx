import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { colors, spacing, typography } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

// Placeholder hasta construir Home y el Tab Navigator.
export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>
      <Text style={styles.body}>Sesión iniciada. Aquí irán las oportunidades.</Text>
      <Button label="Cerrar sesión" variant="secondary" onPress={() => supabase.auth.signOut()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'stretch',
    justifyContent: 'center',
    padding: spacing.screen,
    gap: 12,
  },
  title: {
    ...typography.display,
    color: colors.text,
  },
  body: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: 12,
  },
});
