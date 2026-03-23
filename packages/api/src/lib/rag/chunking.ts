/**
 * Document Chunking Strategies
 *
 * Intelligent document splitting for RAG embeddings.
 * Supports recursive, semantic, and fixed-size chunking.
 */

export interface ChunkOptions {
  /** Chunking strategy */
  strategy: 'recursive' | 'semantic' | 'fixed'

  /** Target chunk size in characters */
  chunkSize: number

  /** Overlap between chunks in characters */
  chunkOverlap: number

  /** Separators to use for splitting (for recursive strategy) */
  separators?: string[]

  /** Minimum chunk size (discard smaller chunks) */
  minChunkSize?: number
}

export interface Chunk {
  /** Chunk content */
  content: string

  /** Index in the original document */
  index: number

  /** Metadata extracted from chunk */
  metadata: ChunkMetadata
}

export interface ChunkMetadata {
  /** Start position in original document */
  startPos: number

  /** End position in original document */
  endPos: number

  /** Estimated token count */
  tokenCount: number

  /** Length in characters */
  charCount: number

  /** Whether this chunk has overlap with previous chunk */
  hasOverlap: boolean

  /** Custom metadata (page numbers, section titles, etc.) */
  custom?: Record<string, unknown>
}

/**
 * Chunk a document using the specified strategy
 */
export async function chunkDocument(
  content: string,
  options: ChunkOptions
): Promise<Chunk[]> {
  // Validate options
  if (options.chunkSize <= 0) {
    throw new Error('chunkSize must be positive')
  }

  if (options.chunkOverlap < 0) {
    throw new Error('chunkOverlap cannot be negative')
  }

  if (options.chunkOverlap >= options.chunkSize) {
    throw new Error('chunkOverlap must be less than chunkSize')
  }

  // Select strategy
  switch (options.strategy) {
    case 'recursive':
      return recursiveChunking(content, options)

    case 'semantic':
      return semanticChunking(content, options)

    case 'fixed':
      return fixedChunking(content, options)

    default:
      throw new Error(`Unknown chunking strategy: ${options.strategy}`)
  }
}

/**
 * Recursive Chunking
 *
 * Tries to split by paragraphs first, then sentences, then words.
 * Preserves natural document structure.
 */
function recursiveChunking(content: string, options: ChunkOptions): Chunk[] {
  const separators = options.separators || [
    '\n\n\n', // Multiple blank lines (sections)
    '\n\n', // Double newline (paragraphs)
    '\n', // Single newline
    '. ', // Sentence end
    '! ', // Exclamation
    '? ', // Question
    '; ', // Semicolon
    ', ', // Comma
    ' ', // Space (words)
  ]

  return recursiveSplit(content, separators, options, 0)
}

function recursiveSplit(
  text: string,
  separators: string[],
  options: ChunkOptions,
  startPos: number
): Chunk[] {
  if (text.length <= options.chunkSize) {
    // Text fits in one chunk
    return [
      {
        content: text,
        index: 0,
        metadata: {
          startPos,
          endPos: startPos + text.length,
          tokenCount: estimateTokens(text),
          charCount: text.length,
          hasOverlap: false,
        },
      },
    ]
  }

  // Try to split with current separator
  const separator = separators[0]
  if (!separator) {
    // No more separators, use fixed chunking
    return fixedChunking(text, {
      ...options,
      strategy: 'fixed',
    })
  }

  const splits = text.split(separator)
  const chunks: Chunk[] = []
  let currentChunk = ''
  let currentStartPos = startPos

  for (let i = 0; i < splits.length; i++) {
    const split = splits[i]!
    const testChunk = currentChunk + (currentChunk ? separator : '') + split

    if (testChunk.length <= options.chunkSize) {
      // Add to current chunk
      currentChunk = testChunk
    } else {
      // Current chunk is full
      if (currentChunk) {
        chunks.push({
          content: currentChunk,
          index: chunks.length,
          metadata: {
            startPos: currentStartPos,
            endPos: currentStartPos + currentChunk.length,
            tokenCount: estimateTokens(currentChunk),
            charCount: currentChunk.length,
            hasOverlap: chunks.length > 0 && options.chunkOverlap > 0,
          },
        })

        // Start new chunk with overlap
        if (options.chunkOverlap > 0) {
          const overlapText = currentChunk.slice(-options.chunkOverlap)
          currentChunk = overlapText + separator + split
          currentStartPos += currentChunk.length - overlapText.length - separator.length
        } else {
          currentChunk = split
          currentStartPos += currentChunk.length
        }
      } else {
        // Split is too large, try next separator
        const subChunks = recursiveSplit(split, separators.slice(1), options, currentStartPos)
        chunks.push(...subChunks)
        currentStartPos += split.length + separator.length
        currentChunk = ''
      }
    }
  }

  // Add final chunk
  if (currentChunk) {
    chunks.push({
      content: currentChunk,
      index: chunks.length,
      metadata: {
        startPos: currentStartPos,
        endPos: currentStartPos + currentChunk.length,
        tokenCount: estimateTokens(currentChunk),
        charCount: currentChunk.length,
        hasOverlap: chunks.length > 0 && options.chunkOverlap > 0,
      },
    })
  }

  return chunks
}

/**
 * Semantic Chunking
 *
 * Splits documents while preserving semantic meaning.
 * Uses sentence boundaries and tries to keep related content together.
 */
function semanticChunking(content: string, options: ChunkOptions): Chunk[] {
  // Split into sentences
  const sentences = splitIntoSentences(content)
  const chunks: Chunk[] = []
  let currentChunk = ''
  let currentSentences: string[] = []
  let currentStartPos = 0

  for (const sentence of sentences) {
    const testChunk = currentChunk + (currentChunk ? ' ' : '') + sentence

    if (testChunk.length <= options.chunkSize) {
      // Add sentence to current chunk
      currentChunk = testChunk
      currentSentences.push(sentence)
    } else {
      // Create chunk from accumulated sentences
      if (currentChunk) {
        chunks.push({
          content: currentChunk,
          index: chunks.length,
          metadata: {
            startPos: currentStartPos,
            endPos: currentStartPos + currentChunk.length,
            tokenCount: estimateTokens(currentChunk),
            charCount: currentChunk.length,
            hasOverlap: chunks.length > 0 && options.chunkOverlap > 0,
            custom: {
              sentenceCount: currentSentences.length,
            },
          },
        })

        // Start new chunk with overlap (keep last N sentences)
        if (options.chunkOverlap > 0) {
          const overlapSentences = findOverlapSentences(currentSentences, options.chunkOverlap)
          currentChunk = overlapSentences.join(' ') + ' ' + sentence
          currentSentences = [...overlapSentences, sentence]
          currentStartPos += currentChunk.length - overlapSentences.join(' ').length - 1
        } else {
          currentChunk = sentence
          currentSentences = [sentence]
          currentStartPos += currentChunk.length
        }
      } else {
        // Single sentence is too long, split it with fixed chunking
        const sentenceChunks = fixedChunking(sentence, options)
        chunks.push(...sentenceChunks)
        currentChunk = ''
        currentSentences = []
        currentStartPos += sentence.length
      }
    }
  }

  // Add final chunk
  if (currentChunk) {
    chunks.push({
      content: currentChunk,
      index: chunks.length,
      metadata: {
        startPos: currentStartPos,
        endPos: currentStartPos + currentChunk.length,
        tokenCount: estimateTokens(currentChunk),
        charCount: currentChunk.length,
        hasOverlap: chunks.length > 0 && options.chunkOverlap > 0,
        custom: {
          sentenceCount: currentSentences.length,
        },
      },
    })
  }

  return chunks
}

/**
 * Fixed-Size Chunking
 *
 * Simple strategy that splits text into fixed-size chunks with overlap.
 */
function fixedChunking(content: string, options: ChunkOptions): Chunk[] {
  const chunks: Chunk[] = []
  let startPos = 0
  let index = 0

  while (startPos < content.length) {
    const endPos = Math.min(startPos + options.chunkSize, content.length)
    const chunkContent = content.slice(startPos, endPos)

    chunks.push({
      content: chunkContent,
      index,
      metadata: {
        startPos,
        endPos,
        tokenCount: estimateTokens(chunkContent),
        charCount: chunkContent.length,
        hasOverlap: index > 0 && options.chunkOverlap > 0,
      },
    })

    startPos += options.chunkSize - options.chunkOverlap
    index++
  }

  return chunks
}

/**
 * Split text into sentences
 */
function splitIntoSentences(text: string): string[] {
  // Simple sentence splitting (can be improved with NLP)
  const sentenceEndings = /([.!?]+)\s+/g
  const sentences: string[] = []
  let lastIndex = 0

  text.replace(sentenceEndings, (match, _p1, offset) => {
    const sentence = text.slice(lastIndex, offset + match.length).trim()
    if (sentence) {
      sentences.push(sentence)
    }
    lastIndex = offset + match.length
    return match
  })

  // Add remaining text
  if (lastIndex < text.length) {
    const lastSentence = text.slice(lastIndex).trim()
    if (lastSentence) {
      sentences.push(lastSentence)
    }
  }

  return sentences
}

/**
 * Find sentences for overlap based on character count
 */
function findOverlapSentences(sentences: string[], overlapSize: number): string[] {
  const overlap: string[] = []
  let currentSize = 0

  for (let i = sentences.length - 1; i >= 0; i--) {
    const sentence = sentences[i]!
    if (currentSize + sentence.length <= overlapSize) {
      overlap.unshift(sentence)
      currentSize += sentence.length + 1 // +1 for space
    } else {
      break
    }
  }

  return overlap
}

/**
 * Estimate token count from text
 * Rough estimate: 1 token ≈ 4 characters
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Filter chunks by minimum size
 */
export function filterChunks(chunks: Chunk[], minSize: number): Chunk[] {
  return chunks.filter((chunk) => chunk.content.length >= minSize)
}

/**
 * Merge small adjacent chunks
 */
export function mergeSmallChunks(chunks: Chunk[], minSize: number, maxSize: number): Chunk[] {
  const merged: Chunk[] = []
  let currentChunk: Chunk | null = null

  for (const chunk of chunks) {
    if (!currentChunk) {
      currentChunk = { ...chunk }
      continue
    }

    if (
      currentChunk.content.length < minSize &&
      currentChunk.content.length + chunk.content.length <= maxSize
    ) {
      // Merge with current chunk
      currentChunk.content += ' ' + chunk.content
      currentChunk.metadata.endPos = chunk.metadata.endPos
      currentChunk.metadata.charCount = currentChunk.content.length
      currentChunk.metadata.tokenCount = estimateTokens(currentChunk.content)
    } else {
      // Push current chunk and start new one
      merged.push(currentChunk)
      currentChunk = { ...chunk, index: merged.length }
    }
  }

  if (currentChunk) {
    merged.push(currentChunk)
  }

  return merged
}
