/**
 * Departments Router
 * Handles department-specific context and custom prompts for corporate intelligence
 */

import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from '../trpc'
import { db } from '@quoorum/db'
import { departments, companies, departmentTypeEnum } from '@quoorum/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { logger } from '../lib/logger'

// ═══════════════════════════════════════════════════════════
// PREDEFINED DEPARTMENTS (Templates)
// ═══════════════════════════════════════════════════════════

export const PREDEFINED_DEPARTMENTS = [
  {
    type: 'finance' as const,
    name: 'Finanzas',
    description: 'CFO y equipo financiero',
    icon: '💰',
    agentRole: 'analyst',
    basePrompt: `Eres el CFO de la empresa. Tu rol es:
- Analizar el impacto financiero de cada decisión
- Evaluar ROI, costos, presupuestos y viabilidad económica
- Identificar riesgos financieros y oportunidades de optimización
- Recomendar decisiones basadas en métricas y datos numéricos`,
    departmentContext: `KPIs: Revenue, Cash Flow, EBITDA, Burn Rate
Procesos: Presupuestación, forecasting, análisis de costos
Informes: P&L mensuales, balance sheets, proyecciones trimestrales`,
  },
  {
    type: 'marketing' as const,
    name: 'Marketing',
    description: 'CMO y equipo de marketing',
    icon: '📢',
    agentRole: 'analyst',
    basePrompt: `Eres el CMO de la empresa. Tu rol es:
- Evaluar el impacto en brand awareness, customer acquisition y engagement
- Analizar canales de marketing, mensajes y posicionamiento
- Identificar oportunidades de crecimiento y expansión de mercado
- Recomendar estrategias basadas en datos de audiencia y competencia`,
    departmentContext: `KPIs: CAC, LTV, Conversion Rate, Brand Awareness
Procesos: Campañas, content marketing, SEO/SEM, social media
Informes: Performance de campañas, métricas de audiencia, análisis de competencia`,
  },
  {
    type: 'operations' as const,
    name: 'Operaciones',
    description: 'COO y equipo de operaciones',
    icon: '⚙️',
    agentRole: 'critic',
    basePrompt: `Eres el COO de la empresa. Tu rol es:
- Evaluar la viabilidad operativa y escalabilidad de las decisiones
- Identificar cuellos de botella, riesgos de ejecución y problemas logísticos
- Analizar procesos, recursos necesarios y capacidad del equipo
- Recomendar mejoras de eficiencia y optimización de operaciones`,
    departmentContext: `KPIs: Efficiency, Throughput, Lead Time, Error Rate
Procesos: Supply chain, logistics, quality control, process optimization
Informes: Operational metrics, capacity planning, incident reports`,
  },
  {
    type: 'hr' as const,
    name: 'Recursos Humanos',
    description: 'CHRO y equipo de talento',
    icon: '👥',
    agentRole: 'critic',
    basePrompt: `Eres el CHRO de la empresa. Tu rol es:
- Evaluar el impacto en el equipo, cultura y employee experience
- Identificar necesidades de contratación, capacitación y retención
- Analizar riesgos de burnout, rotación y satisfacción del equipo
- Recomendar decisiones que fortalezcan la cultura y el talento`,
    departmentContext: `KPIs: Retention Rate, Employee Satisfaction, Time to Hire
Procesos: Reclutamiento, onboarding, performance reviews, cultura
Informes: Engagement surveys, turnover analysis, talent pipeline`,
  },
  {
    type: 'sales' as const,
    name: 'Ventas',
    description: 'VP Sales y equipo comercial',
    icon: '💼',
    agentRole: 'analyst',
    basePrompt: `Eres el VP de Ventas de la empresa. Tu rol es:
- Evaluar el impacto en pipeline, deals y revenue
- Analizar estrategias de prospección, cierre y expansión de cuentas
- Identificar objeciones de clientes y oportunidades de upsell/cross-sell
- Recomendar tácticas para acelerar el ciclo de ventas y aumentar win rate`,
    departmentContext: `KPIs: MRR, ARR, Win Rate, Sales Cycle Length
Procesos: Prospecting, demos, negotiations, account management
Informes: Pipeline reports, forecast accuracy, deal analysis`,
  },
  {
    type: 'product' as const,
    name: 'Producto',
    description: 'CPO y equipo de producto',
    icon: '🎯',
    agentRole: 'synthesizer',
    basePrompt: `Eres el CPO de la empresa. Tu rol es:
- Evaluar la alineación con product vision y roadmap
- Analizar el impacto en user experience, adoption y product-market fit
- Identificar trade-offs entre funcionalidades, deuda técnica y time-to-market
- Recomendar decisiones basadas en feedback de usuarios y datos de uso`,
    departmentContext: `KPIs: Adoption Rate, Feature Usage, NPS, Churn
Procesos: Discovery, roadmap planning, user research, A/B testing
Informes: Usage analytics, user feedback, feature performance`,
  },
  {
    type: 'engineering' as const,
    name: 'Ingeniería',
    description: 'CTO y equipo técnico',
    icon: '🛠️',
    agentRole: 'critic',
    basePrompt: `Eres el CTO de la empresa. Tu rol es:
- Evaluar la viabilidad técnica, arquitectura y escalabilidad
- Identificar riesgos técnicos, deuda técnica y requisitos de infraestructura
- Analizar trade-offs entre velocidad de desarrollo y calidad de código
- Recomendar soluciones técnicas robustas y mantenibles`,
    departmentContext: `KPIs: Uptime, Performance, Deploy Frequency, MTTR
Procesos: Development, testing, deployment, monitoring
Informes: System health, technical debt, sprint velocity`,
  },
  {
    type: 'customer_success' as const,
    name: 'Customer Success',
    description: 'VP CS y equipo de éxito del cliente',
    icon: '🤝',
    agentRole: 'analyst',
    basePrompt: `Eres el VP de Customer Success. Tu rol es:
- Evaluar el impacto en customer satisfaction, retention y expansion
- Analizar pain points, necesidades y expectativas de clientes
- Identificar riesgos de churn y oportunidades de expansion revenue
- Recomendar acciones para maximizar customer lifetime value`,
    departmentContext: `KPIs: NPS, CSAT, Retention Rate, Expansion MRR
Procesos: Onboarding, adoption, renewal, upsell
Informes: Health scores, churn analysis, expansion opportunities`,
  },
  {
    type: 'legal' as const,
    name: 'Legal y Compliance',
    description: 'General Counsel y equipo legal',
    icon: '⚖️',
    agentRole: 'critic',
    basePrompt: `Eres el General Counsel de la empresa. Tu rol es:
- Evaluar riesgos legales, compliance y regulatorios
- Identificar implicaciones contractuales, de propiedad intelectual y laborales
- Analizar requisitos de privacidad de datos y normativas aplicables
- Recomendar salvaguardas legales y mitigación de riesgos`,
    departmentContext: `KPIs: Compliance Rate, Legal Exposure, Contract Velocity
Procesos: Contract review, regulatory compliance, risk assessment
Informes: Legal audits, compliance reports, risk assessments`,
  },
]

// ═══════════════════════════════════════════════════════════
// VALIDATION SCHEMAS
// ═══════════════════════════════════════════════════════════

const createDepartmentSchema = z.object({
  companyId: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: z.enum(departmentTypeEnum.enumValues),
  departmentContext: z.string().min(10),
  basePrompt: z.string().min(10),
  customPrompt: z.string().optional(),
  agentRole: z.enum(['analyst', 'critic', 'synthesizer']).default('analyst'),
  temperature: z.string().default('0.7'),
  description: z.string().optional(),
  icon: z.string().optional(),
})

const updateDepartmentSchema = createDepartmentSchema.partial().extend({
  id: z.string().uuid(),
})

// ═══════════════════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════════════════

export const departmentsRouter = router({
  /**
   * List all predefined department templates
   */
  listPredefined: protectedProcedure.query(() => {
    return PREDEFINED_DEPARTMENTS
  }),

  /**
   * List user's departments
   */
  list: protectedProcedure
    .input(z.object({ companyId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify company ownership
      const [company] = await db
        .select()
        .from(companies)
        .where(and(eq(companies.id, input.companyId), eq(companies.userId, ctx.userId)))

      if (!company) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Company not found',
        })
      }

      const depts = await db
        .select()
        .from(departments)
        .where(eq(departments.companyId, input.companyId))
        .orderBy(desc(departments.createdAt))

      return depts
    }),

  /**
   * Get department by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [department] = await db
        .select()
        .from(departments)
        .where(eq(departments.id, input.id))

      if (!department) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Department not found',
        })
      }

      // Verify ownership through company
      const [company] = await db
        .select()
        .from(companies)
        .where(and(eq(companies.id, department.companyId), eq(companies.userId, ctx.userId)))

      if (!company) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        })
      }

      return department
    }),

  /**
   * Create department
   */
  create: protectedProcedure
    .input(createDepartmentSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify company ownership
      const [company] = await db
        .select()
        .from(companies)
        .where(and(eq(companies.id, input.companyId), eq(companies.userId, ctx.userId)))

      if (!company) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Company not found',
        })
      }

      const [department] = await db
        .insert(departments)
        .values({
          ...input,
          isPredefined: false,
        })
        .returning()

      logger.info('Department created', {
        departmentId: department.id,
        companyId: input.companyId,
        type: department.type,
      })

      return department
    }),

  /**
   * Update department
   */
  update: protectedProcedure
    .input(updateDepartmentSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      // Get department and verify ownership
      const [existing] = await db
        .select()
        .from(departments)
        .where(eq(departments.id, id))

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Department not found',
        })
      }

      const [company] = await db
        .select()
        .from(companies)
        .where(and(eq(companies.id, existing.companyId), eq(companies.userId, ctx.userId)))

      if (!company) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        })
      }

      const [updated] = await db
        .update(departments)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(departments.id, id))
        .returning()

      logger.info('Department updated', {
        departmentId: updated.id,
        companyId: updated.companyId,
      })

      return updated
    }),

  /**
   * Delete department
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Get department and verify ownership
      const [existing] = await db
        .select()
        .from(departments)
        .where(eq(departments.id, input.id))

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Department not found',
        })
      }

      const [company] = await db
        .select()
        .from(companies)
        .where(and(eq(companies.id, existing.companyId), eq(companies.userId, ctx.userId)))

      if (!company) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        })
      }

      await db.delete(departments).where(eq(departments.id, input.id))

      logger.info('Department deleted', {
        departmentId: input.id,
        companyId: existing.companyId,
      })

      return { success: true }
    }),

  /**
   * Seed predefined departments for a company
   */
  seedPredefined: protectedProcedure
    .input(z.object({ companyId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify company ownership
      const [company] = await db
        .select()
        .from(companies)
        .where(and(eq(companies.id, input.companyId), eq(companies.userId, ctx.userId)))

      if (!company) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Company not found',
        })
      }

      // Insert all predefined departments
      const createdDepartments = await db
        .insert(departments)
        .values(
          PREDEFINED_DEPARTMENTS.map((dept) => ({
            companyId: input.companyId,
            name: dept.name,
            type: dept.type,
            departmentContext: dept.departmentContext,
            basePrompt: dept.basePrompt,
            agentRole: dept.agentRole,
            description: dept.description,
            icon: dept.icon,
            isPredefined: true,
          }))
        )
        .returning()

      logger.info('Predefined departments seeded', {
        companyId: input.companyId,
        count: createdDepartments.length,
      })

      return createdDepartments
    }),
})
