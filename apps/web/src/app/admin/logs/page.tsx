"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { api } from "@/lib/trpc/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Bug,
  XCircle,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Download,
  Trash,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const LEVEL_CONFIG = {
  debug: { icon: Bug, color: "text-gray-500", bg: "bg-gray-100" },
  info: { icon: Info, color: "text-blue-500", bg: "bg-blue-100" },
  warn: { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-100" },
  error: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-100" },
  fatal: { icon: XCircle, color: "text-purple-500", bg: "bg-purple-100" },
};

export default function LogsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [level, setLevel] = useState<string | undefined>();
  const [source, setSource] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const limit = 50;

  // Auth check (CRITICAL: Admin page requires authentication)
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      } else {
        // TODO: Add admin role check when role system is implemented
        setIsAuthenticated(true);
      }
    }
    checkAuth();
  }, [router, supabase.auth]);

  // Query logs (only execute when authenticated)
  const { data, isLoading, refetch } = api.systemLogs.list.useQuery(
    {
      limit,
      offset: page * limit,
      level: level as any,
      source: source as any,
      search: search || undefined,
    },
    { enabled: isAuthenticated }
  );

  // Query stats (only execute when authenticated)
  const { data: stats } = api.systemLogs.stats.useQuery(
    {},
    { enabled: isAuthenticated }
  );

  // Delete old logs mutation
  const deleteOld = api.systemLogs.deleteOld.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });

  const handleExport = () => {
    if (!data) return;

    const csv = [
      ["Timestamp", "Level", "Source", "Message", "User ID", "Error"],
      ...data.logs.map((log) => [
        format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss"),
        log.level,
        log.source,
        log.message,
        log.userId || "",
        log.errorMessage || "",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Logs</h1>
            <p className="text-gray-600">
              Monitoreo en tiempo real de eventos del sistema
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => void refetch()}
              disabled={isLoading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refrescar
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteOld.mutate({ olderThanDays: 30 })
              }
              disabled={deleteOld.isPending}
            >
              <Trash className="w-4 h-4 mr-2" />
              Limpiar +30 días
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="p-4">
              <div className="text-sm text-gray-600">Total Logs</div>
              <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
            </Card>

            {stats.byLevel.map((stat) => {
              const config = LEVEL_CONFIG[stat.level as keyof typeof LEVEL_CONFIG];
              const Icon = config.icon;

              return (
                <Card key={stat.level} className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${config.color}`} />
                    <div className="text-sm text-gray-600 capitalize">
                      {stat.level}
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{stat.count.toLocaleString()}</div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Nivel
              </label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los niveles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="debug">Debug</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warn">Warn</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="fatal">Fatal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Source
              </label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="server">Server</SelectItem>
                  <SelectItem value="worker">Worker</SelectItem>
                  <SelectItem value="cron">Cron</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Buscar
              </label>
              <Input
                placeholder="Buscar en mensajes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Logs Table */}
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              Cargando logs...
            </div>
          ) : data?.logs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No se encontraron logs
            </div>
          ) : (
            <div className="divide-y">
              {data?.logs.map((log) => {
                const config = LEVEL_CONFIG[log.level as keyof typeof LEVEL_CONFIG];
                const Icon = config.icon;
                const isExpanded = expandedLog === log.id;

                return (
                  <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div
                      className="flex items-start gap-4 cursor-pointer"
                      onClick={() =>
                        setExpandedLog(isExpanded ? null : log.id)
                      }
                    >
                      {/* Expand icon */}
                      <div className="flex-shrink-0 mt-1">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                      </div>

                      {/* Level icon */}
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}
                      >
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="capitalize">
                            {log.source}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {format(new Date(log.createdAt), "PPp", { locale: es })}
                          </span>
                          {log.userId && (
                            <span className="text-xs text-gray-400">
                              User: {log.userId.slice(0, 8)}
                            </span>
                          )}
                        </div>

                        <div className="text-sm text-gray-900 font-medium">
                          {log.message}
                        </div>

                        {log.errorMessage && !isExpanded && (
                          <div className="text-xs text-red-600 mt-1 truncate">
                            {log.errorMessage}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="ml-16 mt-4 space-y-3">
                        {log.errorMessage && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <div className="text-xs font-medium text-red-700 mb-1">
                              Error: {log.errorName}
                            </div>
                            <div className="text-xs text-red-600">
                              {log.errorMessage}
                            </div>
                            {log.errorStack && (
                              <pre className="text-xs text-red-600 mt-2 overflow-x-auto">
                                {log.errorStack}
                              </pre>
                            )}
                          </div>
                        )}

                        {log.metadata && (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <div className="text-xs font-medium text-gray-700 mb-1">
                              Metadata
                            </div>
                            <pre className="text-xs text-gray-600 overflow-x-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Pagination */}
        {data && data.total > limit && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Mostrando {page * limit + 1} - {Math.min((page + 1) * limit, data.total)} de {data.total}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={!data.hasMore}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
