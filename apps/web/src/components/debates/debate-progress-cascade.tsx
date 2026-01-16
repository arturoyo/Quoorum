"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
  Clock,
  Users,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

// ============================================
// TYPES
// ============================================

interface ProcessingStatus {
  phase: string;
  message: string;
  progress: number;
  currentRound?: number;
  totalRounds?: number;
  timestamp: string;
}

interface DebateProgressCascadeProps {
  processingStatus?: ProcessingStatus | null;
  status: "draft" | "pending" | "in_progress" | "completed" | "failed" | "cancelled";
}

// ============================================
// PHASE ICONS
// ============================================

const PHASE_ICONS: Record<string, React.ReactNode> = {
  validating: <Clock className="h-5 w-5" />,
  analyzing: <TrendingUp className="h-5 w-5" />,
  matching: <Users className="h-5 w-5" />,
  preparing: <MessageSquare className="h-5 w-5" />,
  deliberating: <MessageSquare className="h-5 w-5 animate-pulse" />,
  calculating: <TrendingUp className="h-5 w-5" />,
  finalizing: <CheckCircle2 className="h-5 w-5" />,
  completed: <CheckCircle2 className="h-5 w-5" />,
  failed: <AlertCircle className="h-5 w-5" />,
};

// ============================================
// PHASE COLORS
// ============================================

const PHASE_COLORS: Record<string, string> = {
  validating: "text-blue-400",
  analyzing: "text-purple-400",
  matching: "text-indigo-400",
  preparing: "text-cyan-400",
  deliberating: "text-green-400",
  calculating: "text-yellow-400",
  finalizing: "text-orange-400",
  completed: "text-green-500",
  failed: "text-red-500",
};

// ============================================
// COMPONENT
// ============================================

export function DebateProgressCascade({
  processingStatus,
  status,
}: DebateProgressCascadeProps) {
  const [events, setEvents] = useState<ProcessingStatus[]>([]);

  // Add new events as they arrive
  useEffect(() => {
    if (processingStatus) {
      setEvents((prev) => {
        // Check if event already exists (avoid duplicates)
        const exists = prev.some(
          (e) => e.phase === processingStatus.phase && e.message === processingStatus.message
        );
        if (exists) return prev;

        // Add new event
        return [...prev, processingStatus];
      });
    }
  }, [processingStatus]);

  // Don't render if no events yet
  if (events.length === 0 && status !== "in_progress") {
    return null;
  }

  // Render for in_progress status
  if (status === "in_progress" || events.length > 0) {
    const currentEvent = events[events.length - 1] || processingStatus;
    const progress = currentEvent?.progress ?? 0;
    const phase = currentEvent?.phase ?? "pending";
    const message = currentEvent?.message ?? "Iniciando deliberación...";

    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              {status === "in_progress" && (
                <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
              )}
              {status === "completed" && (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
              {status === "failed" && (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              Progreso del Debate
            </CardTitle>
            <Badge
              variant="outline"
              className={`${
                status === "in_progress"
                  ? "bg-blue-500/20 text-blue-400 border-blue-500/50"
                  : status === "completed"
                    ? "bg-green-500/20 text-green-400 border-green-500/50"
                    : "bg-red-500/20 text-red-400 border-red-500/50"
              }`}
            >
              {progress}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-gray-400">{message}</p>
            {currentEvent?.currentRound && currentEvent?.totalRounds && (
              <p className="text-xs text-gray-500">
                Ronda {currentEvent.currentRound} de {currentEvent.totalRounds}
              </p>
            )}
          </div>

          {/* Event Timeline */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            <AnimatePresence>
              {events.map((event, index) => {
                const isCompleted = index < events.length - 1 || status === "completed";
                const isCurrent = index === events.length - 1 && status === "in_progress";
                const phaseColor = PHASE_COLORS[event.phase] || "text-gray-400";
                const phaseIcon = PHASE_ICONS[event.phase] || <Circle className="h-5 w-5" />;

                return (
                  <motion.div
                    key={`${event.phase}-${event.timestamp}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex items-start gap-3 p-2 rounded-lg ${
                      isCurrent ? "bg-slate-700/50" : ""
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 ${phaseColor} ${
                        isCurrent ? "animate-pulse" : ""
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : isCurrent ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        phaseIcon
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isCurrent ? "text-white" : "text-gray-300"}`}>
                        {event.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(event.timestamp).toLocaleTimeString("es-ES")}
                      </p>
                      {event.currentRound && event.totalRounds && (
                        <p className="text-xs text-gray-500 mt-1">
                          Ronda {event.currentRound}/{event.totalRounds}
                        </p>
                      )}
                    </div>

                    {/* Progress Badge */}
                    <div className="flex-shrink-0">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          isCompleted
                            ? "bg-green-500/10 text-green-400 border-green-500/30"
                            : isCurrent
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                              : "bg-gray-500/10 text-gray-400 border-gray-500/30"
                        }`}
                      >
                        {event.progress}%
                      </Badge>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
