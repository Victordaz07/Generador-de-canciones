# SGM Music Lab

Herramienta interna de **Seeker Gospel Music (SGM)** para generar una
canción completa (letra, style sheet, audio vía Suno y portada) desde una
sola pantalla, sin saltar entre herramientas.

Proyecto separado de `seekergospel.com` (Firebase). Este stack corre 100%
en Vercel.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Route Handlers (`app/api/**/route.ts`) como proxy server-side hacia
  Claude API, Apiframe (Suno) y el proveedor de imágenes — ninguna API key
  se expone al cliente
- Sin base de datos en v1: estado en cliente durante la sesión;
  histórico en `localStorage` (Vercel KV queda documentado como mejora
  futura, no bloqueante)
- Auth de contraseña única (`SITE_PASSWORD`), sin NextAuth/Firebase Auth.
  Implementada en `proxy.ts` (Next.js 16 renombró `middleware.ts` a
  `proxy.ts`; misma función) + sesión firmada con `jose` en una cookie
  httpOnly

## Variables de entorno

Copia `.env.example` a `.env.local` y completa:

```
ANTHROPIC_API_KEY=
APIFRAME_API_KEY=
IMAGE_API_KEY=      # API key de OpenAI (portadas vía DALL-E 3)
SITE_PASSWORD=
```

Todas se consumen solo en Route Handlers server-side.

## Desarrollo local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Limitación conocida: edición de fragmentos en Suno

La función **"Replace Section"** de Suno (editar solo un fragmento de una
canción ya generada, sin regenerarla completa) **no existe como endpoint
público en la API de Apiframe**. Esta herramienta no puede replicarla.

Si necesitas editar solo un fragmento de una canción ya generada, usa
[suno.com](https://suno.com) directamente — esa función no está
disponible por API todavía. La UI de esta app muestra este mismo aviso en
el paso de generación de canción.

## Estado del proyecto

Ver el orden de implementación en el brief del proyecto. Progreso actual:

- [x] 1. Scaffold Next.js + Tailwind (build verificado local; deploy a
      Vercel pendiente — requiere importar el repo en vercel.com/new o
      un token de Vercel CLI)
- [x] 2. Auth con contraseña única (`proxy.ts` + `/api/login` + `/api/logout`)
- [x] 3. `lib/sgm-creative-rules.ts` con las reglas creativas
- [x] 4. Endpoint + UI de generación de letras (Claude API) — **verificado
      de punta a punta con una llamada real** (personaje "Pedro, Echa La
      Red", Lucas 5:1-11): letra completa con tags de estructura, título
      que nunca menciona al personaje, identidad sonora coherente con la
      guía del Nuevo Testamento (Organic House / Indie Folk), prompt de
      Suno siguiendo las reglas de producción, prompt de portada sin
      cruces/halos/vitral, y checklist doctrinal respondido
- [x] 5. Endpoint + UI de generación de canción (Apiframe) con polling —
      probado contra la API real en producción (Vercel), corrigiendo dos
      bugs que solo aparecieron ahí (ya que `apiframe.pro` sigue
      bloqueado en este entorno de desarrollo): el endpoint correcto es
      `/suno-imagine` (no `/custom_generate`), el header de auth es
      `Authorization: <key>` sin prefijo "Bearer", y el polling de
      estado es `POST /fetch` con `{"task_id": ...}` en el body (no GET
      con query param). Confirmado contra el SDK oficial
      (`APIFRAME-PRO/apiframe-python`) y ejemplos públicos reales de
      integración con Suno vía Apiframe
- [x] 6. Endpoint + UI de portada (DALL-E 3, `lib/images.ts`) —
      **tampoco verificado con una llamada real**: `api.openai.com`
      está igual de bloqueado en este entorno de desarrollo. Usa
      `IMAGE_API_KEY` como key de OpenAI y pide una imagen 1024x1024 en
      base64 (`response_format: "b64_json"`), mostrada inline con botón
      de descarga. Verifica localmente o en Vercel con tu key real. Sí
      se verificó el manejo de errores propios (falta de API key,
      prompt vacío) con llamadas reales
- [x] 7. Panel de metadata y exportación — probado de punta a punta en
      navegador real (Playwright) con la respuesta de Claude simulada:
      título, escritura, género, BPM, signature sound y tags se
      muestran correctamente; "Copiar metadata" copia el texto esperado
      al portapapeles y "Descargar letra + style sheet" genera el
      archivo `.md` sin errores de consola
- [x] 8. Pulido de UI/UX — las 5 secciones (idea inicial, propuesta,
      canción, portada, metadata) son acordeones colapsables
      (`CollapsibleSection`) en vez de bloques fijos, para evitar scroll
      infinito en una sola pantalla. Verificado en navegador real
      (Playwright): cada sección colapsa/expande correctamente y
      conserva su contenido
