/**
 * PowerPoint Export for Debates
 * 
 * Genera presentación PowerPoint automática con los resultados del debate.
 */

import type { DebateResult } from '../types'
import type { ExpertProfile } from '../expert-database'
import type { PDFExportOptions } from '../pdf-export'
import { quoorumLogger } from '../logger'

// ============================================================================
// TYPES
// ============================================================================

export interface PowerPointExportOptions extends PDFExportOptions {
  includeArgumentTree?: boolean
  includeConsensusTimeline?: boolean
  slideTheme?: 'dark' | 'light'
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Genera PowerPoint desde un debate
 * 
 * Note: This uses a simple approach that generates HTML/CSS that can be converted to PPTX
 * For production, consider using pptxgenjs or similar library
 */
export async function generateDebatePowerPoint(
  debate: DebateResult,
  experts: ExpertProfile[],
  options: PowerPointExportOptions = {}
): Promise<Buffer> {
  quoorumLogger.info('Generating PowerPoint export', {
    debateId: debate.sessionId,
  })

  // For now, we'll generate a simple HTML representation
  // In production, use pptxgenjs:
  // import PptxGenJS from 'pptxgenjs'
  // const pptx = new PptxGenJS()
  // ... add slides ...
  // return await pptx.write({ outputType: 'nodebuffer' })

  // Temporary implementation: Generate HTML that can be converted
  const html = generatePowerPointHTML(debate, experts, options)

  // Convert HTML to buffer (for now, return as text)
  // In production, use a proper PPTX library
  return Buffer.from(html, 'utf-8')
}

// ============================================================================
// HTML GENERATION (Temporary - will be replaced with pptxgenjs)
// ============================================================================

function generatePowerPointHTML(
  debate: DebateResult,
  experts: ExpertProfile[],
  options: PowerPointExportOptions
): string {
  const theme = options.slideTheme || 'dark'
  const bgColor = theme === 'dark' ? '#0b141a' : '#ffffff'
  const textColor = theme === 'dark' ? '#ffffff' : '#1a1a1a'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Debate Report - ${debate.question}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: ${bgColor};
      color: ${textColor};
      margin: 0;
      padding: 20px;
    }
    .slide {
      page-break-after: always;
      min-height: 100vh;
      padding: 40px;
      background: ${bgColor};
    }
    h1 { font-size: 36px; margin-bottom: 20px; }
    h2 { font-size: 28px; margin-bottom: 16px; }
    h3 { font-size: 22px; margin-bottom: 12px; }
    p { font-size: 16px; line-height: 1.6; }
    .slide-title { color: #8b5cf6; }
  </style>
</head>
<body>
  <!-- Slide 1: Title -->
  <div class="slide">
    <h1 class="slide-title">Debate Report</h1>
    <h2>${escapeHtml(debate.question || 'Sin pregunta')}</h2>
    <p>Fecha: ${new Date().toLocaleDateString('es-ES')}</p>
    <p>Consenso: ${((debate.consensusScore || 0) * 100).toFixed(0)}%</p>
  </div>

  <!-- Slide 2: Executive Summary -->
  <div class="slide">
    <h2 class="slide-title">Resumen Ejecutivo</h2>
    <p><strong>Opción Recomendada:</strong> ${escapeHtml(debate.finalRanking?.[0]?.option || 'N/A')}</p>
    <p><strong>Score:</strong> ${debate.finalRanking?.[0]?.successRate?.toFixed(1) || 'N/A'}%</p>
    <p><strong>Rondas:</strong> ${debate.rounds?.length || 0}</p>
    <p><strong>Costo:</strong> $${debate.totalCostUsd?.toFixed(2) || '0.00'}</p>
  </div>

  <!-- Slide 3: Ranking -->
  <div class="slide">
    <h2 class="slide-title">Ranking de Opciones</h2>
    <ol>
      ${(debate.finalRanking || [])
        .slice(0, 5)
        .map(
          (opt, idx) =>
            `<li><strong>${opt.option}</strong> - ${opt.successRate?.toFixed(1) || 'N/A'}%</li>`
        )
        .join('')}
    </ol>
  </div>

  <!-- Slide 4-N: Key Rounds -->
  ${(debate.rounds || [])
    .slice(0, 5)
    .map(
      (round, idx) => `
  <div class="slide">
    <h2 class="slide-title">Ronda ${round.round || idx + 1}</h2>
    ${(round.messages || [])
      .slice(0, 3)
      .map(
        (msg) =>
          `<p><strong>${msg.agentName || msg.agentKey}:</strong> ${escapeHtml(
            msg.content.substring(0, 200)
          )}...</p>`
      )
      .join('')}
  </div>
  `
    )
    .join('')}
</body>
</html>
  `.trim()
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m] || m)
}
