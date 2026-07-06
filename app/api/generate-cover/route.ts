import { NextResponse } from "next/server";
import { generateCoverImage } from "@/lib/images";

interface GenerateCoverBody {
  prompt?: string;
  title?: string;
}

export async function POST(request: Request) {
  let body: GenerateCoverBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const prompt = body.prompt?.trim();
  const title = body.title?.trim();

  if (!prompt) {
    return NextResponse.json(
      { error: "Falta el prompt de portada." },
      { status: 400 }
    );
  }
  if (!title) {
    return NextResponse.json(
      { error: "Falta el título de la canción." },
      { status: 400 }
    );
  }

  try {
    const imageDataUrl = await generateCoverImage(prompt, title);
    return NextResponse.json({ imageDataUrl });
  } catch (error) {
    console.error("generate-cover error:", error);
    const message =
      error instanceof Error ? error.message : "Error inesperado al generar la portada.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
