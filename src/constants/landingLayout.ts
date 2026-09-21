// Geometría de la Landing: la ilustración fija dónde empieza el panel blanco.
//
// Medido sobre las 4 ilustraciones (ancho:alto ~1.04:1), el dibujo ocupa:
//   slide 1: x 12.5%-87.3%, y 13.0%-92.9%
//   slide 2: x 17.9%-87.3%, y  9.0%-92.9%
//   slide 3: x 17.9%-89.4%, y 13.4%-92.9%
//   slide 4: x 12.6%-88.1%, y 14.7%-92.9%
// El suelo (donde apoyan los pies) queda siempre al 92.9% del alto.

export const ASPECT = 1.037;

// La imagen puede pasarse del ancho de la pantalla: solo se recorta su margen vacío lateral.
// Con 1.22 se ve el 82% central; el cohete de la slide 3 (89.4%) es lo más justo y queda visible
// con ~1.6% de margen.
export const WIDTH_FACTOR = 1.22;

// La imagen va anclada al borde superior. Positivo: se pasa de él esa fracción de su alto (solo se
// recorta su margen vacío; el dibujo empieza como mínimo al 9.0% del alto, en la slide 2).
// Negativo: empieza por debajo del borde (el borde superior se difumina con el fondo del slide).
export const RAISE = -0.03;

// Posición del suelo dentro de la imagen (fracción del alto).
export const GROUND = 0.929;

// Alto mínimo del panel blanco para que quepan marca, leyenda, botón y link.
export const MIN_PANEL_HEIGHT = 300;
// Cuánto sube el panel sobre el área de la ilustración (sus esquinas redondeadas).
export const PANEL_OVERLAP = 20;
// Cuánto se mete el panel sobre el suelo del dibujo. Positivo: la línea del suelo queda oculta y los
// pies "pisan" el borde. Negativo: el panel empieza por debajo del suelo (deja ver la línea).
export const GROUND_HIDDEN = -24;

export function getLandingLayout(width: number, windowHeight: number) {
  const imageHeight = Math.min(
    (width * WIDTH_FACTOR) / ASPECT,
    (windowHeight - MIN_PANEL_HEIGHT) / (GROUND - RAISE),
  );
  const imageWidth = imageHeight * ASPECT;
  // Distancia del borde superior de la pantalla al suelo del dibujo.
  const groundY = imageHeight * (GROUND - RAISE);
  const panelTop = groundY - GROUND_HIDDEN;

  return { imageHeight, imageWidth, panelTop, stageHeight: panelTop + PANEL_OVERLAP };
}
