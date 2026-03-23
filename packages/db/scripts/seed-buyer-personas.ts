/**
 * Seed Buyer Personas for Market Simulator Testing
 *
 * Creates example buyer personas with realistic psychographics
 * for testing the Market Simulator feature.
 */

import { db } from '../src'
import { strategicProfiles } from '../src/schema'
import { eq } from 'drizzle-orm'

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
      channels: [
        'LinkedIn',
        'CFO newsletters',
        'Industry conferences',
        'Peer recommendations',
      ],
      professionalProfile: {
        role: 'CFO',
        yearsExperience: 12,
        responsibilities: [
          'Gestión financiera',
          'Reporting al board',
          'Compliance y auditoría',
          'Optimización de procesos',
        ],
        reportingStructure: 'Reports to CEO',
      },
      decisionProcess: {
        timeframe: '2-3 months',
        stakeholders: ['CEO', 'CTO', 'Board'],
        budget: '$50K-$200K annually',
      },
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
      channels: [
        'Product Hunt',
        'Twitter tech',
        'Product management communities',
        'Slack communities',
      ],
      professionalProfile: {
        role: 'Head of Product',
        yearsExperience: 8,
        responsibilities: [
          'Product roadmap',
          'User research',
          'Feature prioritization',
          'Cross-functional collaboration',
        ],
        reportingStructure: 'Reports to CEO',
      },
      decisionProcess: {
        timeframe: '1-2 months',
        stakeholders: ['CEO', 'CTO', 'Design Lead'],
        budget: '$20K-$100K annually',
      },
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
      channels: [
        'YC forums',
        'Twitter',
        'Founder communities',
        'Investor introductions',
      ],
      professionalProfile: {
        role: 'CEO & Founder',
        yearsExperience: 5,
        responsibilities: [
          'Strategic decisions',
          'Fundraising',
          'Team building',
          'Product vision',
        ],
        reportingStructure: 'Reports to Board',
      },
      decisionProcess: {
        timeframe: '2-4 weeks',
        stakeholders: ['Co-founder', 'Lead investor'],
        budget: '$10K-$50K annually',
      },
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
      channels: [
        'LinkedIn',
        'Marketing conferences',
        'Industry publications',
        'Agency networks',
      ],
      professionalProfile: {
        role: 'Marketing Director',
        yearsExperience: 10,
        responsibilities: [
          'Marketing strategy',
          'Campaign management',
          'Brand positioning',
          'Demand generation',
        ],
        reportingStructure: 'Reports to CMO',
      },
      decisionProcess: {
        timeframe: '1-2 months',
        stakeholders: ['CMO', 'Head of Sales', 'CFO'],
        budget: '$30K-$150K annually',
      },
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
      channels: [
        'Operations communities',
        'SaaS forums',
        'LinkedIn',
        'Industry reports',
      ],
      professionalProfile: {
        role: 'Head of Operations',
        yearsExperience: 7,
        responsibilities: [
          'Process optimization',
          'Team coordination',
          'Workflow automation',
          'Vendor management',
        ],
        reportingStructure: 'Reports to COO',
      },
      decisionProcess: {
        timeframe: '1-2 months',
        stakeholders: ['COO', 'CFO', 'Team leads'],
        budget: '$25K-$80K annually',
      },
    },
  },
]

async function seedBuyerPersonas() {
  console.log('[INFO] Starting buyer personas seed...')

  let created = 0
  let updated = 0
  let skipped = 0

  for (const persona of BUYER_PERSONAS) {
    try {
      // Check if persona already exists
      const existing = await db.query.strategicProfiles.findFirst({
        where: eq(strategicProfiles.slug, persona.slug),
      })

      if (existing) {
        // Update existing
        await db
          .update(strategicProfiles)
          .set({
            type: 'buyer_persona',
            name: persona.name,
            title: persona.title,
            description: persona.description,
            category: persona.category,
            specialization: persona.specialization,
            psychographics: persona.psychographics,
            isActive: true,
            updatedAt: new Date(),
          })
          .where(eq(strategicProfiles.id, existing.id))

        console.log(`[OK] Updated buyer persona: ${persona.name}`)
        updated++
      } else {
        // Create new
        await db.insert(strategicProfiles).values({
          type: 'buyer_persona',
          slug: persona.slug,
          name: persona.name,
          title: persona.title,
          description: persona.description,
          category: persona.category,
          specialization: persona.specialization,
          psychographics: persona.psychographics,
          isActive: true,
          isSystemProfile: true, // Mark as system-provided
        })

        console.log(`[OK] Created buyer persona: ${persona.name}`)
        created++
      }
    } catch (error) {
      console.error(`[ERROR] Failed to seed ${persona.name}:`, error)
      skipped++
    }
  }

  console.log('\n[INFO] Buyer Personas Seed Summary:')
  console.log(`  Created: ${created}`)
  console.log(`  Updated: ${updated}`)
  console.log(`  Skipped: ${skipped}`)
  console.log(`  Total: ${BUYER_PERSONAS.length}`)
}

// Run if called directly
if (require.main === module) {
  seedBuyerPersonas()
    .then(() => {
      console.log('[OK] Seed completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('[ERROR] Seed failed:', error)
      process.exit(1)
    })
}

export { seedBuyerPersonas, BUYER_PERSONAS }
