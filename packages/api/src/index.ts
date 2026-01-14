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
  quoorumDealsRouter,
  quoorumFeedbackRouter,
  quoorumInsightsRouter,
  quoorumNotificationsRouter,
  quoorumReportsRouter,
  quoorumPublicApiRouter,
  adminQuoorumRouter,
  contextAssessmentRouter,
  debatesRouter,
  // Settings routers
  notificationSettingsRouter,
  sessionsRouter,
  apiKeysRouter,
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
  quoorumDeals: quoorumDealsRouter,
  quoorumFeedback: quoorumFeedbackRouter,
  quoorumInsights: quoorumInsightsRouter,
  quoorumNotifications: quoorumNotificationsRouter,
  quoorumReports: quoorumReportsRouter,
  quoorumPublicApi: quoorumPublicApiRouter,
  adminQuoorum: adminQuoorumRouter,
  contextAssessment: contextAssessmentRouter,
  debates: debatesRouter,
  // Settings routers
  notificationSettings: notificationSettingsRouter,
  sessions: sessionsRouter,
  apiKeys: apiKeysRouter,
});

export type AppRouter = typeof appRouter;

export { router, publicProcedure, protectedProcedure, createContext } from "./trpc.js";
export type { Context } from "./trpc.js";
