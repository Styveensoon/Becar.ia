import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Becar.ia',
  slug: 'becaria',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'becaria',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'mx.becaria.app',
  },
  android: {
    // Identificador en Play Store: NO se puede cambiar después de la primera publicación.
    package: 'mx.becaria.app',
    adaptiveIcon: {
      backgroundColor: '#FFFFFF',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-web-browser',
    'expo-font',
    // Logo de Becar.ia sobre blanco al abrir la app (origen: assets/brand/icono-original.jpg).
    ['expo-splash-screen', { image: './assets/splash-icon.png', imageWidth: 140, backgroundColor: '#FFFFFF', resizeMode: 'contain' }],
    // Solo notificaciones locales (recordatorios de cierre); sin push ni alarmas exactas.
    ['expo-notifications', { color: '#FF7A33', icon: './assets/notification-icon.png' }],
  ],
  experiments: {
    typedRoutes: true,
  },
  owner: 'styveensoon',
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    // Proyecto en EAS (builds en la nube). Es un identificador, no un secreto.
    eas: { projectId: 'ebade86e-218e-4fd9-8947-45190bdbe715' },
  },
};

export default config;
