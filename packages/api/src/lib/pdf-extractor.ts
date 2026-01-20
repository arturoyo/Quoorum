/**
 * PDF Text Extractor
 *
 * Extracts text content from PDF files using pdf-parse
 */

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js'

// Configure worker source for pdfjs
if (typeof window === 'undefined') {
  // Node.js environment - use legacy build
  const workerSrc = require('pdfjs-dist/legacy/build/pdf.worker.entry.js')
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc
}

/**
 * Extract text from PDF file
 * @param buffer - PDF file as ArrayBuffer
 * @returns Extracted text content
 */
export async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  try {
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: buffer })
    const pdf = await loadingTask.promise

    const textParts: string[] = []

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()

      // Combine text items from page
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')

      if (pageText.trim()) {
        textParts.push(`\n--- Página ${pageNum} ---\n${pageText}`)
      }
    }

    return textParts.join('\n\n')
  } catch (error) {
    console.error('Error extracting PDF text:', error)
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
