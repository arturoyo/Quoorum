/**
 * AI Debate Prompts - Prompt templates for debate execution
 */

import type { SubDebate, DebateContext, DebaterPersona, DebateResponse } from './ai-debate-types'

// ============================================================================
// SYSTEM PROMPTS
// ============================================================================

export const DEBATE_SYSTEM_PROMPT = `Eres un experto en toma de decisiones estratégicas para startups y empresas.
Tu rol es analizar decisiones desde una perspectiva específica y proporcionar argumentos claros.
Responde SIEMPRE en español. Sé conciso pero profundo. Usa bullet points cuando sea apropiado.
No uses frases vacías - cada punto debe aportar valor concreto.`

export const SYNTHESIS_SYSTEM_PROMPT = 'Eres un sintetizador experto. Responde SOLO con JSON válido.'

export const DEVILS_ADVOCATE_SYSTEM = `Eres un consultor senior que ha visto cientos de startups fracasar.
Tu trabajo es prevenir errores costosos siendo brutalmente honesto.`

export const PRE_MORTEM_SYSTEM = 'Eres un analista de fracasos empresariales. Has estudiado cientos de post-mortems de startups.'

export const GUT_CHECK_SYSTEM = 'Eres un mentor experimentado. Respuestas cortas y directas.'

// ============================================================================
// DEBATE PROMPTS
// ============================================================================

export function buildDebatePrompt(
  debate: SubDebate, context: DebateContext, persona: DebaterPersona
): string {
  const previousContext = context.previousDebates?.length
    ? `\n\nDebates anteriores:\n${context.previousDebates.map(d =>
        `- "${d.question}": ${d.topOption}`).join('\n')}`
    : ''

  const companyInfo = context.companyContext
    ? `\n\nContexto de la empresa:\n${context.companyContext}` : ''

  return `
PREGUNTA ORIGINAL: ${context.originalQuestion}

SUB-PREGUNTA A ANALIZAR: ${debate.question}
${companyInfo}${previousContext}

TU PERSPECTIVA: ${persona.name} - ${persona.perspective}
TU ESTILO: ${persona.style}

Analiza esta sub-pregunta desde tu perspectiva. Proporciona:
1. Tu posición clara (a favor, en contra, o con matices)
2. 3-5 argumentos principales
3. Evidencia o razonamiento que soporta cada argumento
4. Riesgos o consideraciones importantes
5. Tu recomendación final

Sé específico y actionable. Evita generalidades.
`.trim()
}

export function buildSynthesisPrompt(
  debate: SubDebate, responses: DebateResponse[], context: DebateContext
): string {
  const debateResponses = responses.map(r =>
    `### ${r.persona.name} (${r.persona.role}):\n${r.response}`
  ).join('\n\n')

  return `
PREGUNTA ORIGINAL: ${context.originalQuestion}
SUB-PREGUNTA DEBATIDA: ${debate.question}

## PERSPECTIVAS DEL DEBATE:

${debateResponses}

## TU TAREA:
Sintetiza las diferentes perspectivas y genera:
1. CONCLUSIÓN: Una recomendación clara y actionable (2-3 oraciones)
2. CONSENSO: Puntos en los que todos coinciden
3. DISENSO: Puntos de desacuerdo y por qué importan
4. CONFIANZA: Del 0-100, qué tan segura es esta conclusión
5. SIGUIENTE PASO: Una acción concreta inmediata

Formato tu respuesta como JSON:
{
  "conclusion": "...",
  "consensus": ["punto 1", "punto 2"],
  "dissent": ["punto 1", "punto 2"],
  "confidence": 75,
  "nextStep": "..."
}
`.trim()
}

// ============================================================================
// SPECIAL MODE PROMPTS (Dynamic + Fallback)
// ============================================================================

// Hardcoded fallback template for Devil's Advocate
const DEVILS_ADVOCATE_FALLBACK = `PREGUNTA: \${question}

LA PREFERENCIA DEL USUARIO ES: "\${userPreference}"

TU MISIÓN: Ser el Abogado del Diablo. Argumenta ACTIVAMENTE en contra de la preferencia del usuario.
No seas condescendiente - busca genuinamente los problemas, riesgos y razones por las que esta podría ser una mala decisión.

\${companyContext}

Proporciona:
1. 3-5 razones fuertes por las que "\${userPreference}" podría ser un ERROR
2. Escenarios específicos donde esta decisión podría fallar
3. Qué estarían pensando las personas que NO están de acuerdo
4. El "elephant in the room" - lo que nadie quiere decir pero es verdad
5. Una alternativa que el usuario probablemente no ha considerado

Sé brutalmente honesto pero constructivo.`;

export async function buildDevilsAdvocatePrompt(
  question: string,
  userPreference: string,
  context: DebateContext,
  performanceLevel: 'economic' | 'balanced' | 'performance' = 'balanced'
): Promise<string> {
  try {
    const { getPromptTemplate } = await import('../lib/prompt-manager');
    const resolvedPrompt = await getPromptTemplate(
      'special-mode-devils-advocate',
      {
        question,
        userPreference,
        companyContext: context.companyContext ? `CONTEXTO: ${context.companyContext}` : '',
      },
      performanceLevel
    );
    return resolvedPrompt.template;
  } catch {
    // Fallback to hardcoded template
    return DEVILS_ADVOCATE_FALLBACK
      .replace(/\${question}/g, question)
      .replace(/\${userPreference}/g, userPreference)
      .replace(/\${companyContext}/g, context.companyContext ? `CONTEXTO: ${context.companyContext}` : '')
      .trim();
  }
}

// Hardcoded fallback template for Pre-Mortem
const PRE_MORTEM_FALLBACK = `DECISIÓN A ANALIZAR: \${question}

\${companyContext}

EJERCICIO PRE-MORTEM:
Imagina que estamos en 12 meses en el futuro. Esta decisión se tomó y FUE UN FRACASO TOTAL.
La empresa perdió dinero, tiempo, y oportunidades.

Tu tarea es hacer ingeniería inversa del fracaso:

1. CAUSA DE MUERTE: ¿Cuál fue LA razón principal del fracaso?
2. SEÑALES IGNORADAS: ¿Qué red flags existían hoy que ignoramos?
3. TIMELINE DEL FRACASO: Mes a mes, ¿cómo se deterioró la situación?
4. RESPONSABLES: ¿Quién debería haber actuado diferente y cómo?
5. COSTE REAL: ¿Cuánto costó este error (dinero, tiempo, moral, oportunidad)?
6. ALTERNATIVA: ¿Qué deberíamos haber hecho en su lugar?
7. PREVENCIÓN: ¿Qué podemos hacer HOY para evitar este futuro?

Sé específico y realista. Usa números cuando sea posible.`;

export async function buildPreMortemPrompt(
  question: string,
  context: DebateContext,
  performanceLevel: 'economic' | 'balanced' | 'performance' = 'balanced'
): Promise<string> {
  try {
    const { getPromptTemplate } = await import('../lib/prompt-manager');
    const resolvedPrompt = await getPromptTemplate(
      'special-mode-pre-mortem',
      {
        question,
        companyContext: context.companyContext ? `CONTEXTO: ${context.companyContext}` : '',
      },
      performanceLevel
    );
    return resolvedPrompt.template;
  } catch {
    // Fallback to hardcoded template
    return PRE_MORTEM_FALLBACK
      .replace(/\${question}/g, question)
      .replace(/\${companyContext}/g, context.companyContext ? `CONTEXTO: ${context.companyContext}` : '')
      .trim();
  }
}

// Hardcoded fallback template for Gut Check
const GUT_CHECK_FALLBACK = `PREGUNTA: \${question}

RESPONDE EN MÁXIMO 3 ORACIONES:
1. ¿Cuál es tu instinto inicial? (SÍ/NO/DEPENDE)
2. ¿Por qué en una frase?
3. ¿Qué es lo ÚNICO que necesitas saber para estar seguro?

Sé directo. Sin rodeos. Como un mentor que tiene 30 segundos.`;

export async function buildGutCheckPrompt(
  question: string,
  performanceLevel: 'economic' | 'balanced' | 'performance' = 'balanced'
): Promise<string> {
  try {
    const { getPromptTemplate } = await import('../lib/prompt-manager');
    const resolvedPrompt = await getPromptTemplate(
      'special-mode-gut-check',
      { question },
      performanceLevel
    );
    return resolvedPrompt.template;
  } catch {
    // Fallback to hardcoded template
    return GUT_CHECK_FALLBACK.replace(/\${question}/g, question).trim();
  }
}
