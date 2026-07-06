"use client";

import { useState } from "react";
import type { SongProposal } from "@/lib/types";

const LANGUAGES = ["Español", "English"];

export function LyricsGenerator() {
  const [character, setCharacter] = useState("");
  const [scripture, setScripture] = useState("");
  const [notes, setNotes] = useState("");
  const [language, setLanguage] = useState(LANGUAGES[0]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<SongProposal | null>(null);
  const [checked, setChecked] = useState<boolean[]>([]);

  async function handleGenerate() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/generate-lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character, scripture, notes, language }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo generar la propuesta.");
        return;
      }
      setProposal(data.proposal as SongProposal);
      setChecked(new Array(data.proposal.doctrinal_checklist.length).fill(false));
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  function updateProposal<K extends keyof SongProposal>(key: K, value: SongProposal[K]) {
    if (!proposal) return;
    setProposal({ ...proposal, [key]: value });
  }

  return (
    <div className="flex w-full max-w-3xl flex-col gap-8 px-6 py-10">
      <section className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
          1. Idea inicial
        </h2>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-zinc-700 dark:text-zinc-300">
            Personaje / idea
          </label>
          <input
            value={character}
            onChange={(e) => setCharacter(e.target.value)}
            placeholder="Ej. Pedro, Echa La Red"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-zinc-700 dark:text-zinc-300">
            Referencia escritural (opcional)
          </label>
          <input
            value={scripture}
            onChange={(e) => setScripture(e.target.value)}
            placeholder="Ej. Lucas 5:1-11"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-zinc-700 dark:text-zinc-300">
            Notas / dirección creativa adicional (opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-zinc-700 dark:text-zinc-300">
            Idioma de la letra
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button
          onClick={handleGenerate}
          disabled={loading || !character.trim()}
          className="self-start rounded-md bg-black px-4 py-2 text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {loading ? "Generando..." : "Generar propuesta"}
        </button>
      </section>

      {proposal && (
        <section className="flex flex-col gap-6 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
            2. Propuesta de Claude
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-zinc-700 dark:text-zinc-300">
                Título (español)
              </label>
              <input
                value={proposal.title_es}
                onChange={(e) => updateProposal("title_es", e.target.value)}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-zinc-700 dark:text-zinc-300">
                Título (referencia interna, inglés)
              </label>
              <input
                value={proposal.title_en}
                onChange={(e) => updateProposal("title_en", e.target.value)}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-zinc-700 dark:text-zinc-300">Letra</label>
            <textarea
              value={proposal.lyrics}
              onChange={(e) => updateProposal("lyrics", e.target.value)}
              rows={16}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-zinc-700 dark:text-zinc-300">
              Music Bible / style sheet
            </label>
            <textarea
              value={proposal.music_bible}
              onChange={(e) => updateProposal("music_bible", e.target.value)}
              rows={5}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-zinc-700 dark:text-zinc-300">
              Prompt de Suno
            </label>
            <textarea
              value={proposal.suno_prompt}
              onChange={(e) => updateProposal("suno_prompt", e.target.value)}
              rows={4}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-zinc-700 dark:text-zinc-300">
              Prompt de portada
            </label>
            <textarea
              value={proposal.cover_prompt}
              onChange={(e) => updateProposal("cover_prompt", e.target.value)}
              rows={4}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Checklist del Filtro de Fidelidad Doctrinal SUD
            </p>
            <p className="text-xs text-zinc-500">
              Confirma cada punto manualmente — nada se aprueba automáticamente.
            </p>
            <ul className="flex flex-col gap-2">
              {proposal.doctrinal_checklist.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={checked[i] ?? false}
                    onChange={(e) => {
                      const next = [...checked];
                      next[i] = e.target.checked;
                      setChecked(next);
                    }}
                    className="mt-1"
                  />
                  <div className="text-sm">
                    <p className="font-medium text-black dark:text-zinc-50">
                      {item.question}
                    </p>
                    <p className="text-zinc-600 dark:text-zinc-400">{item.answer}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
