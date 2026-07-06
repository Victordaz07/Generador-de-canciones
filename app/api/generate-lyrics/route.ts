import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { SGM_CREATIVE_RULES } from "@/lib/sgm-creative-rules";

const client = new Anthropic();

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    title_es: { type: "string" },
    title_en: { type: "string" },
    scripture_reference: {
      type: "string",
      description:
        "Referencia escritural confirmada o sugerida (ej. 'Lucas 5:1-11'), nunca el nombre del personaje.",
    },
    lyrics: { type: "string" },
    music_bible: {
      type: "string",
      description:
        "Music Bible / style sheet en texto legible: género, BPM, instrumentos, energía y signature sound.",
    },
    genre: { type: "string", description: "Género musical principal, para metadata." },
    bpm: { type: "integer", description: "BPM, para metadata." },
    signature_sound: {
      type: "string",
      description: "Signature sound del personaje en una frase corta, para metadata.",
    },
    youtube_tags: {
      type: "array",
      items: { type: "string" },
      description: "5-10 tags sugeridos para YouTube.",
    },
    suno_prompt: { type: "string" },
    cover_prompt: { type: "string" },
    doctrinal_checklist: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          answer: { type: "string" },
        },
        required: ["question", "answer"],
        additionalProperties: false,
      },
    },
  },
  required: [
    "title_es",
    "title_en",
    "scripture_reference",
    "lyrics",
    "music_bible",
    "genre",
    "bpm",
    "signature_sound",
    "youtube_tags",
    "suno_prompt",
    "cover_prompt",
    "doctrinal_checklist",
  ],
  additionalProperties: false,
} as const;

interface GenerateLyricsBody {
  character?: string;
  scripture?: string;
  notes?: string;
  language?: string;
}

export async function POST(request: Request) {
  let body: GenerateLyricsBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const character = body.character?.trim();
  if (!character) {
    return NextResponse.json(
      { error: "Falta el personaje o idea inicial." },
      { status: 400 }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY no está configurada en el servidor." },
      { status: 502 }
    );
  }

  const language = body.language?.trim() || "Español";
  const scripture = body.scripture?.trim();
  const notes = body.notes?.trim();

  const userPrompt = [
    `Personaje o idea: ${character}`,
    scripture
      ? `Referencia escritural sugerida: ${scripture}`
      : "Sugiere tú la referencia escritural más apropiada.",
    notes ? `Notas / dirección creativa adicional: ${notes}` : null,
    `Idioma de la letra: ${language}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 8000,
      system: SGM_CREATIVE_RULES,
      messages: [{ role: "user", content: userPrompt }],
      output_config: {
        format: { type: "json_schema", schema: RESPONSE_SCHEMA },
      },
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "Claude no devolvió una respuesta de texto." },
        { status: 502 }
      );
    }

    const proposal = JSON.parse(textBlock.text);
    return NextResponse.json({ proposal });
  } catch (error) {
    console.error("generate-lyrics error:", error);

    let message = "Error inesperado al generar la propuesta.";
    if (error instanceof Anthropic.AuthenticationError) {
      message = "ANTHROPIC_API_KEY inválida o ausente.";
    } else if (error instanceof Anthropic.RateLimitError) {
      message = "Límite de uso de Claude alcanzado. Intenta de nuevo en unos segundos.";
    } else if (error instanceof Anthropic.APIError) {
      message = error.message;
    }

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
