import type { ExpertProfile } from './expert-database'
import { quoorumLogger } from './quoorum-logger'
import type { QualityAnalysis } from './quality-monitor'
import type { DebateResult } from './types'

export interface PDFExportOptions {
  includeMetadata?: boolean
  includeQualityMetrics?: boolean
  includeFullTranscript?: boolean
  brandingColor?: string
  logo?: string
}

/**
 * Generate PDF export of debate
 * This is a server-side function that generates a PDF buffer
 */
export async function generateDebatePDF(
  debate: DebateResult,
  experts: ExpertProfile[],
  options: PDFExportOptions = {},
  qualityAnalysis?: QualityAnalysis
): Promise<Buffer> {
  // Destructure options for default values (used in generateDebateHTML)
  const _defaults = {
    includeMetadata: options.includeMetadata ?? true,
    includeQualityMetrics: options.includeQualityMetrics ?? true,
    includeFullTranscript: options.includeFullTranscript ?? true,
    brandingColor: options.brandingColor ?? '#00a884',
    logo: options.logo,
  }
  void _defaults // Options are passed to generateDebateHTML

  // Generate HTML content
  const html = generateDebateHTML(debate, experts, options, qualityAnalysis)

  // Convert HTML to PDF using a library (puppeteer, html-pdf, etc.)
  // For now, we'll use a simple approach with html-pdf-node or similar
  const pdf = await htmlToPDF(html)

  return pdf
}

function generateDebateHTML(
  debate: DebateResult,
  experts: ExpertProfile[],
  options: PDFExportOptions,
  qualityAnalysis?: QualityAnalysis
): string {
  const { brandingColor = '#00a884', logo } = options

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Forum Debate Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background: #ffffff;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }

    .header {
      border-bottom: 3px solid ${brandingColor};
      padding-bottom: 20px;
      margin-bottom: 40px;
    }

    .logo {
      max-width: 150px;
      margin-bottom: 20px;
    }

    h1 {
      font-size: 32px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 10px;
    }

    .subtitle {
      font-size: 16px;
      color: #666;
    }

    .metadata {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 30px;
    }

    .metadata-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }

    .metadata-item {
      display: flex;
      flex-direction: column;
    }

    .metadata-label {
      font-size: 12px;
      text-transform: uppercase;
      color: #666;
      font-weight: 600;
      margin-bottom: 5px;
    }

    .metadata-value {
      font-size: 16px;
      color: #1a1a1a;
      font-weight: 500;
    }

    .section {
      margin-bottom: 40px;
    }

    .section-title {
      font-size: 24px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e0e0e0;
    }

    .experts-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }

    .expert-card {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 15px;
      border-left: 4px solid ${brandingColor};
    }

    .expert-name {
      font-size: 16px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 5px;
    }

    .expert-role {
      font-size: 14px;
      color: #666;
    }

    .quality-metrics {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }

    .metric-card {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }

    .metric-value {
      font-size: 32px;
      font-weight: 700;
      color: ${brandingColor};
      margin-bottom: 5px;
    }

    .metric-label {
      font-size: 12px;
      text-transform: uppercase;
      color: #666;
      font-weight: 600;
    }

    .ranking {
      margin-bottom: 30px;
    }

    .ranking-item {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .ranking-number {
      font-size: 32px;
      font-weight: 700;
      color: ${brandingColor};
      min-width: 50px;
    }

    .ranking-content {
      flex: 1;
    }

    .ranking-option {
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 5px;
    }

    .ranking-score {
      font-size: 14px;
      color: #666;
    }

    .ranking-reasoning {
      font-size: 14px;
      color: #444;
      margin-top: 10px;
      line-height: 1.5;
    }

    .transcript {
      margin-bottom: 30px;
    }

    .round {
      margin-bottom: 30px;
    }

    .round-header {
      background: ${brandingColor};
      color: white;
      padding: 10px 20px;
      border-radius: 8px 8px 0 0;
      font-size: 16px;
      font-weight: 600;
    }

    .round-content {
      background: #f8f9fa;
      border-radius: 0 0 8px 8px;
      padding: 20px;
    }

    .message {
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 1px solid #e0e0e0;
    }

    .message:last-child {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }

    .message-author {
      font-size: 14px;
      font-weight: 600;
      color: ${brandingColor};
      margin-bottom: 8px;
    }

    .message-content {
      font-size: 14px;
      color: #444;
      line-height: 1.6;
      white-space: pre-wrap;
    }

    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 2px solid #e0e0e0;
      text-align: center;
      color: #666;
      font-size: 12px;
    }

    .page-break {
      page-break-after: always;
    }

    @media print {
      .container {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      ${logo ? `<img src="${logo}" alt="Logo" class="logo" />` : ''}
      <h1>Forum Debate Report</h1>
      <p class="subtitle">Sistema Dinámico de Expertos</p>
    </div>

    <!-- Question -->
    <div class="section">
      <h2 class="section-title">Pregunta</h2>
      <p style="font-size: 18px; color: #1a1a1a; line-height: 1.6;">${escapeHtml(debate.question || '')}</p>
    </div>

    <!-- Metadata -->
    ${
      options.includeMetadata
        ? `
    <div class="metadata">
      <div class="metadata-grid">
        <div class="metadata-item">
          <div class="metadata-label">Fecha</div>
          <div class="metadata-value">${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
        <div class="metadata-item">
          <div class="metadata-label">Rondas</div>
          <div class="metadata-value">${debate.rounds?.length || 0}</div>
        </div>
        <div class="metadata-item">
          <div class="metadata-label">Expertos</div>
          <div class="metadata-value">${experts.length}</div>
        </div>
        <div class="metadata-item">
          <div class="metadata-label">Consenso</div>
          <div class="metadata-value">${(debate.consensusScore * 100).toFixed(0)}%</div>
        </div>
      </div>
    </div>
    `
        : ''
    }

    <!-- Experts -->
    <div class="section">
      <h2 class="section-title">Expertos Participantes</h2>
      <div class="experts-grid">
        ${experts
          .map(
            (expert) => `
          <div class="expert-card">
            <div class="expert-name">${escapeHtml(expert.name)}</div>
            <div class="expert-role">${escapeHtml(expert.role || expert.title)}</div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>

    <!-- Quality Metrics -->
    ${
      options.includeQualityMetrics && qualityAnalysis
        ? `
    <div class="section">
      <h2 class="section-title">Métricas de Calidad</h2>
      <div class="quality-metrics">
        <div class="metric-card">
          <div class="metric-value">${qualityAnalysis.depthScore.toFixed(0)}</div>
          <div class="metric-label">Profundidad</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${qualityAnalysis.diversityScore.toFixed(0)}</div>
          <div class="metric-label">Diversidad</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${qualityAnalysis.originalityScore.toFixed(0)}</div>
          <div class="metric-label">Originalidad</div>
        </div>
      </div>
    </div>
    `
        : ''
    }

    <div class="page-break"></div>

    <!-- Ranking -->
    <div class="section">
      <h2 class="section-title">Ranking de Opciones</h2>
      <div class="ranking">
        ${debate.ranking
          ?.map(
            (option, index) => `
          <div class="ranking-item">
            <div class="ranking-number">#${index + 1}</div>
            <div class="ranking-content">
              <div class="ranking-option">${escapeHtml(option.option)}</div>
              <div class="ranking-score">Score: ${(option.score || option.successRate).toFixed(1)} | Confianza: ${(option.confidence * 100).toFixed(0)}%</div>
              ${option.reasoning ? `<div class="ranking-reasoning">${escapeHtml(option.reasoning)}</div>` : ''}
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>

    <!-- Transcript -->
    ${
      options.includeFullTranscript
        ? `
    <div class="page-break"></div>
    <div class="section transcript">
      <h2 class="section-title">Transcripción Completa</h2>
      ${debate.rounds
        ?.map(
          (round, roundIndex) => `
        <div class="round">
          <div class="round-header">Ronda ${roundIndex + 1}</div>
          <div class="round-content">
            ${round.messages
              ?.map(
                (message) => `
              <div class="message">
                <div class="message-author">${escapeHtml(message.agentName || '')}</div>
                <div class="message-content">${escapeHtml(message.content)}</div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      `
        )
        .join('')}
    </div>
    `
        : ''
    }

    <!-- Footer -->
    <div class="footer">
      <p>Generado por Forum - Sistema Dinámico de Expertos</p>
      <p>${new Date().toLocaleString('es-ES')}</p>
    </div>
  </div>
</body>
</html>
  `
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

async function htmlToPDF(html: string): Promise<Buffer> {
  try {
    // Try to use puppeteer if available
    const puppeteer = await import('puppeteer').catch(() => null)

    if (puppeteer) {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      })

      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: 'networkidle0' })

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
      })

      await browser.close()

      return Buffer.from(pdf)
    }

    // Fallback: try html-pdf-node
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Dynamic import with type assertion for optional dependency
    const htmlPdfModule = await import('html-pdf-node' as unknown as string).catch(() => null)

    if (htmlPdfModule) {
      const htmlPdf = htmlPdfModule as {
        generatePdf: (
          file: { content: string },
          options: { format: string; printBackground: boolean }
        ) => Promise<Buffer>
      }
      const file = { content: html }
      const options = { format: 'A4', printBackground: true }
      const pdfBuffer = await htmlPdf.generatePdf(file, options)
      return pdfBuffer
    }

    // Last resort: return HTML as buffer (client can convert)
    quoorumLogger.warn('No PDF library available, returning HTML')
    return Buffer.from(html, 'utf-8')
  } catch (error) {
    quoorumLogger.error(
      'Failed to generate PDF',
      error instanceof Error ? error : new Error(String(error))
    )
    // Return HTML as fallback
    return Buffer.from(html, 'utf-8')
  }
}

/**
 * Generate Markdown export of debate
 */
export function generateDebateMarkdown(
  debate: DebateResult,
  experts: ExpertProfile[],
  qualityAnalysis?: QualityAnalysis
): string {
  let md = `# Forum Debate Report\n\n`

  // Question
  md += `## Pregunta\n\n${debate.question || ''}\n\n`

  // Metadata
  md += `## Metadata\n\n`
  md += `- **Fecha:** ${new Date().toLocaleDateString('es-ES')}\n`
  md += `- **Rondas:** ${debate.rounds?.length || 0}\n`
  md += `- **Expertos:** ${experts.length}\n`
  md += `- **Consenso:** ${(debate.consensusScore * 100).toFixed(0)}%\n\n`

  // Experts
  md += `## Expertos Participantes\n\n`
  experts.forEach((expert) => {
    md += `- **${expert.name}** - ${expert.role || expert.title}\n`
  })
  md += `\n`

  // Quality Metrics
  if (qualityAnalysis) {
    md += `## Métricas de Calidad\n\n`
    md += `- **Profundidad:** ${qualityAnalysis.depthScore.toFixed(0)}/100\n`
    md += `- **Diversidad:** ${qualityAnalysis.diversityScore.toFixed(0)}/100\n`
    md += `- **Originalidad:** ${qualityAnalysis.originalityScore.toFixed(0)}/100\n\n`
  }

  // Ranking
  md += `## Ranking de Opciones\n\n`
  debate.ranking?.forEach((option, index) => {
    md += `### #${index + 1} ${option.option}\n\n`
    md += `- **Score:** ${(option.score || option.successRate).toFixed(1)}\n`
    md += `- **Confianza:** ${(option.confidence * 100).toFixed(0)}%\n`
    if (option.reasoning) {
      md += `- **Razonamiento:** ${option.reasoning}\n`
    }
    md += `\n`
  })

  // Transcript
  md += `## Transcripción Completa\n\n`
  debate.rounds?.forEach((round, roundIndex) => {
    md += `### Ronda ${roundIndex + 1}\n\n`
    round.messages?.forEach((message) => {
      md += `**${message.agentName}:**\n\n${message.content}\n\n---\n\n`
    })
  })

  return md
}
