/**
 * Excel/CSV Data Extractor
 *
 * Extracts structured data from Excel and CSV files
 */

import * as XLSX from 'xlsx'
import { logger } from './logger'

/**
 * Extract data from Excel/CSV file as formatted text
 * @param buffer - File buffer
 * @returns Formatted text representation of the data
 */
export async function extractExcelData(buffer: ArrayBuffer): Promise<string> {
  try {
    // Read workbook from buffer
    const workbook = XLSX.read(buffer, { type: 'array' })

    const textParts: string[] = []

    // Process each sheet
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName]

      if (!worksheet) continue

      // Convert to CSV for easier text parsing
      const csv = XLSX.utils.sheet_to_csv(worksheet)

      if (csv.trim()) {
        textParts.push(`\n--- Hoja: ${sheetName} ---\n${csv}`)
      }
    }

    return textParts.join('\n\n')
  } catch (error) {
    logger.error('Error extracting Excel data:', error instanceof Error ? error : undefined)
    throw new Error(`Failed to extract Excel: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Extract data as JSON structure (alternative format)
 */
export function extractExcelDataAsJson(buffer: ArrayBuffer): Record<string, any[]> {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const result: Record<string, any[]> = {}

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName]
    if (worksheet) {
      result[sheetName] = XLSX.utils.sheet_to_json(worksheet)
    }
  }

  return result
}

/**
 * Check if buffer is a valid Excel file
 */
export function isExcelBuffer(buffer: ArrayBuffer): boolean {
  try {
    // Try to read as workbook - will throw if invalid
    XLSX.read(buffer, { type: 'array' })
    return true
  } catch {
    return false
  }
}
