/**
 * Pinecone Integration
 *
 * Vector database for similarity search
 */

import { Pinecone } from '@pinecone-database/pinecone'
import OpenAI from 'openai'
import { forumLogger } from '../logger'

// ============================================================================
// CONFIGURATION
// ============================================================================

const PINECONE_API_KEY = process.env['PINECONE_API_KEY']
const PINECONE_ENVIRONMENT = process.env['PINECONE_ENVIRONMENT'] || 'us-east-1'
const PINECONE_INDEX = process.env['PINECONE_INDEX'] || 'forum-debates'

const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'],
})

let pineconeClient: Pinecone | null = null
let pineconeIndex: ReturnType<Pinecone['index']> | null = null

// ============================================================================
// INITIALIZATION
// ============================================================================

export async function initPinecone() {
  if (!PINECONE_API_KEY) {
    forumLogger.warn('PINECONE_API_KEY not set, similarity search disabled', {})
    return null
  }

  try {
    pineconeClient = new Pinecone({
      apiKey: PINECONE_API_KEY,
    })

    // Get or create index
    const indexes = await pineconeClient.listIndexes()
    const indexExists = indexes.indexes?.some((idx) => idx.name === PINECONE_INDEX) ?? false

    if (!indexExists) {
      forumLogger.info('Creating Pinecone index', { index: PINECONE_INDEX })
      await pineconeClient.createIndex({
        name: PINECONE_INDEX,
        dimension: 1536, // text-embedding-3-small
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: PINECONE_ENVIRONMENT,
          },
        },
      })
      forumLogger.info('Pinecone index created', { index: PINECONE_INDEX })
    }

    pineconeIndex = pineconeClient.index(PINECONE_INDEX)
    forumLogger.info('Pinecone initialized', { index: PINECONE_INDEX })
    return pineconeIndex
  } catch (error) {
    forumLogger.error('Failed to initialize Pinecone', error instanceof Error ? error : new Error(String(error)), {})
    return null
  }
}

// ============================================================================
// EMBEDDING GENERATION
// ============================================================================

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    })

    return response.data[0]!.embedding
  } catch (error) {
    forumLogger.error('Failed to generate embedding', error instanceof Error ? error : new Error(String(error)), {})
    throw error
  }
}

// ============================================================================
// VECTOR OPERATIONS
// ============================================================================

export async function upsertDebate(
  debateId: string,
  question: string,
  metadata: {
    userId: string
    consensusScore: number
    totalCost: number
    createdAt: Date
    topOption?: string
  }
) {
  if (!pineconeIndex) {
    await initPinecone()
    if (!pineconeIndex) return
  }

  try {
    const embedding = await generateEmbedding(question)

    await pineconeIndex.upsert([
      {
        id: debateId,
        values: embedding,
        metadata: {
          question,
          userId: metadata.userId,
          consensusScore: metadata.consensusScore,
          totalCost: metadata.totalCost,
          createdAt: metadata.createdAt.toISOString(),
          topOption: metadata.topOption || '',
        },
      },
    ])

    forumLogger.info('Upserted debate to Pinecone', { debateId })
  } catch (error) {
    forumLogger.error('Failed to upsert debate to Pinecone', error instanceof Error ? error : new Error(String(error)), { debateId })
  }
}

export async function searchSimilarDebates(
  question: string,
  options: {
    topK?: number
    userId?: string
    minConsensus?: number
  } = {}
): Promise<Array<{
  id: string
  score: number
  question: string
  consensusScore: number
  totalCost: number
  topOption?: string
}>> {
  if (!pineconeIndex) {
    await initPinecone()
    if (!pineconeIndex) return []
  }

  try {
    const embedding = await generateEmbedding(question)

    const filter: Record<string, unknown> = {}
    if (options.userId) {
      filter['userId'] = { $eq: options.userId }
    }
    if (options.minConsensus) {
      filter['consensusScore'] = { $gte: options.minConsensus }
    }

    const queryResponse = await pineconeIndex.query({
      vector: embedding,
      topK: options.topK || 5,
      includeMetadata: true,
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    })

    return queryResponse.matches
      .filter((match) => match.metadata !== undefined)
      .map((match) => {
        const metadata = match.metadata!
        return {
          id: match.id,
          score: match.score ?? 0,
          question: String(metadata['question'] ?? ''),
          consensusScore: Number(metadata['consensusScore'] ?? 0),
          totalCost: Number(metadata['totalCost'] ?? 0),
          topOption: metadata['topOption'] ? String(metadata['topOption']) : undefined,
        }
      })
  } catch (error) {
    forumLogger.error('Failed to search similar debates', error instanceof Error ? error : new Error(String(error)), { question, options })
    return []
  }
}

export async function deleteDebate(debateId: string) {
  if (!pineconeIndex) {
    await initPinecone()
    if (!pineconeIndex) return
  }

  try {
    await pineconeIndex.deleteOne(debateId)
    forumLogger.info('Deleted debate from Pinecone', { debateId })
  } catch (error) {
    forumLogger.error('Failed to delete debate from Pinecone', error instanceof Error ? error : new Error(String(error)), { debateId })
  }
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

export async function batchUpsertDebates(
  debates: Array<{
    id: string
    question: string
    userId: string
    consensusScore: number
    totalCost: number
    createdAt: Date
    topOption?: string
  }>
) {
  if (!pineconeIndex) {
    await initPinecone()
    if (!pineconeIndex) return
  }

  try {
    // Generate embeddings for all debates
    const embeddings = await Promise.all(
      debates.map(debate => generateEmbedding(debate.question))
    )

    // Prepare vectors
    const vectors = debates.map((debate, i) => ({
      id: debate.id,
      values: embeddings[i],
      metadata: {
        question: debate.question,
        userId: debate.userId,
        consensusScore: debate.consensusScore,
        totalCost: debate.totalCost,
        createdAt: debate.createdAt.toISOString(),
        topOption: debate.topOption || '',
      },
    }))

    // Batch upsert (max 100 at a time)
    const batchSize = 100
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize)
      await pineconeIndex.upsert(batch)
    }

    forumLogger.info('Batch upserted debates to Pinecone', { count: debates.length })
  } catch (error) {
    forumLogger.error('Failed to batch upsert debates to Pinecone', error instanceof Error ? error : new Error(String(error)), { count: debates.length })
  }
}

export async function deleteUserDebates(userId: string) {
  if (!pineconeIndex) {
    await initPinecone()
    if (!pineconeIndex) return
  }

  try {
    await pineconeIndex.deleteMany({
      filter: { userId: { $eq: userId } },
    })
    forumLogger.info('Deleted all user debates from Pinecone', { userId })
  } catch (error) {
    forumLogger.error('Failed to delete user debates from Pinecone', error instanceof Error ? error : new Error(String(error)), { userId })
  }
}

// ============================================================================
// ANALYTICS
// ============================================================================

export async function getIndexStats() {
  if (!pineconeIndex) {
    await initPinecone()
    if (!pineconeIndex) return null
  }

  try {
    const stats = await pineconeIndex.describeIndexStats()
    return {
      totalVectors: stats.totalRecordCount,
      dimension: stats.dimension,
      indexFullness: stats.indexFullness,
    }
  } catch (error) {
    forumLogger.error('Failed to get Pinecone index stats', error instanceof Error ? error : new Error(String(error)), {})
    return null
  }
}

// ============================================================================
// MIGRATION
// ============================================================================

export async function migrateExistingDebates(
  debates: Array<{
    id: string
    question: string
    userId: string
    consensusScore: number
    totalCost: number
    createdAt: Date
    topOption?: string
  }>
) {
  forumLogger.info('Starting Pinecone migration', { count: debates.length })

  await batchUpsertDebates(debates)

  const stats = await getIndexStats()
  forumLogger.info('Pinecone migration complete', { stats, count: debates.length })
}
