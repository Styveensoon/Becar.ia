import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AuthScreen } from '@/components/AuthScreen';
import { Button } from '@/components/Button';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Input } from '@/components/Input';
import { Reveal } from '@/components/Reveal';
import { colors, typography } from '@/constants/theme';
import { signInWithEmail } from '@/lib/authActions';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  const onEmailChange = (value: string) => {
    setEmail(value);
    setError(null);
  };

  const onPasswordChange = (value: string) => {
    setPassword(value);
    setError(null);
  };

  const onSubmit = async () => {
    setSubmitting(true);
    const result = await signInWithEmail(email, password);
    setSubmitting(false);
    if (!result.ok && result.sinConfirmar) {
      // Cuenta creada pero sin confirmar: se le manda un código nuevo y se pide ahí mismo.
      router.push({ pathname: '/verificar-correo', params: { email: email.trim(), reenviar: '1' } });
      return;
    }
    if (!result.ok) setError(result.message);
    // Con sesión válida el guard del layout raíz lleva a Home solo.
  };

  // Recuperación con código por correo; se lleva el correo si ya lo escribió.
  const onForgotPassword = () => router.push({ pathname: '/recuperar', params: { email: email.trim() } });

  return (
    <AuthScreen icon="log-in-outline">
      <Reveal step={0}>
        <Text style={styles.title}>Bienvenido de vuelta</Text>
        <Text style={styles.subtitle}>Inicia sesión para seguir encontrando oportunidades</Text>
      </Reveal>

      <View style={styles.fields}>
        <Reveal step={1}>
          <Input
            label="Correo electrónico"
            placeholder="tucorreo@ejemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={onEmailChange}
          />
        </Reveal>
        <Reveal step={2}>
          <Input
            label="Contraseña"
            isPassword
            autoCapitalize="none"
            value={password}
            onChangeText={onPasswordChange}
          />
          <Text
            accessibilityRole="link"
            onPress={onForgotPassword}
            style={styles.forgot}
          >
            ¿Olvidaste tu contraseña?
          </Text>
        </Reveal>
      </View>

      <Reveal step={3} style={styles.action}>
        {error && (
          <View style={styles.banner}>
            <ErrorBanner message={error} />
          </View>
        )}
        <Button
          label="Iniciar sesión"
          onPress={onSubmit}
          disabled={!canSubmit}
          loading={submitting}
        />
      </Reveal>

      <Reveal step={4}>
        <Text style={styles.footer}>
          ¿No tienes cuenta?{' '}
          <Link href="/signup" replace style={styles.footerAction}>
            Crear cuenta
          </Link>
        </Text>
      </Reveal>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.display,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 32,
  },
  fields: {
    gap: 16,
  },
  forgot: {
    ...typography.caption,
    color: colors.primaryText,
    textAlign: 'right',
    marginTop: 8,
  },
  action: {
    marginTop: 32,
  },
  banner: {
    marginBottom: 12,
  },
  footer: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 32,
  },
  footerAction: {
    ...typography.bodyMedium,
    color: colors.primaryText,
  },
});
