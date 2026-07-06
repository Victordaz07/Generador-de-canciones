"use client";

import { useState } from "react";
import type { SongProposal } from "@/lib/types";

interface MetadataPanelProps {
  proposal: SongProposal;
  character: string;
}

function buildMetadataText(proposal: SongProposal, character: string) {
  return [
    `Título: ${proposal.title_es}`,
    `Título (EN, referencia interna): ${proposal.title_en}`,
    `Personaje (referencia interna): ${character}`,
    `Escritura principal: ${proposal.scripture_reference}`,
    `Género: ${proposal.genre}`,
    `BPM: ${proposal.bpm}`,
    `Signature sound: ${proposal.signature_sound}`,
    `Tags YouTube: ${proposal.youtube_tags.join(", ")}`,
  ].join("\n");
}

function slugify(text: string) {
  return (
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "cancion"
  );
}

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function MetadataPanel({ proposal, character }: MetadataPanelProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopyMetadata() {
    await navigator.clipboard.writeText(buildMetadataText(proposal, character));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const content = [
      `# ${proposal.title_es}`,
      "",
      `**Título (EN, referencia interna):** ${proposal.title_en}`,
      `**Personaje (referencia interna):** ${character}`,
      `**Escritura principal:** ${proposal.scripture_reference}`,
      "",
      "## Letra",
      "",
      proposal.lyrics,
      "",
      "## Music Bible / Style Sheet",
      "",
      proposal.music_bible,
      "",
      `**Género:** ${proposal.genre}`,
      `**BPM:** ${proposal.bpm}`,
      `**Signature sound:** ${proposal.signature_sound}`,
      `**Tags YouTube:** ${proposal.youtube_tags.join(", ")}`,
      "",
      "## Prompt de Suno",
      "",
      proposal.suno_prompt,
      "",
      "## Prompt de portada",
      "",
      proposal.cover_prompt,
    ].join("\n");

    downloadTextFile(`${slugify(proposal.title_en)}.md`, content);
  }

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
        5. Metadata y exportación
      </h2>

      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-zinc-500">Título</dt>
          <dd className="text-black dark:text-zinc-50">{proposal.title_es}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Título (EN, referencia interna)</dt>
          <dd className="text-black dark:text-zinc-50">{proposal.title_en}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Personaje (referencia interna)</dt>
          <dd className="text-black dark:text-zinc-50">{character}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Escritura principal</dt>
          <dd className="text-black dark:text-zinc-50">{proposal.scripture_reference}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Género</dt>
          <dd className="text-black dark:text-zinc-50">{proposal.genre}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">BPM</dt>
          <dd className="text-black dark:text-zinc-50">{proposal.bpm}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Signature sound</dt>
          <dd className="text-black dark:text-zinc-50">{proposal.signature_sound}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Tags YouTube</dt>
          <dd className="text-black dark:text-zinc-50">
            {proposal.youtube_tags.join(", ")}
          </dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleCopyMetadata}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm text-black transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-900"
        >
          {copied ? "Copiado ✓" : "Copiar metadata"}
        </button>
        <button
          onClick={handleDownload}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm text-black transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-900"
        >
          Descargar letra + style sheet (.md)
        </button>
      </div>
    </section>
  );
}
