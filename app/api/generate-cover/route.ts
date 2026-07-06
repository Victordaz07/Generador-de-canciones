import { NextResponse } from "next/server";
import { generateCoverImage } from "@/lib/images";

interface GenerateCoverBody {
  prompt?: string;
}

export async function POST(request: Request) {
  let body: GenerateCoverBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const prompt = body.prompt?.trim();
  if (!prompt) {
    return NextResponse.json(
      { error: "Falta el prompt de portada." },
      { status: 400 }
    );
  }

  try {
    const imageDataUrl = await generateCoverImage(prompt);
    return NextResponse.json({ imageDataUrl });
  } catch (error) {
    console.error("generate-cover error:", error);
    const message =
      error instanceof Error ? error.message : "Error inesperado al generar la portada.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
