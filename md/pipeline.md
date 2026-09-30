# Pipeline semanal de convocatorias

Busca cada semana becas, concursos y programas para **secundaria, bachillerato y universidad**,
los valida en código contra la fuente oficial y los deja como `pendiente_validar` para que una
persona del equipo los publique. Nada llega a la app sin revisión humana (regla de `CLAUDE.md`).

## Cómo funciona

```
Lunes 9:00 (CDMX)  pg_cron → pipeline_invocar('enviar')
                    └─ Edge Function arma 9 búsquedas (3 niveles × 3 grupos) y las manda
                       como UN lote a la API de Claude (Batches: asíncrono, 50% más barato).
                       Cada búsqueda: Claude Opus 5.5 con búsqueda web + lectura de páginas.

Cada hora (:20)    pg_cron → pipeline_invocar('procesar')
                    └─ Si el lote terminó: valida cada hallazgo e inserta los buenos
                       como 'pendiente_validar' con su evidencia. Si el modelo pausó a media
                       búsqueda, manda una continuación (máx. 2).
```

| Nivel | Grupos que se buscan |
|---|---|
| Secundaria | becas · concursos/olimpiadas/eventos · movilidad/veranos/certificaciones |
| Bachillerato | igual |
| Universidad | igual |

Código: `supabase/functions/pipeline-convocatorias/` (`busqueda.ts` = qué y cómo se pide,
`validacion.ts` = reglas, `index.ts` = orquestación). Migración:
`20260929000500_pipeline_convocatorias.sql`.

## Qué tan meticuloso es (capas de control)

**Al modelo se le exige** (prompt en `busqueda.ts`):
- Solo convocatorias abiertas (o que abren en ≤45 días) con cierre posterior a hoy, accesibles
  desde México.
- La fuente citada debe ser la **página o PDF oficial del convocante**; la prensa solo sirve para
  descubrir, y los agregadores (becasmexico, mextudia, etc.) y redes sociales están bloqueados
  en sus herramientas.
- Abrir la fuente y copiar **literal** la frase que contiene la fecha límite.
- `null` en todo lo que la fuente no diga; nunca inventar montos, fechas ni requisitos.
- Para menores: solo instituciones reconocidas y convocatorias gratuitas o sin cobros dudosos.
- No repetir lo que ya está en la base.
- La salida pasa por una herramienta con esquema estricto (`strict: true`): categorías, niveles,
  carreras y temas solo pueden ser valores del catálogo.

**El código no le cree al modelo** (`validacion.ts`, probado con 17 casos):
- Rechaza: agregadores, prensa y redes como fuente; URLs sin https; fechas imposibles
  (30 de febrero); convocatorias ya cerradas o a más de 400 días; inscripción que abre después
  de cerrar; edades fuera de rango o invertidas; valores fuera de catálogo; niveles vacíos.
- **Rechaza si la frase "literal" no menciona la fecha límite declarada** (señal de fecha inventada).
- Descarga la fuente: si ya no existe (404/410) la rechaza; si existe, busca la frase citada
  **literalmente** en el texto de la página (ignorando acentos y mayúsculas, sin contar scripts).
  - Encontrada → `evidencia_verificada = true`.
  - No encontrada, PDF, o el sitio bloquea bots → se inserta con `evidencia_verificada = false`
    y una nota en `notas_validacion` que explica qué revisar a mano.
- Deduplica por título contra lo vigente y dentro del mismo lote.
- La base vuelve a validar todo con sus `check` (categoría, fechas, https, catálogos).

## Activarlo (una sola vez)

La función ya está desplegada y los dos cron jobs ya existen; falta darles las llaves.

1. **Llave de la API de Claude.** Crear una en https://console.anthropic.com (idealmente en un
   workspace del proyecto con límite de gasto mensual).

2. **Generar un secreto compartido** (lo usan el cron y la función para confiar entre sí):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Guardar ambos en la función** (terminal, en la raíz del repo):
   ```bash
   npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-... PIPELINE_SECRET=<el secreto del paso 2>
   ```

4. **Guardar la URL y el mismo secreto en Vault** (Supabase → SQL Editor):
   ```sql
   select vault.create_secret('https://itkttzmhtevcrjuhzqvg.supabase.co', 'pipeline_project_url');
   select vault.create_secret('<el secreto del paso 2>', 'pipeline_secret');
   ```

5. **Primera corrida manual** (para no esperar al lunes):
   ```sql
   select public.pipeline_invocar('enviar');
   ```
   El lote tarda de minutos a unas horas. El cron de cada hora lo procesa solo; para forzarlo:
   ```sql
   select public.pipeline_invocar('procesar');
   ```

## Revisar y publicar (cada semana)

```sql
-- Lo nuevo, primero lo que tiene evidencia verificada
select id, titulo, institucion, fecha_limite, niveles, url_fuente,
       evidencia_verificada, evidencia_cita, notas_validacion
from oportunidades
where estado = 'pendiente_validar' and origen = 'pipeline'
order by evidencia_verificada desc, fecha_limite;

-- Después de abrir url_fuente y revisar campo por campo:
update oportunidades set estado = 'publicado', verificado_at = now() where id = '...';
update oportunidades set estado = 'rechazado' where id = '...';
```

Regla del equipo (`CLAUDE.md`): se valida **contra la fuente**, no contra el resumen del modelo.
`evidencia_verificada = true` solo significa que la frase de la fecha existe en la página; los
demás campos (monto, requisitos, niveles) se revisan a mano.

## Monitoreo

```sql
select created_at, estado, resumen->>'insertadas' as insertadas,
       resumen->>'verificadas' as verificadas, resumen->'rechazadas' as rechazadas,
       resumen->'tokens' as tokens, error
from pipeline_runs order by created_at desc limit 10;
```

`resumen.notas_modelo` trae, por búsqueda, qué encontró y qué descartó el modelo y por qué.

## Costo aproximado

Estimación, no medición: 9 búsquedas por semana con Claude Opus 5.5 vía Batches (50% de
descuento) ≈ **4 a 8 USD por semana** (tokens de entrada de las páginas leídas + búsquedas web +
salida). El prompt de sistema se cachea entre las 9 búsquedas. Después de 2-3 corridas, revisar
`resumen.tokens` en `pipeline_runs` para tener el costo real y, si hace falta, bajar `effort` o
`max_uses` en `busqueda.ts`.

## Limitaciones conocidas

- Páginas que cargan su contenido con JavaScript o PDFs: la cita no se puede comprobar
  automáticamente (quedan marcadas para revisión manual, no se descartan).
- La API de Batches no admite el parámetro de fallback ante rechazos del modelo; si el modelo
  declina una búsqueda, queda registrado en `resumen.errores` y se reintenta la semana siguiente.
- Los agregadores bloqueados están en `busqueda.ts` (`DOMINIOS_AGREGADORES` y `DOMINIOS_PRENSA`);
  agregar ahí cualquier sitio que se cuele como fuente.
