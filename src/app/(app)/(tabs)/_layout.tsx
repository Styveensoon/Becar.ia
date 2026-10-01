import { Tabs } from 'expo-router/js-tabs';
import { StyleSheet, Text, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

// Alto de la barra sin el área del sistema. La librería usa 49 fijo, pero el ícono con píldora
// (30) + label en Poppins no caben ahí y el texto se cortaba, más aún con letra grande en Ajustes.
const ITEM_PADDING_TOP = 6;
const ICON_HEIGHT = 30;
const LABEL_GAP = 2;
const LABEL_LINE = 18;
const BOTTOM_PADDING = 8;
// Cuánto puede crecer el label con la letra grande del teléfono: con 5 pestañas, más que esto ya no
// cabe "Calendario" a lo ancho (se cortaba en "Calend…" con letra al 130%).
const MAX_ESCALA_LABEL = 1.15;

export default function TabsLayout() {
  const probar = useNotificacionDePrueba();
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  const escala = Math.min(fontScale, MAX_ESCALA_LABEL);
  const alto = ITEM_PADDING_TOP + ICON_HEIGHT + LABEL_GAP + Math.ceil(LABEL_LINE * escala) + BOTTOM_PADDING;
  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        // El ícono activo va en `primary` (TabIcon); el label en `primary-text` porque es texto.
        tabBarActiveTintColor: colors.primaryText,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabel: ({ color, children }) => (
          <Text
            style={[styles.label, { color }]}
            numberOfLines={1}
            maxFontSizeMultiplier={MAX_ESCALA_LABEL}
            // Si aun así no cabe a lo ancho (pantallas angostas), se encoge en vez de cortarse.
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {children}
          </Text>
        ),
        tabBarItemStyle: { paddingTop: ITEM_PADDING_TOP },
        // Borde superior, sin sombra (CLAUDE.md §7 Tab bar).
        tabBarStyle: {
          // Incluye la barra de gestos / botones de Android (insets.bottom) para no quedar debajo.
          height: alto + insets.bottom,
          paddingBottom: insets.bottom,
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

const styles = StyleSheet.create({
  label: { fontFamily: fonts.medium, fontSize: 12, lineHeight: LABEL_LINE, marginTop: LABEL_GAP },
});
