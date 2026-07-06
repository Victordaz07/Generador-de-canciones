import "server-only";

/**
 * Cliente mínimo para la API de Apiframe (proxy de Suno).
 *
 * Nota para Victor: la red de este entorno de desarrollo (Claude Code on
 * the web) bloquea apiframe.pro, así que estos endpoints y nombres de
 * campo no pudieron verificarse aquí con una llamada real — están
 * basados en la convención pública documentada de Apiframe para Suno
 * Custom Mode. Antes de la primera prueba real (`npm run dev` local o en
 * Vercel), confirma el endpoint y los campos exactos en tu dashboard de
 * Apiframe (docs.apiframe.pro) y ajusta las constantes de abajo si
 * difieren.
 */

const APIFRAME_BASE_URL = "https://api.apiframe.pro";
const GENERATE_PATH = "/custom_generate";
const FETCH_TASK_PATH = "/fetch_task";

function getApiKey() {
  const key = process.env.APIFRAME_API_KEY;
  if (!key) {
    throw new Error("APIFRAME_API_KEY no está configurada");
  }
  return key;
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
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      prompt: params.lyrics,
      tags: params.stylePrompt,
      title: params.title,
      make_instrumental: params.instrumental ?? false,
    }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      (data && (data.message || data.error)) || `Apiframe respondió ${res.status}`;
    throw new Error(message);
  }

  const taskId = data?.task_id ?? data?.data?.task_id;
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
  const res = await fetch(
    `${APIFRAME_BASE_URL}${FETCH_TASK_PATH}?task_id=${encodeURIComponent(taskId)}`,
    {
      headers: { Authorization: `Bearer ${getApiKey()}` },
    }
  );

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      (data && (data.message || data.error)) || `Apiframe respondió ${res.status}`;
    throw new Error(message);
  }

  const rawStatus = String(data?.status ?? data?.data?.status ?? "pending").toLowerCase();
  const status: SongStatus["status"] =
    rawStatus === "completed" || rawStatus === "finished"
      ? "completed"
      : rawStatus === "failed" || rawStatus === "error"
        ? "failed"
        : rawStatus === "processing"
          ? "processing"
          : "pending";

  const rawClips: unknown[] = data?.data?.clips ?? data?.clips ?? [];
  const clips: SongClip[] = rawClips.map((clip) => {
    const c = clip as Record<string, unknown>;
    return {
      id: String(c.id ?? ""),
      title: String(c.title ?? ""),
      audioUrl: (c.audio_url as string) ?? null,
      imageUrl: (c.image_url as string) ?? null,
    };
  });

  return { status, clips };
}
