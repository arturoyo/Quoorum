/**
 * Question Similarity - Find similar past debates
 *
 * Uses embeddings to find semantically similar questions
 * and recommend relevant past debates.
 */

import { forumLogger } from './forum-logger'

export interface SimilarDebate {
  id: string
  question: string
  similarity: number // 0-1
  outcome: string
  quality: number
  consensus: number
  createdAt: Date
}

/**
 * Find similar debates to a given question
 */
export async function findSimilarDebates(
  question: string,
  _limit: number = 5,
  _minSimilarity: number = 0.7
): Promise<SimilarDebate[]> {
  try {
    // Generate embedding for the question
    const embedding = await generateQuestionEmbedding(question)

    if (embedding.length === 0) {
      return []
    }

    // Use Pinecone integration
    try {
      const { searchSimilarDebates } = await import('./integrations/pinecone')
      const results = await searchSimilarDebates(question, { topK: _limit })

      return results
        .filter((r) => r.score >= _minSimilarity)
        .map((r) => ({
          id: r.id,
          question: r.question,
          similarity: r.score,
          outcome: r.topOption || 'No outcome',
          quality: r.consensusScore,
          consensus: r.consensusScore,
          createdAt: new Date(),
        }))
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      forumLogger.warn('Pinecone not available, returning empty array')
      return []
    }
  } catch (error) {
    forumLogger.error(
      'Error finding similar debates',
      error instanceof Error ? error : new Error(String(error))
    )
    return []
  }
}

/**
 * Generate embedding for a question
 */
export async function generateQuestionEmbedding(question: string): Promise<number[]> {
  try {
    // Use OpenAI embeddings API
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env['OPENAI_API_KEY']}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: question,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = (await response.json()) as {
      data: Array<{ embedding: number[] }>
    }
    return data.data[0]?.embedding ?? []
  } catch (error) {
    forumLogger.error(
      'Error generating embedding',
      error instanceof Error ? error : new Error(String(error))
    )
    // Return empty array as fallback
    return []
  }
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i]! * b[i]!
    normA += a[i]! * a[i]!
    normB += b[i]! * b[i]!
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Extract key topics from a question
 */
export function extractTopics(question: string): string[] {
  // Simple keyword extraction
  // In production, would use NLP

  const keywords = [
    'pricing',
    'price',
    'cost',
    'positioning',
    'market',
    'competition',
    'product',
    'feature',
    'roadmap',
    'growth',
    'marketing',
    'acquisition',
    'sales',
    'revenue',
    'conversion',
  ]

  const lowerQuestion = question.toLowerCase()
  return keywords.filter((kw) => lowerQuestion.includes(kw))
}

/**
 * Recommend debates based on similar questions
 */
export async function recommendDebates(
  question: string,
  limit: number = 3
): Promise<SimilarDebate[]> {
  const similar = await findSimilarDebates(question, limit * 2, 0.6)

  // Sort by quality and similarity
  return similar
    .sort((a, b) => {
      const scoreA = a.similarity * 0.7 + a.quality * 0.3
      const scoreB = b.similarity * 0.7 + b.quality * 0.3
      return scoreB - scoreA
    })
    .slice(0, limit)
}
