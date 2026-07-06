"use client";

import { useEffect, useRef, useState } from "react";
import type { SongClip } from "@/lib/apiframe";

const POLL_INTERVAL_MS = 8000;

interface SongGeneratorProps {
  lyrics: string;
  stylePrompt: string;
  title: string;
}

type Status = "idle" | "submitting" | "polling" | "completed" | "failed";

export function SongGenerator({ lyrics, stylePrompt, title }: SongGeneratorProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [clips, setClips] = useState<SongClip[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function stopPolling() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  async function pollStatus(id: string) {
    try {
      const res = await fetch(`/api/song-status?taskId=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (!res.ok) {
        stopPolling();
        setStatus("failed");
        setError(data.error ?? "No se pudo consultar el estado de la canción.");
        return;
      }
      if (data.status === "completed") {
        stopPolling();
        setClips(data.clips ?? []);
        setStatus("completed");
      } else if (data.status === "failed") {
        stopPolling();
        setStatus("failed");
        setError("Apiframe reportó un fallo al generar la canción.");
      }
      // "pending" / "processing" — sigue el polling.
    } catch {
      stopPolling();
      setStatus("failed");
      setError("Error de red mientras se consultaba el estado.");
    }
  }

  async function handleSendToSuno() {
    setError(null);
    setClips([]);
    setStatus("submitting");
    try {
      const res = await fetch("/api/generate-song", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lyrics, stylePrompt, title }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("failed");
        setError(data.error ?? "No se pudo enviar la canción a Suno.");
        return;
      }
      setTaskId(data.taskId);
      setStatus("polling");
      intervalRef.current = setInterval(() => pollStatus(data.taskId), POLL_INTERVAL_MS);
      // Primera consulta inmediata, sin esperar el primer intervalo.
      pollStatus(data.taskId);
    } catch {
      setStatus("failed");
      setError("Error de red. Intenta de nuevo.");
    }
  }

  return (
    <>
      <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">
        Si necesitas editar solo un fragmento de esta canción ya generada, usa{" "}
        <strong>Replace Section</strong> directamente en{" "}
        <a
          href="https://suno.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          suno.com
        </a>{" "}
        — esa función no está disponible por API todavía.
      </p>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        onClick={handleSendToSuno}
        disabled={status === "submitting" || status === "polling"}
        className="self-start rounded-md bg-black px-4 py-2 text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        {status === "submitting"
          ? "Enviando..."
          : status === "polling"
            ? "Generando en Suno..."
            : "Enviar a Suno"}
      </button>

      {status === "polling" && taskId && (
        <p className="text-sm text-zinc-500">
          Tarea {taskId} en proceso. Suno normalmente tarda 1-3 minutos.
        </p>
      )}

      {status === "completed" && clips.length > 0 && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            Elige la variante que prefieras:
          </p>
          {clips.map((clip) => (
            <div
              key={clip.id}
              className="flex flex-col gap-2 rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
            >
              <p className="text-sm font-medium text-black dark:text-zinc-50">
                {clip.title || clip.id}
              </p>
              {clip.audioUrl && (
                <audio controls src={clip.audioUrl} className="w-full" />
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
