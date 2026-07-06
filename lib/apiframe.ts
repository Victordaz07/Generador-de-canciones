import "server-only";

/**
 * Cliente mínimo para la API de Apiframe v2 (proxy de Suno).
 *
 * Confirmado contra el SDK oficial (github.com/apiframe-ai/apiframe-nodejs-sdk,
 * paquete @apiframe-ai/sdk@2) tras un 400 real en producción que reveló
 * que la key de Victor (prefijo `afk_`) es de Apiframe v2, no v1 —
 * docs.apiframe.pro / api.apiframe.pro son la API v1 anterior y no
 * aplican. api.apiframe.ai (v2) sigue bloqueado en este entorno de
 * desarrollo, así que la forma exacta de result.tracks[] (nombres de
 * campo para audio/imagen) no se pudo confirmar 100% — si `fetchSongStatus`
 * no encuentra las URLs, revisa el log de Vercel (imprime el cuerpo
 * crudo de la respuesta) y ajusta el mapeo de abajo.
 */

const APIFRAME_BASE_URL = "https://api.apiframe.ai";
const GENERATE_PATH = "/v2/music/generate";
const SUNO_MODEL_VERSION = "V5";

function getApiKey() {
  const key = process.env.APIFRAME_API_KEY;
  if (!key) {
    throw new Error("APIFRAME_API_KEY no está configurada");
  }
  return key;
}

async function parseApiframeResponse(res: Response) {
  const rawText = await res.text();
  let data: Record<string, unknown> | null = null;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    // El cuerpo no es JSON (ej. página de error HTML). rawText queda
    // disponible abajo para diagnóstico.
  }

  if (!res.ok) {
    const detail =
      (data?.message as string) ?? (data?.error as string) ?? rawText.slice(0, 300);
    console.error(`Apiframe ${res.status} en ${res.url}:`, rawText.slice(0, 500));
    throw new Error(`Apiframe respondió ${res.status}: ${detail || "sin cuerpo"}`);
  }

  return data;
}

export interface GenerateSongParams {
  lyrics: string;
  stylePrompt: string;
  title: string;
  instrumental?: boolean;
}

export async function requestSongGeneration(params: GenerateSongParams) {
  const res = await fetch(`${APIFRAME_BASE_URL}${GENERATE_PATH}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": getApiKey(),
    },
    body: JSON.stringify({
      model: "suno",
      prompt: params.lyrics,
      sunoParams: {
        custom_mode: true,
        instrumental: params.instrumental ?? false,
        model_version: SUNO_MODEL_VERSION,
        title: params.title,
        style: params.stylePrompt,
      },
    }),
  });

  const data = await parseApiframeResponse(res);

  const jobId = data?.jobId as string;
  if (!jobId) {
    throw new Error("Apiframe no devolvió un jobId.");
  }

  return { taskId: String(jobId) };
}

export interface SongClip {
  id: string;
  title: string;
  audioUrl: string | null;
  imageUrl: string | null;
}

export interface SongStatus {
  status: "pending" | "processing" | "completed" | "failed";
  clips: SongClip[];
}

export async function fetchSongStatus(taskId: string): Promise<SongStatus> {
  const res = await fetch(`${APIFRAME_BASE_URL}/v2/jobs/${encodeURIComponent(taskId)}`, {
    headers: { "X-API-Key": getApiKey() },
  });

  const data = await parseApiframeResponse(res);

  const rawStatus = String(data?.status ?? "queued").toLowerCase();
  const status: SongStatus["status"] =
    rawStatus === "completed"
      ? "completed"
      : rawStatus === "failed" || rawStatus === "error"
        ? "failed"
        : rawStatus === "progress" || rawStatus === "processing" || rawStatus === "in_progress"
          ? "processing"
          : "pending";

  const result = data?.result as Record<string, unknown> | undefined;
  const rawTracks = (result?.tracks as unknown[]) ?? [];

  if (status === "completed" && rawTracks.length === 0) {
    console.error(
      `Apiframe: job completado pero sin result.tracks reconocible. Cuerpo:`,
      JSON.stringify(data).slice(0, 1000)
    );
  }

  const clips: SongClip[] = rawTracks.map((track, index) => {
    const t = track as Record<string, unknown>;
    return {
      id: String(t.id ?? index),
      title: String(t.title ?? ""),
      audioUrl: (t.audio_url as string) ?? (t.audioUrl as string) ?? null,
      imageUrl: (t.image_url as string) ?? (t.imageUrl as string) ?? null,
    };
  });

  return { status, clips };
}
