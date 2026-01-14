#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Forum CLI Tool
 *
 * Quick bonus: Command-line interface for forum operations
 * Uses console.log for CLI output - this is intentional
 * console.error is migrated to quoorumLogger for consistency
 */

import { runDebate } from './index'
import { EXPERT_DATABASE } from './expert-database'
import { generateDebatePDF as _generateDebatePDF } from './pdf-export'
import type { DebateResult as _DebateResult } from './types'
import { quoorumLogger } from './quoorum-logger'
void _generateDebatePDF
void (0 as unknown as _DebateResult)

// ============================================================================
// CLI COMMANDS
// ============================================================================

async function createDebate(question: string, mode: 'static' | 'dynamic' = 'dynamic') {
  console.log(`\n🎯 Creating debate: ${question}`)
  console.log(`Mode: ${mode}\n`)

  try {
    // Note: mode is not used directly - the runner auto-detects mode
    void mode // Mode parameter is available but runner auto-detects
    const result = await runDebate({
      sessionId: `cli-${Date.now()}`,
      question,
      context: { sources: [], combinedContext: '' },
    })

    console.log('\n✅ Debate completed!')
    console.log(`Consensus: ${(result.consensusScore * 100).toFixed(0)}%`)
    console.log(`Rounds: ${result.rounds?.length || 0}`)
    console.log(`Cost: $${result.totalCostUsd?.toFixed(3) || 0}`)

    if (result.ranking && result.ranking.length > 0) {
      console.log('\n📊 Top Recommendations:')
      result.ranking.slice(0, 3).forEach((option, i) => {
        console.log(`  ${i + 1}. ${option.option} (${option.successRate.toFixed(1)}%)`)
      })
    }

    return result
  } catch (error) {
    quoorumLogger.error(
      'Error creating debate',
      error instanceof Error ? error : new Error(String(error)),
      { question, mode }
    )
    process.exit(1)
  }
}

function listExperts(): void {
  console.log('\n👥 Available Experts:\n')

  const categories: Record<string, (typeof EXPERT_DATABASE)[string][]> = {}

  Object.values(EXPERT_DATABASE).forEach((expert) => {
    const category = expert.expertise[0] || 'Other'
    if (!categories[category]) {
      categories[category] = []
    }
    categories[category].push(expert)
  })

  Object.entries(categories).forEach(([category, experts]) => {
    console.log(`\n${category}:`)
    experts.forEach((expert) => {
      console.log(`  • ${expert.name} - ${expert.title}`)
    })
  })

  console.log(`\nTotal: ${Object.keys(EXPERT_DATABASE).length} experts\n`)
}

function exportDebate(debateId: string, format: 'pdf' | 'json' | 'md' = 'pdf'): void {
  const formatStr = typeof format === 'string' ? format : 'pdf'
  console.log(`\n📄 Exporting debate ${debateId} as ${formatStr}...\n`)

  // In a real implementation, would fetch debate from DB
  console.log('⚠️  This is a demo. In production, would fetch debate from database.')
  console.log('✅ Export would be saved to: ./exports/debate-' + debateId + '.' + format)
}

function analyzeDebate(debateId: string): void {
  console.log(`\n📊 Analyzing debate ${debateId}...\n`)

  // In a real implementation, would fetch and analyze debate
  console.log('⚠️  This is a demo. In production, would analyze debate from database.')
  console.log('\nAnalysis would include:')
  console.log('  • Consensus score')
  console.log('  • Expert contributions')
  console.log('  • Quality metrics')
  console.log('  • Cost breakdown')
  console.log('  • Key insights')
}

async function benchmarkExperts() {
  console.log('\n⚡ Benchmarking experts...\n')

  const testQuestions = [
    'Should we pivot to B2B?',
    'What pricing model should we use?',
    'How do we improve retention?',
  ]

  console.log('Running test debates...')

  for (const question of testQuestions) {
    console.log(`\n  Testing: ${question}`)
    const start = Date.now()

    try {
      await runDebate({
        sessionId: `benchmark-${Date.now()}`,
        question,
        context: { sources: [], combinedContext: '' },
      })

      const duration = Date.now() - start
      console.log(`  ✅ Completed in ${(duration / 1000).toFixed(1)}s`)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.log(`  ❌ Failed: ${errorMsg}`)
    }
  }

  console.log('\n✅ Benchmark complete!\n')
}

function cleanupOldDebates(days: number = 30): void {
  console.log(`\n🧹 Cleaning up debates older than ${days} days...\n`)

  // In a real implementation, would delete old debates from DB
  console.log('⚠️  This is a demo. In production, would delete from database.')
  console.log(
    '✅ Would delete debates older than ' +
      new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  )
}

function migrateData(): void {
  console.log('\n🔄 Running data migration...\n')

  console.log('⚠️  This is a demo. In production, would run actual migrations.')
  console.log('Steps:')
  console.log('  1. Backup existing data')
  console.log('  2. Run schema migrations')
  console.log('  3. Migrate debate data')
  console.log('  4. Verify data integrity')
  console.log('  5. Update indexes')
  console.log('\n✅ Migration would be complete!')
}

// ============================================================================
// CLI PARSER
// ============================================================================

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printHelp()
    return
  }

  switch (command) {
    case 'create':
    case 'debate': {
      const question = args.slice(1).join(' ')
      if (!question) {
        quoorumLogger.error('Please provide a question', undefined, { command: 'create' })
        console.log('Usage: forum create "Your question here"')
        process.exit(1)
      }
      await createDebate(question)
      break
    }

    case 'list':
    case 'experts': {
      listExperts()
      break
    }

    case 'export': {
      const exportDebateId = args[1]
      const format = (args[2] as 'pdf' | 'json' | 'md') || 'pdf'
      if (!exportDebateId) {
        quoorumLogger.error('Please provide a debate ID', undefined, { command: 'export' })
        console.log('Usage: forum export <debate-id> [format]')
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        process.exit(1)
      }
      exportDebate(exportDebateId, format)
      break
    }

    case 'analyze': {
      const analyzeDebateId = args[1]
      if (!analyzeDebateId) {
        quoorumLogger.error('Please provide a debate ID', undefined, { command: 'analyze' })
        console.log('Usage: forum analyze <debate-id>')
        process.exit(1)
      }
      analyzeDebate(analyzeDebateId)
      break
    }

    case 'benchmark': {
      await benchmarkExperts()
      break
    }

    case 'cleanup': {
      const days = parseInt(args[1] || '30') || 30
      cleanupOldDebates(days)
      break
    }

    case 'migrate': {
      migrateData()
      break
    }

    default: {
      quoorumLogger.error('Unknown command', undefined, { command })
      console.log('Run "forum help" to see available commands')
      process.exit(1)
    }
  }
}

function printHelp() {
  console.log(`
🎯 Forum CLI - Command-line interface for Quoorum Dynamic System

USAGE:
  forum <command> [options]

COMMANDS:
  create <question>        Create and run a new debate
  list                     List all available experts
  export <id> [format]     Export debate (pdf, json, md)
  analyze <id>             Analyze debate results
  benchmark                Benchmark expert performance
  cleanup [days]           Clean up old debates (default: 30 days)
  migrate                  Run data migrations
  help                     Show this help message

EXAMPLES:
  forum create "Should we pivot to B2B?"
  forum list
  forum export abc123 pdf
  forum analyze abc123
  forum benchmark
  forum cleanup 60
  forum migrate

OPTIONS:
  -h, --help               Show help
  -v, --version            Show version

For more information, visit: https://github.com/arturoyo/Wallie
  `)
}

// ============================================================================
// RUN CLI
// ============================================================================

if (require.main === module) {
  main().catch((error) => {
    quoorumLogger.error(
      'Fatal error in CLI',
      error instanceof Error ? error : new Error(String(error))
    )
    process.exit(1)
  })
}

export { main as runCLI }
