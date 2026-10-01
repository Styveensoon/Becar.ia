import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode, RefObject } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthArt } from '@/components/AuthArt';
import { colors, spacing } from '@/constants/theme';

type AuthScreenProps = {
  icon: keyof typeof Ionicons.glyphMap;
  children: ReactNode;
  // Para que un hijo (p. ej. CodeInput) pueda desplazar la pantalla al abrir el teclado.
  scrollRef?: RefObject<ScrollView | null>;
};

export function AuthScreen({ icon, children, scrollRef }: AuthScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    // 'padding' también en Android: con edge-to-edge (obligatorio desde Expo SDK 54) la ventana ya no
    // se encoge sola al abrir el teclado, así que sin esto el teclado tapa los campos.
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      <ScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: spacing.screen,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            hitSlop={12}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/landing'))}
            style={styles.back}
          >
            <Ionicons name="arrow-back" size={24} color={colors.secondary} />
          </Pressable>
          <AuthArt icon={icon} />
        </View>
        <View style={styles.body}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  back: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    marginLeft: -8,
  },
  body: {
    marginTop: 8,
  },
});
