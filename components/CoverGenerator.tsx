"use client";

import { useState } from "react";

interface CoverGeneratorProps {
  prompt: string;
}

export function CoverGenerator({ prompt }: CoverGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);

  async function handleGenerate() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/generate-cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo generar la portada.");
        return;
      }
      setImageDataUrl(data.imageDataUrl);
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="self-start rounded-md bg-black px-4 py-2 text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        {loading ? "Generando..." : "Generar portada"}
      </button>

      {imageDataUrl && (
        <div className="flex flex-col items-start gap-3">
          {/* Imagen generada por DALL-E como data URL — no es una foto de usuario. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageDataUrl}
            alt="Portada generada"
            className="w-full max-w-sm rounded-md border border-zinc-200 dark:border-zinc-800"
          />
          <a
            href={imageDataUrl}
            download="portada.png"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm text-black transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-900"
          >
            Descargar portada
          </a>
        </div>
      )}
    </>
  );
}
