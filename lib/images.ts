import "server-only";
import { composeCoverImage } from "@/lib/cover-compose";

const OPENAI_IMAGES_URL = "https://api.openai.com/v1/images/generations";

function getApiKey() {
  const key = process.env.IMAGE_API_KEY;
  if (!key) {
    throw new Error("IMAGE_API_KEY no está configurada");
  }
  return key;
}

async function requestSceneImage(prompt: string): Promise<Buffer> {
  const res = await fetch(OPENAI_IMAGES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size: "1024x1536",
    }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = data?.error?.message ?? `La API de imágenes respondió ${res.status}`;
    throw new Error(message);
  }

  const result = data?.data?.[0];
  if (result?.b64_json) {
    return Buffer.from(result.b64_json as string, "base64");
  }
  if (result?.url) {
    const imageRes = await fetch(result.url as string);
    if (!imageRes.ok) {
      throw new Error("No se pudo descargar la imagen generada.");
    }
    return Buffer.from(await imageRes.arrayBuffer());
  }

  throw new Error("La API de imágenes no devolvió una imagen.");
}

/**
 * Genera la escena vertical (sin texto ni logo) y le superpone el título
 * de la canción y el logo de Seeker Gospel Music.
 */
export async function generateCoverImage(prompt: string, title: string): Promise<string> {
  const sceneBuffer = await requestSceneImage(prompt);
  const composed = await composeCoverImage(sceneBuffer, title);
  return `data:image/png;base64,${composed.toString("base64")}`;
}
