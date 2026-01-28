/**
 * PDF Text Extractor
 *
 * Extracts text content from PDF files using pdfjs-dist
 */

import { logger } from './logger'

// Dynamic import for pdfjs-dist (ESM compatible)
let pdfjsLib: typeof import('pdfjs-dist') | null = null

async function getPdfjs() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist')

    // Configure worker - use fake worker for Node.js
    // @ts-expect-error - pdfjs types are complex
    pdfjsLib.GlobalWorkerOptions.workerSrc = ''
  }
  return pdfjsLib
}

/**
 * Extract text from PDF file
 * @param buffer - PDF file as ArrayBuffer
 * @returns Extracted text content
 */
export async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  try {
    const pdfjs = await getPdfjs()

    // Load PDF document with disableWorker for Node.js compatibility
    const loadingTask = pdfjs.getDocument({
      data: buffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    })
    const pdf = await loadingTask.promise

    const textParts: string[] = []

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()

      // Combine text items from page
      const pageText = textContent.items
        .filter((item): item is import('pdfjs-dist').TextItem => 'str' in item && typeof (item as any).str === 'string')
        .map((item) => (item as any).str)
        .join(' ')

      if (pageText.trim()) {
        textParts.push(`\n--- Page ${pageNum} ---\n${pageText}`)
      }
    }

    return textParts.join('\n\n')
  } catch (error) {
    logger.error('Error extracting PDF text:', error instanceof Error ? error : undefined)
    throw new Error(`Failed to extract PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Check if buffer is a valid PDF
 */
export function isPdfBuffer(buffer: ArrayBuffer): boolean {
  const arr = new Uint8Array(buffer)
  // PDF magic number: %PDF
  return arr.length > 4 &&
    arr[0] === 0x25 && // %
    arr[1] === 0x50 && // P
    arr[2] === 0x44 && // D
    arr[3] === 0x46    // F
}
