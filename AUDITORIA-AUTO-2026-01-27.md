# 📊 Auditoría Automatizada del Proyecto

**Fecha:** 2026-01-27
**Modo:** Rápido (sin tests)
**Puntuación Final:** 6.9/10.0

❌ **Estado:** Requiere atención - Hay problemas críticos que resolver.

---

## ❌ TypeScript Strictness

**Puntuación:** 25/100 (25%)

### ❌ Errores Críticos

- Found 3 @ts-ignore directives (target: 0)
- TypeScript compilation failed

### ⚠️ Advertencias

- Found 21 'any' types (target: 0)
- Found 11 @ts-expect-error directives

### 📋 Detalles

- Total files analyzed: 640
- 'any' types found: 21
- @ts-ignore directives: 3
- @ts-expect-error directives: 11

Running pnpm typecheck...
[ERROR] TypeScript compilation failed

---

## ❌ Code Quality

**Puntuación:** 50/100 (50%)

### ⚠️ Advertencias

- Found 768 console.* statements in production code
- ESLint found issues

### 📋 Detalles

- Production files analyzed: 638
- console.* statements: 768

Files with console statements:
-   - .\apps\web\e2e\helpers\auth-postgres.ts (7)
-   - .\apps\web\e2e\helpers\auth.ts (4)
-   - .\apps\web\e2e\helpers\setup.ts (4)
-   - .\apps\web\scripts\confirm-email-http.ts (25)
-   - .\apps\web\scripts\confirm-email-sql.ts (21)
-   - .\apps\web\scripts\confirm-user-email.ts (21)
-   - .\apps\web\scripts\copy-pdf-worker.js (3)
-   - .\apps\web\scripts\create-test-user-db.ts (31)
-   - .\apps\web\scripts\create-test-user.js (22)
-   - .\apps\web\scripts\create-test-user.ts (14)
-   ... and 63 more

Running pnpm lint...
[WARN] ESLint found issues

---

## ✅ Testing

**Puntuación:** 100/100 (100%)

### 📋 Detalles

- Total test files: 51

Test files by package:
[SKIPPED] Test execution skipped (--quick mode)

---

## ✅ Security

**Puntuación:** 100/100 (100%)

### ⚠️ Advertencias

- 10 DB queries without userId filter (verify if intentional)

### 📋 Detalles

[OK] .env files are in .gitignore
[OK] No obvious secrets found in code

---

## 🎯 Acciones Recomendadas

### Alta Prioridad (2)

1. Found 3 @ts-ignore directives (target: 0)
2. TypeScript compilation failed

### Media Prioridad (5)

1. Found 21 'any' types (target: 0)
2. Found 11 @ts-expect-error directives
3. Found 768 console.* statements in production code
4. ESLint found issues
5. 10 DB queries without userId filter (verify if intentional)

---

*Generado automáticamente por scripts/audit-project.ts*
