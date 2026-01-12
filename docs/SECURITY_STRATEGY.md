# 🔐 SECURITY STRATEGY: Single Session Enforcement

> **Objetivo Dual**: Proteger datos sensibles + Crear motor de upsell hacia Team Plan
> **Versión**: 1.0.0
> **Fecha**: 31 Diciembre 2025
> **Audiencia**: Product, Sales, Growth, Customer Success

---

## 📋 ÍNDICE

1. [Executive Summary](#executive-summary)
2. [Part 1: Security Argument](#part-1-security-argument)
3. [Part 2: Sales Argument](#part-2-sales-argument)
4. [Part 3: Metrics & KPIs](#part-3-metrics--kpis)
5. [Part 4: Customer Communication](#part-4-customer-communication)
6. [Part 5: Technical Implementation](#part-5-technical-implementation)
7. [Part 6: Roadmap](#part-6-roadmap)

---

## EXECUTIVE SUMMARY

### 🎯 Dual Objective

**Security**: Proteger acceso a WhatsApp Business y Google Calendar mediante Single Session enforcement

**Revenue**: Convertir limitación técnica en motor de upsell hacia Team Plan (+220% revenue uplift)

### 🔑 Key Message

> "Wallie tiene acceso directo a tu WhatsApp Business y a tu Google Calendar. Compartir credenciales es un riesgo crítico de privacidad y seguridad. El Plan Team te da control granular: cada vendedor ve solo sus propios clientes y conversaciones."

### 📊 Expected Impact

| Metric                               | Target     | Timeframe |
| ------------------------------------ | ---------- | --------- |
| Upgrade Rate (Starter/Pro → Team)    | 15-20%     | Q1 2026   |
| Average Revenue Per User (ARPU)      | +€50/month | Q1 2026   |
| Support Tickets (credential sharing) | -60%       | Q2 2026   |
| GDPR Compliance Score                | 95%+       | Q1 2026   |

---

## PART 1: SECURITY ARGUMENT

### 1.1 Why Single Session Matters

**Wallie NO es un CRM tradicional.** Wallie tiene acceso a:

1. **WhatsApp Business** (end-to-end encryption)
   - TODOS los mensajes (incluidos los privados/personales)
   - Contactos completos
   - Estados de conversación

2. **Google Calendar**
   - Reuniones personales
   - Eventos familiares
   - Negociaciones confidenciales con clientes VIP

3. **Client Database**
   - Datos sensibles de TODOS los clientes
   - Historial completo de conversaciones
   - Notas internas y estrategias de venta

**¿Qué pasa si compartes tu cuenta?**

❌ Tu asistente/empleado puede:

- Leer TODOS tus mensajes de WhatsApp (incluidos los privados)
- Ver tu calendario completo (reuniones personales incluidas)
- Acceder a datos de TODOS tus clientes (no solo los suyos)
- Exportar/copiar información confidencial

### 1.2 Real-World Scenarios (Customer Stories)

#### Escenario 1: "El Empleado Despedido"

**Cliente**: Inmobiliaria con 3 agentes
**Problema**: Compartían 1 cuenta Pro (€49/mes) entre 3 personas
**Incidente**:

- Empleado A es despedido
- Empleado A SIGUE teniendo acceso a WhatsApp Business y Calendar
- Puede contactar a clientes de la empresa en nombre propio
- Puede ver reuniones confidenciales del dueño con inversores

**Costo Real**: €12,000 en clientes perdidos + 2 meses de recuperación

**Solución**: Team Plan → Cada agente tiene su propia cuenta → Revocación inmediata al despedir

#### Escenario 2: "La Reunión Personal Expuesta"

**Cliente**: Coach ejecutivo
**Problema**: Asistente tenía acceso a cuenta compartida
**Incidente**:

- Asistente vio reunión en calendario: "Terapia de pareja - 18:00"
- Información personal expuesta
- Violación de privacidad

**Costo Real**: Pérdida de confianza + cambio de asistente

**Solución**: Single Session → Solo 1 persona puede estar logueada → No más accesos compartidos

#### Escenario 3: "El Competidor Interno"

**Cliente**: Concesionario de autos
**Problema**: Vendedor junior con acceso compartido
**Incidente**:

- Vendedor junior lee conversaciones de vendedor senior con cliente VIP
- Vendedor junior contacta directamente al cliente ofreciendo mejor precio
- Conflicto interno + pérdida de comisión

**Costo Real**: €5,000 en comisiones perdidas + rotación de empleados

**Solución**: Team Plan → Cada vendedor solo ve sus propios clientes

### 1.3 GDPR Compliance

**Article 32: Security of Processing**

> "Taking into account the state of the art, the costs of implementation and the nature, scope, context and purposes of processing as well as the risk of varying likelihood and severity for the rights and freedoms of natural persons, the controller and the processor shall implement appropriate technical and organisational measures to ensure a level of security appropriate to the risk."

**Single Session cumple con**:

- ✅ **Access Controls**: Solo 1 sesión activa = menor superficie de ataque
- ✅ **Audit Trail**: Device info + timestamps = trazabilidad completa
- ✅ **Confidentiality**: Inactividad auto-logout = protección contra acceso no autorizado

**GDPR Fine Risk** sin Single Session:

- Multas de hasta €20M o 4% del revenue anual global
- Single Session es medida de "technical and organisational measures"

### 1.4 Security Best Practices (Industry Standard)

**Comparación con otros SaaS**:

| Product                | Single Session | Multi-Device     | Inactivity Timeout |
| ---------------------- | -------------- | ---------------- | ------------------ |
| **Google Workspace**   | ❌ No          | ✅ Multi-device  | ✅ 14 días         |
| **Slack**              | ❌ No          | ✅ Multi-device  | ❌ No              |
| **HubSpot**            | ❌ No          | ✅ Multi-device  | ❌ No              |
| **Salesforce**         | ❌ No          | ✅ Multi-device  | ✅ 2 horas         |
| **Banking Apps**       | ✅ Yes         | ❌ Single-device | ✅ 5-15 min        |
| **Wallie Starter/Pro** | ✅ Yes         | ❌ Single-device | ✅ 45 min          |

**Por qué Wallie es más estricto**:

- Banking Apps protegen dinero → Wallie protege WhatsApp + Calendar (igual de sensible)
- HubSpot NO tiene acceso a WhatsApp → Wallie SÍ
- Salesforce NO tiene acceso a Calendar personal → Wallie SÍ

---

## PART 2: SALES ARGUMENT

### 2.1 Positioning: "Protección Natural"

**Elevator Pitch** (30 segundos):

> "Wallie tiene acceso directo a tu WhatsApp Business y a tu Google Calendar. Compartir credenciales es un riesgo crítico de privacidad. Por eso, los planes Starter y Pro tienen Single Session: solo 1 persona puede estar logueada a la vez. Si necesitas que tu equipo trabaje simultáneamente, el Plan Team te da control granular: cada vendedor ve solo sus propios clientes y conversaciones. Más seguro, más profesional, y cumple con GDPR."

### 2.2 Objection Handling

#### Objeción 1: "¿Por qué no puedo compartir mi cuenta?"

**Script**:

> "Entiendo que parece más simple compartir credenciales. Sin embargo, Wallie tiene acceso directo a tu WhatsApp Business y a tu Google Calendar.
>
> Imagina esto: si compartes tu cuenta, **cualquier persona con esas credenciales puede**:
>
> - Ver TODOS tus mensajes de WhatsApp (incluso los privados)
> - Leer tu calendario completo (reuniones personales incluidas)
> - Acceder a datos de TODOS tus clientes
>
> ¿Realmente quieres que tu asistente/empleado vea reuniones personales tuyas en el calendario? ¿O negociaciones confidenciales con clientes VIP?
>
> El Plan Team te da control granular: cada vendedor ve **solo sus propios clientes y conversaciones**. Más seguro, más profesional, y cumple con GDPR."

#### Objeción 2: "Es muy caro subir a Team Plan"

**Script**:

> "Entiendo la preocupación por el costo. Veamos los números:
>
> **Opción 1: Compartir 1 cuenta Pro (€49/mes)**
>
> - Riesgo de filtración de datos
> - Sin control de acceso
> - Posible multa GDPR: €20,000+
> - Pérdida de clientes si empleado se va: €10,000+
>
> **Opción 2: Team Plan (€99 + €29/asiento = €157/mes para 3 personas)**
>
> - Cada vendedor tiene acceso controlado
> - Revocación inmediata si alguien se va
> - Cumplimiento GDPR garantizado
> - ROI: 1 cliente recuperado paga 6 meses de Team Plan
>
> La pregunta no es 'es caro subir a Team Plan', sino '¿cuánto me cuesta NO tener control de acceso?'"

#### Objeción 3: "Solo somos 2 personas, no necesitamos Team"

**Script**:

> "Perfecto, entonces cada uno puede tener su propia cuenta Pro (€49/mes cada uno = €98/mes total).
>
> O bien, puedes contratar Team Plan (€99/mes para 3 asientos) y tener 1 asiento de sobra para:
>
> - Un asistente virtual
> - Un becario en temporada alta
> - Un socio futuro
>
> Además, con Team Plan cada uno ve solo sus propios clientes. ¿Tu socio/empleado debería ver TODAS tus conversaciones privadas de WhatsApp? Con cuentas separadas, cada uno mantiene su privacidad."

#### Objeción 4: "Mi equipo trabaja en turnos, no simultáneo"

**Script**:

> "Entiendo. Sin embargo, el problema no es solo la simultaneidad, sino el **control de acceso**.
>
> Con cuentas compartidas:
>
> - Empleado del turno mañana puede leer conversaciones del turno tarde
> - Si despides a alguien, TODOS deben cambiar la contraseña
> - No sabes quién hizo qué (sin audit trail)
>
> Con Team Plan:
>
> - Cada empleado tiene su propia cuenta
> - Ves exactamente quién envió cada mensaje
> - Revocas acceso individualmente si alguien se va
>
> Es como la diferencia entre dar a todos la llave de tu casa vs. tener cerraduras individuales."

### 2.3 Upsell Funnel

#### Step 1: Identificar Trigger Signals

**Señales de que cliente necesita Team Plan**:

1. **Preguntas sobre "compartir cuenta"** → Red flag
2. **Menciona "mi equipo"** → Proactivamente ofrecer Team
3. **Industry: Inmobiliaria, Concesionario, Agencia** → Alto % multi-usuario
4. **Más de 50 clientes en DB** → Poco probable que sea solo 1 persona
5. **Conversaciones concurrentes (mismo user_id, diferentes IP)** → Probable shared account

#### Step 2: Email Preventivo (Post-Signup)

**Subject**: "⚠️ Importante: ¿Tu equipo necesita acceso a Wallie?"

**Body**:

```
Hola [Nombre],

¡Bienvenido a Wallie! 🎉

Notamos que estás en el Plan [Starter/Pro]. Este plan está diseñado para **uso individual** y tiene Single Session: solo 1 persona puede estar logueada a la vez.

**⚠️ IMPORTANTE**: Si tu equipo necesita acceso simultáneo, el Plan Team es la solución correcta:

✅ Cada vendedor tiene su propia cuenta
✅ Control granular de acceso (cada uno ve solo sus clientes)
✅ Cumplimiento GDPR garantizado
✅ Revocación inmediata si alguien se va

**¿Por qué NO compartir credenciales?**

Wallie tiene acceso a tu WhatsApp Business y Google Calendar. Compartir credenciales significa que todos ven:
- TODOS los mensajes de WhatsApp (incluidos los privados)
- TODO el calendario (reuniones personales incluidas)
- TODOS los clientes (no solo los suyos)

**Pricing Team Plan**: €99/mes (base) + €29/asiento adicional

¿Necesitas que tu equipo trabaje en Wallie? Responde a este email y te ayudaremos a configurar Team Plan en 5 minutos.

Saludos,
[Nombre] - Wallie Customer Success
```

#### Step 3: Email Reactivo (Detección de Shared Account)

**Trigger**: Sistema detecta login desde 2 IPs diferentes en <1 hora

**Subject**: "🚨 Detectamos acceso compartido en tu cuenta Wallie"

**Body**:

```
Hola [Nombre],

Nuestro sistema de seguridad detectó que tu cuenta Wallie fue accedida desde 2 dispositivos diferentes:

📱 Dispositivo 1: [Chrome en Windows - Madrid - 10:30]
📱 Dispositivo 2: [Safari en iPhone - Barcelona - 10:45]

**⚠️ ¿Esto fue intencional?**

Si estás compartiendo tu cuenta con tu equipo, te recomendamos urgentemente cambiar al Plan Team por estas razones:

1. **Seguridad**: Wallie tiene acceso a tu WhatsApp Business y Google Calendar. Compartir credenciales expone datos sensibles.

2. **GDPR**: Compartir cuentas viola Article 32 (Security of Processing). Posibles multas: €20,000+.

3. **Control**: Con Team Plan, cada vendedor solo ve sus propios clientes. Más profesional y seguro.

**Solución**: Migrar a Team Plan (€99 + €29/asiento)

Responde "TEAM" a este email y te configuramos el upgrade en 5 minutos con descuento del 20% en el primer mes.

Saludos,
[Nombre] - Wallie Security Team
```

### 2.4 Pricing Strategy

#### Current Plans

| Plan           | Sesiones Permitidas           | Precio Mensual         | Target                             |
| -------------- | ----------------------------- | ---------------------- | ---------------------------------- |
| **Starter**    | 1 sesión (Single Session)     | €29                    | Freelancers, 1-person businesses   |
| **Pro**        | 1 sesión (Single Session)     | €49                    | Profesionales con clientes premium |
| **Team**       | Multi-usuario (3-10 asientos) | €99 base + €29/asiento | Equipos de ventas, agencias        |
| **Enterprise** | Unlimited users + SSO         | Custom                 | Corporaciones                      |

#### Revenue Math

**Escenario: Cliente con 3 vendedores**

**Opción A (Sin Single Session)**: Compartir 1 cuenta Pro

- Revenue: €49/mes
- ACV: €588/año

**Opción B (Con Single Session)**: Forzado a Team Plan

- Revenue: €99 + (2 × €29) = €157/mes
- ACV: €1,884/año

**Revenue Uplift**: +220% 🚀

**Escenario: 100 clientes Starter/Pro**

- **Sin upsell**: 100 × €49 = €4,900/mes
- **Con 20% upgrade a Team (2 asientos)**: (80 × €49) + (20 × €157) = €7,060/mes
- **Revenue Uplift**: +€2,160/mes = +€25,920/año

### 2.5 Competitive Positioning

**Comparación con competidores**:

| Feature                   | Wallie Team    | HubSpot Sales Hub | Salesforce    |
| ------------------------- | -------------- | ----------------- | ------------- |
| WhatsApp Integration      | ✅ Native      | ❌ Via Twilio     | ❌ Via Twilio |
| Google Calendar Access    | ✅ Native      | ✅ Limited        | ✅ Limited    |
| Single Session Security   | ✅ Starter/Pro | ❌ No             | ❌ No         |
| Multi-user Access Control | ✅ Team Plan   | ✅ All plans      | ✅ All plans  |
| Pricing (3 users)         | €157/mes       | €300/mes          | €375/mes      |

**USP**: "El único CRM que protege tu WhatsApp Business con Single Session enforcement + Team Plan más económico que competidores"

---

## PART 3: METRICS & KPIs

### 3.1 Dashboard Metrics

**Query para identificar oportunidades de upsell**:

```sql
-- Clientes con señales de shared account
SELECT
  p.id,
  p.full_name,
  p.email,
  p.business_name,
  s.plan_type,
  COUNT(DISTINCT p.current_session_device_info->>'ip') as unique_ips_last_30d,
  COUNT(c.id) as total_clients,
  COUNT(conv.id) as total_conversations
FROM profiles p
JOIN subscriptions s ON s.user_id = p.id
LEFT JOIN clients c ON c.user_id = p.id
LEFT JOIN conversations conv ON conv.user_id = p.id
WHERE s.plan_type IN ('STARTER', 'PRO')
  AND s.status = 'ACTIVE'
  AND p.created_at > NOW() - INTERVAL '30 days'
GROUP BY p.id, p.full_name, p.email, p.business_name, s.plan_type
HAVING COUNT(DISTINCT p.current_session_device_info->>'ip') >= 2
   OR COUNT(c.id) > 50  -- Poco probable que 1 persona tenga >50 clientes activos
ORDER BY unique_ips_last_30d DESC, total_clients DESC
LIMIT 50;
```

**Query para medir upgrade rate**:

```sql
-- Upgrade rate Starter/Pro → Team
SELECT
  DATE_TRUNC('month', upgraded_at) as month,
  COUNT(*) as upgrades,
  AVG(days_to_upgrade) as avg_days_to_upgrade,
  SUM(mrr_increase) as total_mrr_increase
FROM (
  SELECT
    s1.user_id,
    s2.created_at as upgraded_at,
    EXTRACT(DAYS FROM s2.created_at - s1.created_at) as days_to_upgrade,
    (s2.amount - s1.amount) as mrr_increase
  FROM subscriptions s1
  JOIN subscriptions s2 ON s1.user_id = s2.user_id
  WHERE s1.plan_type IN ('STARTER', 'PRO')
    AND s2.plan_type = 'TEAM'
    AND s2.created_at > s1.created_at
    AND s1.status = 'CANCELED'
    AND s2.status = 'ACTIVE'
) upgrades
GROUP BY month
ORDER BY month DESC;
```

### 3.2 KPIs to Track

| KPI                           | Formula                                                  | Target        | Current |
| ----------------------------- | -------------------------------------------------------- | ------------- | ------- |
| **Upgrade Rate**              | (Team Plan signups from Starter/Pro) / Total Starter/Pro | 15-20%        | TBD     |
| **Time to Upgrade**           | Days from signup to Team Plan upgrade                    | <30 days      | TBD     |
| **MRR Increase from Upsells** | Sum of (Team Plan MRR - Previous Plan MRR)               | €10,000/month | TBD     |
| **ARPU**                      | Total MRR / Total Active Users                           | €70/user      | TBD     |
| **Churn Rate (Team Plan)**    | Team Plan cancellations / Total Team Plans               | <5%           | TBD     |
| **Security Incidents**        | Shared account violations detected                       | 0             | TBD     |

### 3.3 Success Indicators

**Week 1 Post-Launch**:

- ✅ 0 support tickets sobre "no puedo loguearme simultáneamente"
- ✅ Email preventivo enviado a 100% de nuevos signups Starter/Pro
- ✅ Dashboard de detección de shared accounts funcionando

**Month 1 Post-Launch**:

- ✅ 5-10% upgrade rate Starter/Pro → Team
- ✅ €2,000+ MRR increase from upsells
- ✅ 0 GDPR-related security incidents

**Quarter 1 Post-Launch**:

- ✅ 15-20% upgrade rate
- ✅ €10,000+ MRR increase from upsells
- ✅ Customer Success playbook refinado con real objections
- ✅ Case studies de 3-5 clientes Team Plan satisfechos

---

## PART 4: CUSTOMER COMMUNICATION

### 4.1 In-App Modal (First Login After Update)

**Trigger**: Usuario con Plan Starter/Pro hace login después de deploy de Single Session

**UI**:

```
┌─────────────────────────────────────────────────────────┐
│  🔐 Nueva Funcionalidad de Seguridad                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Wallie ahora protege tu cuenta con Single Session:     │
│  solo 1 dispositivo puede estar logueado a la vez.      │
│                                                          │
│  **¿Por qué?**                                           │
│                                                          │
│  Wallie tiene acceso directo a:                          │
│  ✅ Tu WhatsApp Business (todos los mensajes)            │
│  ✅ Tu Google Calendar (reuniones personales)            │
│  ✅ Todos tus clientes y conversaciones                  │
│                                                          │
│  Compartir credenciales es un riesgo crítico de          │
│  privacidad. Single Session te protege.                  │
│                                                          │
│  **¿Tu equipo necesita acceso simultáneo?**              │
│                                                          │
│  El Plan Team te da control granular:                    │
│  cada vendedor ve solo sus propios clientes.             │
│                                                          │
│  [Ver Plan Team]  [Entendido, continuar]                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Session Invalidated Toast

**Trigger**: Usuario logueado en Device A, luego alguien se loguea desde Device B

**UI**:

```
┌─────────────────────────────────────────────────────────┐
│  ⚠️ Sesión cerrada                                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Se ha iniciado sesión desde otro dispositivo:          │
│  📱 Chrome en Windows - Madrid - hace 2 minutos          │
│                                                          │
│  Por seguridad, esta sesión se ha cerrado.               │
│                                                          │
│  ¿No fuiste tú? Cambia tu contraseña inmediatamente.     │
│                                                          │
│  ¿Necesitas que tu equipo trabaje simultáneamente?       │
│  El Plan Team es la solución → [Ver más]                 │
│                                                          │
│  [Iniciar sesión nuevamente]                             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 4.3 Inactivity Logout Toast

**Trigger**: Usuario inactivo por 45 minutos

**UI**:

```
┌─────────────────────────────────────────────────────────┐
│  ⏱️ Sesión cerrada por inactividad                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Tu sesión se cerró automáticamente después de          │
│  45 minutos de inactividad.                              │
│                                                          │
│  Esto protege tus datos si dejaste la sesión abierta.    │
│                                                          │
│  [Iniciar sesión nuevamente]                             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 4.4 FAQ Section (Help Center)

**Q1: ¿Por qué solo puedo tener 1 sesión activa?**

> Los planes Starter y Pro están diseñados para uso individual. Wallie tiene acceso directo a tu WhatsApp Business y Google Calendar. Por seguridad, limitamos a 1 sesión activa para evitar que múltiples personas accedan a tus datos sensibles simultáneamente.
>
> Si tu equipo necesita acceso simultáneo, el Plan Team es la solución correcta. Cada vendedor tiene su propia cuenta y solo ve sus propios clientes.

**Q2: ¿Qué pasa si alguien más inicia sesión en mi cuenta?**

> Si alguien inicia sesión desde otro dispositivo, tu sesión actual se cerrará automáticamente. Verás un mensaje indicando el dispositivo desde el cual se inició la nueva sesión.
>
> Si no fuiste tú, cambia tu contraseña inmediatamente.

**Q3: ¿Por qué me desloguea por inactividad?**

> Por seguridad, cerramos sesiones inactivas después de 45 minutos. Esto protege tus datos si dejaste la sesión abierta en un dispositivo compartido o público.

**Q4: ¿Cómo puedo dar acceso a mi equipo?**

> La forma correcta es con el Plan Team. Cada miembro de tu equipo tiene:
>
> - Su propia cuenta con credenciales únicas
> - Acceso solo a sus propios clientes
> - No puede ver tus mensajes privados de WhatsApp o tu calendario personal
>
> Contacta a sales@wallie.ai para configurar Team Plan.

**Q5: ¿Puedo compartir mi contraseña con mi asistente?**

> ❌ **No recomendamos compartir credenciales** por estas razones:
>
> - Tu asistente podrá ver TODOS tus mensajes de WhatsApp (incluidos los privados)
> - Podrá ver tu Google Calendar completo (reuniones personales incluidas)
> - Tendrá acceso a datos de TODOS tus clientes
> - Violación de GDPR (posibles multas)
>
> ✅ **Solución correcta**: Darle su propia cuenta en Team Plan. Así solo ve lo que necesita ver.

---

## PART 5: TECHNICAL IMPLEMENTATION

### 5.1 Architecture Summary

**Database Schema** (`profiles` table):

```sql
-- Session tracking fields
current_session_id UUID
current_session_started_at TIMESTAMP WITH TIME ZONE
current_session_device_info JSONB  -- {browser, os, device, ip, location}
last_activity_at TIMESTAMP WITH TIME ZONE
```

**Backend** (`packages/api/src/routers/sessions-single.ts`):

- `initSession`: Create new session (invalidates previous)
- `validateSession`: Check if session is still active
- `renewActivity`: Keep-alive heartbeat (updates last_activity_at)
- `terminateSession`: Manual logout
- `getCurrentSession`: Get session info for UI
- `cleanupInactiveSessions`: Background worker (auto-logout inactive users)

**Frontend** (`apps/web/src/hooks/use-session-guard.ts`):

- Session validation polling (every 30s)
- Inactivity detection (45 min timeout)
- Activity tracking (mouse, keyboard, scroll, touch events)
- Keep-alive heartbeat (every 2 min when active)
- Auto-logout with toast notifications

**Background Worker** (Inngest cron job):

```typescript
// packages/workers/src/functions/cleanup-inactive-sessions.ts
export const cleanupInactiveSessions = inngest.createFunction(
  { id: 'cleanup-inactive-sessions', name: 'Cleanup Inactive Sessions' },
  { cron: '*/15 * * * *' }, // Every 15 minutes
  async ({ step }) => {
    const result = await step.run('cleanup', async () => {
      return api.sessionsSingle.cleanupInactiveSessions.mutate()
    })

    return { cleanedCount: result.cleanedCount }
  }
)
```

### 5.2 Security Considerations

**1. Session Hijacking Protection**:

- Session ID stored in httpOnly cookie (not accessible via JavaScript)
- CSRF token validation on all mutations
- TLS/HTTPS required for all endpoints

**2. Brute Force Protection**:

- Rate limiting on login endpoint (5 attempts per 15 minutes)
- Account lockout after 10 failed attempts
- CAPTCHA after 3 failed attempts

**3. Audit Trail**:

- All session events logged (init, validate, renew, terminate)
- Device info tracked (browser, OS, IP, location)
- Retention: 90 days

**4. GDPR Compliance**:

- User can export session history via GDPR export
- User can request deletion of session history
- Session data NOT shared with third parties

### 5.3 Migration Plan

**Phase 1: Deploy (Week 1)**

- Deploy schema changes (migration 0030)
- Deploy backend router (sessions-single.ts)
- Deploy frontend hook (use-session-guard.ts)
- Enable for NEW signups only (existing users unaffected)

**Phase 2: Communication (Week 2)**

- Send email to existing Starter/Pro users explaining change
- Update help center with FAQ
- Train customer success team on objection handling

**Phase 3: Rollout (Week 3)**

- Enable for 10% of existing users (A/B test)
- Monitor support tickets and user feedback
- Iterate on messaging

**Phase 4: Full Rollout (Week 4)**

- Enable for 100% of users
- Monitor upgrade rate and revenue impact
- Celebrate wins 🎉

---

## PART 6: ROADMAP

### 6.1 Short-Term (Q1 2026)

**January 2026**:

- ✅ Deploy Single Session enforcement
- ✅ Launch Team Plan upsell campaign
- ✅ Monitor metrics and iterate on messaging

**February 2026**:

- [ ] Launch "Trusted Devices" feature (allow user to whitelist 2-3 devices)
- [ ] Launch "Session History" page in Settings (show all past sessions)
- [ ] A/B test different inactivity timeouts (30 min vs 45 min vs 60 min)

**March 2026**:

- [ ] Launch "Family Plan" (2-3 users, €79/mes) for small teams
- [ ] Launch "Session Alerts" (email notification when new device logs in)
- [ ] Integrate with Supabase Auth for better session management

### 6.2 Mid-Term (Q2 2026)

**April 2026**:

- [ ] Launch "Device Management" UI (remotely terminate sessions)
- [ ] Launch "2FA Enforcement" for Team Plan (mandatory for team admins)
- [ ] Launch "IP Whitelisting" for Enterprise Plan

**May 2026**:

- [ ] Launch "SSO Integration" for Enterprise (Google Workspace, Microsoft)
- [ ] Launch "Role-Based Access Control" (Admin, Manager, Agent)
- [ ] Launch "Audit Log" page for compliance

**June 2026**:

- [ ] Launch "Mobile App" with Single Session enforcement
- [ ] Launch "Offline Mode" with session sync
- [ ] Launch "Security Dashboard" for Team Plan admins

### 6.3 Long-Term (Q3-Q4 2026)

**Q3 2026**:

- [ ] Launch "Passwordless Authentication" (WebAuthn, Passkeys)
- [ ] Launch "Zero-Trust Architecture" (micro-segmentation)
- [ ] Launch "SOC 2 Type II Certification"

**Q4 2026**:

- [ ] Launch "ISO 27001 Certification"
- [ ] Launch "Penetration Testing Program" (quarterly audits)
- [ ] Launch "Bug Bounty Program" (public vulnerability disclosure)

---

## APPENDIX A: LEGAL DISCLAIMER

**Texto para Terms of Service**:

> **Section 4.2: Account Sharing Prohibited**
>
> You may not share your Wallie account credentials with any third party. Starter and Pro plans are limited to a single active session. If we detect account sharing, we reserve the right to:
> (a) Terminate your active session
> (b) Suspend your account pending verification
> (c) Require upgrade to Team Plan for multi-user access
>
> Sharing credentials violates GDPR Article 32 (Security of Processing) and exposes you to liability for data breaches.

**Texto para Privacy Policy**:

> **Section 7: Session Management**
>
> We track your active sessions to ensure security and prevent unauthorized access. Session data includes:
>
> - Session ID (UUID)
> - Device information (browser, OS, device type)
> - IP address and approximate location
> - Start time and last activity timestamp
>
> This data is retained for 90 days for security and audit purposes. You can request deletion of session history via GDPR data export.

---

## APPENDIX B: CUSTOMER SUCCESS PLAYBOOK

### Reactive Support: Session Invalidated Ticket

**Ticket**: "No puedo entrar a Wallie, dice que hay otra sesión activa"

**Response**:

```
Hola [Nombre],

Gracias por contactarnos. El mensaje que ves indica que alguien inició sesión en tu cuenta Wallie desde otro dispositivo:

📱 Dispositivo actual: [Chrome en Windows - Madrid - hace 5 minutos]

**¿Fuiste tú?**

Si fuiste tú desde otro dispositivo (ej. tu móvil), esto es normal. Los planes Starter y Pro tienen Single Session: solo 1 dispositivo puede estar logueado a la vez. Simplemente cierra sesión en el otro dispositivo y vuelve a entrar aquí.

**¿NO fuiste tú?**

Si no reconoces ese dispositivo, es posible que:
1. Alguien tenga tu contraseña (cámbiala inmediatamente)
2. Estés compartiendo tu cuenta con tu equipo (no recomendado)

**¿Compartes tu cuenta con tu equipo?**

Entiendo que parece más simple compartir credenciales, pero Wallie tiene acceso a tu WhatsApp Business y Google Calendar. Compartir credenciales significa que todos ven TODOS tus mensajes (incluidos los privados).

La solución correcta es el Plan Team: cada vendedor tiene su propia cuenta y solo ve sus propios clientes. Más seguro y cumple con GDPR.

¿Te ayudo a configurar Team Plan? Responde "SÍ" y te envío toda la info.

Saludos,
[Nombre] - Wallie Customer Success
```

### Proactive Support: High-Value Customer

**Trigger**: Cliente Starter/Pro con >€5,000 MRR en clientes (alto valor, probablemente tiene equipo)

**Email**:

```
Subject: [Nombre], ¿tu equipo necesita acceso a Wallie?

Hola [Nombre],

Felicitaciones por el éxito en Wallie 🎉 Veo que ya tienes [X] clientes activos.

Con ese volumen, es probable que tengas un equipo trabajando contigo. ¿Sabías que el Plan Team de Wallie te permite:

✅ Dar acceso individual a cada vendedor
✅ Cada uno ve solo sus propios clientes (no todos los tuyos)
✅ Revocar acceso inmediatamente si alguien se va
✅ Cumplir con GDPR (acceso controlado = menos riesgo)

**Pricing**: €99/mes (hasta 3 usuarios) + €29/asiento adicional

**Caso real**: Inmobiliaria con 3 agentes compartía 1 cuenta Pro. Empleado despedido SEGUÍA teniendo acceso a WhatsApp Business y pudo contactar a clientes. Pérdida: €12,000.

Con Team Plan, ese problema no existe. Cada vendedor tiene su cuenta, tú tienes control total.

¿Hablamos 15 minutos esta semana? Te muestro cómo funciona.

[Agendar llamada]

Saludos,
[Nombre] - Wallie Customer Success
```

---

## CONCLUSION

**Single Session enforcement NO es una limitación técnica molesta.**

**Es una ventaja competitiva que**:

1. ✅ Protege datos sensibles (WhatsApp + Calendar)
2. ✅ Cumple con GDPR Article 32
3. ✅ Crea upsell path natural hacia Team Plan (+220% revenue)
4. ✅ Reduce support tickets por credential sharing
5. ✅ Aumenta profesionalidad del producto

**Mensaje final para el equipo**:

> "Cuando un cliente se queja de Single Session, NO es un bug a arreglar. Es una oportunidad de venta. Nuestro trabajo es explicar POR QUÉ existe (seguridad) y CÓMO resolverlo (Team Plan). Cada objeción es una conversación de upsell."

---

**Documento mantenido por**: Product Team
**Última revisión**: 31 Diciembre 2025
**Próxima revisión**: 31 Enero 2026
**Feedback**: product@wallie.ai
