/**
 * Trigger Manual del Auto-Healer
 *
 * Ejecuta: pnpm tsx scripts/trigger-auto-healer.ts
 */

import { inngest } from '../packages/workers/src/client'

async function triggerAutoHealer() {
  console.log('🔧 Triggering Auto-Healer manually...\n')

  try {
    const result = await inngest.send({
      name: 'nextjs/auto-healer.trigger',
      data: {
        triggeredBy: 'manual-script',
        timestamp: new Date().toISOString(),
      },
    })

    console.log('✅ Auto-Healer triggered successfully!')
    console.log('Event IDs:', result.ids)
    console.log('\n📊 The worker will now:')
    console.log('  1. Run TypeScript typecheck')
    console.log('  2. Run ESLint')
    console.log('  3. Detect and classify errors')
    console.log('  4. Apply safe auto-fixes')
    console.log('  5. Log results to TIMELINE.md')
    console.log('\n⏳ Check Inngest dashboard or logs for execution details')
  } catch (error) {
    console.error('❌ Error triggering Auto-Healer:', error)
    process.exit(1)
  }
}

triggerAutoHealer()
