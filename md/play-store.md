# Play Console: respuestas listas para copiar

Basadas en lo que la app hace hoy (revisado en el código y la BD). Si se agrega algo que recolecte
datos nuevos (analytics, crash reporting, anuncios, push remotas), hay que actualizar esto.

## Política y URLs

| Campo | Valor |
|---|---|
| Política de privacidad | https://styveensoon.github.io/Becar.ia/privacidad.html |
| URL para eliminar la cuenta | https://styveensoon.github.io/Becar.ia/eliminar-cuenta.html |
| Correo de contacto | becar.ia.mx@gmail.com |
| ¿Contiene anuncios? | **No** |
| ID de la app | `mx.becaria.app` (definitivo después de la primera subida) |

## Acceso a la app (App access)

La app pide iniciar sesión. Elegir «Todas o algunas funciones están restringidas» y dar la cuenta
de revisión que está en `credentials.md` (sección "Cuenta para la revisión de Google Play"):
- Nombre: `Cuenta de revisión`
- Usuario y contraseña: los de `revision.play@becaria.test`
- Instrucciones: «Inicia sesión en la pantalla inicial con "¿Ya tienes cuenta? Iniciar sesión". La
  cuenta ya está verificada y personalizada.»

## Público objetivo y contenido

- **Grupos de edad:** 13-15, 16-17 y 18+. **No** marcar menores de 13 (la app no es para ellos).
- ¿Atrae a menores de forma no intencionada? La audiencia de 13-17 es intencional; responder según
  el formulario (no es una app "Diseñada para familias").
- **Clasificación de contenido (IARC):** categoría "Referencia, noticias o educación". Sin violencia,
  sexo, lenguaje, drogas, apuestas ni compras. No hay chat ni interacción entre usuarios. No comparte
  ubicación. Resultado esperado: apta para todos.

## Seguridad de los datos (Data safety)

**Preguntas generales**
| Pregunta | Respuesta |
|---|---|
| ¿Recolecta o comparte datos de los usuarios? | Sí, recolecta |
| ¿Todos los datos se encriptan en tránsito? | **Sí** (HTTPS a Supabase) |
| ¿Ofrece una forma de pedir que se borren los datos? | **Sí** (en la app y en la URL de arriba) |
| ¿Comparte datos con terceros? | **No** (Supabase es proveedor de infraestructura que trata los datos por nuestra cuenta: Play no lo cuenta como "compartir") |

**Tipos de datos recolectados** (ninguno se comparte; ninguno se procesa solo de forma efímera):

| Categoría de Play | Dato en Becar.ia | ¿Obligatorio? | Finalidades |
|---|---|---|---|
| Información personal → Dirección de correo electrónico | Correo de la cuenta | Obligatorio | Funcionalidad de la app, Administración de la cuenta |
| Información personal → Nombre | Apodo (Play cuenta los apodos como "nombre") | Obligatorio | Funcionalidad de la app, Personalización |
| Información personal → Otra información | Rango de edad, nivel educativo, intereses, avatar y color, institución (opcional) | Obligatorio (institución opcional) | Funcionalidad de la app, Personalización |
| Actividad en la app → Interacciones con la app | Favoritos guardados | Opcional | Funcionalidad de la app, Personalización |

**No recolecta:** ubicación, contactos, fotos o videos, archivos, calendario, audio, información
financiera, de salud, mensajes, historial de navegación, identificadores de dispositivo o de
publicidad, registros de fallos ni diagnósticos.

Notas para no equivocarse:
- La **contraseña** no se declara aparte: la maneja Supabase Auth cifrada (hash) y es parte de
  "Administración de la cuenta".
- Los **recordatorios** son notificaciones locales del teléfono; no generan datos en el servidor.
- El correo de bienvenida y los códigos son correos de la cuenta, no marketing.

## Antes de mandar a revisión

- [ ] Llenar `RESPONSABLE` y `DOMICILIO` en `src/constants/legal.ts` y regenerar la web
      (`node --experimental-strip-types scripts/generar-legal-web.mjs`).
- [ ] Publicar `docs/` en GitHub Pages y comprobar que las dos URLs abren sin iniciar sesión.
- [ ] Build de producción: `npx eas-cli build -p android --profile production` (genera el `.aab`).
- [x] Capturas de pantalla (8, 1080×1920), ícono 512×512 y gráfico destacado 1024×500: todo en
      `store/play/` (`capturas/01-08.png`, `icono-512.png`, `grafico-destacado.png`). Se regeneran con
      `python store/play/componer.py` a partir de las capturas crudas de `store/play/fuente/`.
- [ ] Borrar las cuentas de prueba que no se usen (`pruebas@`, `styveen.emiliano+becaria-test@`);
      dejar `revision.play@` y las de validación.
