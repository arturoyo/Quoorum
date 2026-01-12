# Workers System - Wallie

> **Last updated:** 10 Dec 2025
> **Package:** `@wallie/workers`

---

## Current Workers (12 Active)

| Worker | Trigger | Frequency | Description |
|--------|---------|-----------|-------------|
| `dailySummary` | Cron | 8:00 AM | Generates daily summary email with stats, reminders, follow-ups |
| `conversationAnalysis` | Event | On read | Extracts entities, creates AI reminders from conversations |
| `reminderCheck` | Cron | Every hour | Checks due reminders, sends notifications |
| `scoringAnalysis` | Event | 10min debounce | AI-powered lead scoring based on conversation |
| `hotLeadNotification` | Event | Immediate | Notifies when high-intent lead detected |
| `gmailSync` | Cron | Every 15 min | Syncs Gmail inbox, threads, drafts |
| `gmailSyncSingleUser` | Event | On demand | Syncs Gmail for specific user |
| `knowledgeImport` | Event | On upload | Processes WhatsApp exports, documents |
| `knowledgeBatchImport` | Event | On upload | Processes large imports (10k+ messages) |
| `knowledgeDelete` | Event | On request | GDPR-compliant data deletion |
| `audioReceived` | Event | On message | Transcribes WhatsApp audio messages |
| `safetyLimiter` | Multiple | Continuous | Rate limiting, usage caps, glass ceiling |

---

## Recommended New Workers

### High Priority (Add for MVP)

#### 1. `outlookSync`
**Purpose:** Sync Microsoft Outlook/365 emails (same as gmailSync)
**Trigger:** Cron every 15 min
**Value:** Complete email coverage (Gmail + Outlook = 80%+ of business email)
```typescript
// Similar structure to gmail-sync.ts
export const outlookSync = inngest.createFunction(
  { id: 'outlook-sync', name: 'Sync Outlook Emails' },
  { cron: '*/15 * * * *' },
  async ({ step }) => {
    // Use Microsoft Graph API
    // Sync inbox, sent, drafts
  }
)
```

#### 2. `sequenceRunner`
**Purpose:** Execute prospecting sequences automatically
**Trigger:** Cron every hour
**Value:** Automates sales outreach, reduces manual work
```typescript
export const sequenceRunner = inngest.createFunction(
  { id: 'sequence-runner', name: 'Run Prospecting Sequences' },
  { cron: '0 * * * *' }, // Every hour
  async ({ step }) => {
    // Find sequences with pending steps
    // Execute steps (email, wait, task)
    // Update enrollment status
  }
)
```

#### 3. `clientChurnDetection`
**Purpose:** Detect at-risk clients based on inactivity
**Trigger:** Cron daily at 7 AM
**Value:** Proactive retention, saves revenue
```typescript
export const clientChurnDetection = inngest.createFunction(
  { id: 'client-churn-detection', name: 'Detect At-Risk Clients' },
  { cron: '0 7 * * *' },
  async ({ step }) => {
    // Find clients with no activity > 14 days
    // Calculate churn risk score
    // Create proactive actions
    // Notify user
  }
)
```

### Medium Priority (Phase 2)

#### 4. `weeklyReport`
**Purpose:** Weekly performance summary email
**Trigger:** Cron Mondays 9 AM
**Value:** Engagement, habit formation
```typescript
export const weeklyReport = inngest.createFunction(
  { id: 'weekly-report', name: 'Generate Weekly Report' },
  { cron: '0 9 * * 1' }, // Mondays 9 AM
  async ({ step }) => {
    // Aggregate week's metrics
    // Compare to previous week
    // Top clients, conversion rates
    // AI-generated insights
  }
)
```

#### 5. `prospectEnrichment`
**Purpose:** Enrich prospect data from external sources
**Trigger:** Event on prospect create
**Value:** Better data quality, higher conversion
```typescript
export const prospectEnrichment = inngest.createFunction(
  { id: 'prospect-enrichment', name: 'Enrich Prospect Data' },
  { event: 'prospect/created' },
  async ({ event, step }) => {
    // Lookup LinkedIn profile
    // Find company info
    // Estimate company size
    // Add to prospect record
  }
)
```

#### 6. `linkedinSync`
**Purpose:** Sync LinkedIn conversations (when API available)
**Trigger:** Cron every 30 min
**Value:** Unified inbox for all channels
```typescript
// Note: Requires LinkedIn partnership approval
export const linkedinSync = inngest.createFunction(
  { id: 'linkedin-sync', name: 'Sync LinkedIn Messages' },
  { cron: '*/30 * * * *' },
  async ({ step }) => {
    // Use LinkedIn Messaging API
    // Sync conversations
    // Match to existing clients
  }
)
```

### Low Priority (Future)

#### 7. `campaignScheduler`
**Purpose:** Schedule and execute marketing campaigns
**Trigger:** Cron every 5 min
**Value:** Marketing automation

#### 8. `dataBackup`
**Purpose:** Periodic data export for compliance
**Trigger:** Cron weekly
**Value:** GDPR compliance, disaster recovery

#### 9. `invoiceReminder`
**Purpose:** Send payment reminders for overdue invoices
**Trigger:** Cron daily
**Value:** Cash flow improvement

#### 10. `whatsappBroadcast`
**Purpose:** Send bulk WhatsApp messages (with rate limiting)
**Trigger:** Event on campaign start
**Value:** Marketing, announcements

---

## Worker Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        INNGEST                               │
│  (Serverless background job orchestrator)                   │
└─────────────────┬───────────────────────────────────────────┘
                  │
    ┌─────────────┴─────────────┐
    │                           │
┌───▼───┐               ┌───────▼───────┐
│ CRON  │               │    EVENTS     │
│ Jobs  │               │  (triggered)  │
└───┬───┘               └───────┬───────┘
    │                           │
    ├── dailySummary            ├── conversationAnalysis
    ├── reminderCheck           ├── scoringAnalysis
    ├── gmailSync               ├── hotLeadNotification
    └── (new) outlookSync       ├── knowledgeImport
                                ├── audioReceived
                                └── (new) sequenceRunner
```

---

## Implementation Guide

### Adding a New Worker

1. **Create function file:**
```typescript
// packages/workers/src/functions/my-worker.ts
import { inngest } from '../client'

export const myWorker = inngest.createFunction(
  {
    id: 'my-worker',
    name: 'My Worker Description',
    retries: 3, // Optional: retry on failure
  },
  { cron: '0 * * * *' }, // Or { event: 'my-event' }
  async ({ step }) => {
    // Step 1: Fetch data
    const data = await step.run('fetch-data', async () => {
      // ...
    })

    // Step 2: Process
    const result = await step.run('process', async () => {
      // ...
    })

    return { success: true, result }
  }
)
```

2. **Export in index.ts:**
```typescript
// packages/workers/src/index.ts
export { myWorker } from './functions/my-worker'

export const wallieFunctions = [
  // ... existing
  myWorker,
]
```

3. **Register with Inngest:**
Workers are automatically registered when `wallieFunctions` is imported.

---

## Environment Variables

```env
# Inngest (required for workers)
INNGEST_EVENT_KEY=xxx
INNGEST_SIGNING_KEY=xxx

# Gmail Sync
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx

# Outlook Sync (new)
OUTLOOK_CLIENT_ID=xxx
OUTLOOK_CLIENT_SECRET=xxx

# LinkedIn (future)
LINKEDIN_CLIENT_ID=xxx
LINKEDIN_CLIENT_SECRET=xxx
```

---

## Monitoring

- **Inngest Dashboard:** https://app.inngest.com
- **View runs:** See all worker executions
- **Debug failures:** Full stack traces
- **Replay events:** Re-run failed jobs

---

## Cost Considerations

| Worker | Runs/Day | Est. Cost/Month |
|--------|----------|-----------------|
| dailySummary | 1 | ~$0 |
| reminderCheck | 24 | ~$0.50 |
| gmailSync | 96 | ~$2 |
| conversationAnalysis | Variable | ~$5-20 |
| scoringAnalysis | Variable | ~$10-50 (AI calls) |

**Total estimated:** $20-100/month depending on usage

---

## Priorities for Deployment

### Must Have (Before Launch)
- [x] dailySummary
- [x] reminderCheck
- [x] gmailSync
- [x] conversationAnalysis
- [x] audioReceived

### Nice to Have (Post-Launch)
- [ ] outlookSync
- [ ] sequenceRunner
- [ ] clientChurnDetection
- [ ] weeklyReport

### Future (When Needed)
- [ ] linkedinSync (needs partnership)
- [ ] prospectEnrichment
- [ ] campaignScheduler
