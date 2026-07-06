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
IMAGE_API_KEY=
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
- [x] 4. Endpoint + UI de generación de letras (Claude API) — código
      verificado con una llamada real a la API de Anthropic (llegó
      correctamente, auth y manejo de errores funcionan); la respuesta
      completa con contenido generado queda pendiente de confirmar
      cuando la cuenta de `ANTHROPIC_API_KEY` tenga crédito activo
- [x] 5. Endpoint + UI de generación de canción (Apiframe) con polling —
      **sin verificar con una llamada real**: `apiframe.pro` está
      bloqueado por la política de red de este entorno de desarrollo, así
      que `lib/apiframe.ts` sigue la convención pública documentada de
      Apiframe (endpoint `/custom_generate`, campos `prompt`/`tags`/
      `title`, polling vía `/fetch_task`), pero no se pudo confirmar
      contra la API real. **Antes de usarlo en producción**, corre
      `npm run dev` localmente (o después del deploy a Vercel, donde sí
      hay red completa) con tu `APIFRAME_API_KEY` real y verifica el
      endpoint y los nombres de campo contra tu dashboard de Apiframe —
      ajusta las constantes en `lib/apiframe.ts` si difieren. Sí se
      verificó localmente el manejo de errores (falta de API key,
      body inválido, taskId faltante) con llamadas reales a nuestros
      propios endpoints
- [ ] 6. Endpoint + UI de portada
- [ ] 7. Panel de metadata y exportación
- [ ] 8. Pulido de UI/UX
