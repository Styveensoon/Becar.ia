// Textos legales de Becar.ia. Si cambias el contenido de fondo, sube LEGAL_VERSION: queda
// registrada en `profiles.terminos_version` al registrarse (evidencia de qué versión aceptó).
export const LEGAL_VERSION = '2026-09-30';
export const LEGAL_FECHA = '30 de septiembre de 2026';

// Responsable y domicilio (LFPDPPP). El responsable es el equipo de estudiantes, no la universidad:
// la UTP es la institución donde se desarrolla el proyecto y el domicilio para notificaciones.
export const RESPONSABLE =
  'el equipo de estudiantes de la Universidad Tecnológica de Puebla que desarrolla Becar.ia como proyecto académico';
export const DOMICILIO =
  'Universidad Tecnológica de Puebla, Antiguo Camino a la Resurrección 1002-A, Zona Industrial Oriente, C.P. 72300, Puebla, Puebla, México';
export const CORREO_CONTACTO = 'becar.ia.mx@gmail.com';

// Páginas públicas (GitHub Pages, carpeta docs/). Play Store pide estas URLs.
export const WEB_BASE = 'https://styveensoon.github.io/Becar.ia';
export const WEB_PRIVACIDAD = `${WEB_BASE}/privacidad.html`;
export const WEB_ELIMINAR_CUENTA = `${WEB_BASE}/eliminar-cuenta.html`;

export type SeccionLegal = {
  titulo: string;
  // Cada elemento es un párrafo; los que empiezan con "• " se muestran como viñeta.
  parrafos: string[];
};

export const TERMINOS: SeccionLegal[] = [
  {
    titulo: '1. Aceptación',
    parrafos: [
      `Estos Términos y Condiciones regulan el uso de la aplicación móvil Becar.ia (la "App"), desarrollada y operada por ${RESPONSABLE}, con domicilio en ${DOMICILIO}.`,
      'Al crear una cuenta y marcar la casilla de aceptación, declaras que leíste, entendiste y aceptas estos Términos y el Aviso de Privacidad. Si no estás de acuerdo, no debes crear una cuenta ni usar la App.',
    ],
  },
  {
    titulo: '2. Qué es Becar.ia',
    parrafos: [
      'Becar.ia es un proyecto académico, gratuito y sin fines de lucro, desarrollado en Puebla, México. Reúne en un solo lugar información pública sobre becas, movilidades, concursos, certificaciones y eventos para estudiantes de secundaria, bachillerato, universidad y posgrado, para que no se te pasen las fechas.',
      '• No cobramos por usar la App ni por ninguna de sus funciones.',
      '• No mostramos publicidad ni vendemos tus datos.',
      '• No somos una institución convocante: no otorgamos becas, no recibimos solicitudes ni participamos en la selección de ninguna convocatoria.',
    ],
  },
  {
    titulo: '3. Quién puede usar la App',
    parrafos: [
      'La App está dirigida a personas de 13 años en adelante.',
      'Si tienes entre 13 y 17 años, necesitas que tu madre, padre o tutor conozca y autorice que uses la App y que tratemos los datos que se piden al registrarte. Al marcar la casilla correspondiente declaras que cuentas con esa autorización. Si tu madre, padre o tutor retira su autorización, puedes eliminar tu cuenta en cualquier momento desde Perfil, o ellos pueden pedirlo al correo de contacto.',
      'No uses la App si tienes menos de 13 años.',
    ],
  },
  {
    titulo: '4. Tu cuenta',
    parrafos: [
      '• La información que das al registrarte debe ser verdadera. Solo pedimos tu rango de edad, nunca tu fecha de nacimiento.',
      '• Tu apodo no debe ser tu nombre completo ni el de otra persona, y no puede ser ofensivo, discriminatorio o suplantar a alguien.',
      '• Eres responsable de mantener tu contraseña en secreto y de lo que se haga con tu cuenta. Si crees que alguien más entró a ella, cambia tu contraseña y avísanos.',
      '• Cada cuenta es personal e intransferible.',
    ],
  },
  {
    titulo: '5. La información de las convocatorias',
    parrafos: [
      'Buscamos y resumimos convocatorias publicadas por terceros (gobiernos, universidades, fundaciones, empresas y organismos internacionales). Para encontrarlas nos apoyamos en herramientas automatizadas, incluida inteligencia artificial, y una persona del equipo revisa cada convocatoria contra su fuente antes de publicarla.',
      'Aun así, las convocatorias pueden cambiar, cerrarse antes o contener errores. Por eso:',
      '• La fuente oficial siempre tiene prioridad. Revisa requisitos, fechas y montos en el enlace "Ver convocatoria oficial" antes de aplicar.',
      '• No garantizamos que obtengas una beca, lugar o premio, ni que la información esté completa o actualizada en todo momento.',
      '• Los recordatorios son una ayuda, no un sustituto de revisar tú mismo las fechas.',
      `Si encuentras un error en una convocatoria, escríbenos a ${CORREO_CONTACTO} y la corregiremos o retiraremos.`,
    ],
  },
  {
    titulo: '6. Sitios de terceros',
    parrafos: [
      'La App contiene enlaces a sitios que no controlamos. Al abrirlos quedas sujeto a sus propios términos y avisos de privacidad. No somos responsables de su contenido, disponibilidad ni de cómo tratan tus datos. Nunca te pediremos pagar ni entregar documentos a través de la App: desconfía de cualquier persona que lo haga en nombre de Becar.ia.',
    ],
  },
  {
    titulo: '7. Uso aceptable',
    parrafos: [
      'Al usar la App te comprometes a no:',
      '• Intentar acceder a cuentas, datos o sistemas que no te pertenecen, ni vulnerar la seguridad de la App.',
      '• Extraer información de forma masiva o automatizada (scraping), ni usar la App para enviar spam.',
      '• Descompilar, copiar o modificar la App, salvo lo permitido por la ley.',
      '• Usar la App para fines ilícitos o que afecten a otras personas.',
    ],
  },
  {
    titulo: '8. Propiedad intelectual',
    parrafos: [
      'El diseño, los textos propios, el logotipo y el código de la App pertenecen a sus autores. Los nombres, logotipos y contenidos de las convocatorias pertenecen a sus respectivos titulares; los mencionamos solo para informar y sin que ello implique relación o patrocinio.',
    ],
  },
  {
    titulo: '9. Notificaciones',
    parrafos: [
      'Si lo autorizas, la App programa en tu teléfono recordatorios antes de que cierren las convocatorias que guardaste. Puedes desactivarlos en cualquier momento desde los ajustes de tu teléfono.',
    ],
  },
  {
    titulo: '10. Disponibilidad y responsabilidad',
    parrafos: [
      'Al ser un proyecto académico, la App se ofrece "tal como está" y puede tener interrupciones, errores o cambiar sus funciones. En la medida en que lo permita la legislación aplicable, el equipo no será responsable por daños derivados de decisiones tomadas con base en la información de la App, de la pérdida de una convocatoria o de fallas técnicas ajenas a su control.',
    ],
  },
  {
    titulo: '11. Suspensión y eliminación de la cuenta',
    parrafos: [
      'Puedes eliminar tu cuenta cuando quieras desde Perfil → Eliminar cuenta. Se borran de inmediato tu cuenta, tu perfil y tus favoritos, y se cancelan tus recordatorios.',
      `Si ya no tienes la App instalada, puedes pedir la eliminación siguiendo las instrucciones de ${WEB_ELIMINAR_CUENTA}.`,
      'Podemos suspender o eliminar cuentas que incumplan estos Términos, avisándote por correo cuando sea posible.',
    ],
  },
  {
    titulo: '12. Cambios a estos Términos',
    parrafos: [
      'Podemos actualizar estos Términos. Si el cambio es importante, te avisaremos en la App antes de que entre en vigor. Si sigues usando la App después de esa fecha, aceptas la nueva versión; si no estás de acuerdo, puedes eliminar tu cuenta.',
    ],
  },
  {
    titulo: '13. Ley aplicable',
    parrafos: [
      'Estos Términos se rigen por las leyes de los Estados Unidos Mexicanos. Para cualquier controversia, las partes se someten a los tribunales competentes de la ciudad de Puebla, Puebla, salvo que la ley te otorgue el derecho de acudir a otro fuero o a la Procuraduría Federal del Consumidor.',
    ],
  },
  {
    titulo: '14. Contacto',
    parrafos: [`Para dudas sobre estos Términos escríbenos a ${CORREO_CONTACTO}.`],
  },
];

export const PRIVACIDAD: SeccionLegal[] = [
  {
    titulo: '1. Responsable',
    parrafos: [
      `El responsable del tratamiento de tus datos personales es ${RESPONSABLE}, con domicilio en ${DOMICILIO}, y correo ${CORREO_CONTACTO}. Este Aviso se emite conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.`,
      'Becar.ia es un proyecto académico sin fines de lucro. No vendemos, rentamos ni compartimos tus datos con fines comerciales o publicitarios.',
    ],
  },
  {
    titulo: '2. Datos que recabamos',
    parrafos: [
      '• Para crear tu cuenta: correo electrónico y contraseña. La contraseña se guarda cifrada por nuestro proveedor de autenticación; nadie del equipo puede verla.',
      '• Para tu perfil: apodo, rango de edad (13-15, 16-17 o 18+), nivel educativo, avatar y color elegidos de un catálogo, intereses y, si decides darla, el nombre de tu institución.',
      '• Por usar la App: las convocatorias que guardas en favoritos, y la fecha y versión en que aceptaste estos documentos.',
      'No pedimos tu nombre real, fecha de nacimiento, fotografía, teléfono, domicilio, ubicación ni datos personales sensibles (como salud, origen étnico, creencias u orientación sexual).',
      'Datos que se quedan en tu teléfono y no llegan a nuestros servidores: tu sesión, guardada en el almacenamiento seguro del dispositivo, y los recordatorios programados.',
    ],
  },
  {
    titulo: '3. Para qué usamos tus datos',
    parrafos: [
      'Finalidades necesarias para darte el servicio:',
      '• Crear y administrar tu cuenta, y verificar tu correo.',
      '• Mostrarte convocatorias adecuadas a tu nivel, edad e intereses (sección "Para ti").',
      '• Guardar tus favoritos y programar recordatorios antes de que cierren.',
      '• Atender tus solicitudes y mantener la seguridad de la App.',
      'No usamos tus datos para finalidades secundarias: no hacemos mercadotecnia, publicidad ni perfiles con fines comerciales.',
    ],
  },
  {
    titulo: '4. Personas menores de edad',
    parrafos: [
      'La App puede usarse desde los 13 años. Para registrar a una persona de 13 a 17 años se requiere el consentimiento de quien ejerce la patria potestad o la tutela, que la persona usuaria declara tener al marcar la casilla correspondiente.',
      `La madre, padre o tutor puede en cualquier momento pedir acceso a los datos de su hija, hijo o pupilo, corregirlos o solicitar la eliminación de la cuenta escribiendo a ${CORREO_CONTACTO}. Recabamos de menores solo los datos mínimos descritos arriba y nunca los usamos con fines publicitarios.`,
    ],
  },
  {
    titulo: '5. Con quién compartimos tus datos',
    parrafos: [
      'No transferimos tus datos a terceros. Para que la App funcione, tus datos se alojan con un proveedor de infraestructura en la nube (Supabase), que actúa como encargado: los trata solo por nuestra cuenta y bajo nuestras instrucciones, y sus servidores pueden estar fuera de México.',
      'Solo compartiríamos datos si una autoridad competente lo requiere conforme a la ley.',
    ],
  },
  {
    titulo: '6. Cómo protegemos tus datos',
    parrafos: [
      '• La comunicación con nuestros servidores va cifrada.',
      '• Cada cuenta solo puede leer y modificar su propia información: la base de datos lo impone con reglas de acceso por fila.',
      '• Tu sesión se guarda en el almacenamiento seguro del teléfono, no en texto plano.',
      'Si ocurriera una vulneración de seguridad que afecte tus derechos, te lo informaremos sin demora.',
    ],
  },
  {
    titulo: '7. Cuánto tiempo conservamos tus datos',
    parrafos: [
      'Conservamos tus datos mientras tu cuenta esté activa. Si eliminas tu cuenta, se borran de inmediato de nuestra base de datos; pueden permanecer por un tiempo limitado en copias de seguridad cifradas del proveedor, hasta que estas se renuevan automáticamente.',
      'Si nos haces una solicitud por correo (derechos ARCO o eliminación de cuenta), conservamos solo el registro de esa solicitud (tu correo, la fecha, qué pediste y cómo la atendimos) durante el tiempo necesario para acreditar que la atendimos conforme a la ley.',
    ],
  },
  {
    titulo: '8. Tus derechos ARCO y cómo revocar tu consentimiento',
    parrafos: [
      'Tienes derecho a Acceder a tus datos, Rectificarlos, Cancelarlos y Oponerte a su tratamiento (derechos ARCO), así como a revocar tu consentimiento.',
      'Desde la App, al instante y sin trámites:',
      '• Acceso: en Perfil → Mis datos ves todo lo que guardamos de ti y puedes compartirte una copia.',
      '• Rectificación: en Perfil → Editar perfil corriges tu apodo, nivel, intereses, avatar e institución.',
      '• Cancelación: en Perfil → Eliminar cuenta se borran tu cuenta y todos tus datos.',
      '• Oposición: en Perfil → Mis datos puedes apagar los avisos de convocatorias nuevas, y en los ajustes de tu teléfono, todas las notificaciones.',
      `Por correo, para cualquier otra solicitud (o si ya no tienes la App): escribe a ${CORREO_CONTACTO} desde el correo de tu cuenta. Como no pedimos tu nombre, ese correo es lo que acredita que la cuenta es tuya. Incluye:`,
      '• Qué derecho quieres ejercer (acceso, rectificación, cancelación, oposición o revocación) y sobre qué datos.',
      '• Tu apodo en la App, para localizar la cuenta.',
      '• Si eres madre, padre o tutor: el correo de la cuenta de la persona menor y un documento que acredite tu relación con ella.',
      'Te responderemos al mismo correo en un plazo máximo de 20 días hábiles y, si procede, haremos efectiva tu solicitud dentro de los 15 días hábiles siguientes. Ejercer estos derechos es gratuito.',
      'Si consideras que tu derecho a la protección de datos fue vulnerado, puedes acudir ante la autoridad competente en materia de protección de datos personales.',
    ],
  },
  {
    titulo: '9. Cambios a este Aviso',
    parrafos: [
      'Cualquier cambio a este Aviso de Privacidad se publicará en esta misma sección de la App, accesible sin iniciar sesión, y te avisaremos dentro de la App si el cambio es importante.',
    ],
  },
];
