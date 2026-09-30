import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, Share, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackHeader } from '@/components/BackHeader';
import { Button } from '@/components/Button';
import { intereses, nivelesEducativos } from '@/constants/personalizacion';
import { CORREO_CONTACTO } from '@/constants/legal';
import { cardShadow, colors, radius, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { cachePersonal, PREFERENCIAS_DEFAULT, type Preferencias } from '@/lib/cache';
import { useGuardadas } from '@/lib/guardadas';
import { planDeAvisos } from '@/lib/recordatorios';
import { supabase } from '@/lib/supabase';

// Fila completa de `profiles` tal como está en la BD (RLS: solo la propia).
type PerfilCompleto = {
  mote: string | null;
  rango_edad: string | null;
  nivel_educativo: string | null;
  avatar_id: string | null;
  color: string | null;
  intereses: string[] | null;
  institucion: string | null;
  terminos_version: string | null;
  terminos_aceptados_at: string | null;
  consentimiento_tutor: boolean;
  bienvenida_enviada_at: string | null;
  created_at: string;
};

function fecha(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' });
}

// Derechos ARCO dentro de la app: Acceso (ver y copiar todo), Rectificación (editar perfil),
// Cancelación (eliminar cuenta, en Perfil) y Oposición (avisos de novedades).
export default function MisDatos() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { items: favoritos } = useGuardadas();
  const [perfil, setPerfil] = useState<PerfilCompleto | null>(null);
  const [error, setError] = useState(false);
  const [pref, setPref] = useState<Preferencias>(PREFERENCIAS_DEFAULT);
  // Momento de apertura de la pantalla: separa recordatorios futuros de los ya enviados.
  const [ahora] = useState(() => Date.now());
  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single<PerfilCompleto>()
      .then(({ data, error: e }) => (e ? setError(true) : setPerfil(data)));
    cachePersonal.leer<Preferencias>(userId, 'preferencias').then((p) => p && setPref(p));
  }, [userId]);

  const recordatorios = useMemo(
    () => planDeAvisos(favoritos).filter((a) => a.fecha.getTime() > ahora).length,
    [favoritos, ahora],
  );

  const cambiarNovedades = (valor: boolean) => {
    const nuevas = { ...pref, avisosNovedades: valor };
    setPref(nuevas);
    if (userId) cachePersonal.guardar(userId, 'preferencias', nuevas);
  };

  // Copia completa en texto (JSON legible) que la persona se puede mandar o guardar.
  const compartir = () => {
    const copia = {
      generado: new Date().toISOString(),
      cuenta: {
        correo: session?.user.email,
        creada: session?.user.created_at,
        correo_confirmado: session?.user.email_confirmed_at,
      },
      perfil,
      favoritos: favoritos.map((f) => ({ titulo: f.titulo, institucion: f.institucion, fecha_limite: f.fecha_limite })),
      en_este_telefono: { recordatorios_programados: recordatorios, preferencias: pref },
    };
    Share.share({ title: 'Mis datos en Becar.ia', message: JSON.stringify(copia, null, 2) });
  };

  const solicitudPorCorreo = () => {
    const asunto = encodeURIComponent('Solicitud ARCO - Becar.ia');
    const cuerpo = encodeURIComponent(
      `Hola, equipo de Becar.ia:\n\nQuiero ejercer mi derecho de (acceso / rectificación / cancelación / oposición / revocación):\n\n` +
        `Sobre estos datos:\n\nMi apodo en la app: ${perfil?.mote ?? ''}\n\nGracias.`,
    );
    Linking.openURL(`mailto:${CORREO_CONTACTO}?subject=${asunto}&body=${cuerpo}`).catch(() => {});
  };

  const nivel = nivelesEducativos.find((n) => n.value === perfil?.nivel_educativo)?.label;
  const misIntereses = intereses.filter((i) => perfil?.intereses?.includes(i.id)).map((i) => i.label);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxl },
      ]}
    >
      <BackHeader title="Mis datos" />
      <Text style={styles.lead}>
        Esto es todo lo que Becar.ia guarda sobre ti. No pedimos tu nombre real, fecha de nacimiento, fotos ni
        ubicación.
      </Text>

      {error && <Text style={styles.error}>No pudimos cargar tu perfil. Revisa tu conexión.</Text>}
      {!perfil && !error && <ActivityIndicator color={colors.primary} />}

      {perfil && (
        <>
          <Seccion titulo="Tu cuenta">
            <Dato label="Correo" valor={session?.user.email ?? '—'} />
            <Dato label="Creada el" valor={fecha(session?.user.created_at)} />
            <Dato label="Correo confirmado el" valor={fecha(session?.user.email_confirmed_at)} />
          </Seccion>

          <Seccion titulo="Tu perfil">
            <Dato label="Apodo" valor={perfil.mote ?? '—'} />
            <Dato label="Rango de edad" valor={perfil.rango_edad ?? '—'} />
            <Dato label="Nivel" valor={nivel ?? '—'} />
            <Dato label="Intereses" valor={misIntereses.join(', ') || '—'} />
            <Dato label="Institución" valor={perfil.institucion ?? 'No la diste'} />
            <Dato label="Avatar y color" valor={`${perfil.avatar_id ?? '—'} · ${perfil.color ?? '—'}`} />
          </Seccion>

          <Seccion titulo="Lo que aceptaste">
            <Dato label="Términos y Aviso de Privacidad" valor={`Versión ${perfil.terminos_version ?? '—'}`} />
            <Dato label="Aceptados el" valor={fecha(perfil.terminos_aceptados_at)} />
            {perfil.consentimiento_tutor && <Dato label="Permiso de tutor" valor="Declarado al registrarte" />}
          </Seccion>

          <Seccion titulo="Tu actividad">
            <Dato label="Favoritos" valor={`${favoritos.length}`} />
            {favoritos.slice(0, 5).map((f) => (
              <Text key={f.id} style={styles.item} numberOfLines={1}>
                · {f.titulo}
              </Text>
            ))}
            <Dato label="Recordatorios programados en este teléfono" valor={`${recordatorios}`} />
          </Seccion>

          <Seccion titulo="Tus decisiones">
            <View style={styles.switchRow}>
              <View style={styles.switchText}>
                <Text style={styles.switchTitle}>Avisos de convocatorias nuevas</Text>
                <Text style={styles.muted}>
                  Te avisamos cuando se publica algo de tus temas. Los recordatorios de tus favoritos se controlan
                  desde los ajustes de notificaciones del teléfono.
                </Text>
              </View>
              <Switch
                value={pref.avisosNovedades}
                onValueChange={cambiarNovedades}
                trackColor={{ true: colors.primary, false: colors.secondaryTint }}
                thumbColor={colors.white}
                accessibilityLabel="Avisos de convocatorias nuevas"
              />
            </View>
          </Seccion>

          <Button label="Compartirme una copia de mis datos" onPress={compartir} />
          <Button label="Corregir mis datos" variant="secondary" onPress={() => router.push('/editar-perfil')} />

          <View style={styles.otra}>
            <Text style={styles.muted}>¿Otra solicitud sobre tus datos (derechos ARCO)? Escríbenos desde tu correo:</Text>
            <Pressable onPress={solicitudPorCorreo} accessibilityRole="link">
              <Text style={styles.correo} selectable>
                {CORREO_CONTACTO}
              </Text>
            </Pressable>
            <Text style={styles.muted}>Respondemos en máximo 20 días hábiles. Es gratis.</Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{titulo}</Text>
      {children}
    </View>
  );
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <View style={styles.dato}>
      <Text style={styles.datoLabel}>{label}</Text>
      <Text style={styles.datoValor} selectable>
        {valor}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.screen, gap: spacing.lg },
  lead: { ...typography.body, color: colors.textMuted },
  error: { ...typography.body, color: colors.text },
  card: { backgroundColor: colors.bg, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, ...cardShadow },
  cardTitle: { ...typography.h2, color: colors.text },
  dato: { gap: 2 },
  datoLabel: { ...typography.caption, color: colors.textMuted },
  datoValor: { ...typography.body, color: colors.text },
  item: { ...typography.caption, color: colors.text },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  switchText: { flex: 1, gap: 2 },
  switchTitle: { ...typography.bodyMedium, color: colors.text },
  muted: { ...typography.caption, color: colors.textMuted },
  otra: { gap: spacing.xs, alignItems: 'center', paddingTop: spacing.sm },
  correo: { ...typography.bodyMedium, color: colors.primaryText },
});
