/**
 * Excel Export for Debates
 * 
 * Genera archivo Excel con los resultados del debate en formato estructurado.
 */

import type { DebateResult } from '../types'
import type { ExpertProfile } from '../expert-database'
import type { PDFExportOptions } from '../pdf-export'
import { quoorumLogger } from '../logger'

// ============================================================================
// TYPES
// ============================================================================

export interface ExcelExportOptions extends PDFExportOptions {
  includeFullTranscript?: boolean
  includeArgumentTree?: boolean
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Genera Excel desde un debate
 * 
 * Note: This generates CSV format (Excel-compatible)
 * For production, consider using ExcelJS for proper .xlsx files
 */
export async function generateDebateExcel(
  debate: DebateResult,
  experts: ExpertProfile[],
  options: ExcelExportOptions = {}
): Promise<Buffer> {
  quoorumLogger.info('Generating Excel export', {
    debateId: debate.sessionId,
  })

  // Generate CSV format (Excel-compatible)
  // In production, use ExcelJS:
  // import ExcelJS from 'exceljs'
  // const workbook = new ExcelJS.Workbook()
  // ... add worksheets ...
  // return await workbook.xlsx.writeBuffer()

  const csv = generateExcelCSV(debate, experts, options)
  return Buffer.from(csv, 'utf-8')
}

// ============================================================================
// CSV GENERATION (Temporary - will be replaced with ExcelJS)
// ============================================================================

function generateExcelCSV(
  debate: DebateResult,
  experts: ExpertProfile[],
  options: ExcelExportOptions
): string {
  const lines: string[] = []

  // Sheet 1: Summary
  lines.push('=== RESUMEN ===')
  lines.push('Pregunta,' + escapeCSV(debate.question || 'Sin pregunta'))
  lines.push('Consenso,' + ((debate.consensusScore || 0) * 100).toFixed(0) + '%')
  lines.push('Rondas,' + (debate.rounds?.length || 0))
  lines.push('Costo USD,' + (debate.totalCostUsd?.toFixed(2) || '0.00'))
  lines.push('')

  // Sheet 2: Ranking
  lines.push('=== RANKING DE OPCIONES ===')
  lines.push('Posición,Opción,Score,Confianza,Razonamiento')
  for (let i = 0; i < (debate.finalRanking?.length || 0); i++) {
    const opt = debate.finalRanking![i]!
    lines.push(
      `${i + 1},${escapeCSV(opt.option)},${opt.successRate?.toFixed(1) || 'N/A'},${((opt.confidence || 0) * 100).toFixed(0)}%,${escapeCSV(opt.reasoning || '')}`
    )
  }
  lines.push('')

  // Sheet 3: Transcript (if requested)
  if (options.includeFullTranscript) {
    lines.push('=== TRANSCRIPCIÓN ===')
    lines.push('Ronda,Experto,Mensaje')
    for (const round of debate.rounds || []) {
      for (const message of round.messages || []) {
        lines.push(
          `${round.round || 0},${escapeCSV(message.agentName || message.agentKey || 'Unknown')},${escapeCSV(message.content)}`
        )
      }
    }
  }

  return lines.join('\n')
}

function escapeCSV(text: string): string {
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}
