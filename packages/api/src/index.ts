import { router } from "./trpc.js";
import {
  auditRouter,
  consensusRouter,
  deliberationsRouter,
  expertsRouter,
  opinionsRouter,
  roundsRouter,
  usersRouter,
  votesRouter,
  systemLogsRouter,
  testLoggingRouter,
  // Quoorum routers
  quoorumRouter,
  quoorumFeedbackRouter,
  quoorumInsightsRouter,
  quoorumNotificationsRouter,
  quoorumReportsRouter,
  quoorumPublicApiRouter,
  adminQuoorumRouter,
  adminRouter,
  contextAssessmentRouter,
  debatesRouter,
  debateStrategyRouter,
  // Settings routers
  notificationSettingsRouter,
  sessionsRouter,
  apiKeysRouter,
  notificationsRouter,
  contextFilesRouter,
  // Billing router
  billingRouter,
  // Corporate Intelligence
  companiesRouter,
  departmentsRouter,
} from "./routers/index.js";

export const appRouter = router({
  audit: auditRouter,
  consensus: consensusRouter,
  deliberations: deliberationsRouter,
  experts: expertsRouter,
  opinions: opinionsRouter,
  rounds: roundsRouter,
  users: usersRouter,
  votes: votesRouter,
  systemLogs: systemLogsRouter,
  testLogging: testLoggingRouter, // TODO: Remove in production
  // Quoorum routers
  quoorum: quoorumRouter,
  quoorumFeedback: quoorumFeedbackRouter,
  quoorumInsights: quoorumInsightsRouter,
  quoorumNotifications: quoorumNotificationsRouter,
  quoorumReports: quoorumReportsRouter,
  quoorumPublicApi: quoorumPublicApiRouter,
  adminQuoorum: adminQuoorumRouter,
  admin: adminRouter,
  contextAssessment: contextAssessmentRouter,
  debates: debatesRouter,
  debateStrategy: debateStrategyRouter,
  // Settings routers
  notificationSettings: notificationSettingsRouter,
  sessions: sessionsRouter,
  apiKeys: apiKeysRouter,
  notifications: notificationsRouter,
  contextFiles: contextFilesRouter,
  // Billing
  billing: billingRouter,
  // Corporate Intelligence
  companies: companiesRouter,
  departments: departmentsRouter,
});

export type AppRouter = typeof appRouter;

export { router, publicProcedure, protectedProcedure, createContext } from "./trpc.js";
export type { Context } from "./trpc.js";
export { validateEnvironmentOrThrow, validateEnvironment, requireEnv, getEnvOrWarn } from "./lib/validate-env.js";
