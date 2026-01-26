/**
 * Advanced Export System
 * 
 * Unified export interface for debates (PDF, PowerPoint, Excel, Markdown, JSON)
 */

import { generateDebatePDF } from '../pdf-export'
import { generateDebateMarkdown } from '../pdf-export'
import { generateDebatePowerPoint } from './powerpoint-export'
import { generateDebateExcel } from './excel-export'
import type { DebateResult } from '../types'
import type { ExpertProfile } from '../expert-database'
import type { PDFExportOptions } from '../pdf-export'
import type { PowerPointExportOptions } from './powerpoint-export'
import type { ExcelExportOptions } from './excel-export'
import { quoorumLogger } from '../logger'

// ============================================================================
// TYPES
// ============================================================================

export type ExportFormat = 'pdf' | 'markdown' | 'powerpoint' | 'excel' | 'json'

export interface ExportOptions extends PDFExportOptions {
  format: ExportFormat
  includeArgumentTree?: boolean
  includeConsensusTimeline?: boolean
  slideTheme?: 'dark' | 'light'
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Exporta un debate en el formato especificado
 */
export async function exportDebate(
  debate: DebateResult,
  experts: ExpertProfile[],
  options: ExportOptions
): Promise<{ content: Buffer | string; mimeType: string; filename: string }> {
  quoorumLogger.info('Exporting debate', {
    debateId: debate.sessionId,
    format: options.format,
  })

  try {
    switch (options.format) {
      case 'pdf': {
        const buffer = await generateDebatePDF(debate, experts, {
          includeMetadata: options.includeMetadata,
          includeQualityMetrics: options.includeQualityMetrics,
          includeFullTranscript: options.includeFullTranscript,
          brandingColor: options.brandingColor,
          logo: options.logo,
        })
        return {
          content: buffer,
          mimeType: 'application/pdf',
          filename: `debate-${debate.sessionId}.pdf`,
        }
      }

      case 'markdown': {
        const markdown = generateDebateMarkdown(debate, experts)
        return {
          content: markdown,
          mimeType: 'text/markdown',
          filename: `debate-${debate.sessionId}.md`,
        }
      }

      case 'powerpoint': {
        const buffer = await generateDebatePowerPoint(debate, experts, {
          includeMetadata: options.includeMetadata,
          includeFullTranscript: options.includeFullTranscript,
          includeArgumentTree: options.includeArgumentTree,
          includeConsensusTimeline: options.includeConsensusTimeline,
          slideTheme: options.slideTheme,
        })
        return {
          content: buffer,
          mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          filename: `debate-${debate.sessionId}.pptx`,
        }
      }

      case 'excel': {
        const buffer = await generateDebateExcel(debate, experts, {
          includeMetadata: options.includeMetadata,
          includeFullTranscript: options.includeFullTranscript,
          includeArgumentTree: options.includeArgumentTree,
        })
        return {
          content: buffer,
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          filename: `debate-${debate.sessionId}.xlsx`,
        }
      }

      case 'json': {
        const json = JSON.stringify(debate, null, 2)
        return {
          content: json,
          mimeType: 'application/json',
          filename: `debate-${debate.sessionId}.json`,
        }
      }

      default:
        throw new Error(`Unsupported format: ${options.format}`)
    }
  } catch (error) {
    quoorumLogger.error(
      'Failed to export debate',
      error instanceof Error ? error : new Error(String(error)),
      {
        debateId: debate.sessionId,
        format: options.format,
      }
    )
    throw error
  }
}
