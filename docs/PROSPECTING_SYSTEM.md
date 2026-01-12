# Prospecting System - Documentación Completa

## 🎯 Overview

Sistema completo de prospección automática estilo **11x.ai** con:
- LinkedIn Auto-Prospector
- Data Enrichment (Hunter.io + Clearbit)
- Multi-Channel Sequences (Email → LinkedIn → Call → WhatsApp)

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────┐
│  LinkedIn Auto-Prospector              │
│  - Scraping de Sales Navigator         │
│  - Scoring de leads (0-100)            │
│  - Filtros avanzados                   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Data Enrichment Engine                │
│  - Hunter.io (emails)                  │
│  - Clearbit (company data)             │
│  - Batch processing                    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Multi-Channel Sequence Builder        │
│  - 4 canales (Email, LinkedIn, Call, WA)│
│  - 9 triggers condicionales            │
│  - A/B testing                         │
└─────────────────────────────────────────┘
```

---

## 📦 Componentes

### 1. LinkedIn Auto-Prospector

**Archivo:** `linkedin_auto_prospector.py`

**Funcionalidades:**
- Scraping de LinkedIn Sales Navigator
- Filtros por industria, tamaño, cargo, ubicación, seniority
- Scoring automático (0-100)
- Extracción de datos completos

**Ejemplo:**
```python
from linkedin_auto_prospector import LinkedInAutoProspector, ICP

# Definir ICP
icp = ICP(
    industry="SaaS",
    company_size_min=50,
    company_size_max=500,
    job_titles=["CTO", "VP Engineering", "Head of Product"],
    location="Spain",
    seniority_levels=["Director", "VP", "C-Level"],
    required_skills=["SaaS", "B2B", "Leadership"],
)

# Prospectar
prospector = LinkedInAutoProspector()
prospects = prospector.search_prospects(icp, max_results=100)

# Ver resultados
for prospect in prospects:
    print(f"{prospect['full_name']} - Score: {prospect['score']}/100")
```

---

### 2. Data Enrichment Engine

**Archivo:** `data_enrichment_engine.py`

**Servicios:**
- **Hunter.io**: Encontrar emails, verificar emails
- **Clearbit**: Enriquecer empresa y persona

**Ejemplo:**
```python
from data_enrichment_engine import DataEnrichmentEngine

engine = DataEnrichmentEngine(
    hunter_api_key="your_hunter_key",
    clearbit_api_key="your_clearbit_key",
)

# Enriquecer prospecto
prospect = {
    "full_name": "Juan Pérez",
    "company": "TechCorp",
    "linkedin_url": "https://linkedin.com/in/juanperez",
}

enriched = engine.enrich_prospect(prospect)

print(f"Email encontrado: {enriched['email']}")
print(f"Email verificado: {enriched['email_verified']}")
print(f"Empresa: {enriched['company_data']['industry']}")
```

---

### 3. Multi-Channel Sequence Builder

**Archivo:** `multi_channel_sequence.py`

**Canales:**
- Email
- LinkedIn
- Cold Call
- WhatsApp

**Triggers:**
- `time_delay` - Esperar X días
- `email_opened` - Si abre email
- `email_clicked` - Si hace click
- `email_replied` - Si responde
- `linkedin_accepted` - Si acepta conexión
- `linkedin_replied` - Si responde en LinkedIn
- `call_answered` - Si contesta llamada
- `call_interested` - Si muestra interés
- `whatsapp_replied` - Si responde WhatsApp

**Ejemplo:**
```python
from multi_channel_sequence import SequenceBuilder, SequenceExecutor

# Crear secuencia
sequence = SequenceBuilder.create_default_sequence()

# Ejecutar para un prospecto
executor = SequenceExecutor(sequence)
executor.start(prospect)

# Simular triggers
executor.handle_trigger(TriggerType.EMAIL_OPENED)
executor.handle_trigger(TriggerType.LINKEDIN_ACCEPTED)
```

---

## 🗄️ Base de Datos

### Tablas

#### 1. `prospects`
```sql
- id, user_id
- full_name, email, phone, company, role, linkedin_url
- about, location, experience, skills, company_data
- score, scoring_factors
- status, enrichment_status
- source, icp_id, metadata
- created_at, updated_at, enriched_at, last_contacted_at
```

#### 2. `sequences`
```sql
- id, user_id
- name, description
- steps (JSONB), icp_id
- status, is_active
- total_prospects, active_prospects, replied_prospects, interested_prospects
- conversion_rate
- created_at, updated_at, last_run_at
```

#### 3. `sequence_enrollments`
```sql
- id, user_id, sequence_id, prospect_id
- current_step, total_steps
- is_completed, is_paused
- emails_sent, emails_opened, emails_clicked, emails_replied
- linkedin_sent, linkedin_replied
- calls_made, calls_answered
- enrolled_at, completed_at, paused_at, next_step_at
```

#### 4. `sequence_step_executions`
```sql
- id, user_id, enrollment_id, sequence_id, prospect_id
- step_number, channel, template_id
- subject, message, variables
- status
- sent_at, delivered_at, opened_at, clicked_at, replied_at
- external_id, error, metadata
- created_at, scheduled_for
```

#### 5. `enrichment_jobs`
```sql
- id, user_id, prospect_id
- status
- hunter_io_used, clearbit_used
- email_found, email_verified, company_data_found
- error, raw_data
- created_at, started_at, completed_at
```

---

## 🔌 API Endpoints

### tRPC Router

```typescript
// Prospects
prospecting.listProspects({ limit: 50, status: "new" })
prospecting.createProspect({ fullName, email, company, role })
prospecting.enrichProspect({ prospectId })

// Sequences
prospecting.listSequences()
prospecting.createSequence({ name, description, steps })
prospecting.enrollProspect({ sequenceId, prospectId })

// Stats
prospecting.getStats()
```

### FastAPI Endpoints

```python
POST /prospecting/auto-prospect
POST /prospecting/enrich
POST /prospecting/start-sequence
GET  /prospecting/stats
```

---

## 🚀 Deployment

### 1. Aplicar Migración
```bash
cd packages/db
pnpm drizzle-kit push:pg --migration=0011_prospecting_system.sql
```

### 2. Configurar Variables
```env
HUNTER_IO_API_KEY=your_hunter_key
CLEARBIT_API_KEY=your_clearbit_key
LINKEDIN_EMAIL=your_linkedin_email
LINKEDIN_PASSWORD=your_linkedin_password
```

### 3. Iniciar Workers
```bash
cd packages/growth-worker
python main.py
```

### 4. Acceder a UI
```
https://your-domain.com/admin/prospecting
```

---

## 📊 Comparativa con 11x.ai

| Feature | 11x.ai | Wallie |
|---------|--------|--------|
| Prospección automática | ✅ | ✅ |
| Enriquecimiento de datos | ✅ | ✅ |
| Secuencias multi-canal | ✅ | ✅ |
| Triggers condicionales | ✅ | ✅ |
| LinkedIn outreach | ✅ | ✅ |
| Cold calling | ✅ | ✅ |
| **WhatsApp** | ❌ | ✅ |
| **Humanizer Engine** | ❌ | ✅ |
| **Memoria total** | ❌ | ✅ |
| **Realtime Voice** | ❌ | ✅ |

---

## ✅ Best Practices

1. **ICP bien definido**: Cuanto más específico, mejores resultados
2. **Enriquecer antes de contactar**: Mejora la personalización
3. **Secuencias conservadoras**: Empezar con email-only
4. **Monitorear bounce rate**: Si >5%, revisar calidad de leads
5. **A/B testing**: Probar diferentes mensajes

---

## 🐛 Troubleshooting

**Problema:** No encuentra emails
- Verificar API key de Hunter.io
- Comprobar créditos disponibles

**Problema:** LinkedIn scraping falla
- Verificar credenciales
- Usar proxy si está bloqueado

**Problema:** Secuencias no se ejecutan
- Verificar que sequence.is_active = true
- Comprobar que hay prospectos enrollados

---

## 📈 Roadmap

- [ ] Integración con Salesforce/HubSpot
- [ ] Supervisión pre-envío
- [ ] LinkedIn outreach automatizado (envío real)
- [ ] A/B testing automático
- [ ] Warm-up de dominios

---

**Sistema completo para competir con 11x.ai** 🎯
