import { router, Stack, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { InAppNotice } from '@/components/InAppNotice';
import { colors, spacing } from '@/constants/theme';
import { CatalogoProvider } from '@/lib/catalogo';
import { GuardadasProvider } from '@/lib/guardadas';
import { useAvisarNovedades } from '@/lib/novedades';
import { ProfileProvider, useProfile } from '@/lib/profile';
import { escucharToques } from '@/lib/recordatorios';

// Tocar un recordatorio abre el detalle de la oportunidad (también con la app cerrada).
// Espera a que el perfil cargue y esté completo para que la ruta exista en el Stack.
function useAbrirDesdeNotificacion(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    return escucharToques((id) => router.push({ pathname: '/oportunidad/[id]', params: { id } }));
  }, [enabled]);
}

// La app arranca en /home (src/app/index.tsx). Para el equipo esa ruta no existe: se manda
// explícitamente al panel en vez de depender de a dónde cae el guard.
function useLlevarAlPanel(esValidador: boolean, loading: boolean) {
  const segments = useSegments();
  const enPanel = (segments as string[]).some((s) => s === 'validacion' || s === 'revisar');
  useEffect(() => {
    if (!loading && esValidador && !enPanel) router.replace('/validacion');
  }, [esValidador, loading, enPanel]);
}

function AppNavigator() {
  const { profile, loading, onboarded, esValidador, sinConexion, reintentar } = useProfile();
  const estudiante = !esValidador;
  useAbrirDesdeNotificacion(!loading && estudiante && onboarded);
  useLlevarAlPanel(esValidador, loading);
  useAvisarNovedades(profile, !loading && estudiante && onboarded);
  if (loading) return null;

  // Primer arranque sin red y sin caché: no se puede saber si falta el onboarding.
  if (sinConexion) {
    return (
      <View style={styles.offline}>
        <EmptyState
          icon="cloud-offline-outline"
          title="Sin conexión"
          body="Necesitamos internet la primera vez que abres la app. Conéctate y toca para reintentar."
          onPress={reintentar}
        />
      </View>
    );
  }

  // El guard decide qué pantallas existen:
  // - equipo de validación: solo el panel (no ve onboarding ni la app de estudiantes).
  // - sin onboarding: solo la personalización; al completarla Home pasa a ser la ruta activa.
  return (
    <View style={styles.flex}>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={esValidador}>
        <Stack.Screen name="validacion" />
        <Stack.Screen name="revisar/[id]" />
      </Stack.Protected>
      <Stack.Protected guard={estudiante && !onboarded}>
        <Stack.Screen name="onboarding-avatar" options={{ gestureEnabled: false }} />
        <Stack.Screen name="onboarding-intereses" />
      </Stack.Protected>
      <Stack.Protected guard={estudiante && onboarded}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="resultados" />
        <Stack.Screen name="oportunidad/[id]" />
        <Stack.Screen name="editar-perfil" />
        <Stack.Screen name="mis-datos" />
      </Stack.Protected>
    </Stack>
      {/* Avisos tipo notificación dentro de la app (respaldo donde el sistema no puede mostrarlos). */}
      <InAppNotice />
    </View>
  );
}

export default function AppLayout() {
  return (
    <ProfileProvider>
      <CatalogoProvider>
        <GuardadasProvider>
          <AppNavigator />
        </GuardadasProvider>
      </CatalogoProvider>
    </ProfileProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  offline: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.screen,
    backgroundColor: colors.bg,
  },
});
