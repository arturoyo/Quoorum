# 📚 ROADMAP INVENTORY - Quoorum

> **Auditoría completa:** 21 Enero 2026
> **Producto:** Quoorum - Sistema de debates multi-agente con IA

---

## 📊 ROADMAPS DE QUOORUM (Relevantes)

| Archivo | Propósito | Estado | Última actualización |
|---------|-----------|--------|---------------------|
| **`ROADMAP.md`** | **Roadmap principal** | ✅ FUENTE DE VERDAD | 21 Ene 2026 |
| **`ROADMAP-STATUS.md`** | Auditoría Week 1-6 | ✅ Verificado | 21 Ene 2026 |
| **`ROADMAP-INVENTORY.md`** | Este documento | ✅ Creado hoy | 21 Ene 2026 |

---

## ✅ ESTADO ACTUAL (Según ROADMAP-STATUS.md)

### Completado al 100%

**Week 1: Backstory + Serper + UI Polish** ✅
- User Backstory Schema (`packages/db/src/schema/user-backstory.ts`)
- User Backstory API (`packages/api/src/routers/user-backstory.ts`)
- Onboarding Page (`apps/web/src/app/onboarding/page.tsx`)
- Serper API Integration (`packages/api/src/lib/auto-research.ts`)
- Dark Mode enforcement (`apps/web/src/app/layout.tsx` - className="dark")
- Tailwind Quoorum Colors (`apps/web/tailwind.config.ts`)
- Migration DB (`packages/db/drizzle/0028_add_user_backstory.sql`)

**Week 2-3: Pros and Cons Framework** ✅
- Framework Logic (`packages/quoorum/src/frameworks/pros-and-cons.ts`)
- Landing Page (`apps/web/src/app/frameworks/pros-and-cons/page.tsx`)

**Week 4-5: SWOT Analysis Framework** ✅
- Framework Logic (`packages/quoorum/src/frameworks/swot-analysis.ts`)
- Landing Page (`apps/web/src/app/frameworks/swot-analysis/page.tsx`)

**Week 6: Eisenhower Matrix + Export PDF** ✅
- Framework Logic (`packages/quoorum/src/frameworks/eisenhower-matrix.ts`)
- Landing Page (`apps/web/src/app/frameworks/eisenhower-matrix/page.tsx`)
- Export PDF (`packages/quoorum/src/pdf-export.ts`)
- Analytics (implementado en commit 58a8e70)

---

## 📋 PENDIENTES DEL ROADMAP

### Próximas Prioridades (Febrero 2026)

#### 1. Analytics & Monitoring (Prioridad ALTA - 3-4 días)
- [ ] Configurar PostHog analytics completo
- [ ] Sentry performance + error tracking
- [ ] Dashboard interno con OKRs
- [ ] DB queries para métricas clave

**Por qué es importante:** No podemos medir progreso de OKRs sin analytics

#### 2. SEO Optimization (Prioridad ALTA - 1 semana)
- [ ] Meta tags optimizados en 4 landing pages
- [ ] Schema.org markup (Organization, Article)
- [ ] Google Search Console setup
- [ ] Sitemap.xml y robots.txt
- [ ] Internal linking strategy

**Por qué es importante:** 199K búsquedas/mes esperando ser capturadas

#### 3. Export & Share (Prioridad MEDIA - 1 semana)
- [ ] Link público compartible (read-only debates)
- [ ] Embed widget para blogs
- [ ] Email digest con Resend
- [ ] Social media cards

**Por qué es importante:** Viral potential + documentación de decisiones

---

## 🎯 ROADMAP ACTUALIZADO (Próximos 30 días)

### Semana 22-28 Enero: Analytics & Monitoring ⚡
- [ ] Configurar PostHog analytics completo
- [ ] Sentry performance + error tracking
- [ ] Dashboard interno con OKRs
- [ ] DB queries para métricas clave

### Semana 29 Enero - 4 Febrero: SEO Optimization 🔍
- [ ] Meta tags optimizados en 4 landing pages
- [ ] Schema.org markup (Organization, Article)
- [ ] Google Search Console setup
- [ ] Sitemap.xml y robots.txt
- [ ] Internal linking strategy

### Semana 5-11 Febrero: Export & Share 📤
- [ ] Link público compartible
- [ ] Embed widget
- [ ] Email digest con Resend
- [ ] Social media cards

---

## 📂 OTROS ARCHIVOS EN EL REPO (NO ROADMAPS)

Hay otros archivos que mencionan "roadmap" pero **NO son roadmaps de Quoorum**:

| Archivo | Contenido | Acción |
|---------|-----------|--------|
| `docs/project/ROADMAP.md` | Otro proyecto (Wallie) | ⚠️ Ignorar o eliminar |
| `docs/project/IMPLEMENTATION_ROADMAP.md` | Tech stack de otro proyecto | ⚠️ Ignorar o eliminar |
| `docs/compliance/SECURITY_ROADMAP.md` | Roadmap de seguridad | ⚠️ Puede ser útil después |
| `docs/forum/FORUM_ROADMAP*.md` | Features de foro | ⚠️ No revisado |

**Recomendación:** Mover `docs/project/` a `/archive/` para evitar confusiones.

---

## 🚀 RESUMEN EJECUTIVO

### Estado del Proyecto

```
✅ Weeks 1-6 del roadmap original: COMPLETADAS 100%
├── Backstory system ✅
├── Serper API integration ✅
├── 3 frameworks (Pros/Cons, SWOT, Eisenhower) ✅
├── Dark mode enforcement ✅
├── Export PDF ✅
└── 4 landing pages ✅

📋 Próxima Prioridad: Analytics & Monitoring (3-4 días)
```

### OKRs Q1 2026 - Tracking

| Métrica | Target | Estado Actual | Cómo Medir |
|---------|--------|---------------|------------|
| Usuarios activos semanales | 100 | ❓ Unknown | PostHog analytics |
| Debates completados | 500+ | ❓ Unknown | DB query |
| NPS score | > 50 | ❓ Unknown | Survey |
| Visitas orgánicas frameworks | 5,000-7,000/mes | ❓ Unknown | Google Analytics |

**Acción recomendada:** Implementar analytics tracking ASAP (Prioridad 1)

---

_Última actualización: 21 Enero 2026_
_Próxima acción: Analytics & Monitoring (Semana 22-28 Enero)_
