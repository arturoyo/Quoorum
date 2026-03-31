import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "session-token";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds

export interface SessionPayload extends JWTPayload {
  userId: string;
  email: string;
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET || "quoorum-dev-secret-change-in-production";
  return new TextEncoder().encode(secret);
}

/**
 * Create a signed JWT session token
 */
export async function createSessionToken(payload: {
  userId: string;
  email: string;
}): Promise<string> {
  const token = await new SignJWT({
    userId: payload.userId,
    email: payload.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());

  return token;
}

/**
 * Verify and decode a JWT session token
 * Returns null if invalid or expired
 */
export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.userId || !payload.email) {
      return null;
    }
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Set the session cookie (server-side)
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

/**
 * Get the session token from cookies (server-side)
 */
export async function getSessionCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

/**
 * Clear the session cookie (server-side)
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

/**
 * Verify a session token from a raw cookie header string (for middleware/edge)
 * Does not use next/headers — works in Edge Runtime
 */
export async function verifySessionFromCookieHeader(
  cookieHeader: string
): Promise<SessionPayload | null> {
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`));

  if (!match) return null;

  const token = match.split("=").slice(1).join("=");
  if (!token) return null;

  return verifySessionToken(token);
}

export { SESSION_COOKIE_NAME };
