import type { ImageSourcePropType } from 'react-native';

export type LandingSlide = {
  id: string;
  caption: string;
  // Fragmento de la leyenda que se resalta en `primary-text`.
  highlight: string;
  image: ImageSourcePropType;
  // Fondo pastel del slide. La ilustración se mezcla con él (multiply).
  tint: string;
};

export const landingSlides: LandingSlide[] = [
  {
    id: '1',
    caption: 'Encuentra becas y oportunidades hechas para ti',
    highlight: 'becas',
    image: require('../../assets/landing/slide-1.jpg'),
    tint: '#FFE7D6',
  },
  {
    id: '2',
    caption: 'Sugerencias pensadas para ti',
    highlight: 'para ti',
    image: require('../../assets/landing/slide-2.jpg'),
    tint: '#FFF0C7',
  },
  {
    id: '3',
    caption: 'No vuelvas a llegar tarde a una convocatoria',
    highlight: 'tarde',
    image: require('../../assets/landing/slide-3.jpg'),
    tint: '#DCEAF7',
  },
  {
    id: '4',
    caption: 'Impulsa tu futuro académico',
    highlight: 'futuro académico',
    image: require('../../assets/landing/slide-4.jpg'),
    tint: '#DCF1E3',
  },
];
