import { router } from "./trpc";
import {
  auditRouter,
  consensusRouter,
  deliberationsRouter,
  expertsRouter,
  workersRouter,
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
  adminRolesRouter,
  contextAssessmentRouter,
  debatesRouter,
  debateStrategyRouter,
  // Settings routers
  notificationSettingsRouter,
  sessionsRouter,
  apiKeysRouter,
  contextFilesRouter,
  // Billing router
  billingRouter,
  // Team Members
  teamMembersRouter,
  teamAnalyticsRouter,
  // Corporate Intelligence
  companiesRouter,
  departmentsRouter,
  // User Backstory
  userBackstoryRouter,
  // Decision-Making Frameworks
  frameworksRouter,
  // Process Timeline
  processTimelineRouter,
  // Referrals
  referralsRouter,
  // Scenarios (Decision Playbooks)
  scenariosRouter,
  // Integrations
  slackRouter,
  // Admin Pricing
  adminPricingRouter,
} from "./routers/index";

export const appRouter = router({
  audit: auditRouter,
  consensus: consensusRouter,
  deliberations: deliberationsRouter,
  experts: expertsRouter,
  workers: workersRouter,
  opinions: opinionsRouter,
  rounds: roundsRouter,
  users: usersRouter,
  votes: votesRouter,
  systemLogs: systemLogsRouter,
  testLogging: testLoggingRouter, // Admin only, dev-mode protected (throws FORBIDDEN in prod)
  // Quoorum routers
  quoorum: quoorumRouter,
  quoorumFeedback: quoorumFeedbackRouter,
  quoorumInsights: quoorumInsightsRouter,
  quoorumNotifications: quoorumNotificationsRouter,
  quoorumReports: quoorumReportsRouter,
  quoorumPublicApi: quoorumPublicApiRouter,
  adminQuoorum: adminQuoorumRouter,
  admin: adminRouter,
  adminRoles: adminRolesRouter,
  contextAssessment: contextAssessmentRouter,
  debates: debatesRouter,
  debateStrategy: debateStrategyRouter,
  // Settings routers
  notificationSettings: notificationSettingsRouter,
  sessions: sessionsRouter,
  apiKeys: apiKeysRouter,
  contextFiles: contextFilesRouter,
  // Billing
  billing: billingRouter,
  // Team Members
  teamMembers: teamMembersRouter,
  teamAnalytics: teamAnalyticsRouter,
  // Corporate Intelligence
  companies: companiesRouter,
  departments: departmentsRouter,
  // User Backstory
  userBackstory: userBackstoryRouter,
  // Decision-Making Frameworks
  frameworks: frameworksRouter,
  // Process Timeline
  processTimeline: processTimelineRouter,
  // Referrals
  referrals: referralsRouter,
  // Scenarios (Decision Playbooks)
  scenarios: scenariosRouter,
  // Integrations
  slack: slackRouter,
  // Admin Pricing Configuration
  adminPricing: adminPricingRouter,
});

export type AppRouter = typeof appRouter;

export { router, publicProcedure, protectedProcedure, createContext } from "./trpc";
export type { Context } from "./trpc";
export { validateEnvironmentOrThrow, validateEnvironment, requireEnv, getEnvOrWarn } from "./lib/validate-env";

// Export notification helper functions
export {
  sendForumNotification,
  notifyDebateCompleted,
  notifyDebateFailed,
} from "./routers/quoorum-notifications";

// Export system logger
export { systemLogger } from "./lib/system-logger";
