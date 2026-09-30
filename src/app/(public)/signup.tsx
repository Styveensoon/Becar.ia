import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AuthScreen } from '@/components/AuthScreen';
import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { Chip } from '@/components/Chip';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Input } from '@/components/Input';
import { Reveal } from '@/components/Reveal';
import { esMenorDeEdad, MAX_MOTE, nivelesEducativos, rangosEdad } from '@/constants/personalizacion';
import { colors, typography } from '@/constants/theme';
import {
  signUpWithEmail,
  type NivelEducativo,
  type RangoEdad,
} from '@/lib/authActions';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [mote, setMote] = useState('');
  const [rango, setRango] = useState<RangoEdad | null>(null);
  const [nivel, setNivel] = useState<NivelEducativo | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [tutor, setTutor] = useState(false);

  const [touched, setTouched] = useState({ email: false, password: false, confirm: false, mote: false });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const emailValid = EMAIL_REGEX.test(email.trim());
  const passwordValid = password.length >= 8;
  const confirmValid = confirm.length > 0 && confirm === password;
  const moteValid = mote.trim().length > 0;

  // 13-17: la LFPDPPP exige el consentimiento de quien ejerce la patria potestad o tutela.
  const esMenor = esMenorDeEdad(rango);

  const canSubmit =
    emailValid &&
    passwordValid &&
    confirmValid &&
    moteValid &&
    rango !== null &&
    nivel !== null &&
    accepted &&
    (!esMenor || tutor);

  const touch = (field: keyof typeof touched) => setTouched((t) => ({ ...t, [field]: true }));

  const onSubmit = async () => {
    if (!canSubmit || !rango || !nivel) return;
    setError(null);
    setSubmitting(true);
    const result = await signUpWithEmail({
      email,
      password,
      mote,
      rangoEdad: rango,
      nivelEducativo: nivel,
      consentimientoTutor: esMenor && tutor,
    });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    if (result.needsVerification) {
      router.replace({ pathname: '/verificar-correo', params: { email: email.trim() } });
    }
  };

  return (
    <AuthScreen icon="sparkles-outline">
      <Reveal step={0}>
        <Text style={styles.title}>Crea tu cuenta</Text>
        <Text style={styles.subtitle}>Encuentra becas hechas para ti en minutos</Text>
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
            onChangeText={setEmail}
            onBlur={() => touch('email')}
            error={touched.email && !emailValid ? 'Ingresa un correo válido' : undefined}
          />
        </Reveal>
        <Reveal step={2}>
          <Input
            label="Contraseña"
            isPassword
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
            onBlur={() => touch('password')}
            helper="Mínimo 8 caracteres"
            error={
              touched.password && !passwordValid
                ? 'La contraseña necesita al menos 8 caracteres'
                : undefined
            }
          />
        </Reveal>
        <Reveal step={3}>
          <Input
            label="Confirmar contraseña"
            isPassword
            autoCapitalize="none"
            value={confirm}
            onChangeText={setConfirm}
            onBlur={() => touch('confirm')}
            error={touched.confirm && !confirmValid ? 'Las contraseñas no coinciden' : undefined}
          />
        </Reveal>
        <Reveal step={4}>
          <Input
            label="¿Cómo quieres que te llamen?"
            autoCorrect={false}
            maxLength={MAX_MOTE}
            value={mote}
            onChangeText={setMote}
            onBlur={() => touch('mote')}
            helper="Así te van a ver otros usuarios, no uses tu nombre completo"
            helperItalic
            error={touched.mote && !moteValid ? 'Elige un apodo' : undefined}
          />
        </Reveal>

        <Reveal step={5}>
          <View>
            <Text style={styles.groupLabel}>¿Cuál es tu rango de edad?</Text>
            <View style={styles.chips} accessibilityRole="radiogroup">
              {rangosEdad.map((r) => (
                <Chip key={r.value} label={r.label} selected={rango === r.value} onPress={() => setRango(r.value)} />
              ))}
            </View>
          </View>
        </Reveal>

        <Reveal step={6}>
          <View>
            <Text style={styles.groupLabel}>¿En qué nivel estás?</Text>
            <View style={styles.chips} accessibilityRole="radiogroup">
              {nivelesEducativos.map((n) => (
                <Chip key={n.value} label={n.label} selected={nivel === n.value} onPress={() => setNivel(n.value)} />
              ))}
            </View>
          </View>
        </Reveal>
      </View>

      <Reveal step={7} style={styles.terms}>
        <Checkbox
          checked={accepted}
          onToggle={() => setAccepted((a) => !a)}
          accessibilityLabel="Acepto los Términos y Condiciones y el Aviso de Privacidad"
        >
          <Text style={styles.termsText}>
            Acepto los{' '}
            <Link href="/terminos" style={styles.termsLink}>
              Términos y Condiciones
            </Link>{' '}
            y el{' '}
            <Link href="/privacidad" style={styles.termsLink}>
              Aviso de Privacidad
            </Link>
          </Text>
        </Checkbox>
        {esMenor && (
          <View style={styles.tutor}>
            <Checkbox
              checked={tutor}
              onToggle={() => setTutor((t) => !t)}
              accessibilityLabel="Mi madre, padre o tutor conoce y autoriza que use Becar.ia"
            >
              <Text style={styles.termsText}>
                Mi madre, padre o tutor conoce y autoriza que use Becar.ia y el tratamiento de mis datos
              </Text>
            </Checkbox>
          </View>
        )}
      </Reveal>

      <Reveal step={8} style={styles.action}>
        {error && (
          <View style={styles.banner}>
            <ErrorBanner message={error} />
          </View>
        )}
        <Button label="Crear cuenta" onPress={onSubmit} disabled={!canSubmit} loading={submitting} />
      </Reveal>

      <Reveal step={9}>
        <Text style={styles.footer}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" replace style={styles.footerAction}>
            Iniciar sesión
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
  groupLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  terms: {
    marginTop: 24,
  },
  tutor: {
    marginTop: 12,
  },
  termsText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  termsLink: {
    ...typography.caption,
    color: colors.primaryText,
    textDecorationLine: 'underline',
  },
  action: {
    marginTop: 24,
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
