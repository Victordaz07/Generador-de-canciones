import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  createSessionToken,
  passwordMatches,
  sessionCookieOptions,
  SESSION_COOKIE,
} from "@/lib/auth";

export async function POST(request: Request) {
  let password: string | undefined;
  try {
    const body = await request.json();
    password = body?.password;
  } catch {
    return NextResponse.json(
      { error: "Solicitud inválida." },
      { status: 400 }
    );
  }

  if (!password || typeof password !== "string") {
    return NextResponse.json(
      { error: "Falta la contraseña." },
      { status: 400 }
    );
  }

  if (!passwordMatches(password)) {
    return NextResponse.json(
      { error: "Contraseña incorrecta." },
      { status: 401 }
    );
  }

  const token = await createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions);

  return NextResponse.json({ ok: true });
}
