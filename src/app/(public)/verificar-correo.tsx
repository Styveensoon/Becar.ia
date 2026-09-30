import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { CodeInput } from '@/components/CodeInput';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Floaty } from '@/components/Floaty';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { LONGITUD_CODIGO, reenviarCodigoRegistro, verificarCodigoRegistro } from '@/lib/authActions';

const ESPERA_REENVIO_S = 60;

// Confirmar la cuenta con el código del correo (sin enlaces). Al validarlo se abre
// la sesión y el guard raíz lleva solo al onboarding.
export default function VerificarCorreo() {
  const insets = useSafeAreaInsets();
  // `reenviar=1` cuando se llega desde el login con una cuenta sin confirmar.
  const { email = '', reenviar } = useLocalSearchParams<{ email?: string; reenviar?: string }>();
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [espera, setEspera] = useState(ESPERA_REENVIO_S);

  useEffect(() => {
    if (espera <= 0) return;
    const t = setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [espera]);

  // Desde el login: el código del registro pudo vencer, así que se manda uno nuevo al entrar.
  useEffect(() => {
    if (reenviar !== '1' || !email) return;
    reenviarCodigoRegistro(email).then((r) => {
      if (r.ok) setAviso('Te mandamos un código nuevo.');
      else setError(r.message);
    });
  }, [reenviar, email]);

  const verificar = async (valor = codigo) => {
    if (valor.length !== LONGITUD_CODIGO || cargando) return;
    setError(null);
    setCargando(true);
    const r = await verificarCodigoRegistro(email, valor);
    setCargando(false);
    if (!r.ok) {
      setError(r.message);
      setCodigo('');
    }
    // Si fue válido, la sesión nueva hace que el guard muestre el onboarding.
  };

  const pedirOtro = async () => {
    setError(null);
    setAviso(null);
    const r = await reenviarCodigoRegistro(email);
    if (!r.ok) {
      setError(r.message);
      return;
    }
    setAviso('Listo, te mandamos un código nuevo.');
    setCodigo('');
    setEspera(ESPERA_REENVIO_S);
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.flex}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
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
              Te mandamos un código de {LONGITUD_CODIGO} dígitos a <Text style={styles.strong}>{email}</Text> para confirmar tu
              cuenta. Revisa también spam.
            </Text>
          </Animated.View>
        </View>

        <View style={styles.form}>
          <CodeInput value={codigo} onChange={setCodigo} onComplete={verificar} error={!!error} />
          {error && <ErrorBanner message={error} />}
          {aviso && !error && <Text style={styles.aviso}>{aviso}</Text>}
          <Button label="Confirmar cuenta" disabled={codigo.length !== LONGITUD_CODIGO} loading={cargando} onPress={() => verificar()} />
          <Button
            label={espera > 0 ? `Reenviar código en ${espera} s` : 'Reenviar código'}
            variant="ghost"
            disabled={espera > 0 || cargando}
            onPress={pedirOtro}
          />
          <Button label="Ya lo confirmé, iniciar sesión" variant="ghost" onPress={() => router.replace('/login')} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.screen,
    justifyContent: 'space-between',
    gap: spacing.xxl,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  icon: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    alignItems: 'center',
    gap: spacing.sm,
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
  strong: { ...typography.bodyMedium, color: colors.text },
  form: { gap: spacing.lg },
  aviso: { ...typography.caption, color: colors.success, textAlign: 'center' },
});
