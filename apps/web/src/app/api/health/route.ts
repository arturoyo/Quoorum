import { NextResponse } from "next/server";

/**
 * Health check endpoint
 * SECURITY: Only returns basic status without exposing sensitive info
 * For detailed health checks, use admin endpoints
 */
export async function GET() {
  const startTime = Date.now();

  try {
    // Check database connectivity (lazy import to avoid module load errors)
    let dbStatus = "unknown";

    try {
      const { db } = await import("@quoorum/db");
      const { sql } = await import("drizzle-orm");

      await db.execute(sql`SELECT 1 as test`);
      dbStatus = "connected";
    } catch {
      dbStatus = "disconnected";
    }

    const totalLatency = Date.now() - startTime;

    // SECURITY: Only return minimal public information
    // No configuration details, no environment variables, no error messages
    const health = {
      status: dbStatus === "connected" ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      responseTime: totalLatency,
    };

    const statusCode = health.status === "ok" ? 200 : 503;

    return NextResponse.json(health, { status: statusCode });
  } catch {
    // SECURITY: Don't expose error details publicly
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
