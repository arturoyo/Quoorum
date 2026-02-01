/**
 * Excel/CSV Data Extractor
 *
 * Extracts structured data from Excel and CSV files
 *
 * NOTE: xlsx module is not currently installed.
 * To enable Excel extraction, run: pnpm add xlsx
 */

import { logger } from './logger'

/**
 * Extract data from Excel/CSV file as formatted text
 * @param buffer - File buffer
 * @returns Formatted text representation of the data
 */
export async function extractExcelData(buffer: ArrayBuffer): Promise<string> {
  logger.warn('Excel extraction is not available. Install xlsx with: pnpm add xlsx')
  throw new Error('Excel extraction is not available. Install xlsx with: pnpm add xlsx')
}

/**
 * Extract data as JSON structure (alternative format)
 */
export function extractExcelDataAsJson(buffer: ArrayBuffer): Record<string, any[]> {
  logger.warn('Excel extraction is not available. Install xlsx with: pnpm add xlsx')
  throw new Error('Excel extraction is not available. Install xlsx with: pnpm add xlsx')
}

/**
 * Check if buffer is a valid Excel file
 */
export function isExcelBuffer(buffer: ArrayBuffer): boolean {
  // Without xlsx, we cannot validate
  return false
}
