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
});

export type AppRouter = typeof appRouter;

export { router, publicProcedure, protectedProcedure } from "./trpc.js";
export type { Context } from "./trpc.js";
