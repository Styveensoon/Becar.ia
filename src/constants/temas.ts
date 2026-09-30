import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import type { ImageSourcePropType } from 'react-native';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type Tema = {
  // TODO: agregar `temas text[]` a `oportunidades` para filtrar por estos ids.
  id:
    | 'iot'
    | 'ia'
    | 'robotica'
    | 'programacion'
    | 'negocios'
    | 'arte-diseno'
    | 'salud'
    | 'idiomas'
    | 'medio-ambiente';
  label: string;
  // Fondo pastel mientras no haya imagen real.
  tint: string;
  // Composición de íconos que hace de fondo mientras no haya imagen real.
  icons: readonly [IconName, IconName, IconName];
  // TODO: agregar la ilustración de cada tema (assets/temas/<id>.jpg, ej. robots para IoT).
  // Con `image` presente, CategoryCard la muestra desenfocada en lugar de los íconos.
  image?: ImageSourcePropType;
};

// 9 temas: cuadrícula de 3x3 en Home.
export const temas: readonly Tema[] = [
  { id: 'iot', label: 'IoT', tint: '#DCEAF7', icons: ['hardware-chip', 'wifi', 'bulb-outline'] },
  { id: 'ia', label: 'IA', tint: '#EDE8FB', icons: ['sparkles', 'git-network-outline', 'chatbubble-ellipses-outline'] },
  { id: 'robotica', label: 'Robótica', tint: '#E9EAF0', icons: ['construct', 'cog-outline', 'hardware-chip-outline'] },
  { id: 'programacion', label: 'Programación', tint: '#DCF1E3', icons: ['code-slash', 'terminal-outline', 'laptop-outline'] },
  { id: 'negocios', label: 'Negocios', tint: '#FFF0C7', icons: ['briefcase', 'trending-up-outline', 'cash-outline'] },
  { id: 'arte-diseno', label: 'Arte y diseño', tint: '#FDE3EA', icons: ['color-palette', 'brush-outline', 'musical-notes-outline'] },
  { id: 'salud', label: 'Salud', tint: '#FFE7D6', icons: ['medkit', 'heart-outline', 'fitness-outline'] },
  { id: 'idiomas', label: 'Idiomas', tint: '#DCEAF7', icons: ['language', 'chatbubbles-outline', 'globe-outline'] },
  { id: 'medio-ambiente', label: 'Medio ambiente', tint: '#DCF1E3', icons: ['leaf', 'earth-outline', 'water-outline'] },
];
