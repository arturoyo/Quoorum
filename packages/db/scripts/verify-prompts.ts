import { db } from '../src'
import { sql } from 'drizzle-orm'

async function verifyPrompts() {
  console.log('🔍 Verificando prompts en la base de datos...\n')

  const result = await db.execute(sql`
    SELECT key, name, phase, category, recommended_model, is_active
    FROM system_prompts
    WHERE phase IS NOT NULL
    ORDER BY phase, order_in_phase, name
  `)

  console.log(`📊 Total de prompts con fase asignada: ${result.length}\n`)

  const byPhase: Record<number, any[]> = {}
  result.forEach((p: any) => {
    if (!byPhase[p.phase]) byPhase[p.phase] = []
    byPhase[p.phase].push(p)
  })

  Object.keys(byPhase).sort().forEach((phase) => {
    console.log(`\n📌 Fase ${phase}: ${byPhase[phase as any].length} prompts`)
    byPhase[phase as any].forEach((p: any) => {
      const status = p.is_active ? '✓' : '✗'
      console.log(`  ${status} ${p.key.padEnd(30)} | ${p.category.padEnd(12)} | ${p.recommended_model || 'N/A'}`)
    })
  })

  console.log('\n✅ Verificación completada!')
  process.exit(0)
}

verifyPrompts().catch((error) => {
  console.error('❌ Error:', error)
  process.exit(1)
})
