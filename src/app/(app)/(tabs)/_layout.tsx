import { Tabs } from 'expo-router/js-tabs';

import { TabIcon } from '@/components/TabIcon';
import { colors, fonts } from '@/constants/theme';
import { useCatalogo } from '@/lib/catalogo';
import { useGuardadas } from '@/lib/guardadas';
import { avisar, avisoDePrueba } from '@/lib/novedades';
import { useProfile } from '@/lib/profile';
import { avisosDisponibles } from '@/lib/recordatorios';

// Inicio va al centro de la barra, pero sigue siendo la pestaña con la que abre la app
// (sin esto abriría en la primera, Favoritos).
export const unstable_settings = {
  initialRouteName: 'home',
};

// SOLO DESARROLLO: cada toque a Inicio manda una notificación de muestra para revisar cómo se
// ven. En el build de Play Store `__DEV__` es false y esto no hace nada.
function useNotificacionDePrueba() {
  const { items } = useCatalogo();
  const { profile } = useProfile();
  const { permisoAvisos, activarAvisos } = useGuardadas();
  return async () => {
    if (!__DEV__ || !profile) return;
    if (avisosDisponibles && !permisoAvisos && (await activarAvisos()) !== 'concedido') return;
    const aviso = avisoDePrueba(items, profile);
    if (aviso) await avisar(aviso);
  };
}

export default function TabsLayout() {
  const probar = useNotificacionDePrueba();
  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        // El ícono activo va en `primary` (TabIcon); el label en `primary-text` porque es texto.
        tabBarActiveTintColor: colors.primaryText,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 12, marginTop: 2 },
        tabBarItemStyle: { paddingTop: 6 },
        // Borde superior, sin sombra (CLAUDE.md §7 Tab bar).
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
    >
      <Tabs.Screen
        name="guardadas"
        options={{
          title: 'Favoritos',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} active="heart" inactive="heart-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="calendario"
        options={{
          title: 'Calendario',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} active="calendar" inactive="calendar-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="home"
        listeners={{ tabPress: () => void probar() }}
        options={{
          title: 'Inicio',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} active="home" inactive="home-outline" />,
        }}
      />
      <Tabs.Screen
        name="notificaciones"
        options={{
          // "Notificaciones" no cabe en 5 pestañas; el título completo va en la pantalla.
          title: 'Avisos',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} active="notifications" inactive="notifications-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} active="person-circle" inactive="person-circle-outline" />
          ),
        }}
      />
    </Tabs>
  );
}
