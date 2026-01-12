export { adminRoles, adminRoleEnum, adminUsers } from "./admin.js";
export type { AdminRole, AdminUser, NewAdminRole, NewAdminUser } from "./admin.js";

export { auditLogs } from "./audit-logs.js";
export type { AuditAction, AuditDetails, AuditLog, NewAuditLog } from "./audit-logs.js";

export { clients } from "./clients.js";
export type { Client, NewClient } from "./clients.js";

export { consensus } from "./consensus.js";
export type { Consensus, DissentingExpert, NewConsensus } from "./consensus.js";

export { conversations } from "./conversations.js";
export type { Conversation, NewConversation } from "./conversations.js";

export { deals, dealStageEnum } from "./deals.js";
export type { Deal, NewDeal } from "./deals.js";

export { deliberations } from "./deliberations.js";
export type { Deliberation, DeliberationStatus, NewDeliberation } from "./deliberations.js";

export { experts } from "./experts.js";
export type { AIConfig, AIProvider, Expert, NewExpert } from "./experts.js";

export { opinions } from "./opinions.js";
export type { NewOpinion, Opinion, OpinionMetadata } from "./opinions.js";

export { profiles } from "./profiles.js";
export type { NewProfile, Profile } from "./profiles.js";

export { rounds } from "./rounds.js";
export type { NewRound, Round, RoundStatus } from "./rounds.js";

export { users } from "./users.js";
export type { NewUser, User } from "./users.js";

export { votes } from "./votes.js";
export type { NewVote, Vote } from "./votes.js";

// Forum-specific schemas
export * from "./forum.js";
export * from "./forum-api.js";
export * from "./forum-consultations.js";
export * from "./forum-deals.js";
export * from "./forum-debates.js";
export * from "./forum-feedback.js";
export * from "./forum-notifications.js";
export * from "./forum-reports.js";

// Subscriptions and billing
export * from "./subscriptions.js";

// Alias for backwards compatibility (forum package uses 'notifications' not 'forumNotifications')
export { forumNotifications as notifications } from "./forum-notifications.js";
