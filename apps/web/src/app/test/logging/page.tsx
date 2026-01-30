"use client";

import { useState } from "react";
import { api } from "@/lib/trpc/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Check,
  CheckCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";

export default function TestLoggingPage() {
  const [results, setResults] = useState<Record<string, any>>({});
  const [userId, setUserId] = useState("550e8400-e29b-41d4-a716-446655440000");
  const [batchCount, setBatchCount] = useState(10);

  const testAllLevels = api.testLogging.testAllLevels.useQuery(undefined, {
    enabled: false,
  });

  const testPerformance = api.testLogging.testPerformance.useQuery(undefined, {
    enabled: false,
  });

  const testBatch = api.testLogging.testBatch.useQuery(
    { count: batchCount },
    { enabled: false }
  );

  const testWithUser = api.testLogging.testWithUser.useQuery(
    { userId },
    { enabled: false }
  );

  const handleTest = async (testName: string, refetch: () => Promise<any>) => {
    setResults((prev) => ({ ...prev, [testName]: { loading: true } }));

    try {
      const result = await refetch();
      setResults((prev) => ({
        ...prev,
        [testName]: { success: true, data: result.data },
      }));
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        [testName]: { success: false, error: (error as Error).message },
      }));
    }
  };

  const handleFrontendTest = async () => {
    try {
      // Importar logger dinámicamente
      const { logger } = await import("@/lib/logger");

      logger.debug("Frontend debug test", { test: true });
      logger.info("Frontend info test", { test: true });
      logger.warn("Frontend warn test", { test: true });
      logger.error("Frontend error test", new Error("Test error"));
      logger.track("test_event", { source: "test_page" });

      setResults((prev) => ({
        ...prev,
        frontend: { success: true, data: { message: "5 frontend logs created" } },
      }));
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        frontend: { success: false, error: (error as Error).message },
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold styles.colors.text.primary">
              Test Sistema de Logging
            </h1>
            <p className="styles.colors.text.tertiary">
              Ejecuta tests para verificar que el sistema funciona correctamente
            </p>
          </div>

          <Link href="/admin/logs">
            <Button variant="outline">
              <ExternalLink className="w-4 h-4 mr-2" />
              Ver Dashboard
            </Button>
          </Link>
        </div>

        {/* Backend Tests */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Backend Tests (API)</h2>
          <div className="space-y-4">
            {/* Test 1: All Levels */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h3 className="font-medium">Test All Levels</h3>
                <p className="text-sm styles.colors.text.tertiary">
                  Crea 5 logs (debug, info, warn, error, fatal)
                </p>
              </div>
              <div className="flex items-center gap-2">
                {results.allLevels?.loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {results.allLevels?.success && (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                )}
                {results.allLevels?.success === false && (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <Button
                  onClick={() => handleTest("allLevels", testAllLevels.refetch)}
                  disabled={results.allLevels?.loading}
                >
                  Ejecutar
                </Button>
              </div>
            </div>

            {/* Test 2: Performance */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h3 className="font-medium">Test Performance</h3>
                <p className="text-sm styles.colors.text.tertiary">
                  Mide duración de operación (100ms delay)
                </p>
              </div>
              <div className="flex items-center gap-2">
                {results.performance?.loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {results.performance?.success && (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                )}
                {results.performance?.success === false && (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <Button
                  onClick={() => handleTest("performance", testPerformance.refetch)}
                  disabled={results.performance?.loading}
                >
                  Ejecutar
                </Button>
              </div>
            </div>

            {/* Test 3: Batch */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h3 className="font-medium">Test Batch</h3>
                <p className="text-sm styles.colors.text.tertiary">
                  Inserta múltiples logs rápidamente
                </p>
                <Input
                  type="number"
                  value={batchCount}
                  onChange={(e) => setBatchCount(Number(e.target.value))}
                  min={1}
                  max={100}
                  className="mt-2 w-32"
                />
              </div>
              <div className="flex items-center gap-2">
                {results.batch?.loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {results.batch?.success && (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                )}
                {results.batch?.success === false && (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <Button
                  onClick={() => handleTest("batch", testBatch.refetch)}
                  disabled={results.batch?.loading}
                >
                  Ejecutar
                </Button>
              </div>
            </div>

            {/* Test 4: With User */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h3 className="font-medium">Test With User</h3>
                <p className="text-sm styles.colors.text.tertiary">
                  Log asociado a un userId específico
                </p>
                <Input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="UUID del usuario"
                  className="mt-2 w-full font-mono text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                {results.withUser?.loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {results.withUser?.success && (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                )}
                {results.withUser?.success === false && (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <Button
                  onClick={() => handleTest("withUser", testWithUser.refetch)}
                  disabled={results.withUser?.loading}
                >
                  Ejecutar
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Frontend Tests */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Frontend Tests (Client)</h2>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h3 className="font-medium">Test Frontend Logging</h3>
              <p className="text-sm styles.colors.text.tertiary">
                Crea logs desde el cliente (debug, info, warn, error, track)
              </p>
            </div>
            <div className="flex items-center gap-2">
              {results.frontend?.success && (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              )}
              {results.frontend?.success === false && (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <Button onClick={handleFrontendTest}>
                Ejecutar
              </Button>
            </div>
          </div>
        </Card>

        {/* Results */}
        {Object.keys(results).length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Resultados</h2>
            <pre className="bg-gray-900 styles.colors.text.primary p-4 rounded-lg overflow-x-auto text-sm">
              {JSON.stringify(results, null, 2)}
            </pre>
          </Card>
        )}

        {/* Instructions */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">
            📋 Instrucciones
          </h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Ejecuta los tests uno por uno haciendo click en "Ejecutar"</li>
            <li>
              Ve al{" "}
              <Link href="/admin/logs" className="underline font-medium">
                Dashboard de Logs
              </Link>{" "}
              para verificar que aparecen
            </li>
            <li>Verifica que los filtros y búsqueda funcionen correctamente</li>
            <li>
              Los logs de frontend pueden tardar hasta 10 segundos en aparecer
              (batch processing)
            </li>
          </ol>
        </Card>
      </div>
    </div>
  );
}
