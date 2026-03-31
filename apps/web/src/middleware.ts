import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "session-token";
const APP_HOST = "app.quoorum.pro";
const LANDING_HOST = "quoorum.pro";

// Routes that require authentication
const protectedRoutes = ["/dashboard", "/debates", "/settings", "/admin", "/experts", "/scenarios", "/frameworks"];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ["/login", "/signup", "/forgot-password"];

// Routes that only belong on the landing (quoorum.pro)
const landingOnlyRoutes = ["/"];

// Routes that only belong on the app (app.quoorum.pro)
const appRoutes = [...protectedRoutes, ...authRoutes, "/api"];

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET || "quoorum-dev-secret-change-in-production";
  return new TextEncoder().encode(secret);
}

async function verifyToken(token: string): Promise<{ userId: string; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.userId || !payload.email) return null;
    return { userId: payload.userId as string, email: payload.email as string };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host")?.split(":")[0] || "";

  // Skip middleware for static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  const isLandingHost = hostname === LANDING_HOST || hostname === `www.${LANDING_HOST}`;
  const isAppHost = hostname === APP_HOST;
  const isDev = !isLandingHost && !isAppHost; // localhost or other

  // --- Domain routing ---

  if (isLandingHost) {
    // On landing domain: redirect app routes to app.quoorum.pro
    const isAppRoute = appRoutes.some((r) => pathname === r || pathname.startsWith(r + "/"));
    if (isAppRoute) {
      return NextResponse.redirect(`https://${APP_HOST}${pathname}${request.nextUrl.search}`);
    }
    // Allow landing page and any other marketing pages
    return response;
  }

  if (isAppHost) {
    // On app domain: redirect root to dashboard or login
    if (pathname === "/") {
      const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
      const session = sessionToken ? await verifyToken(sessionToken) : null;
      if (session) {
        return NextResponse.redirect(`https://${APP_HOST}/dashboard`);
      }
      return NextResponse.redirect(`https://${APP_HOST}/login`);
    }
  }

  // --- Auth checks (app domain or dev) ---

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (!isProtectedRoute && !isAuthRoute) {
    return response;
  }

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionToken ? await verifyToken(sessionToken) : null;

  if (isProtectedRoute && !session) {
    const loginUrl = isDev
      ? new URL("/login", request.url)
      : new URL(`https://${APP_HOST}/login`);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && session) {
    const dashUrl = isDev
      ? new URL("/dashboard", request.url)
      : new URL(`https://${APP_HOST}/dashboard`);
    return NextResponse.redirect(dashUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
