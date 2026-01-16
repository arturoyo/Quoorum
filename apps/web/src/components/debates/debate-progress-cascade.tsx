"use client";

import { useEffect, useState, useRef } from "react";
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
  ChevronDown,
  ChevronUp,
  Bot,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ============================================
// TYPES
// ============================================

interface RoundMessage {
  agentKey: string;
  agentName: string;
  model: string;
  content: string;
  timestamp: string;
}

interface ProcessingStatus {
  phase: string;
  message: string;
  progress: number;
  currentRound?: number;
  totalRounds?: number;
  timestamp: string;
  roundMessages?: RoundMessage[];
}

interface DebateProgressCascadeProps {
  processingStatus?: ProcessingStatus | null;
  status: "draft" | "pending" | "in_progress" | "completed" | "failed" | "cancelled";
}

interface PhaseEvent extends ProcessingStatus {
  id: string;
  isExpanded: boolean;
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
// MODEL DISPLAY NAMES
// ============================================

const MODEL_NAMES: Record<string, string> = {
  "gemini-2.0-flash-exp": "Gemini 2.0 Flash",
  "gemini-1.5-pro": "Gemini 1.5 Pro",
  "gpt-4o": "GPT-4o",
  "gpt-4o-mini": "GPT-4o Mini",
  "claude-3-5-sonnet-20241022": "Claude 3.5 Sonnet",
  "claude-3-5-haiku-20241022": "Claude 3.5 Haiku",
};

// ============================================
// COMPONENT
// ============================================

export function DebateProgressCascade({
  processingStatus,
  status,
}: DebateProgressCascadeProps) {
  const [phases, setPhases] = useState<PhaseEvent[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Process incoming processingStatus and manage phase list
  useEffect(() => {
    if (processingStatus) {
      setPhases((prev) => {
        // Find if this phase already exists
        const existingIndex = prev.findIndex(
          (p) => p.phase === processingStatus.phase &&
                 p.currentRound === processingStatus.currentRound
        );

        if (existingIndex >= 0) {
          // Update existing phase
          const updated = [...prev];
          updated[existingIndex] = {
            ...processingStatus,
            id: updated[existingIndex].id,
            isExpanded: updated[existingIndex].isExpanded,
          };
          return updated;
        } else {
          // Add new phase
          const newPhase: PhaseEvent = {
            ...processingStatus,
            id: `${processingStatus.phase}-${processingStatus.timestamp}`,
            isExpanded: processingStatus.phase === 'deliberating', // Expand deliberation by default
          };

          // Auto-collapse previous phases when moving to a new major phase
          const collapsed = prev.map((p, i) => {
            if (i < prev.length - 1 && p.phase !== 'deliberating') {
              return { ...p, isExpanded: false };
            }
            return p;
          });

          return [...collapsed, newPhase];
        }
      });
    }
  }, [processingStatus]);

  // Auto-scroll to latest phase
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [phases]);

  const togglePhase = (phaseId: string) => {
    setPhases((prev) =>
      prev.map((p) =>
        p.id === phaseId ? { ...p, isExpanded: !p.isExpanded } : p
      )
    );
  };

  // Don't render if no events yet
  if (phases.length === 0 && status !== "in_progress") {
    return null;
  }

  // Render for in_progress status
  if (status === "in_progress" || phases.length > 0) {
    const currentPhase = phases[phases.length - 1] || processingStatus;
    const progress = currentPhase?.progress ?? 0;

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
          {/* Main Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            {currentPhase?.currentRound && currentPhase?.totalRounds && (
              <p className="text-xs text-gray-300 bg-slate-800/50 px-2 py-0.5 rounded">
                Ronda {currentPhase.currentRound} de {currentPhase.totalRounds}
              </p>
            )}
          </div>

          {/* Phase Timeline */}
          <div
            ref={scrollContainerRef}
            className="space-y-2 max-h-[500px] overflow-y-auto"
          >
            <AnimatePresence>
              {phases.map((phase, index) => {
                const isCompleted = index < phases.length - 1 || status === "completed";
                const isCurrent = index === phases.length - 1 && status === "in_progress";
                const phaseColor = PHASE_COLORS[phase.phase] || "text-gray-400";
                const phaseIcon = PHASE_ICONS[phase.phase] || <Circle className="h-5 w-5" />;
                const hasMessages = phase.roundMessages && phase.roundMessages.length > 0;

                return (
                  <motion.div
                    key={phase.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`border rounded-lg ${
                      isCurrent
                        ? "border-blue-500/50 bg-slate-700/50"
                        : "border-slate-700"
                    }`}
                  >
                    {/* Phase Header */}
                    <div
                      className="flex items-start gap-3 p-3 cursor-pointer hover:bg-slate-700/30 transition-colors"
                      onClick={() => hasMessages && togglePhase(phase.id)}
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
                        <p
                          className={`text-sm font-medium ${
                            isCurrent ? "text-white" : "text-gray-300"
                          }`}
                        >
                          {phase.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-300">
                            {new Date(phase.timestamp).toLocaleTimeString("es-ES")}
                          </p>
                          {phase.currentRound && phase.totalRounds && (
                            <Badge variant="outline" className="text-xs text-white bg-slate-800/50">
                              Ronda {phase.currentRound}/{phase.totalRounds}
                            </Badge>
                          )}
                          {hasMessages && (
                            <Badge variant="outline" className="text-xs text-white bg-slate-800/50">
                              {phase.roundMessages.length} mensajes
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Progress Badge & Expand Button */}
                      <div className="flex items-center gap-2 flex-shrink-0">
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
                          {phase.progress}%
                        </Badge>
                        {hasMessages && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePhase(phase.id);
                            }}
                          >
                            {phase.isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Messages (expandable) */}
                    <AnimatePresence>
                      {hasMessages && phase.isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-slate-700"
                        >
                          {/* Deliberation Progress Bar */}
                          {phase.phase === 'deliberating' && isCurrent && (
                            <div className="px-3 pt-3">
                              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                                <span>Progreso de la ronda</span>
                                <span>
                                  {phase.roundMessages?.length || 0} de ~{Math.ceil((phase.totalRounds || 5) / 2)} agentes
                                </span>
                              </div>
                              <Progress
                                value={((phase.roundMessages?.length || 0) / Math.ceil((phase.totalRounds || 5) / 2)) * 100}
                                className="h-1.5"
                              />
                            </div>
                          )}

                          {/* Agent Messages */}
                          <div className="px-3 py-2 space-y-2 max-h-[300px] overflow-y-auto">
                            {phase.roundMessages?.map((msg, msgIndex) => (
                              <motion.div
                                key={`${msg.agentKey}-${msg.timestamp}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: msgIndex * 0.1 }}
                                className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50"
                              >
                                {/* Agent Header */}
                                <div className="flex items-center gap-2 mb-2">
                                  <Bot className="h-4 w-4 text-blue-400" />
                                  <span className="text-sm font-medium text-white">
                                    {msg.agentName}
                                  </span>
                                  <Badge variant="outline" className="text-xs ml-auto text-white bg-slate-800/50">
                                    {MODEL_NAMES[msg.model] || msg.model}
                                  </Badge>
                                </div>

                                {/* Agent Message */}
                                <p className="text-sm text-gray-300 leading-relaxed">
                                  {msg.content}
                                </p>

                                {/* Timestamp */}
                                <p className="text-xs text-gray-300 mt-2">
                                  {new Date(msg.timestamp).toLocaleTimeString("es-ES")}
                                </p>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
