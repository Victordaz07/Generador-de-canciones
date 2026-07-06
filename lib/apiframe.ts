import "server-only";

/**
 * Cliente mínimo para la API de Apiframe (proxy de Suno).
 *
 * Endpoint, formato del header de auth y forma de la respuesta
 * confirmados contra el SDK oficial (github.com/APIFRAME-PRO/apiframe-python)
 * y ejemplos públicos reales de integración con /suno-imagine, ya que
 * docs.apiframe.pro sigue bloqueado en el entorno de desarrollo donde se
 * escribió este archivo. Si Apiframe cambia su contrato, este es el
 * único lugar que hay que tocar.
 */

const APIFRAME_BASE_URL = "https://api.apiframe.pro";
const GENERATE_PATH = "/suno-imagine";
const FETCH_PATH = "/fetch";
const SUNO_MODEL = "V5";

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
      Authorization: getApiKey(),
    },
    body: JSON.stringify({
      prompt: params.lyrics,
      model: SUNO_MODEL,
      tags: params.stylePrompt,
      title: params.title,
      make_instrumental: params.instrumental ?? false,
    }),
  });

  const data = await parseApiframeResponse(res);

  const taskId = data?.task_id as string;
  if (!taskId) {
    throw new Error("Apiframe no devolvió un task_id.");
  }

  return { taskId: String(taskId) };
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
  const res = await fetch(`${APIFRAME_BASE_URL}${FETCH_PATH}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getApiKey(),
    },
    body: JSON.stringify({ task_id: taskId }),
  });

  const data = await parseApiframeResponse(res);

  const rawStatus = String(data?.status ?? "pending").toLowerCase();
  const status: SongStatus["status"] =
    rawStatus === "finished" || rawStatus === "completed"
      ? "completed"
      : rawStatus === "failed" || rawStatus === "error"
        ? "failed"
        : rawStatus === "processing"
          ? "processing"
          : "pending";

  const rawSongs = (data?.songs as unknown[]) ?? [];
  const clips: SongClip[] = rawSongs.map((song, index) => {
    const s = song as Record<string, unknown>;
    return {
      id: String(s.id ?? index),
      title: String(s.title ?? ""),
      audioUrl: (s.audio_url as string) ?? null,
      imageUrl: (s.image_url as string) ?? null,
    };
  });

  return { status, clips };
}
