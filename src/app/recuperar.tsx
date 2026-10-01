import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AuthScreen } from '@/components/AuthScreen';
import { Button } from '@/components/Button';
import { CodeInput } from '@/components/CodeInput';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Input } from '@/components/Input';
import { ProgressBar } from '@/components/ProgressBar';
import { colors, spacing, typography } from '@/constants/theme';
import {
  cambiarContrasena,
  enviarCodigoRecuperacion,
  LONGITUD_CODIGO,
  verificarCodigoRecuperacion,
} from '@/lib/authActions';

type Paso = 'correo' | 'codigo' | 'contrasena' | 'listo';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ESPERA_REENVIO_S = 60;

// Recuperar contraseña con un código por correo. Vive fuera de los guards de
// sesión: al validar el código se crea una sesión y la pantalla debe seguir montada para
// pedir la contraseña nueva.
export default function Recuperar() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [paso, setPaso] = useState<Paso>('correo');
  const [email, setEmail] = useState(params.email ?? '');
  const [codigo, setCodigo] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [espera, setEspera] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  // Cuenta regresiva para volver a pedir el código (evita saturar el envío de correos).
  useEffect(() => {
    if (espera <= 0) return;
    const t = setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [espera]);

  const emailValido = EMAIL_REGEX.test(email.trim());
  const passwordValida = password.length >= 8;
  const confirmValida = confirm.length > 0 && confirm === password;

  const enviar = async () => {
    setError(null);
    setCargando(true);
    const r = await enviarCodigoRecuperacion(email);
    setCargando(false);
    if (!r.ok) {
      setError(r.message);
      return;
    }
    setCodigo('');
    setEspera(ESPERA_REENVIO_S);
    setPaso('codigo');
  };

  const verificar = async (valor = codigo) => {
    if (valor.length !== LONGITUD_CODIGO || cargando) return;
    setError(null);
    setCargando(true);
    const r = await verificarCodigoRecuperacion(email, valor);
    setCargando(false);
    if (!r.ok) {
      setError(r.message);
      setCodigo('');
      return;
    }
    setPaso('contrasena');
  };

  const guardar = async () => {
    setError(null);
    setCargando(true);
    const r = await cambiarContrasena(password);
    setCargando(false);
    if (!r.ok) {
      setError(r.message);
      return;
    }
    setPaso('listo');
  };

  const numero = { correo: 1, codigo: 2, contrasena: 3, listo: 3 }[paso];

  return (
    <AuthScreen icon="key-outline" scrollRef={scrollRef}>
      <ProgressBar step={numero} total={3} />

      {paso === 'correo' && (
        <View style={styles.block}>
          <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
          <Text style={styles.subtitle}>Escribe el correo de tu cuenta y te mandamos un código de {LONGITUD_CODIGO} dígitos.</Text>
          <Input
            label="Correo electrónico"
            placeholder="tucorreo@ejemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={() => emailValido && enviar()}
          />
          {error && <ErrorBanner message={error} />}
          <Button label="Enviar código" disabled={!emailValido} loading={cargando} onPress={enviar} />
          <Button label="Volver a iniciar sesión" variant="ghost" onPress={() => router.back()} />
        </View>
      )}

      {paso === 'codigo' && (
        <View style={styles.block}>
          <Text style={styles.title}>Revisa tu correo</Text>
          <Text style={styles.subtitle}>
            Si hay una cuenta con <Text style={styles.strong}>{email.trim()}</Text>, te llegó un código de{' '}
            {LONGITUD_CODIGO} dígitos. Revisa también spam.
          </Text>
          <CodeInput value={codigo} onChange={setCodigo} onComplete={verificar} error={!!error} scrollRef={scrollRef} />
          {error && <ErrorBanner message={error} />}
          <Button label="Verificar código" disabled={codigo.length !== LONGITUD_CODIGO} loading={cargando} onPress={() => verificar()} />
          <Button
            label={espera > 0 ? `Reenviar código en ${espera} s` : 'Reenviar código'}
            variant="ghost"
            disabled={espera > 0 || cargando}
            onPress={enviar}
          />
          <Button
            label="Cambiar correo"
            variant="ghost"
            onPress={() => {
              setError(null);
              setPaso('correo');
            }}
          />
        </View>
      )}

      {paso === 'contrasena' && (
        <View style={styles.block}>
          <Text style={styles.title}>Crea tu contraseña nueva</Text>
          <Text style={styles.subtitle}>Usa una que no uses en otras apps.</Text>
          <Input
            label="Contraseña nueva"
            isPassword
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
            helper="Mínimo 8 caracteres"
            error={password.length > 0 && !passwordValida ? 'La contraseña necesita al menos 8 caracteres' : undefined}
          />
          <Input
            label="Confirmar contraseña"
            isPassword
            autoCapitalize="none"
            value={confirm}
            onChangeText={setConfirm}
            error={confirm.length > 0 && !confirmValida ? 'Las contraseñas no coinciden' : undefined}
          />
          {error && <ErrorBanner message={error} />}
          <Button
            label="Guardar contraseña"
            disabled={!passwordValida || !confirmValida}
            loading={cargando}
            onPress={guardar}
          />
        </View>
      )}

      {paso === 'listo' && (
        <View style={styles.block}>
          <Text style={styles.title}>¡Listo! 🔐</Text>
          <Text style={styles.subtitle}>Tu contraseña se cambió y ya tienes la sesión abierta.</Text>
          <Button label="Continuar" onPress={() => router.replace('/home')} />
        </View>
      )}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.lg, marginTop: spacing.xl },
  title: { ...typography.display, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted },
  strong: { ...typography.bodyMedium, color: colors.text },
});
