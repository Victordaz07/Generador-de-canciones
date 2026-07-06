import { NextResponse } from "next/server";
import { requestSongGeneration } from "@/lib/apiframe";

interface GenerateSongBody {
  lyrics?: string;
  stylePrompt?: string;
  title?: string;
  instrumental?: boolean;
}

export async function POST(request: Request) {
  let body: GenerateSongBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const lyrics = body.lyrics?.trim();
  const stylePrompt = body.stylePrompt?.trim();
  const title = body.title?.trim() || "SGM Song";

  if (!lyrics || !stylePrompt) {
    return NextResponse.json(
      { error: "Faltan la letra o el prompt de estilo." },
      { status: 400 }
    );
  }

  try {
    const result = await requestSongGeneration({
      lyrics,
      stylePrompt,
      title,
      instrumental: body.instrumental,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("generate-song error:", error);
    const message =
      error instanceof Error ? error.message : "Error inesperado al generar la canción.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
