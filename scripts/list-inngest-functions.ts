/**
 * List all Inngest functions registered
 */

import { quoorumFunctions } from '../packages/workers/src/index'

console.log('📋 Inngest Functions Registered:\n')
console.log(`Total: ${quoorumFunctions.length} functions\n`)

quoorumFunctions.forEach((fn, index) => {
  const config = (fn as any).getConfig?.() || {}
  console.log(`${index + 1}. ${config.name || 'Unknown'}`)
  console.log(`   ID: ${config.id || 'N/A'}`)

  if (config.triggers) {
    config.triggers.forEach((trigger: any) => {
      if (trigger.cron) {
        console.log(`   Trigger: Cron (${trigger.cron})`)
      } else if (trigger.event) {
        console.log(`   Trigger: Event (${trigger.event})`)
      }
    })
  }
  console.log()
})
