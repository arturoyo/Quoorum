/**
 * Seed Buyer Personas for Market Simulator Testing
 * Using direct PostgreSQL connection to avoid module resolution issues
 */

import postgres from 'postgres'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
config({ path: join(__dirname, '../../../.env.local') })

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('[ERROR] DATABASE_URL not found in environment')
  process.exit(1)
}

const sql = postgres(DATABASE_URL)

const BUYER_PERSONAS = [
  {
    slug: 'cfo-fintech',
    name: 'CFO Fintech',
    title: 'Chief Financial Officer en empresa Fintech de crecimiento',
    description: 'Director financiero responsable de eficiencia operacional, compliance y optimización de costes en empresa fintech de 100-500 empleados.',
    category: 'Finance',
    specialization: 'Fintech Operations',
    psychographics: {
      jobsToBeDone: [
        'Reducir tiempo dedicado a decisiones estratégicas',
        'Mejorar ROI de consultoras externas',
        'Implementar procesos de decisión data-driven',
        'Asegurar compliance sin ralentizar operaciones',
      ],
      motivations: [
        'Eficiencia operacional',
        'Control de costes',
        'Reducción de riesgo',
        'Toma de decisiones basada en datos',
      ],
      barriers: [
        'Falta de tiempo para análisis profundos',
        'Desconfianza en soluciones "black box"',
        'Necesidad de aprobación del board',
        'Preocupación por coste de cambio',
      ],
    },
  },
  {
    slug: 'product-manager-saas',
    name: 'Product Manager SaaS',
    title: 'Head of Product en startup SaaS B2B',
    description: 'Product Manager senior liderando roadmap y estrategia de producto en startup SaaS de rápido crecimiento.',
    category: 'Product',
    specialization: 'B2B SaaS',
    psychographics: {
      jobsToBeDone: [
        'Validar features antes de desarrollo',
        'Priorizar roadmap con datos cualitativos',
        'Reducir tiempo de discovery',
        'Mejorar product-market fit',
      ],
      motivations: [
        'Velocidad de iteración',
        'User feedback cualitativo',
        'Reducción de features fallidas',
        'Data-driven decisions',
      ],
      barriers: [
        'User research es lento y caro',
        'Difícil obtener feedback de calidad',
        'Presión por lanzar rápido',
        'Recursos limitados para testing',
      ],
    },
  },
  {
    slug: 'ceo-startup',
    name: 'CEO Startup',
    title: 'CEO & Founder de startup tecnológica',
    description: 'Fundador/CEO de startup en etapa seed/Series A, responsable de todas las decisiones estratégicas.',
    category: 'Leadership',
    specialization: 'Startup Operations',
    psychographics: {
      jobsToBeDone: [
        'Tomar decisiones estratégicas rápido',
        'Evitar paralysis by analysis',
        'Maximizar uso de tiempo limitado',
        'Reducir dependencia de consultoras',
      ],
      motivations: [
        'Velocidad de ejecución',
        'Autonomía en decisiones',
        'Eficiencia de recursos',
        'Growth acelerado',
      ],
      barriers: [
        'Falta de tiempo para análisis',
        'Recursos limitados',
        'Falta de expertise en todas las áreas',
        'Presión de inversores',
      ],
    },
  },
  {
    slug: 'marketing-director-enterprise',
    name: 'Marketing Director Enterprise',
    title: 'Director de Marketing en empresa enterprise B2B',
    description: 'Líder de marketing en empresa enterprise, responsable de branding, demand generation y messaging.',
    category: 'Marketing',
    specialization: 'Enterprise B2B',
    psychographics: {
      jobsToBeDone: [
        'Validar messaging antes de campañas',
        'Optimizar conversion rates',
        'Reducir CAC',
        'Mejorar targeting de audiencias',
      ],
      motivations: [
        'ROI de campañas',
        'Precisión en targeting',
        'Reducción de waste en ad spend',
        'Data-driven messaging',
      ],
      barriers: [
        'A/B testing es lento',
        'Focus groups son caros',
        'Difícil predecir performance',
        'Presión por resultados inmediatos',
      ],
    },
  },
  {
    slug: 'ops-manager-saas',
    name: 'Operations Manager SaaS',
    title: 'Head of Operations en SaaS de alto crecimiento',
    description: 'Líder de operaciones enfocado en escalar procesos, mejorar eficiencia y reducir fricción operacional.',
    category: 'Operations',
    specialization: 'SaaS Scaling',
    psychographics: {
      jobsToBeDone: [
        'Optimizar procesos operacionales',
        'Reducir tiempo en decisiones operativas',
        'Implementar data-driven workflows',
        'Escalar sin aumentar headcount proporcionalmente',
      ],
      motivations: [
        'Eficiencia operacional',
        'Automatización de procesos',
        'Escalabilidad',
        'Reducción de bottlenecks',
      ],
      barriers: [
        'Resistencia al cambio del equipo',
        'Falta de visibilidad en procesos',
        'Recursos limitados para mejoras',
        'Prioridades en constante cambio',
      ],
    },
  },
]

async function seedBuyerPersonas() {
  console.log('[INFO] Starting buyer personas seed...')

  let created = 0
  let updated = 0

  for (const persona of BUYER_PERSONAS) {
    try {
      // Check if persona already exists
      const existing = await sql`
        SELECT id FROM strategic_profiles WHERE slug = ${persona.slug} LIMIT 1
      `

      if (existing.length > 0) {
        // Update existing
        await sql`
          UPDATE strategic_profiles
          SET
            type = 'buyer_persona',
            name = ${persona.name},
            title = ${persona.title},
            description = ${persona.description},
            category = ${persona.category},
            specialization = ${persona.specialization},
            psychographics = ${JSON.stringify(persona.psychographics)},
            is_active = true,
            updated_at = NOW()
          WHERE id = ${existing[0].id}
        `
        console.log(`[OK] Updated buyer persona: ${persona.name}`)
        updated++
      } else {
        // Create new
        await sql`
          INSERT INTO strategic_profiles (
            type, slug, name, title, description, category, specialization,
            psychographics, is_active, is_system_profile, created_at, updated_at
          ) VALUES (
            'buyer_persona',
            ${persona.slug},
            ${persona.name},
            ${persona.title},
            ${persona.description},
            ${persona.category},
            ${persona.specialization},
            ${JSON.stringify(persona.psychographics)},
            true,
            true,
            NOW(),
            NOW()
          )
        `
        console.log(`[OK] Created buyer persona: ${persona.name}`)
        created++
      }
    } catch (error) {
      console.error(`[ERROR] Failed to seed ${persona.name}:`, error.message)
    }
  }

  console.log('\n[INFO] Buyer Personas Seed Summary:')
  console.log(`  Created: ${created}`)
  console.log(`  Updated: ${updated}`)
  console.log(`  Total: ${BUYER_PERSONAS.length}`)

  await sql.end()
}

seedBuyerPersonas()
  .then(() => {
    console.log('[OK] Seed completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('[ERROR] Seed failed:', error)
    process.exit(1)
  })
