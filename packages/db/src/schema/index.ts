export { adminRoles, adminRoleEnum, adminUsers } from "./admin";
export type { AdminRole, AdminUser, NewAdminRole, NewAdminUser } from "./admin";

export { auditLogs } from "./audit-logs";
export type { AuditAction, AuditDetails, AuditLog, NewAuditLog } from "./audit-logs";

export { clients } from "./clients";
export type { Client, NewClient } from "./clients";

export { consensus } from "./consensus";
export type { Consensus, DissentingExpert, NewConsensus } from "./consensus";

export { conversations } from "./conversations";
export type { Conversation, NewConversation } from "./conversations";

export { deals, dealStageEnum } from "./deals";
export type { Deal, NewDeal } from "./deals";

export { deliberations } from "./deliberations";
export type { Deliberation, DeliberationStatus, NewDeliberation } from "./deliberations";

export { experts } from "./experts";
export type { AIConfig, AIProvider, Expert, NewExpert } from "./experts";

export { workers, workersRelations, workerRoleEnum, workerTypeEnum } from "./workers";
export type { Worker, NewWorker, WorkerRole, WorkerType } from "./workers";

export { opinions } from "./opinions";
export type { NewOpinion, Opinion, OpinionMetadata } from "./opinions";

export { profiles } from "./profiles";
export type { NewProfile, Profile } from "./profiles";

export { rounds } from "./rounds";
export type { NewRound, Round, RoundStatus } from "./rounds";

export { users } from "./users";
export type { NewUser, User } from "./users";

export { votes } from "./votes";
export type { NewVote, Vote } from "./votes";

// User Backstory (onboarding context)
export {
  userBackstory,
  userBackstoryRelations,
  roleEnum,
  industryEnum,
  companySizeEnum,
  companyStageEnum,
  decisionStyleEnum,
} from "./user-backstory";
export type { UserBackstory, NewUserBackstory, BackstoryFormData } from "./user-backstory";

// Quoorum-specific schemas
export * from "./quoorum";
export * from "./quoorum-api";
export * from "./quoorum-consultations";
export * from "./quoorum-deals";
export * from "./quoorum-debates";
export * from "./quoorum-feedback";
export * from "./quoorum-notifications";
export * from "./quoorum-reports";

// Subscriptions and billing
export * from "./subscriptions";

// Credit Transactions
export {
  creditTransactions,
  creditTransactionsRelations,
  creditTransactionTypeEnum,
  creditTransactionSourceEnum,
} from "./credit-transactions";
export type {
  CreditTransaction,
  NewCreditTransaction,
} from "./credit-transactions";

// System logging
export { systemLogs, logLevelEnum, logSourceEnum } from "./system-logs";
export type { SystemLog, NewSystemLog } from "./system-logs";

// Alias for backwards compatibility (quoorum package uses 'notifications' not 'quoorumNotifications')
export { quoorumNotifications as notifications } from "./quoorum-notifications";

// User settings
export { notificationSettings, notificationSettingsRelations } from "./notification-settings";
export type { NotificationSettings, NewNotificationSettings } from "./notification-settings";

// Sessions
export { sessions, sessionsRelations } from "./sessions";
export type { Session, NewSession } from "./sessions";

// API Keys
export { apiKeys, apiKeysRelations } from "./api-keys";
export type { ApiKey, NewApiKey } from "./api-keys";

// Webhook Events (Idempotency)
export { webhookEvents } from "./webhook-events";
export type { WebhookEvent, NewWebhookEvent } from "./webhook-events";

// User Context Files
export { userContextFiles } from "./user-context-files";
export type { UserContextFile, NewUserContextFile } from "./user-context-files";

// Corporate Intelligence
export { companies, companiesRelations } from "./companies";
export type { Company, NewCompany } from "./companies";

export { departments, departmentsRelations, departmentTypeEnum } from "./departments";
export type { Department, NewDepartment, DepartmentType } from "./departments";

export { workerDepartments, workerDepartmentsRelations } from "./worker-departments";
export type { WorkerDepartment, NewWorkerDepartment } from "./worker-departments";

// Decision-Making Frameworks
export {
  frameworks,
  debateFrameworks,
  frameworksRelations,
  debateFrameworksRelations,
} from "./frameworks";
export type { Framework, NewFramework, DebateFramework, NewDebateFramework } from "./frameworks";

// Team Members
export { teamMembers, teamMembersRelations, teamMemberRoleEnum, teamMemberStatusEnum } from "./team-members";
export type { TeamMember, NewTeamMember } from "./team-members";

// Process Timeline
export { processTimeline, processTimelineRelations, processStatusEnum, processPhaseStatusEnum } from "./process-timeline";
export type { ProcessTimeline, NewProcessTimeline, ProcessPhase, ProcessStatus } from "./process-timeline";

// Referrals
export { referralCodes, referralCodesRelations, referrals, referralsRelations, referralStatusEnum, referralRewardTypeEnum } from "./referrals";
export type { ReferralCode, NewReferralCode, Referral, NewReferral } from "./referrals";

// Scenarios (Decision Playbooks)
export { scenarios, scenariosRelations, scenarioSegmentEnum, scenarioStatusEnum } from "./scenarios";
export type { Scenario, NewScenario, ScenarioSegment, ScenarioStatus } from "./scenarios";

export { scenarioUsage } from "./scenario-usage";
export type { ScenarioUsage, NewScenarioUsage } from "./scenario-usage";

// Pricing Configuration
export {
  pricingGlobalConfig,
  tierPricingConfig,
  pricingChangeHistory,
  pricingGlobalConfigRelations,
  tierPricingConfigRelations,
  pricingChangeHistoryRelations,
} from "./pricing-config";
export type {
  PricingGlobalConfig,
  NewPricingGlobalConfig,
  TierPricingConfig,
  NewTierPricingConfig,
  PricingChangeHistory,
  NewPricingChangeHistory,
} from "./pricing-config";
