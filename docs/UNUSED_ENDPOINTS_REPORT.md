# 📊 Reporte de Endpoints Infrautilizados

**Fecha:** 8/1/2026, 11:15:18

**Total routers:** 139
**Total procedures:** 910

## ❌ Routers Completamente Sin Usar (104)

### admin-agent-config

- **Procedures:** 3
- **Lista:** getConfig, saveConfig, generatePreview

### admin-ai-usage

- **Procedures:** 13
- **Lista:** getOverview, getProviderUsage, getQuotaStatus, getAlerts, getProviderHealth, getRateLimiterStatus, getMetrics, updateProviderLimits, forceCloseCircuit, resetMetrics, resetQuota, exportUsageData, getCostEstimate

### admin-analytics

- **Procedures:** 12
- **Lista:** getUsersSummary, getUserRegistrationTrend, getUsersByPlan, getUserRetention, getRevenueSummary, getRevenueTrend, getRevenueByPlan, getUsageSummary, getMessagesTrend, getTopUsersByActivity, getChurnMetrics, getExecutiveKPIs

### admin-api-keys

- **Procedures:** 8
- **Lista:** list, getById, create, revoke, updateRateLimit, getUsageStats, getAvailableScopes, getStats

### admin-communications

- **Procedures:** 9
- **Lista:** listAnnouncements, getAnnouncement, createAnnouncement, updateAnnouncement, deleteAnnouncement, sendNotification, broadcastNotification, listSentNotifications, getStats

### admin-dynamic-plans

- **Procedures:** 18
- **Lista:** listPlans, getPlan, createPlan, updatePlan, deletePlan, listFeatures, createFeature, updateFeature, deleteFeature, assignFeatureToPlan, updatePlanFeature, removePlanFeature, grantUserFeature, listUserOverrides, revokeUserFeature, getUserUsage, resetFeatureUsage, getStats

### admin-embedding-cache

- **Procedures:** 8
- **Lista:** getStats, clearCache, invalidateQuery, resetStats, warmup, logPerformance, getConfig, triggerWarmup

### admin-feedback

- **Procedures:** 9
- **Lista:** listFeatureRequests, getFeatureRequest, updateFeatureRequestStatus, listUserFeedback, respondToFeedback, markFeedbackRead, listNpsResponses, getNpsScore, getStats

### admin-forum

- **Procedures:** 8
- **Lista:** getAgents, estimateCost, listSessions, getSession, createSession, runDebate, deleteSession, getStats

### admin-growth

- **Procedures:** 31
- **Lista:** healthCheck, runVacancySniper, runWallieScout, runWallieScoutV2, getJobStatus, getJobResults, listJobs, createTemplate, listTemplates, useTemplate, deleteTemplate, createScheduledJob, listScheduledJobs, getScheduledJob, deleteScheduledJob, pauseScheduledJob, resumeScheduledJob, importLeadsToCRM, createOutreachCampaign, listOutreachCampaigns, getOutreachCampaign, pauseOutreachCampaign, resumeOutreachCampaign, deleteOutreachCampaign, generateAudio, sendAudioMessage, runAudioCampaign, listVoices, generateWAlliePost, runWAllieRoutine, startWAllieBot

### admin-knowledge

- **Procedures:** 3
- **Lista:** query, listSources, list

### admin-plans

- **Procedures:** 12
- **Lista:** list, getById, create, update, delete, updateFeatures, createTransition, listTransitions, deactivateTransition, listFeatureDefinitions, createFeatureDefinition, getStats

### admin-reports

- **Procedures:** 10
- **Lista:** listTemplates, listSavedReports, createReport, runReport, getExecutionHistory, deleteReport, exportUsers, exportSubscriptions, getStats, quickExport

### admin-rewards

- **Procedures:** 15
- **Lista:** listRewards, createReward, updateReward, deleteReward, listGamificationConfig, updateGamificationConfig, createGamificationConfig, listLevelConfig, updateLevelConfig, getSystemConfig, updateSystemConfig, initializeDefaults, listRedemptions, updateRedemptionStatus, getStats

### admin-subscriptions

- **Procedures:** 12
- **Lista:** list, getById, changePlan, cancel, reactivate, extendTrial, adjustLimits, resetUsage, listInvoices, markInvoicePaid, refundInvoice, getStats

### admin-support

- **Procedures:** 13
- **Lista:** listTickets, getTicket, createTicket, respondToTicket, assignTicket, changeTicketStatus, changeTicketPriority, getStats, getTicketsByCategory, getAvailableAdmins, generateAutoResponse, generateFollowUp, generateResolutionEmail

### admin-system

- **Procedures:** 14
- **Lista:** getServicesStatus, updateServiceStatus, listIncidents, getIncident, createIncident, addIncidentUpdate, listMaintenanceWindows, createMaintenanceWindow, updateMaintenanceStatus, listErrors, trackError, updateErrorStatus, getHealthDashboard, getDiagnostics

### admin-users

- **Procedures:** 12
- **Lista:** me, listUsers, getUserById, toggleUserActive, adjustUserLimits, listAdmins, createAdmin, revokeAdmin, listRoles, getPermissions, getActivityLog, setupInitial

### admin-wallie-config

- **Procedures:** 14
- **Lista:** getAgentConfig, toggleAgent, updateAllAgents, getResponseConfig, setResponseMode, updateModeInstructions, resetModeInstructions, getDefaultInstructions, getViewConfigs, toggleView, updateViewInstructions, resetViewInstructions, updateAllViewConfigs, getDefaultViewConfigs

### admin-webhooks

- **Procedures:** 12
- **Lista:** list, getById, create, update, setStatus, regenerateSecret, delete, sendTest, retryDelivery, getDeliveries, getAvailableEvents, getStats

### admin

- **Procedures:** 8
- **Lista:** listAll, getById, create, globalSummary, agentStats, subscriptionStats, listAll, invoices

### agent-config

- **Procedures:** 2
- **Lista:** get, update

### ai-config

- **Procedures:** 2
- **Lista:** getGlobal, updateGlobal

### ai-models

- **Procedures:** 8
- **Lista:** list, getConfig, saveConfig, updateOrder, toggleModel, setDefaultForTier, getProviders, resetToDefaults

### behavior-dna

- **Procedures:** 8
- **Lista:** getMyDefault, getForClient, updateDefault, updateForClient, deleteClientConfig, applyPreset, listPresets, listClientConfigs

### business-profile

- **Procedures:** 11
- **Lista:** get, upsert, updateWebsiteData, getRAGContext, listDocuments, addDocument, deleteDocument, listSocialAccounts, addSocialAccount, updateSocialAnalysis, deleteSocialAccount

### campaigns

- **Procedures:** 12
- **Lista:** list, get, create, update, updateStatus, delete, addMessage, updateMessage, deleteMessage, getAudience, countAudience, getMetrics

### case-studies

- **Procedures:** 7
- **Lista:** getApprovedCaseStudies, getPotentialCaseStudies, generateDraft, requestApproval, approveCaseStudy, revokeCaseStudy, getUserROIReport

### classifiers

- **Procedures:** 9
- **Lista:** intent, sentiment, urgency, scoreLead, predictChurn, recommendChannel, classifyMessage, batchClassify, getStats

### client-activity

- **Procedures:** 4
- **Lista:** searchMessages, getClientTimeline, getActivitySummary, getGlobalTimeline

### client-enrichment

- **Procedures:** 7
- **Lista:** getExtractedData, analyzeClient, applySuggestion, ignoreSuggestion, getPendingEnrichments, getStats, receiveEnrichmentFromMiniServer

### client-groups

- **Procedures:** 11
- **Lista:** list, get, getMembers, create, update, delete, addMembers, removeMembers, evaluateSmartGroup, getAvailableFields, syncSmartGroup

### clients-360-helpers

- **Procedures:** 0
- **Lista:**

### clients-360

- **Procedures:** 1
- **Lista:** get360View

### clients-base

- **Procedures:** 6
- **Lista:** list, getById, create, update, delete, togglePersonalStatus

### clients-pipeline

- **Procedures:** 2
- **Lista:** getByPipeline, updatePipelineStatus

### clients-profile-basic

- **Procedures:** 1
- **Lista:** getProfile

### clients-profile-full

- **Procedures:** 1
- **Lista:** getFullProfile

### clients-profile

- **Procedures:** 0
- **Lista:**

### clients

- **Procedures:** 0
- **Lista:**

### cold-calling

- **Procedures:** 0
- **Lista:**

### compliance

- **Procedures:** 12
- **Lista:** getAuditLogs, getAuditStats, exportAuditLogs, getRetentionSettings, updateRetentionSettings, requestDataExport, getExportRequestStatus, listExportRequests, getDashboard, getActiveAddons, reportIncident, getMyIncidents

### conversation-psychology

- **Procedures:** 4
- **Lista:** getByConversation, analyze, updatePhase, getSummary

### corrective-rag

- **Procedures:** 0
- **Lista:**

### debug-tags

- **Procedures:** 1
- **Lista:** diagnose

### email-onboarding

- **Procedures:** 7
- **Lista:** connectGmail, connectOutlook, getAvailableProviders, connectSMTP, getConnectedAccounts, disconnectAccount, setPrimaryAccount

### email

- **Procedures:** 3
- **Lista:** sendWelcome, sendNewMessageNotification, sendSubscriptionConfirmed

### emotional-intelligence

- **Procedures:** 4
- **Lista:** analyzeMessage, getByMessage, getConversationTrajectory, getAlerts

### feature-flags

- **Procedures:** 8
- **Lista:** isEnabled, get, list, create, update, delete, setUserOverride, deleteUserOverride

### forum-deals

- **Procedures:** 10
- **Lista:** linkDebate, unlinkDebate, getDebatesByDeal, getDealsByDebate, updateInfluence, getRecommendations, generateRecommendations, dismissRecommendation, getInfluenceStats, getSuggestedDeals

### forum-feedback

- **Procedures:** 6
- **Lista:** submit, getByDebate, getExpertRatings, getTopExperts, getMyFeedback, delete

### forum-insights

- **Procedures:** 5
- **Lista:** getRecent, getStats, store, getById, rate

### forum-notifications

- **Procedures:** 10
- **Lista:** list, getUnreadCount, markAsRead, markAllAsRead, archive, archiveAllRead, cleanupOld, getPreferences, updatePreferences, create

### forum-public-api

- **Procedures:** 12
- **Lista:** generateApiKey, listApiKeys, revokeApiKey, createDebate, getDebate, getDebateStatus, listDebates, createWebhook, listWebhooks, updateWebhook, deleteWebhook, testWebhook

### forum-reports

- **Procedures:** 13
- **Lista:** generateDebateReport, generateWeeklySummary, generateCustomReport, get, list, delete, share, getShared, createSchedule, listSchedules, updateSchedule, deleteSchedule, runScheduleNow

### gdpr

- **Procedures:** 6
- **Lista:** exportData, requestDeletion, cancelDeletion, getDeletionStatus, getComplianceStatus, deleteAccount

### health

- **Procedures:** 2
- **Lista:** check, protected

### knowledge-base

- **Procedures:** 4
- **Lista:** listDocuments, getDocument, createDocument, deleteDocument

### knowledge-context

- **Procedures:** 2
- **Lista:** listClientContext, deleteClientContext

### knowledge-faqs

- **Procedures:** 2
- **Lista:** listFAQs, deleteFAQ

### knowledge-import

- **Procedures:** 3
- **Lista:** importWhatsAppHistory, parseAndImportWhatsAppText, previewWhatsAppParse

### knowledge-parse

- **Procedures:** 4
- **Lista:** previewWhatsAppExport, getStyleExamples, getImportStats, deleteWhatsAppImport

### knowledge-scrape

- **Procedures:** 2
- **Lista:** getScrapingStatus, previewUrl

### knowledge-search

- **Procedures:** 2
- **Lista:** shouldUseRAG, getStats

### knowledge

- **Procedures:** 0
- **Lista:**

### linkedin

- **Procedures:** 10
- **Lista:** getStatus, getAuthUrl, listConversations, getConversation, markAsRead, togglePin, archiveConversation, linkToClient, getStats, importConversation

### magic-link

- **Procedures:** 2
- **Lista:** sendMagicLink, checkEmail

### marketing-calendar

- **Procedures:** 10
- **Lista:** list, get, getUpcoming, create, update, delete, createTemplate, getTemplates, getDefaultEvents, seedDefaultEvents

### onboarding-analysis

- **Procedures:** 8
- **Lista:** discoverBusiness, importContacts, getContacts, togglePersonal, bulkTogglePersonal, analyzeOpportunities, getInsights, getAnalysisStatus

### persona-detection

- **Procedures:** 4
- **Lista:** getByClient, analyzeClient, getRecommendations, listAll

### phone-auth

- **Procedures:** 4
- **Lista:** sendOtp, verifyOtp, diagnose, checkOtpStatus

### psychology-engine

- **Procedures:** 5
- **Lista:** getRecommendations, generateAnnotation, logSuggestionUsed, updateSuggestionOutcome, getEffectivenessStats

### psychology-metrics

- **Procedures:** 4
- **Lista:** phaseTransitionStats, annotationDismissRates, performanceMetrics, dashboardOverview

### public-pricing

- **Procedures:** 3
- **Lista:** getPlans, getPlanBySlug, comparePlans

### reciprocity

- **Procedures:** 8
- **Lista:** recordEvent, getBalance, getHistory, getReadyForAsk, getInDeficit, getStats, deleteEvent, suggestEvents

### sales-insights

- **Procedures:** 6
- **Lista:** getRevenueForecast, getTopLeads, getObjectionAnalysis, getSalesMetrics, getAtRiskClients, getCoachingSuggestions

### saved-replies

- **Procedures:** 10
- **Lista:** list, getById, create, update, delete, incrementUsage, getCategories, getCategoryCounts, toggleFavorite, trackUsage

### sessions-single

- **Procedures:** 6
- **Lista:** initSession, validateSession, renewActivity, terminateSession, getCurrentSession, cleanupInactiveSessions

### sessions

- **Procedures:** 5
- **Lista:** list, revoke, revokeAll, getActivityLog, getActivitySummary

### two-factor

- **Procedures:** 6
- **Lista:** getStatus, setup, enable, disable, verify, regenerateBackupCodes

### wallie-actions

- **Procedures:** 6
- **Lista:** proposeAction, confirmAction, cancelAction, getPendingActions, parseActionIntent, executeActionDirect

### wallie-advanced

- **Procedures:** 1
- **Lista:** supervisedChat

### wallie-analysis-daily

- **Procedures:** 1
- **Lista:** getDailySummary

### wallie-analysis-suggestions

- **Procedures:** 1
- **Lista:** detectIntent

### wallie-analysis

- **Procedures:** 0
- **Lista:**

### wallie-annotations-actions

- **Procedures:** 6
- **Lista:** dismiss, rateHelpfulness, useSuggestedMessage, delete, getStats, cleanupExpired

### wallie-annotations-queries

- **Procedures:** 5
- **Lista:** listByConversation, getUnreadCounts, create, markAsRead, markAllAsRead

### wallie-annotations

- **Procedures:** 0
- **Lista:**

### wallie-chat-context

- **Procedures:** 0
- **Lista:**

### wallie-chat-helpers

- **Procedures:** 0
- **Lista:**

### wallie-chat-open

- **Procedures:** 0
- **Lista:**

### wallie-chat

- **Procedures:** 0
- **Lista:**

### wallie-interactions

- **Procedures:** 5
- **Lista:** getPendingReminders, continueInteraction, getInteractions, toggleCollapsed, deleteInteraction

### wallie-management

- **Procedures:** 3
- **Lista:** previewPlan, getUsageReport, canUseHallucinationChecker

### wallie-smart

- **Procedures:** 1
- **Lista:** smartChat

### wallie-support

- **Procedures:** 1
- **Lista:** supportChat

### wallie-voice

- **Procedures:** 5
- **Lista:** voiceCommand, voiceStatus, startVoiceCall, voiceCallMessage, endVoiceCall

### wallie

- **Procedures:** 0
- **Lista:**

### whatsapp-connections

- **Procedures:** 9
- **Lista:** getStatus, startQrSession, pollStatus, disconnect, checkMigrationStatus, startMigration, completeCloudApiSetup, declineMigration, incrementConversationCount

### whatsapp-magic-login

- **Procedures:** 6
- **Lista:** requestMagicLink, createToken, validateToken, checkToken, diagnose, testMagicLink

### whatsapp-templates

- **Procedures:** 10
- **Lista:** list, getById, create, update, delete, submitToMeta, syncStatus, incrementUsage, listApproved, duplicate

### wizard-ab-testing

- **Procedures:** 10
- **Lista:** getActiveTest, getVariantForUser, getVariant, markCompleted, listTests, getTestDetails, createTest, getAnalysisHistory, startTest, stopTest

### wizard

- **Procedures:** 2
- **Lista:** getProgress, updateWizardV2

### workers

- **Procedures:** 0
- **Lista:**

## ⚠️ Routers Infrautilizados (12)

### addons

- **Uso:** 3/9 (33.3%)
- **Procedures sin usar:** 6
  - listAvailable, getActive, getDetails, unsubscribe, updateConfig, previewPrice
- **Procedures usados:** 3
  - `subscribe`: 1 usos en 1 archivo(s)
  - `createPrivacyModeCheckout`: 1 usos en 1 archivo(s)
  - `checkForumAccess`: 1 usos en 1 archivo(s)

### ai

- **Uso:** 4/10 (40.0%)
- **Procedures sin usar:** 6
  - quickResponse, analyzeMessage, detectIntent, detectLanguage, getIntentTypes, updateStyleCustomInstructions
- **Procedures usados:** 4
  - `generateResponse`: 3 usos en 3 archivo(s)
  - `suggestedReplies`: 3 usos en 3 archivo(s)
  - `analyzeUserStyle`: 1 usos en 1 archivo(s)
  - `getStyleData`: 1 usos en 1 archivo(s)

### analytics

- **Uso:** 4/10 (40.0%)
- **Procedures sin usar:** 6
  - trackEvent, trackDraft, getActivityChart, getConversionFunnel, getIntentBreakdown, getActiveWorkers
- **Procedures usados:** 4
  - `getProductivitySummary`: 2 usos en 2 archivo(s)
  - `getSafetyMetrics`: 2 usos en 2 archivo(s)
  - `getReactivationMetrics`: 2 usos en 2 archivo(s)
  - `getCostMetrics`: 2 usos en 2 archivo(s)

### coaching

- **Uso:** 1/3 (33.3%)
- **Procedures sin usar:** 2
  - getClientCoaching, getPersonaDetails
- **Procedures usados:** 1
  - `analyzeConversation`: 1 usos en 1 archivo(s)

### goals

- **Uso:** 2/10 (20.0%)
- **Procedures sin usar:** 8
  - getConfig, list, getCurrent, getById, updateProgress, update, cancel, delete
- **Procedures usados:** 2
  - `getActiveForDashboard`: 1 usos en 1 archivo(s)
  - `create`: 1 usos en 1 archivo(s)

### invoices

- **Uso:** 1/8 (12.5%)
- **Procedures sin usar:** 7
  - list, getById, create, markAsPaid, getFiscalProfile, updateFiscalProfile, getSummary
- **Procedures usados:** 1
  - `downloadPdf`: 1 usos en 1 archivo(s)

### mining

- **Uso:** 2/8 (25.0%)
- **Procedures sin usar:** 6
  - listQualified, getLeads, processBatch, overallStats, triggerAutoDiscovery, startMining
- **Procedures usados:** 2
  - `listQueue`: 1 usos en 1 archivo(s)
  - `batchStats`: 1 usos en 1 archivo(s)

### productivity

- **Uso:** 2/9 (22.2%)
- **Procedures sin usar:** 7
  - logActivity, getRecentActivity, getDailyMetrics, calculateDailyMetrics, createGoal, getActiveGoals, updateGoalProgress
- **Procedures usados:** 2
  - `getProductivitySummary`: 3 usos en 3 archivo(s)
  - `getActivityByHour`: 2 usos en 2 archivo(s)

### prospecting

- **Uso:** 3/18 (16.7%)
- **Procedures sin usar:** 15
  - getProspect, createProspect, updateProspect, deleteProspect, getSequence, createSequence, updateSequence, deleteSequence, enrollProspect, unenrollProspect, listEnrollments, listEnrichmentJobs, createEnrichmentJob, bulkCreateProspects, bulkEnrollProspects
- **Procedures usados:** 3
  - `getStats`: 1 usos en 1 archivo(s)
  - `listProspects`: 1 usos en 1 archivo(s)
  - `listSequences`: 1 usos en 1 archivo(s)

### scoring

- **Uso:** 3/15 (20.0%)
- **Procedures sin usar:** 12
  - recalculate, getLeaderboard, getHotLeads, getNeedingAttention, getStats, filterClients, getVipClients, getUrgentClients, getRecurringClients, setRecurringStatus, onMessageReceived, getExtendedStats
- **Procedures usados:** 3
  - `getClientScore`: 1 usos en 1 archivo(s)
  - `setVipStatus`: 2 usos en 2 archivo(s)
  - `batchRecalculate`: 2 usos en 2 archivo(s)

### usage

- **Uso:** 3/7 (42.9%)
- **Procedures sin usar:** 4
  - record, getBreakdownByReason, getDailyTrend, checkLimits
- **Procedures usados:** 3
  - `getSummary`: 2 usos en 2 archivo(s)
  - `getSettings`: 2 usos en 2 archivo(s)
  - `updateSettings`: 2 usos en 2 archivo(s)

### whatsapp

- **Uso:** 1/7 (14.3%)
- **Procedures sin usar:** 6
  - getConversations, getConversation, getMessages, sendButtons, archiveConversation, reopenConversation
- **Procedures usados:** 1
  - `sendMessage`: 2 usos en 2 archivo(s)
