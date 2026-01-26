import { NextResponse } from "next/server";

/**
 * Health check endpoint
 * Returns server status, database connectivity, and basic system info
 */
export async function GET() {
  const startTime = Date.now();

  try {
    // Check database connectivity (lazy import to avoid module load errors)
    let dbStatus = "unknown";
    let dbLatency = 0;
    let dbError: string | null = null;

    try {
      const { db } = await import("@quoorum/db");
      const { sql } = await import("drizzle-orm");
      
      const dbStartTime = Date.now();
      await db.execute(sql`SELECT 1 as test`);
      dbLatency = Date.now() - dbStartTime;
      dbStatus = "connected";
    } catch (error) {
      dbStatus = "disconnected";
      dbError = error instanceof Error ? error.message : String(error);
      dbLatency = Date.now() - startTime;
    }

    // Check environment variables
    const envStatus = {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      nodeEnv: process.env.NODE_ENV || "development",
    };

    const totalLatency = Date.now() - startTime;

    const uptime = process.uptime();
    const health = {
      status: dbStatus === "connected" ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: isFinite(uptime) ? Math.round(uptime) : 0,
      database: {
        status: dbStatus,
        latency: dbLatency,
        ...(dbError && { error: dbError }),
      },
      environment: envStatus,
      responseTime: totalLatency,
    };

    const statusCode = health.status === "healthy" ? 200 : 503;

    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
        stack: process.env.NODE_ENV === "development" && error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
