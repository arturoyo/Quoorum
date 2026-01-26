'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Target,
  ArrowRight,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type {
  ContextAssessment,
  ContextAnswers,
  ContextAssumption,
  ClarifyingQuestion,
} from '@/lib/context-assessment/types';

interface ContextReadinessProps {
  assessment: ContextAssessment;
  onAnswersChange: (answers: ContextAnswers) => void;
  onRefine: () => void;
  onProceed: () => void;
  isAnalyzing?: boolean;
}

export function ContextReadiness({
  assessment,
  onAnswersChange,
  onRefine,
  onProceed,
  isAnalyzing = false,
}: ContextReadinessProps) {
  const [answers, setAnswers] = useState<ContextAnswers>({
    assumptionResponses: {},
    questionResponses: {},
    additionalContext: '',
  });
  const [showDimensions, setShowDimensions] = useState(false);
  const [activeSection, setActiveSection] = useState<'assumptions' | 'questions' | null>(
    assessment.assumptions.length > 0 ? 'assumptions' : 'questions'
  );

  useEffect(() => {
    onAnswersChange(answers);
  }, [answers, onAnswersChange]);

  const handleAssumptionResponse = (id: string, confirmed: boolean) => {
    setAnswers(prev => ({
      ...prev,
      assumptionResponses: {
        ...prev.assumptionResponses,
        [id]: confirmed,
      },
    }));
  };

  const handleQuestionResponse = (id: string, response: string | string[]) => {
    setAnswers(prev => ({
      ...prev,
      questionResponses: {
        ...prev.questionResponses,
        [id]: response,
      },
    }));
  };

  const handleAdditionalContext = (text: string) => {
    setAnswers(prev => ({
      ...prev,
      additionalContext: text,
    }));
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    if (score >= 30) return 'text-orange-400';
    return 'text-red-400';
  };

  const getProgressColor = (score: number) => {
    if (score >= 75) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    if (score >= 30) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getReadinessLabel = (level: ContextAssessment['readinessLevel']) => {
    const labels = {
      insufficient: { text: 'Insuficiente', color: 'bg-red-500/20 text-red-400' },
      basic: { text: 'Básico', color: 'bg-orange-500/20 text-orange-400' },
      good: { text: 'Bueno', color: 'bg-yellow-500/20 text-yellow-400' },
      excellent: { text: 'Excelente', color: 'bg-green-500/20 text-green-400' },
    };
    return labels[level];
  };

  const unansweredAssumptions = assessment.assumptions.filter(
    a => answers.assumptionResponses[a.id] === undefined
  );
  const unansweredQuestions = assessment.clarifyingQuestions.filter(
    q => !answers.questionResponses[q.id]
  );

  const canProceed = assessment.overallScore >= 30 ||
    (unansweredAssumptions.length === 0 && unansweredQuestions.length === 0);

  return (
    <div className="space-y-6">
      {/* Main Score Card */}
      <Card className="border-[#2a3942] bg-gradient-to-br from-[#111b21] to-[#1a2730]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-400" />
              <CardTitle className="text-lg text-[#e9edef]">
                Preparación del Contexto
              </CardTitle>
            </div>
            <Badge className={getReadinessLabel(assessment.readinessLevel).color}>
              {getReadinessLabel(assessment.readinessLevel).text}
            </Badge>
          </div>
          <CardDescription className="text-[var(--theme-text-secondary)]">
            {assessment.summary}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--theme-text-secondary)]">Nivel de contexto</span>
              <span className={`font-bold ${getScoreColor(assessment.overallScore)}`}>
                {assessment.overallScore}%
              </span>
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-[#2a3942]">
              <motion.div
                className={`h-full ${getProgressColor(assessment.overallScore)}`}
                initial={{ width: 0 }}
                animate={{ width: `${assessment.overallScore}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
              {/* Threshold markers */}
              <div className="absolute inset-0 flex">
                <div className="w-[30%] border-r border-white/20" />
                <div className="w-[20%] border-r border-white/20" />
                <div className="w-[25%] border-r border-white/20" />
              </div>
            </div>
            <div className="flex justify-between text-xs text-[var(--theme-text-tertiary)]">
              <span>Insuficiente</span>
              <span>Básico</span>
              <span>Bueno</span>
              <span>Excelente</span>
            </div>
          </div>

          {/* Dimension Breakdown (Collapsible) */}
          <Collapsible open={showDimensions} onOpenChange={setShowDimensions}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between text-[var(--theme-text-secondary)] hover:text-white"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Ver desglose por dimensiones
                </span>
                {showDimensions ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="grid gap-2">
                {assessment.dimensions.map(dim => (
                  <div
                    key={dim.id}
                    className="flex items-center justify-between rounded-lg bg-[#1a2730] p-3"
                  >
                    <div className="flex items-center gap-2">
                      {dim.status === 'complete' && (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      )}
                      {dim.status === 'partial' && (
                        <AlertCircle className="h-4 w-4 text-yellow-400" />
                      )}
                      {dim.status === 'missing' && (
                        <HelpCircle className="h-4 w-4 text-red-400" />
                      )}
                      <span className="text-sm text-[#e9edef]">{dim.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 overflow-hidden rounded-full bg-[#2a3942]">
                        <div
                          className={`h-full ${getProgressColor(dim.score)}`}
                          style={{ width: `${dim.score}%` }}
                        />
                      </div>
                      <span className="text-xs text-[var(--theme-text-secondary)] w-8">{dim.score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Assumptions Section */}
      {assessment.assumptions.length > 0 && (
        <Card className="border-[#2a3942] bg-[#111b21]">
          <CardHeader
            className="cursor-pointer"
            onClick={() => setActiveSection(activeSection === 'assumptions' ? null : 'assumptions')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-400" />
                <CardTitle className="text-base text-[#e9edef]">
                  Confirma mis asunciones
                </CardTitle>
                {unansweredAssumptions.length > 0 && (
                  <Badge variant="outline" className="border-yellow-500/50 text-yellow-400">
                    {unansweredAssumptions.length} pendiente(s)
                  </Badge>
                )}
              </div>
              {activeSection === 'assumptions' ? (
                <ChevronUp className="h-5 w-5 text-[var(--theme-text-secondary)]" />
              ) : (
                <ChevronDown className="h-5 w-5 text-[var(--theme-text-secondary)]" />
              )}
            </div>
            <CardDescription className="text-[var(--theme-text-secondary)]">
              He hecho algunas suposiciones. ¿Son correctas?
            </CardDescription>
          </CardHeader>
          <AnimatePresence>
            {activeSection === 'assumptions' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <CardContent className="space-y-4">
                  {assessment.assumptions.map(assumption => (
                    <AssumptionCard
                      key={assumption.id}
                      assumption={assumption}
                      response={answers.assumptionResponses[assumption.id]}
                      onResponse={(confirmed) =>
                        handleAssumptionResponse(assumption.id, confirmed)
                      }
                    />
                  ))}
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      )}

      {/* Questions Section */}
      {assessment.clarifyingQuestions.length > 0 && (
        <Card className="border-[#2a3942] bg-[#111b21]">
          <CardHeader
            className="cursor-pointer"
            onClick={() => setActiveSection(activeSection === 'questions' ? null : 'questions')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-purple-400" />
                <CardTitle className="text-base text-[#e9edef]">
                  Preguntas para mejorar el contexto
                </CardTitle>
                {unansweredQuestions.length > 0 && (
                  <Badge variant="outline" className="border-purple-500/50 text-purple-400">
                    {unansweredQuestions.length} pendiente(s)
                  </Badge>
                )}
              </div>
              {activeSection === 'questions' ? (
                <ChevronUp className="h-5 w-5 text-[var(--theme-text-secondary)]" />
              ) : (
                <ChevronDown className="h-5 w-5 text-[var(--theme-text-secondary)]" />
              )}
            </div>
            <CardDescription className="text-[var(--theme-text-secondary)]">
              Responder estas preguntas mejorará la calidad del debate
            </CardDescription>
          </CardHeader>
          <AnimatePresence>
            {activeSection === 'questions' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <CardContent className="space-y-4">
                  {assessment.clarifyingQuestions.map(question => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      response={answers.questionResponses[question.id]}
                      onResponse={(response) =>
                        handleQuestionResponse(question.id, response)
                      }
                    />
                  ))}
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      )}

      {/* Additional Context */}
      <Card className="border-[#2a3942] bg-[#111b21]">
        <CardHeader>
          <CardTitle className="text-base text-[#e9edef]">
            ¿Algo más que añadir?
          </CardTitle>
          <CardDescription className="text-[var(--theme-text-secondary)]">
            Cualquier detalle adicional que pueda ser relevante
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={answers.additionalContext}
            onChange={(e) => handleAdditionalContext(e.target.value)}
            placeholder="Contexto adicional, detalles importantes, restricciones específicas..."
            className="min-h-[100px] border-[#2a3942] bg-[#1a2730] text-[#e9edef] placeholder:text-[var(--theme-text-tertiary)]"
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onRefine}
          disabled={isAnalyzing}
          className="border-[#2a3942] text-[var(--theme-text-secondary)] hover:bg-[#1a2730]"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Analizando...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Re-analizar contexto
            </>
          )}
        </Button>
        <Button
          onClick={onProceed}
          disabled={!canProceed || isAnalyzing}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {assessment.recommendedAction === 'proceed' ? (
            <>
              Iniciar debate
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          ) : (
            <>
              Continuar de todas formas
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {/* Recommendation message */}
      {assessment.recommendedAction !== 'proceed' && (
        <p className="text-center text-sm text-[var(--theme-text-secondary)]">
          {assessment.recommendedAction === 'clarify' && (
            <>
              <AlertCircle className="mr-1 inline h-4 w-4 text-yellow-400" />
              Recomendamos responder las preguntas críticas para mejores resultados
            </>
          )}
          {assessment.recommendedAction === 'refine' && (
            <>
              <AlertCircle className="mr-1 inline h-4 w-4 text-orange-400" />
              El contexto es limitado. Considera añadir más detalles
            </>
          )}
        </p>
      )}
    </div>
  );
}

// Sub-component for Assumption Cards
function AssumptionCard({
  assumption,
  response,
  onResponse,
}: {
  assumption: ContextAssumption;
  response: boolean | undefined;
  onResponse: (confirmed: boolean) => void;
}) {
  return (
    <div className="rounded-lg border border-[#2a3942] bg-[#1a2730] p-4">
      <p className="mb-3 text-sm text-[#e9edef]">
        "{assumption.assumption}"
      </p>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={response === true ? 'default' : 'outline'}
          onClick={() => onResponse(true)}
          className={
            response === true
              ? 'bg-green-600 hover:bg-green-700'
              : 'border-[#2a3942] text-[var(--theme-text-secondary)] hover:bg-[#2a3942]'
          }
        >
          <CheckCircle className="mr-1 h-3 w-3" />
          Correcto
        </Button>
        <Button
          size="sm"
          variant={response === false ? 'default' : 'outline'}
          onClick={() => onResponse(false)}
          className={
            response === false
              ? 'bg-red-600 hover:bg-red-700'
              : 'border-[#2a3942] text-[var(--theme-text-secondary)] hover:bg-[#2a3942]'
          }
        >
          <AlertCircle className="mr-1 h-3 w-3" />
          Incorrecto
        </Button>
      </div>
      {response === false && assumption.alternatives && assumption.alternatives.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-[var(--theme-text-secondary)]">¿Cuál aplica mejor?</p>
          <RadioGroup className="gap-2">
            {assumption.alternatives.map((alt, i) => (
              <div key={i} className="flex items-center space-x-2">
                <RadioGroupItem value={alt} id={`${assumption.id}-alt-${i}`} />
                <Label
                  htmlFor={`${assumption.id}-alt-${i}`}
                  className="text-sm text-[var(--theme-text-secondary)]"
                >
                  {alt}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )}
    </div>
  );
}

// Sub-component for Question Cards
function QuestionCard({
  question,
  response,
  onResponse,
}: {
  question: ClarifyingQuestion;
  response: string | string[] | undefined;
  onResponse: (response: string | string[]) => void;
}) {
  const priorityColors = {
    critical: 'border-red-500/30 bg-red-500/5',
    important: 'border-yellow-500/30 bg-yellow-500/5',
    'nice-to-have': 'border-gray-500/30',
  };

  const priorityBadge = {
    critical: { text: 'Crítica', color: 'bg-red-500/20 text-red-400' },
    important: { text: 'Importante', color: 'bg-yellow-500/20 text-yellow-400' },
    'nice-to-have': { text: 'Opcional', color: 'bg-gray-500/20 text-[var(--theme-text-secondary)]' },
  };

  return (
    <div className={`rounded-lg border p-4 ${priorityColors[question.priority]}`}>
      <div className="mb-3 flex items-start justify-between">
        <p className="text-sm text-[#e9edef]">{question.question}</p>
        <Badge className={priorityBadge[question.priority].color}>
          {priorityBadge[question.priority].text}
        </Badge>
      </div>

      {question.multipleChoice ? (
        <RadioGroup
          value={typeof response === 'string' ? response : undefined}
          onValueChange={(value) => onResponse(value)}
          className="gap-2"
        >
          {question.multipleChoice.options.map((option, i) => (
            <div key={i} className="flex items-center space-x-2">
              <RadioGroupItem value={option} id={`${question.id}-opt-${i}`} />
              <Label
                htmlFor={`${question.id}-opt-${i}`}
                className="text-sm text-[var(--theme-text-secondary)]"
              >
                {option}
              </Label>
            </div>
          ))}
        </RadioGroup>
      ) : (
        <Textarea
          value={typeof response === 'string' ? response : ''}
          onChange={(e) => onResponse(e.target.value)}
          placeholder="Tu respuesta..."
          className="min-h-[80px] border-[#2a3942] bg-[#1a2730] text-[#e9edef] placeholder:text-[var(--theme-text-tertiary)]"
        />
      )}
    </div>
  );
}
