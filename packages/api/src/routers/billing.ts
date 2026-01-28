/**
 * Billing Router
 *
 * Handles Stripe checkout sessions and credit purchases
 */

import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import Stripe from 'stripe'
import { router, protectedProcedure } from '../trpc'
import { env } from '../env'
import { db } from '@quoorum/db'
import { usage, subscriptions, users, plans, creditTransactions, quoorumDebates } from '@quoorum/db/schema'
import { eq, desc, and, sql } from 'drizzle-orm'
import { logger } from '../lib/logger'

// ============================================================================
// STRIPE CLIENT
// ============================================================================

// Initialize Stripe only if secret key is configured
let stripe: Stripe | null = null
try {
  // Only initialize if we have a non-empty secret key
  if (env.STRIPE_SECRET_KEY && env.STRIPE_SECRET_KEY.trim().length > 0) {
    stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    })
    logger.info('Stripe client initialized successfully')
  } else {
    logger.warn('Stripe secret key not configured. Billing features will be disabled.')
  }
} catch (error) {
  logger.error('Failed to initialize Stripe client', error instanceof Error ? error : new Error(String(error)))
  stripe = null // Ensure stripe is null on error
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createCheckoutSessionSchema = z.object({
  planId: z.enum(['free', 'starter', 'pro', 'business']),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
})

const purchaseCreditsSchema = z.object({
  credits: z.number().min(8000).max(1200000), // 8,000 to 1,200,000 credits (basado en CREDIT_AMOUNTS)
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
})

const createTeamCheckoutSchema = z.object({
  seats: z.number().min(1).max(1000),
  creditsPerSeat: z.number().min(4000).max(1200000),
  isYearly: z.boolean().default(false),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
})

// ============================================================================
// PRICING CONFIGURATION
// ============================================================================

const PLAN_PRICES = {
  free: {
    monthly: 0,
    yearly: 0,
    credits: 100, // 100 créditos una vez (no mensual)
    stripePriceId: null, // Free plan has no Stripe price
  },
  starter: {
    monthly: 2900, // 29€/mes (cents) por 3,500 créditos
    yearly: 29000, // 290€/año por 3,500 créditos/mes
    credits: 3500, // 3,500 créditos por mes
    stripePriceIdMonthly: env.STRIPE_STARTER_MONTHLY_PRICE_ID,
    stripePriceIdYearly: env.STRIPE_STARTER_YEARLY_PRICE_ID,
  },
  pro: {
    monthly: 7900, // 79€/mes (cents) por 10,000 créditos
    yearly: 79000, // 790€/año por 10,000 créditos/mes
    credits: 10000, // 10,000 créditos por mes
    stripePriceIdMonthly: env.STRIPE_PRO_MONTHLY_PRICE_ID,
    stripePriceIdYearly: env.STRIPE_PRO_YEARLY_PRICE_ID,
  },
  business: {
    monthly: 19900, // 199€/mes (cents) por 30,000 créditos
    yearly: 199000, // 1,990€/año por 30,000 créditos/mes
    credits: 30000, // 30,000 créditos por mes
    stripePriceIdMonthly: env.STRIPE_BUSINESS_MONTHLY_PRICE_ID,
    stripePriceIdYearly: env.STRIPE_BUSINESS_YEARLY_PRICE_ID,
  },
}

// ============================================================================
// ESTÁNDAR QUOORUM: SISTEMA DE CRÉDITOS
// ============================================================================
// Valor del Crédito: $0.01 USD (100 Créditos = $1 USD)
// Multiplicador de Servicio: 1.75x
// Fórmula: Créditos = ⌈(Coste API USD × 1.75) / 0.01⌉
// ============================================================================

const CREDIT_PRICE_PER_UNIT = 0.01 // $0.01 USD por crédito
const CREDITS_PER_DOLLAR = 100 // 100 créditos por $1 USD
const SERVICE_MULTIPLIER = 1.75 // Multiplicador de servicio (1.75x)

// Función para calcular precio basado en créditos (en centavos USD)
function calculatePriceFromCredits(credits: number): number {
  // Precio en centavos USD = créditos * 0.01 * 100
  return Math.round(credits * CREDIT_PRICE_PER_UNIT * 100)
}

// Función para calcular créditos basado en precio (en centavos USD)
function calculateCreditsFromPrice(priceInCents: number): number {
  // Créditos = precio en centavos / (0.01 * 100)
  return Math.round(priceInCents / (CREDIT_PRICE_PER_UNIT * 100))
}

// Función para calcular créditos desde coste API USD (con multiplicador de servicio)
function calculateCreditsFromApiCost(apiCostUsd: number): number {
  // Créditos = ⌈(Coste API USD × 1.75) / 0.01⌉
  return Math.ceil((apiCostUsd * SERVICE_MULTIPLIER) / CREDIT_PRICE_PER_UNIT)
}

// Credit packs (one-time purchases) - Generados con la fórmula
// Opciones de créditos disponibles
const CREDIT_AMOUNTS = [
  8000,
  12000,
  16000,
  20000,
  40000,
  63000,
  85000,
  110000,
  170000,
  230000,
  350000,
  480000,
  1200000,
] as const

// Generar CREDIT_PACKS dinámicamente con la fórmula
const CREDIT_PACKS = Object.fromEntries(
  CREDIT_AMOUNTS.map((credits) => [
    credits,
    {
      price: calculatePriceFromCredits(credits), // Precio en centavos
      stripePriceId: env[`STRIPE_CREDITS_${credits}_PRICE_ID` as keyof typeof env] as string | undefined,
    },
  ])
) as Record<number, { price: number; stripePriceId?: string }>

// ============================================================================
// ROUTER
// ============================================================================

export const billingRouter = router({
  // --------------------------------------------------------------------------
  // CREATE CHECKOUT SESSION (Subscription)
  // --------------------------------------------------------------------------
  createCheckoutSession: protectedProcedure
    .input(createCheckoutSessionSchema)
    .mutation(async ({ ctx, input }) => {
      const { planId, successUrl, cancelUrl } = input

      // Free plan doesn't require checkout
      if (planId === 'free') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Free plan does not require checkout',
        })
      }

      const plan = PLAN_PRICES[planId]

      // Check if Stripe is configured
      if (!stripe) {
        logger.error('Stripe not configured', {
          planId,
          userId: ctx.userId,
        })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Stripe no está configurado. Por favor, contacta al soporte o configura las variables de entorno de Stripe.',
        })
      }

      // Validate that Stripe price ID exists and is not empty
      if (!plan.stripePriceIdMonthly || plan.stripePriceIdMonthly.trim().length === 0) {
        logger.error('Missing or empty Stripe price ID for plan', {
          planId,
          userId: ctx.userId,
          stripePriceIdMonthly: plan.stripePriceIdMonthly,
          availableKeys: Object.keys(plan),
        })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Stripe price ID no configurado para el plan: ${planId}. Por favor, contacta al soporte o configura las variables de entorno STRIPE_${planId.toUpperCase()}_MONTHLY_PRICE_ID.`,
        })
      }

      try {
        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
          mode: 'subscription',
          payment_method_types: ['card'],
          line_items: [
            {
              price: plan.stripePriceIdMonthly, // Default to monthly
              quantity: 1,
            },
          ],
          success_url: successUrl || `${env.NEXT_PUBLIC_APP_URL}/account?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: cancelUrl || `${env.NEXT_PUBLIC_APP_URL}/account`,
          customer_email: ctx.user.email,
          metadata: {
            userId: ctx.userId,
            planId,
          },
          subscription_data: {
            metadata: {
              userId: ctx.userId,
              planId,
            },
          },
        })

        logger.info('Checkout session created successfully', {
          sessionId: session.id,
          planId,
          userId: ctx.userId,
        })

        return {
          sessionId: session.id,
          url: session.url,
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        const errorDetails = error instanceof Stripe.errors.StripeError 
          ? { type: error.type, code: error.code, statusCode: error.statusCode }
          : {}

        // Log full error details for debugging - INCLUIR TODOS LOS DETALLES
        logger.error('Failed to create Stripe checkout session', error instanceof Error ? error : new Error(String(error)), {
          planId,
          userId: ctx.userId,
          stripePriceId: plan.stripePriceIdMonthly,
          stripePriceIdLength: plan.stripePriceIdMonthly?.length || 0,
          stripeConfigured: !!stripe,
          stripeSecretKeyLength: env.STRIPE_SECRET_KEY?.length || 0,
          errorName: error instanceof Error ? error.name : typeof error,
          errorMessage: errorMessage,
          isStripeError: error instanceof Stripe.errors.StripeError,
          ...errorDetails,
        })

        // Provide more helpful error message based on the actual error
        let userMessage = 'Error al crear sesión de checkout'
        
        // Check for common Stripe errors
        if (error instanceof Stripe.errors.StripeError) {
          if (error.type === 'StripeInvalidRequestError') {
            if (error.message.includes('No such price') || error.message.includes('Invalid price')) {
              userMessage = `El precio de Stripe no está configurado correctamente para el plan ${planId}. Por favor, contacta al soporte o configura la variable de entorno STRIPE_${planId.toUpperCase()}_MONTHLY_PRICE_ID.`
            } else if (error.message.includes('Invalid API Key') || error.message.includes('api_key')) {
              userMessage = 'La clave de API de Stripe no es válida. Por favor, contacta al soporte o configura la variable de entorno STRIPE_SECRET_KEY.'
            } else {
              userMessage = `Error de Stripe: ${error.message}`
            }
          } else if (error.type === 'StripeAuthenticationError') {
            userMessage = 'Error de autenticación con Stripe. La clave de API no es válida. Por favor, contacta al soporte.'
          } else if (error.type === 'StripeAPIError') {
            userMessage = `Error de la API de Stripe: ${error.message}`
          } else {
            userMessage = `Error de Stripe: ${error.message}`
          }
        } else {
          // Si no es un error de Stripe, usar el mensaje original pero más descriptivo
          // Incluir el mensaje del error para debugging
          userMessage = `Error al crear sesión de checkout: ${errorMessage}`
          
          // Si el error tiene un mensaje útil, incluirlo
          if (errorMessage && errorMessage.length > 0 && errorMessage !== 'Failed to create checkout session') {
            userMessage = `Error al crear sesión de checkout: ${errorMessage}`
          } else {
            // Mensaje más descriptivo si no hay detalles
            userMessage = 'Error al crear sesión de checkout. Por favor, verifica que Stripe esté configurado correctamente o contacta al soporte.'
          }
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: userMessage,
          cause: error,
        })
      }
    }),

  // --------------------------------------------------------------------------
  // PURCHASE CREDITS (One-time)
  // --------------------------------------------------------------------------
  purchaseCredits: protectedProcedure.input(purchaseCreditsSchema).mutation(async ({ ctx, input }) => {
    if (!stripe) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Stripe no está configurado. Por favor, contacta al soporte o configura las variables de entorno de Stripe.',
      })
    }

    const { credits: requestedCredits, successUrl, cancelUrl } = input

    // Find closest available pack
    const availablePacks = CREDIT_AMOUNTS.slice().sort((a, b) => a - b)
    
    // Find closest pack (round up to nearest available pack)
    const closestPack = availablePacks.find((pack) => pack >= requestedCredits) || availablePacks[availablePacks.length - 1]
    
    // Calculate price using formula
    const priceInCents = calculatePriceFromCredits(closestPack)
    
    const pack = CREDIT_PACKS[closestPack]
    if (!pack) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid credit pack',
      })
    }

    try {
      // Use Stripe price ID if available, otherwise create price on the fly
      let lineItem: Stripe.Checkout.SessionCreateParams.LineItem
      
      if (pack.stripePriceId) {
        // Use existing Stripe price
        lineItem = {
          price: pack.stripePriceId,
          quantity: 1,
        }
      } else {
        // Create price on the fly
        lineItem = {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${closestPack.toLocaleString()} Créditos`,
              description: `Compra única de ${closestPack.toLocaleString()} créditos`,
            },
            unit_amount: priceInCents, // Price in cents
          },
          quantity: 1,
        }
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [lineItem],
        success_url: successUrl || `${env.NEXT_PUBLIC_APP_URL}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
        customer_email: ctx.user.email,
        metadata: {
          userId: ctx.userId,
          type: 'credit_purchase',
          credits: String(closestPack),
        },
      })

      return {
        sessionId: session.id,
        url: session.url,
        credits: closestPack,
        price: priceInCents,
      }
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create credit purchase session',
        cause: error,
      })
    }
  }),

  // --------------------------------------------------------------------------
  // CREATE TEAM CHECKOUT SESSION
  // --------------------------------------------------------------------------
  createTeamCheckout: protectedProcedure
    .input(createTeamCheckoutSchema)
    .mutation(async ({ ctx, input }) => {
      if (!stripe) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Stripe no está configurado. Por favor, contacta al soporte o configura las variables de entorno de Stripe.',
        })
      }

      const { seats, creditsPerSeat, isYearly, successUrl, cancelUrl } = input

      // Calcular precio por asiento según créditos seleccionados
      // Opciones de créditos por asiento (mismo que en frontend)
      const CREDIT_OPTIONS_PER_SEAT = [
        { credits: 4000, price: 32 },
        { credits: 8000, price: 64 },
        { credits: 12000, price: 96 },
        { credits: 16000, price: 128 },
        { credits: 20000, price: 160 },
        { credits: 40000, price: 320 },
        { credits: 63000, price: 504 },
        { credits: 85000, price: 680 },
        { credits: 110000, price: 880 },
        { credits: 170000, price: 1360 },
        { credits: 230000, price: 1840 },
        { credits: 350000, price: 2800 },
        { credits: 480000, price: 3840 },
        { credits: 1200000, price: 9600 },
      ] as const

      // Encontrar el precio correspondiente a los créditos seleccionados
      const creditOption = CREDIT_OPTIONS_PER_SEAT.find(
        (opt) => opt.credits === creditsPerSeat
      )

      if (!creditOption) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid credits per seat option',
        })
      }

      const pricePerSeat = creditOption.price
      const monthlyTotal = seats * pricePerSeat
      const totalPrice = isYearly
        ? Math.round(monthlyTotal * 12 * 0.83) // 17% descuento anual
        : monthlyTotal

      const priceInCents = totalPrice * 100 // Convertir a centavos

      try {
        // Crear checkout session para plan Team
        const session = await stripe.checkout.sessions.create({
          mode: 'subscription', // Plan recurrente
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'eur',
                recurring: {
                  interval: isYearly ? 'year' : 'month',
                },
                product_data: {
                  name: `Plan Equipo - ${seats} asientos`,
                  description: `${seats} asientos × ${creditsPerSeat.toLocaleString()} créditos/asiento/mes`,
                },
                unit_amount: Math.round(priceInCents / seats), // Precio por asiento en centavos
              },
              quantity: seats,
            },
          ],
          success_url:
            successUrl ||
            `${env.NEXT_PUBLIC_APP_URL}/settings/team?success=true&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url:
            cancelUrl || `${env.NEXT_PUBLIC_APP_URL}/settings/team?canceled=true`,
          customer_email: ctx.user.email,
          metadata: {
            userId: ctx.userId,
            type: 'team_subscription',
            seats: String(seats),
            creditsPerSeat: String(creditsPerSeat),
            isYearly: String(isYearly),
            totalCredits: String(seats * creditsPerSeat),
          },
        })

        return {
          sessionId: session.id,
          url: session.url,
          seats,
          creditsPerSeat,
          totalCredits: seats * creditsPerSeat,
          price: priceInCents,
          isYearly,
        }
      } catch (error) {
        logger.error('Failed to create team checkout session', {
          error: error instanceof Error ? error.message : String(error),
          userId: ctx.userId,
          seats,
          creditsPerSeat,
        })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create team checkout session',
          cause: error,
        })
      }
    }),

  // --------------------------------------------------------------------------
  // GET PRICING INFO
  // --------------------------------------------------------------------------
  getPricingInfo: protectedProcedure.query(() => {
    return {
      plans: PLAN_PRICES,
      creditPacks: CREDIT_PACKS,
      creditPricePerUnit: CREDIT_PRICE_PER_UNIT, // $0.01 USD por crédito
      creditsPerDollar: CREDITS_PER_DOLLAR, // 100 créditos por $1 USD
      serviceMultiplier: SERVICE_MULTIPLIER, // 1.75x multiplicador de servicio
      // Nota: Las funciones de cálculo no son serializables en JSON
      // Usar calculatePriceFromCredits, calculateCreditsFromPrice, calculateCreditsFromApiCost directamente
    }
  }),

  // --------------------------------------------------------------------------
  // REFRESH DAILY CREDITS (solo si han pasado 24h desde último refresh)
  // --------------------------------------------------------------------------
  refreshDailyCredits: protectedProcedure.mutation(async ({ ctx }) => {
    const now = new Date()
    const lastRefresh = ctx.user.lastDailyCreditRefresh
    
    // Si nunca se ha refrescado, inicializar con la fecha actual
    if (!lastRefresh) {
      await db
        .update(users)
        .set({
          lastDailyCreditRefresh: now,
          updatedAt: now,
        })
        .where(eq(users.id, ctx.userId))
      
      return {
        refreshed: false,
        creditsAdded: 0,
        message: 'Primera visita - créditos diarios se activarán mañana',
      }
    }
    
    // Calcular horas desde último refresh
    const hoursSinceRefresh = (now.getTime() - lastRefresh.getTime()) / (1000 * 60 * 60)
    
    // Solo refrescar si han pasado al menos 24 horas
    if (hoursSinceRefresh < 24) {
      const hoursRemaining = Math.ceil(24 - hoursSinceRefresh)
      return {
        refreshed: false,
        creditsAdded: 0,
        message: `Créditos diarios disponibles en ${hoursRemaining} horas`,
        hoursRemaining,
      }
    }
    
    // Calcular créditos diarios según tier
    const DAILY_CREDITS_BY_TIER: Record<string, number> = {
      free: 10, // 10 créditos diarios para usuarios free
      starter: 25, // 25 créditos diarios para starter
      pro: 50, // 50 créditos diarios para pro
      business: 100, // 100 créditos diarios para business
    }
    
    const dailyCredits = DAILY_CREDITS_BY_TIER[ctx.user.tier] || DAILY_CREDITS_BY_TIER.free
    
    // Añadir créditos usando la función de credit-transactions
    const { addCredits } = await import('@quoorum/quoorum/billing/credit-transactions')
    const result = await addCredits(
      ctx.userId,
      dailyCredits,
      undefined, // No hay subscriptionId para créditos diarios
      'daily_reset',
      `Créditos diarios de actualización (${ctx.user.tier} tier)`
    )
    
    if (!result.success) {
      logger.error('Failed to add daily credits', {
        userId: ctx.userId,
        tier: ctx.user.tier,
        error: result.error,
      })
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error al añadir créditos diarios',
      })
    }
    
    // Actualizar lastDailyCreditRefresh
    await db
      .update(users)
      .set({
        lastDailyCreditRefresh: now,
        updatedAt: now,
      })
      .where(eq(users.id, ctx.userId))
    
    logger.info('Daily credits refreshed', {
      userId: ctx.userId,
      tier: ctx.user.tier,
      creditsAdded: dailyCredits,
      newBalance: result.newBalance,
    })
    
    return {
      refreshed: true,
      creditsAdded: dailyCredits,
      newBalance: result.newBalance,
      message: `Se añadieron ${dailyCredits} créditos diarios`,
    }
  }),

  // --------------------------------------------------------------------------
  // GET CURRENT PLAN (con refresh automático de créditos diarios)
  // --------------------------------------------------------------------------
  getCurrentPlan: protectedProcedure.query(async ({ ctx }) => {
    // IMPORTANT: ctx.userId is profile.id, but for users table operations we need ctx.user.id
    const usersId = ctx.user.id
    
    // Intentar refrescar créditos diarios automáticamente (fire-and-forget)
    // No bloquea la respuesta si falla
    void (async () => {
      try {
        const now = new Date()
        const lastRefresh = ctx.user.lastDailyCreditRefresh
        
        // Si nunca se ha refrescado o han pasado 24h, intentar refrescar
        if (!lastRefresh) {
          // Primera visita: solo marcar timestamp, no añadir créditos
          await db
            .update(users)
            .set({
              lastDailyCreditRefresh: now,
              updatedAt: now,
            })
            .where(eq(users.id, usersId))
          return
        }
        
        const hoursSinceRefresh = (now.getTime() - lastRefresh.getTime()) / (1000 * 60 * 60)
        
        if (hoursSinceRefresh >= 24) {
          // Refrescar créditos diarios
          const DAILY_CREDITS_BY_TIER: Record<string, number> = {
            free: 10,
            starter: 25,
            pro: 50,
            business: 100,
          }
          
          const dailyCredits = DAILY_CREDITS_BY_TIER[ctx.user.tier] || DAILY_CREDITS_BY_TIER.free
          
          const { addCredits } = await import('@quoorum/quoorum/billing/credit-transactions')
          const result = await addCredits(
            usersId, // Use users.id, not profile.id
            dailyCredits,
            undefined,
            'daily_reset',
            `Créditos diarios de actualización (${ctx.user.tier} tier)`
          )
          
          if (result.success) {
            await db
              .update(users)
              .set({
                lastDailyCreditRefresh: now,
                updatedAt: now,
              })
              .where(eq(users.id, usersId))
            
            logger.info('Daily credits auto-refreshed', {
              userId: usersId,
              tier: ctx.user.tier,
              creditsAdded: dailyCredits,
            })
          }
        }
      } catch (error) {
        // Silenciar errores en el refresh automático para no bloquear la respuesta
        logger.warn('Failed to auto-refresh daily credits', {
          userId: usersId,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    })()
    
    // Obtener balance actualizado (después del refresh)
    const [updatedUser] = await db
      .select({ credits: users.credits })
      .from(users)
      .where(eq(users.id, usersId)) // Use users.id, not profile.id
      .limit(1)
    
    return {
      tier: ctx.user.tier,
      credits: updatedUser?.credits ?? ctx.user.credits,
    }
  }),

  // --------------------------------------------------------------------------
  // GET MY USAGE HISTORY
  // --------------------------------------------------------------------------
  getMyUsageHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const results = await db
        .select()
        .from(usage)
        .where(eq(usage.userId, ctx.userId))
        .orderBy(desc(usage.periodStart))
        .limit(input.limit)
        .offset(input.offset)

      return results
    }),

  // --------------------------------------------------------------------------
  // GET MY INVOICES (Stripe invoices)
  // --------------------------------------------------------------------------
  getMyInvoices: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(5),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!stripe) {
        logger.warn('Stripe not configured, returning empty invoices list', { userId: ctx.userId })
        return []
      }

      try {
        // Get user's Stripe customer ID from subscription
        const [subscription] = await db
          .select({ stripeCustomerId: subscriptions.stripeCustomerId })
          .from(subscriptions)
          .where(eq(subscriptions.userId, ctx.userId))
          .limit(1)

        if (!subscription?.stripeCustomerId) {
          return []
        }

        // Fetch invoices from Stripe
        const stripeInvoices = await stripe.invoices.list({
          customer: subscription.stripeCustomerId,
          limit: input.limit,
        })

        return stripeInvoices.data.map((invoice) => ({
          id: invoice.id,
          date: new Date(invoice.created * 1000),
          amount: invoice.amount_paid / 100, // Convert from cents to dollars
          status: invoice.status,
          invoicePdf: invoice.invoice_pdf,
          hostedInvoiceUrl: invoice.hosted_invoice_url,
        }))
      } catch (error) {
        logger.error('Error fetching Stripe invoices', error instanceof Error ? error : new Error(String(error)), {
          userId: ctx.userId,
        })
        return []
      }
    }),

  // --------------------------------------------------------------------------
  // GET CUSTOMER PORTAL URL (Stripe billing portal)
  // --------------------------------------------------------------------------
  getCustomerPortalUrl: protectedProcedure
    .input(
      z.object({
        returnUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!stripe) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Stripe no está configurado. Por favor, contacta al soporte o configura las variables de entorno de Stripe.',
        })
      }

      try {
        // Get user's Stripe customer ID from subscription
        const [subscription] = await db
          .select({ stripeCustomerId: subscriptions.stripeCustomerId })
          .from(subscriptions)
          .where(eq(subscriptions.userId, ctx.userId))
          .limit(1)

        if (!subscription?.stripeCustomerId) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'No se encontró una suscripción activa',
          })
        }

        // Create billing portal session
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: subscription.stripeCustomerId,
          return_url: input.returnUrl || `${env.NEXT_PUBLIC_APP_URL}/settings/billing`,
        })

        return { url: portalSession.url }
      } catch (error) {
        logger.error('Error creating Stripe portal session', error instanceof Error ? error : new Error(String(error)), {
          userId: ctx.userId,
        })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al crear sesión del portal de facturación',
        })
      }
    }),

  // --------------------------------------------------------------------------
  // GET MY SUBSCRIPTIONS (Payment History)
  // --------------------------------------------------------------------------
  getMySubscriptions: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const results = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, ctx.userId))
        .orderBy(desc(subscriptions.createdAt))
        .limit(input.limit)
        .offset(input.offset)

      return results
    }),

  // --------------------------------------------------------------------------
  // GET CREDIT TRANSACTION HISTORY
  // --------------------------------------------------------------------------
  getCreditHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      // IMPORTANT: creditTransactions.userId references users.id, not profiles.id
      // ctx.userId is profile.id, but we need users.id (ctx.user.id)
      const usersId = ctx.user.id

      // Get total count for pagination
      const countResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(creditTransactions)
        .where(eq(creditTransactions.userId, usersId))

      const total = countResult[0]?.count ?? 0

      // Get transactions with debate info (if available)
      const rawTransactions = await db
        .select({
          id: creditTransactions.id,
          type: creditTransactions.type,
          source: creditTransactions.source,
          amount: creditTransactions.amount,
          balanceBefore: creditTransactions.balanceBefore,
          balanceAfter: creditTransactions.balanceAfter,
          reason: creditTransactions.reason,
          debateId: creditTransactions.debateId,
          debateQuestionFromJoin: quoorumDebates.question,
          debateStatus: quoorumDebates.status,
          metadata: creditTransactions.metadata,
          createdAt: creditTransactions.createdAt,
        })
        .from(creditTransactions)
        .leftJoin(
          quoorumDebates,
          eq(creditTransactions.debateId, quoorumDebates.id)
        )
        .where(eq(creditTransactions.userId, usersId))
        .orderBy(desc(creditTransactions.createdAt))
        .limit(input.limit)
        .offset(input.offset)

      // Transform: use debateQuestion from join first, fallback to metadata
      const transactions = rawTransactions.map((t) => ({
        id: t.id,
        type: t.type,
        source: t.source,
        amount: t.amount,
        balanceBefore: t.balanceBefore,
        balanceAfter: t.balanceAfter,
        reason: t.reason,
        debateId: t.debateId,
        debateQuestion: t.debateQuestionFromJoin || (t.metadata as { debateQuestion?: string } | null)?.debateQuestion || null,
        debateStatus: t.debateStatus,
        createdAt: t.createdAt,
      }))

      return {
        transactions,
        total,
      }
    }),
})

// ============================================================================
// WEBHOOK HANDLER (exported for Next.js API route)
// ============================================================================

/**
 * Handles Stripe webhook events
 * @param payload - Raw request body from Stripe
 * @param signature - Stripe signature header
 * @returns Success or error response
 */
export async function handleStripeWebhook(payload: string | Buffer, signature: string) {
  if (!stripe) {
    logger.error('Stripe not configured, cannot handle webhook')
    return { success: false, error: 'Stripe not configured' }
  }

  let event: Stripe.Event

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    logger.error('Webhook signature verification failed', err instanceof Error ? err : new Error(String(err)))
    return { success: false, error: 'Invalid signature' }
  }

  logger.info('Stripe webhook received', { eventType: event.type })

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode === 'subscription') {
          // Handle subscription payment
          await handleSubscriptionPayment(session)
        } else if (session.mode === 'payment' && session.metadata?.type === 'credit_purchase') {
          // Handle one-time credit purchase
          await handleCreditPurchase(session)
        }

        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice

        // Renew subscription credits
        await handleInvoicePaid(invoice)

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        // Downgrade user to free plan
        await handleSubscriptionCanceled(subscription)

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        // Update subscription status (e.g., past_due, canceled)
        await handleSubscriptionUpdated(subscription)

        break
      }

      default:
        logger.info('Stripe webhook unhandled event', { eventType: event.type })
    }

    return { success: true }
  } catch (error) {
    logger.error(`Stripe webhook error processing ${event.type}`, error instanceof Error ? error : new Error(String(error)))
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ============================================================================
// WEBHOOK EVENT HANDLERS
// ============================================================================

async function handleSubscriptionPayment(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  const planId = session.metadata?.planId as keyof typeof PLAN_PRICES

  if (!userId || !planId) {
    throw new Error('Missing userId or planId in session metadata')
  }

  logger.info('Webhook processing subscription payment', { userId, planId })

  const plan = PLAN_PRICES[planId]

  // 1. Create or update subscription record
  const stripeSubscriptionId = session.subscription as string
  const stripeCustomerId = session.customer as string

  const [existingSub] = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId)))
    .limit(1)

  if (existingSub) {
    // Update existing subscription
    await db
      .update(subscriptions)
      .set({
        status: 'active',
        currentPeriodStart: new Date(session.created * 1000),
        currentPeriodEnd: new Date((session.created + 30 * 24 * 60 * 60) * 1000), // Approx 30 days
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, existingSub.id))
  } else {
    // Get plan ID from DB (we need the actual UUID)
    // No userId filter: plans are system-level data, not user-specific
    const [dbPlan] = await db.select().from(plans).where(eq(plans.tier, planId)).limit(1)

    if (!dbPlan) {
      throw new Error(`Plan ${planId} not found in database`)
    }

    // Create new subscription
    await db.insert(subscriptions).values({
      userId,
      planId: dbPlan.id,
      status: 'active',
      stripeCustomerId,
      stripeSubscriptionId,
      currentPeriodStart: new Date(session.created * 1000),
      currentPeriodEnd: new Date((session.created + 30 * 24 * 60 * 60) * 1000),
      monthlyCredits: plan.credits,
    })
  }

  // 2. Update user tier and add credits
  await db
    .update(users)
    .set({
      tier: planId,
      credits: sql`${users.credits} + ${plan.credits}`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))

  logger.info('Webhook subscription activated', { userId, planId, creditsAdded: plan.credits })
}

async function handleCreditPurchase(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  const creditsStr = session.metadata?.credits

  if (!userId || !creditsStr) {
    throw new Error('Missing userId or credits in session metadata')
  }

  const credits = parseInt(creditsStr, 10)

  logger.info('Webhook processing credit purchase', { userId, credits })

  // Add credits to user account
  await db
    .update(users)
    .set({
      credits: sql`${users.credits} + ${credits}`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))

  logger.info('Webhook credits added', { userId, credits })
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const userId = invoice.subscription_details?.metadata?.userId

  if (!userId) {
    logger.warn('Webhook invoice missing userId', {})
    return
  }

  logger.info('Webhook processing invoice paid', { userId })

  // Get current subscription to know the monthly credit allocation
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))
    .limit(1)

  if (!sub) {
    logger.warn('Webhook no active subscription for renewal', {})
    return
  }

  // Renew monthly credits
  await db
    .update(users)
    .set({
      credits: sql`${users.credits} + ${sub.monthlyCredits}`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))

  // Update subscription period
  await db
    .update(subscriptions)
    .set({
      currentPeriodStart: new Date(invoice.period_start * 1000),
      currentPeriodEnd: new Date(invoice.period_end * 1000),
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, sub.id))

  logger.info('Webhook credits renewed', { userId, monthlyCredits: sub.monthlyCredits })
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId

  if (!userId) {
    throw new Error('Missing userId in subscription metadata')
  }

  logger.info('Webhook processing subscription cancellation', { userId })

  // Update subscription status
  await db
    .update(subscriptions)
    .set({
      status: 'canceled',
      canceledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id))

  // Downgrade user to free tier (but keep their remaining credits)
  await db
    .update(users)
    .set({
      tier: 'free',
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))

  logger.info('Webhook subscription canceled', { userId, tier: 'free' })
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  logger.info('Webhook processing subscription update', { subscriptionId: subscription.id })

  // Map Stripe status to our enum
  const statusMap: Record<string, string> = {
    active: 'active',
    canceled: 'canceled',
    past_due: 'past_due',
    trialing: 'trialing',
    paused: 'paused',
    unpaid: 'unpaid',
  }

  const status = statusMap[subscription.status] || 'active'

  // Update subscription status
  await db
    .update(subscriptions)
    .set({
      status: status as any,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id))

  logger.info('Webhook subscription updated', { subscriptionId: subscription.id, status })
}
