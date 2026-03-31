import { NextResponse, type NextRequest } from "next/server";
import { SignJWT, jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "session-token";

// Routes that require authentication
// NOTE: /api/trpc is NOT included here because tRPC routers handle their own auth
// via protectedProcedure. Blocking at middleware level prevents public procedures.
const protectedRoutes = ["/dashboard", "/debates", "/settings"];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ["/login", "/signup", "/forgot-password"];

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

  // Skip middleware for static files and API routes that handle their own auth
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Skip auth check for non-protected, non-auth routes
  if (!isProtectedRoute && !isAuthRoute) {
    return response;
  }

  // Verify JWT session from cookie
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionToken ? await verifyToken(sessionToken) : null;

  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect to dashboard if accessing auth routes while authenticated
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
