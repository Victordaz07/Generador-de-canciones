import "server-only";
import { createHash, timingSafeEqual } from "crypto";
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "sgm_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 días

function getSigningKey() {
  const password = process.env.SITE_PASSWORD;
  if (!password) {
    throw new Error("SITE_PASSWORD no está configurada");
  }
  // Deriva la clave de firma de la contraseña compartida para no requerir
  // una variable de entorno adicional solo para firmar la sesión.
  return createHash("sha256").update(password).digest();
}

export function passwordMatches(candidate: string) {
  const password = process.env.SITE_PASSWORD;
  if (!password) {
    throw new Error("SITE_PASSWORD no está configurada");
  }
  const a = Buffer.from(candidate);
  const b = Buffer.from(password);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function createSessionToken() {
  const key = getSigningKey();
  return new SignJWT({ auth: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(key);
}

export async function verifySessionToken(token: string | undefined) {
  if (!token) return false;
  try {
    const key = getSigningKey();
    await jwtVerify(token, key, { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};
