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
  // Forum routers
  forumRouter,
  forumDealsRouter,
  forumFeedbackRouter,
  forumInsightsRouter,
  forumNotificationsRouter,
  forumReportsRouter,
  forumPublicApiRouter,
  adminForumRouter,
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
  // Forum routers
  forum: forumRouter,
  forumDeals: forumDealsRouter,
  forumFeedback: forumFeedbackRouter,
  forumInsights: forumInsightsRouter,
  forumNotifications: forumNotificationsRouter,
  forumReports: forumReportsRouter,
  forumPublicApi: forumPublicApiRouter,
  adminForum: adminForumRouter,
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
