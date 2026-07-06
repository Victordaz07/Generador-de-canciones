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
IMAGE_API_KEY=      # API key de OpenAI (portadas vía gpt-image-1)
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
      la key de Victor es de **Apiframe v2** (prefijo `afk_`), API
      completamente distinta a v1 (`apiframe.pro`, que era lo que
      `lib/apiframe.ts` asumía originalmente por convención pública). Ya
      corregido a v2: base URL `api.apiframe.ai`, endpoint
      `POST /v2/music/generate` con `model: "suno"` +
      `sunoParams: { custom_mode: true, ... }`, header
      `X-API-Key: <key>` (no "Bearer"), y estado vía
      `GET /v2/jobs/{jobId}`. Confirmado contra el SDK oficial
      (`apiframe-ai/apiframe-nodejs-sdk`, `openapi.json`). **Pendiente
      de confirmar 100%**: los nombres de campo dentro de
      `result.tracks[]` (audio/imagen) — `api.apiframe.ai` sigue
      bloqueado en este entorno, así que si el player no muestra audio
      tras un job `completed`, revisa el log de Vercel (queda impreso
      el cuerpo crudo de la respuesta) y ajusta `fetchSongStatus` en
      `lib/apiframe.ts`
- [x] 6. Endpoint + UI de portada (`lib/images.ts`) — probado contra la
      API real en producción (Vercel), corrigiendo dos cosas que
      cambiaron desde que se escribió el código: OpenAI ya no acepta el
      parámetro `response_format` en `/v1/images/generations` (se
      quitó; ahora se acepta `b64_json` o `url`, lo que venga), y el
      modelo `dall-e-3` ya no existe — reemplazado por `gpt-image-1`,
      confirmado contra más de 20 ejemplos públicos actuales de la API
      de imágenes de OpenAI
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
- [x] 9. Portada con título y logo compuestos por código
      (`lib/cover-compose.ts`) — la IA (`gpt-image-1`) genera solo la
      escena vertical (1024x1536, sin texto ni logo — reforzado en
      `sgm-creative-rules.ts`); el título de la canción (tipografía
      Cinzel Bold dorada, con ajuste automático de tamaño y salto de
      línea según el largo del texto) y el logo real de Seeker Gospel
      Music (`assets/logo-sgm.png`) se superponen con `sharp` de forma
      exacta y consistente en cada portada, nunca alucinados por el
      modelo. Probado localmente generando portadas sintéticas con
      títulos corto/largo/con acentos (ñ, í) — el texto ajusta tamaño y
      salto de línea correctamente y nunca se desborda
