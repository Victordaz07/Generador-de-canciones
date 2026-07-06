import { NextResponse } from "next/server";
import { fetchSongStatus } from "@/lib/apiframe";

export async function GET(request: Request) {
  const taskId = new URL(request.url).searchParams.get("taskId");

  if (!taskId) {
    return NextResponse.json({ error: "Falta taskId." }, { status: 400 });
  }

  try {
    const result = await fetchSongStatus(taskId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("song-status error:", error);
    const message =
      error instanceof Error ? error.message : "Error inesperado al consultar el estado.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
