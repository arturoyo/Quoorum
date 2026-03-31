import { NextResponse } from "next/server";

/**
 * Auth callback route - no longer needed with local auth.
 * Redirects to login page.
 */
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/login`);
}
