# Auditoría Técnica Integral "Wallie 100%"

**Fecha:** 24 de Mayo de 2024
**Auditor:** AI Architect (Gemini 3 Pro)
**Estado:** 🔴 CRÍTICO (Requiere intervención inmediata antes de producción)

## 1. Resumen Ejecutivo

La auditoría del código base de Wallie ha revelado una arquitectura moderna y bien estructurada (Next.js 14, tRPC, Drizzle), pero con **vulnerabilidades críticas de seguridad y lógica** que comprometen la viabilidad del proyecto en producción.

El hallazgo más alarmante es la **desactivación total de la autenticación en entorno local**, lo que impide probar flujos reales de usuarios y crea una falsa sensación de seguridad. Además, el sistema de permisos de administrador está implementado incorrectamente, y existen patrones arquitectónicos incompatibles con el despliegue en Vercel (WebSockets custom y tareas en segundo plano "fire-and-forget").

## 2. Tabla de Hallazgos Críticos

| ID          | Severidad  | Categoría    | Descripción                                                                                                                                                   | Ubicación                     |
| ----------- | ---------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| **SEC-01**  | 🔴 Crítica | Seguridad    | **Bypass Total de Auth en Localhost:** El middleware y tRPC inyectan un usuario falso y saltan la validación de sesión en local. Imposible testear auth real. | `middleware.ts`, `trpc.ts`    |
| **SEC-02**  | 🔴 Crítica | Seguridad    | **Verificación Admin Rota:** `adminProcedure` verifica `ctx.user.role` (rol de Supabase) en lugar de consultar la tabla `admin_users`.                        | `packages/api/src/trpc.ts`    |
| **ARC-01**  | 🟠 Alta    | Arquitectura | **Tareas Async Inestables:** Generación de reportes usa `void generateReportAsync()` sin cola. Se cancelará en Vercel al terminar la request.                 | `forum-reports.ts`            |
| **ARC-02**  | 🟠 Alta    | Arquitectura | **WebSockets Incompatibles:** Implementación custom de WS (`ws://localhost:3001`) no funcionará en Vercel Serverless.                                         | `websocket-provider.tsx`      |
| **TYP-01**  | 🟡 Media   | Type Safety  | **Uso de `z.any()`:** El router del Wizard acepta cualquier estructura para `socialLinks`, rompiendo la seguridad de tipos.                                   | `wizard.ts`                   |
| **PERF-01** | 🟡 Media   | Performance  | **SSG Desactivado:** `dynamic = 'force-dynamic'` en `layout.tsx` fuerza SSR en toda la app, degradando performance.                                           | `apps/web/src/app/layout.tsx` |

## 3. Análisis Detallado

### 3.1 Seguridad y Autenticación (SEC-01, SEC-02)

El código actual contiene "trampas" para facilitar el desarrollo que se han convertido en vulnerabilidades:

- **Middleware:** `if (isLocalhost) return NextResponse.next()` evita que Supabase refresque los tokens.
- **tRPC:** Inyecta un `E2E_USER_ID` automáticamente.
- **Consecuencia:** No se puede garantizar que el sistema de login, logout y protección de rutas funcione realmente hasta que se despliega.

### 3.2 Lógica de Negocio y Admin

La verificación de administrador asume que el usuario de Supabase tiene un rol `admin` en sus metadatos o tabla interna, pero el sistema usa una tabla propia `admin_users`.

```typescript
// ACTUAL (Incorrecto)
if (ctx.user.role !== 'admin') throw new TRPCError(...)

// CORRECTO (Sugerido)
const isAdmin = await db.query.adminUsers.findFirst({ where: eq(adminUsers.userId, ctx.userId) })
if (!isAdmin) throw new TRPCError(...)
```

### 3.3 Arquitectura Serverless (ARC-01, ARC-02)

- **Reportes PDF:** La generación de PDFs es pesada. Al lanzarla sin `await` en una Serverless Function, la ejecución se congela o mata en cuanto se envía la respuesta HTTP. Se requiere una cola (ej. Inngest, QStash o BullMQ).
- **WebSockets:** Vercel no soporta servidores WebSocket persistentes estándar. Se debe migrar a **Pusher**, **Ably**, o usar **Polling** (que ya está parcialmente implementado como fallback).

## 4. Plan de Refactorización (Roadmap)

### Fase 1: Seguridad y Core (Inmediato)

1.  [ ] **Eliminar Bypass de Auth:** Quitar la lógica de `isLocalhost` en middleware y `trpc.ts`. Usar cuentas de prueba reales de Supabase.
2.  [ ] **Corregir `adminProcedure`:** Implementar la consulta a la base de datos para verificar roles.
3.  [ ] **Tipar `wizard.ts`:** Definir esquema Zod estricto para `socialLinks`.

### Fase 2: Estabilidad Serverless

4.  [ ] **Migrar WebSockets:** Eliminar servidor custom y usar Polling (más simple/barato) o integrar Pusher.
5.  [ ] **Cola de Tareas:** Implementar manejo robusto para `generateReportAsync` (o hacerlo síncrono si es rápido, o usar Cron jobs).

### Fase 3: Optimización

6.  [ ] **Revisar `force-dynamic`:** Aplicarlo solo a páginas que lo requieran, no al layout raíz.

## 5. Conclusión

El proyecto tiene una base sólida pero "frágil" debido a atajos tomados durante el desarrollo. La prioridad absoluta es **restaurar la integridad del sistema de autenticación** y corregir la verificación de permisos. Sin esto, el despliegue a producción es inseguro.
