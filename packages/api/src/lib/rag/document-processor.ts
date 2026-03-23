/**
 * Document Processor
 *
 * Utilities for processing documents before chunking.
 * Includes text extraction, cleaning, and metadata extraction.
 */

export interface ProcessedDocument {
  /** Cleaned text content */
  content: string

  /** Original raw content */
  rawContent: string

  /** Document metadata */
  metadata: DocumentMetadata
}

export interface DocumentMetadata {
  /** File name */
  fileName: string

  /** File type */
  fileType: string

  /** File size in bytes */
  fileSize: number

  /** Total character count */
  charCount: number

  /** Estimated token count */
  tokenCount: number

  /** Total line count */
  lineCount: number

  /** Total paragraph count */
  paragraphCount: number

  /** Custom metadata per file type */
  custom?: Record<string, unknown>
}

/**
 * Process document text
 *
 * Cleans and normalizes text for better chunking and embedding.
 */
export function processDocument(
  rawContent: string,
  fileName: string,
  fileType: string,
  fileSize: number
): ProcessedDocument {
  // Clean text
  let content = rawContent

  // Normalize line endings
  content = content.replace(/\r\n/g, '\n')

  // Remove excessive whitespace
  content = content.replace(/[ \t]+/g, ' ') // Multiple spaces to single space
  content = content.replace(/\n{3,}/g, '\n\n') // Multiple newlines to double newline

  // Trim each line
  content = content
    .split('\n')
    .map((line) => line.trim())
    .join('\n')

  // Remove leading/trailing whitespace
  content = content.trim()

  // Extract metadata
  const metadata: DocumentMetadata = {
    fileName,
    fileType,
    fileSize,
    charCount: content.length,
    tokenCount: estimateTokens(content),
    lineCount: content.split('\n').length,
    paragraphCount: content.split(/\n\n+/).filter((p) => p.trim()).length,
  }

  return {
    content,
    rawContent,
    metadata,
  }
}

/**
 * Extract metadata specific to file type
 */
export function extractFileTypeMetadata(
  content: string,
  fileType: string
): Record<string, unknown> {
  switch (fileType.toLowerCase()) {
    case 'pdf':
      return extractPDFMetadata(content)

    case 'md':
    case 'markdown':
      return extractMarkdownMetadata(content)

    case 'txt':
    case 'text':
      return extractTextMetadata(content)

    default:
      return {}
  }
}

/**
 * Extract PDF-specific metadata
 */
function extractPDFMetadata(content: string): Record<string, unknown> {
  // Estimate page count (rough: 3000 chars per page)
  const estimatedPages = Math.ceil(content.length / 3000)

  return {
    estimatedPages,
    hasTables: /\|.*\|.*\|/.test(content), // Simple table detection
    hasLists: /^\s*[-*]\s+/m.test(content), // Bullet list detection
  }
}

/**
 * Extract Markdown-specific metadata
 */
function extractMarkdownMetadata(content: string): Record<string, unknown> {
  // Count headers
  const headers = content.match(/^#{1,6}\s+.+$/gm) || []

  // Extract header hierarchy
  const headerLevels = headers.map((h) => {
    const level = h.match(/^(#{1,6})/)?.[1]?.length || 0
    const title = h.replace(/^#{1,6}\s+/, '').trim()
    return { level, title }
  })

  // Count code blocks
  const codeBlocks = (content.match(/```[\s\S]*?```/g) || []).length

  // Count links
  const links = (content.match(/\[.+?\]\(.+?\)/g) || []).length

  // Count images
  const images = (content.match(/!\[.+?\]\(.+?\)/g) || []).length

  return {
    headerCount: headers.length,
    headerLevels,
    codeBlockCount: codeBlocks,
    linkCount: links,
    imageCount: images,
  }
}

/**
 * Extract plain text metadata
 */
function extractTextMetadata(content: string): Record<string, unknown> {
  // Detect structure
  const hasNumberedLists = /^\s*\d+\.\s+/m.test(content)
  const hasBulletLists = /^\s*[-*]\s+/m.test(content)

  // Estimate reading time (200 words per minute)
  const wordCount = content.split(/\s+/).filter((w) => w.length > 0).length
  const readingTimeMinutes = Math.ceil(wordCount / 200)

  return {
    wordCount,
    readingTimeMinutes,
    hasNumberedLists,
    hasBulletLists,
  }
}

/**
 * Estimate token count from text
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Clean text for embedding
 *
 * Removes noise that doesn't add semantic value.
 */
export function cleanTextForEmbedding(text: string): string {
  let cleaned = text

  // Remove URLs
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, '')

  // Remove email addresses
  cleaned = cleaned.replace(/[\w.-]+@[\w.-]+\.\w+/g, '')

  // Remove excessive punctuation
  cleaned = cleaned.replace(/[!?]{2,}/g, '!')
  cleaned = cleaned.replace(/\.{3,}/g, '...')

  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ')
  cleaned = cleaned.trim()

  return cleaned
}

/**
 * Detect language (simple heuristic)
 */
export function detectLanguage(text: string): string {
  const sample = text.slice(0, 1000).toLowerCase()

  // Spanish indicators
  const spanishWords = ['el', 'la', 'de', 'que', 'y', 'en', 'un', 'por', 'para', 'con']
  const spanishCount = spanishWords.filter((word) =>
    new RegExp(`\\b${word}\\b`, 'i').test(sample)
  ).length

  // English indicators
  const englishWords = ['the', 'and', 'of', 'to', 'a', 'in', 'for', 'is', 'on', 'that']
  const englishCount = englishWords.filter((word) =>
    new RegExp(`\\b${word}\\b`, 'i').test(sample)
  ).length

  if (spanishCount > englishCount) {
    return 'es'
  } else if (englishCount > spanishCount) {
    return 'en'
  }

  return 'unknown'
}

/**
 * Split document into sections
 *
 * Useful for preserving document structure in chunks.
 */
export function splitIntoSections(content: string): Array<{ title: string; content: string }> {
  const sections: Array<{ title: string; content: string }> = []

  // Try to detect section headers (markdown-style)
  const headerRegex = /^#{1,3}\s+(.+)$/gm
  let lastIndex = 0
  let match

  while ((match = headerRegex.exec(content)) !== null) {
    const title = match[1]!.trim()
    const headerStart = match.index

    if (lastIndex > 0) {
      // Add previous section
      const sectionContent = content.slice(lastIndex, headerStart).trim()
      if (sectionContent) {
        sections.push({
          title: sections[sections.length - 1]?.title || 'Introduction',
          content: sectionContent,
        })
      }
    }

    lastIndex = headerStart + match[0].length
  }

  // Add final section
  if (lastIndex < content.length) {
    const sectionContent = content.slice(lastIndex).trim()
    if (sectionContent) {
      sections.push({
        title: sections.length > 0 ? sections[sections.length - 1]!.title : 'Main Content',
        content: sectionContent,
      })
    }
  }

  // If no sections found, return entire content as one section
  if (sections.length === 0) {
    sections.push({
      title: 'Document',
      content: content.trim(),
    })
  }

  return sections
}
