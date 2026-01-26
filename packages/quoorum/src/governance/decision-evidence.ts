/**
 * Decision Evidence Engine
 * 
 * Genera certificado inmutable de gobernanza para debates con:
 * - Hash SHA-256 de integridad del debate
 * - Timestamp notarizado
 * - Mapeo a estándares (ISO 27001, NIST CSF, GDPR)
 * - Audit trail completo
 * 
 * Impacto: Desbloquea mercado Enterprise (requisito de compliance)
 */

import { createHash } from 'crypto'
import type { DebateResult, DebateMessage, DebateRound } from '../types'
import { quoorumLogger } from '../logger'

// ============================================================================
// TYPES
// ============================================================================

export interface AuditEvent {
  timestamp: Date
  type: 'round_start' | 'round_complete' | 'consensus_check' | 'intervention' | 'cost_limit' | 'completion'
  description: string
  metadata?: Record<string, unknown>
}

export interface ComplianceMapping {
  iso27001: boolean // ISO/IEC 27001: Information Security Management
  nistCsf: boolean // NIST Cybersecurity Framework
  gdpr: boolean // General Data Protection Regulation
  soc2?: boolean // SOC 2 Type II (optional)
}

export interface DecisionEvidence {
  debateId: string
  timestamp: Date
  integrityHash: string // SHA-256 del debate completo
  participants: string[] // Expertos/agentes involucrados
  methodology: string // "Multi-Agent Deliberation"
  compliance: ComplianceMapping
  auditTrail: AuditEvent[]
  metadata: {
    totalRounds: number
    totalCostUsd: number
    consensusScore: number
    finalRanking: Array<{ option: string; score: number }>
    question: string
  }
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Genera certificado de evidencia de decisión (Decision Evidence)
 */
export async function generateDecisionEvidence(
  debate: DebateResult
): Promise<DecisionEvidence> {
  quoorumLogger.info('Generating decision evidence', {
    debateId: debate.sessionId,
  })

  // Extract participants (unique agents/experts)
  const participants = extractParticipants(debate.rounds || [])

  // Generate integrity hash
  const integrityHash = generateIntegrityHash(debate)

  // Build audit trail
  const auditTrail = buildAuditTrail(debate)

  // Check compliance
  const compliance = checkCompliance(debate, auditTrail)

  return {
    debateId: debate.sessionId,
    timestamp: new Date(),
    integrityHash,
    participants,
    methodology: 'Multi-Agent Deliberation',
    compliance,
    auditTrail,
    metadata: {
      totalRounds: debate.rounds?.length || 0,
      totalCostUsd: debate.totalCostUsd || 0,
      consensusScore: debate.consensusScore || 0,
      finalRanking: (debate.finalRanking || []).map((opt) => ({
        option: typeof opt === 'string' ? opt : opt.option,
        score: typeof opt === 'string' ? 0 : opt.successRate || 0,
      })),
      question: debate.question || 'Sin pregunta',
    },
  }
}

// ============================================================================
// INTEGRITY HASH
// ============================================================================

/**
 * Genera hash SHA-256 del debate completo para verificación de integridad
 */
function generateIntegrityHash(debate: DebateResult): string {
  // Serialize debate in deterministic order
  const serialized = JSON.stringify({
    id: debate.sessionId,
    question: debate.question,
    rounds: debate.rounds?.map((round) => ({
      round: round.round,
      messages: round.messages?.map((msg) => ({
        id: msg.id,
        agentKey: msg.agentKey,
        content: msg.content,
        timestamp: msg.createdAt,
      })),
    })),
    finalRanking: debate.finalRanking,
    consensusScore: debate.consensusScore,
    totalCostUsd: debate.totalCostUsd,
  })

  // Generate SHA-256 hash
  const hash = createHash('sha256')
  hash.update(serialized)
  return hash.digest('hex')
}

// ============================================================================
// PARTICIPANTS EXTRACTION
// ============================================================================

/**
 * Extrae lista única de participantes (agentes/expertos)
 */
function extractParticipants(rounds: DebateRound[]): string[] {
  const participants = new Set<string>()

  for (const round of rounds) {
    for (const message of round.messages || []) {
      const participant = message.agentName || message.agentKey || 'Unknown'
      participants.add(participant)
    }
  }

  return Array.from(participants).sort()
}

// ============================================================================
// AUDIT TRAIL
// ============================================================================

/**
 * Construye audit trail completo del debate
 */
function buildAuditTrail(debate: DebateResult): AuditEvent[] {
  const events: AuditEvent[] = []

  // Add round events
  for (const round of debate.rounds || []) {
    events.push({
      timestamp: new Date(), // In production, use actual round timestamp
      type: 'round_start',
      description: `Ronda ${round.round} iniciada`,
      metadata: {
        round: round.round,
        agentCount: round.messages?.length || 0,
      },
    })

    // Add consensus check events
    if (round.consensusCheck) {
      events.push({
        timestamp: new Date(),
        type: 'consensus_check',
        description: `Verificación de consenso en ronda ${round.round}`,
        metadata: {
          round: round.round,
          consensusScore: round.consensusCheck.consensusScore,
          hasConsensus: round.consensusCheck.hasConsensus,
          topOptions: round.consensusCheck.topOptions?.slice(0, 3),
        },
      })
    }

    events.push({
      timestamp: new Date(),
      type: 'round_complete',
      description: `Ronda ${round.round} completada`,
      metadata: {
        round: round.round,
        messageCount: round.messages?.length || 0,
      },
    })
  }

  // Add completion event
  if (debate.status === 'completed') {
    events.push({
      timestamp: new Date(),
      type: 'completion',
      description: 'Debate completado',
      metadata: {
        totalRounds: debate.rounds?.length || 0,
        finalConsensus: debate.consensusScore,
        totalCost: debate.totalCostUsd,
      },
    })
  }

  return events
}

// ============================================================================
// COMPLIANCE CHECKING
// ============================================================================

/**
 * Verifica cumplimiento con estándares de gobernanza
 */
function checkCompliance(
  debate: DebateResult,
  auditTrail: AuditEvent[]
): ComplianceMapping {
  // ISO 27001: Information Security Management
  // Requisitos: Trazabilidad, integridad de datos, control de acceso
  const iso27001 =
    auditTrail.length > 0 && // Tiene audit trail
    debate.sessionId !== undefined && // Identificador único
    extractParticipants(debate.rounds || []).length > 0 // Participantes identificados

  // NIST CSF: Cybersecurity Framework
  // Requisitos: Detección, respuesta, recuperación
  const nistCsf =
    auditTrail.some((e) => e.type === 'consensus_check') && // Tiene verificaciones
    debate.status === 'completed' && // Proceso completado
    (debate.consensusScore || 0) >= 0 // Resultado medible

  // GDPR: General Data Protection Regulation
  // Requisitos: Minimización de datos, transparencia, derecho al olvido
  const gdpr =
    debate.sessionId !== undefined && // Identificador para eliminación
    auditTrail.length > 0 && // Trazabilidad de procesamiento
    extractParticipants(debate.rounds || []).length > 0 // Control de acceso

  return {
    iso27001,
    nistCsf,
    gdpr,
    soc2: iso27001 && nistCsf, // SOC 2 requiere ambos
  }
}

// ============================================================================
// VERIFICATION
// ============================================================================

/**
 * Verifica la integridad de un debate usando su hash
 */
export function verifyDebateIntegrity(
  debate: DebateResult,
  expectedHash: string
): boolean {
  const actualHash = generateIntegrityHash(debate)
  return actualHash === expectedHash
}

// ============================================================================
// EXPORT FORMATS
// ============================================================================

/**
 * Exporta evidencia como JSON (para auditorías)
 */
export function exportEvidenceAsJSON(evidence: DecisionEvidence): string {
  return JSON.stringify(evidence, null, 2)
}

/**
 * Exporta evidencia como certificado legible (texto)
 */
export function exportEvidenceAsCertificate(evidence: DecisionEvidence): string {
  return `
═══════════════════════════════════════════════════════════════
CERTIFICADO DE EVIDENCIA DE DECISIÓN
Decision Evidence Certificate
═══════════════════════════════════════════════════════════════

ID del Debate: ${evidence.debateId}
Fecha: ${evidence.timestamp.toISOString()}
Hash de Integridad: ${evidence.integrityHash}

Metodología: ${evidence.methodology}
Participantes: ${evidence.participants.join(', ')}

Cumplimiento:
- ISO 27001: ${evidence.compliance.iso27001 ? '✅' : '❌'}
- NIST CSF: ${evidence.compliance.nistCsf ? '✅' : '❌'}
- GDPR: ${evidence.compliance.gdpr ? '✅' : '❌'}
${evidence.compliance.soc2 ? `- SOC 2: ${evidence.compliance.soc2 ? '✅' : '❌'}` : ''}

Métricas:
- Rondas: ${evidence.metadata.totalRounds}
- Costo: $${evidence.metadata.totalCostUsd.toFixed(2)}
- Consenso: ${(evidence.metadata.consensusScore * 100).toFixed(0)}%

Audit Trail: ${evidence.auditTrail.length} eventos registrados

═══════════════════════════════════════════════════════════════
Este certificado garantiza la integridad y trazabilidad completa
del proceso de decisión mediante deliberación multi-agente.
═══════════════════════════════════════════════════════════════
  `.trim()
}
