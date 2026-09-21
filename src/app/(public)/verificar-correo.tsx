import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { Floaty } from '@/components/Floaty';
import { colors, radius, spacing, typography } from '@/constants/theme';

export default function VerificarCorreo() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.screen },
      ]}
    >
      <View style={styles.content}>
        <Animated.View entering={ZoomIn.delay(100).springify().damping(9)}>
          <Floaty amplitude={8} rotate={4} duration={2200}>
            <View style={styles.icon}>
              <Ionicons name="mail-outline" size={40} color={colors.primaryText} />
            </View>
          </Floaty>
        </Animated.View>
        <Animated.View entering={FadeInUp.delay(300).springify().damping(16)} style={styles.copy}>
          <Text style={styles.title}>Revisa tu correo</Text>
          <Text style={styles.body}>
            Te enviamos un enlace para confirmar tu cuenta. Ábrelo y después inicia sesión.
          </Text>
        </Animated.View>
      </View>
      <Button label="Ir a iniciar sesión" onPress={() => router.replace('/login')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.screen,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  copy: {
    gap: 12,
  },
  icon: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    ...typography.display,
    color: colors.text,
    textAlign: 'center',
  },
  body: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
