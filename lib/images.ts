import "server-only";

const OPENAI_IMAGES_URL = "https://api.openai.com/v1/images/generations";

function getApiKey() {
  const key = process.env.IMAGE_API_KEY;
  if (!key) {
    throw new Error("IMAGE_API_KEY no está configurada");
  }
  return key;
}

export async function generateCoverImage(prompt: string): Promise<string> {
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
      size: "1024x1024",
    }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = data?.error?.message ?? `La API de imágenes respondió ${res.status}`;
    throw new Error(message);
  }

  const result = data?.data?.[0];
  if (result?.b64_json) {
    return `data:image/png;base64,${result.b64_json}`;
  }
  if (result?.url) {
    return result.url as string;
  }

  throw new Error("La API de imágenes no devolvió una imagen.");
}
