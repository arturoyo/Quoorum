# Dependency Management Strategy

> **Versión:** 1.0.0 | **Última actualización:** 10 Dic 2025

---

## Principios

1. **Estabilidad sobre novedad** - Preferir versiones estables
2. **Seguridad primero** - Actualizar vulnerabilidades inmediatamente
3. **Cambios incrementales** - Actualizar de a poco, no todo junto
4. **Testing obligatorio** - Nunca actualizar sin verificar tests

---

## Clasificación de Dependencias

### Críticas (actualizar con cuidado)

| Dependencia | Política | Razón |
|-------------|----------|-------|
| `next` | Minor mensual, major con análisis | Breaking changes frecuentes |
| `react` | Seguir Next.js | Compatibilidad |
| `drizzle-orm` | Minor mensual | Migraciones de DB |
| `@trpc/*` | Minor trimestral | API changes |
| `typescript` | Minor mensual | Type changes |

### Importantes (actualizar regularmente)

| Dependencia | Política | Razón |
|-------------|----------|-------|
| `@supabase/*` | Minor mensual | Auth/DB features |
| `tailwindcss` | Minor mensual | Styles |
| `zod` | Minor mensual | Validaciones |
| `openai` / AI SDKs | Minor semanal | Nuevos modelos |

### Flexibles (actualizar libremente)

| Dependencia | Política |
|-------------|----------|
| `lucide-react` | Latest |
| `date-fns` | Latest |
| `clsx`, `tailwind-merge` | Latest |
| Dev dependencies | Latest |

---

## Proceso de Actualización

### Semanal: Security Scan

```bash
# Lunes AM
pnpm audit

# Si hay vulnerabilidades críticas:
pnpm audit fix

# Si requiere major update:
# Evaluar y planificar
```

### Mensual: Minor Updates

```bash
# Primer viernes del mes

# 1. Ver qué hay para actualizar
pnpm outdated

# 2. Actualizar dev dependencies primero
pnpm update -D

# 3. Correr tests
pnpm test

# 4. Si pasan, actualizar prod dependencies
pnpm update

# 5. Correr tests de nuevo
pnpm test && pnpm build

# 6. Commit
git commit -am "chore(deps): monthly dependency update"
```

### Trimestral: Major Updates

```bash
# Último viernes del trimestre

# 1. Revisar changelogs de dependencias críticas
# - Next.js: https://nextjs.org/blog
# - tRPC: https://trpc.io/docs/migrate-from-v10-to-v11
# - Drizzle: https://orm.drizzle.team/docs/changelog

# 2. Crear branch
git checkout -b chore/major-deps-update-q1-2025

# 3. Actualizar una dependencia a la vez
pnpm update next@latest
pnpm test && pnpm build

# 4. Si falla, investigar breaking changes

# 5. PR con descripción detallada de cambios
```

---

## Dependencias Prohibidas

| Librería | Razón | Alternativa |
|----------|-------|-------------|
| `moment.js` | Bundle size | `date-fns` |
| `lodash` (full) | Bundle size | `lodash-es` (tree-shakeable) |
| `axios` | Innecesario | `fetch` nativo |
| `jquery` | No necesario | React |
| `express` | Server en Next.js | API routes |

---

## Agregar Nueva Dependencia

### Checklist

- [ ] ¿Es realmente necesaria? ¿No hay alternativa nativa?
- [ ] ¿Está activamente mantenida? (commits < 6 meses)
- [ ] ¿Tiene buena documentación?
- [ ] ¿Bundle size es aceptable?
- [ ] ¿Es type-safe o tiene @types/?
- [ ] ¿No tiene vulnerabilidades conocidas?

### Comando

```bash
# 1. Investigar antes de instalar
npx bundlephobia <package-name>  # Ver tamaño
npm info <package-name>           # Ver metadata

# 2. Instalar
pnpm add <package-name>

# 3. Si es dev-only
pnpm add -D <package-name>

# 4. Documentar en STACK.md si es importante
```

---

## Lockfile Policy

```yaml
# pnpm-lock.yaml SIEMPRE debe estar en Git

# NUNCA hacer:
git rm pnpm-lock.yaml  # ❌

# SI hay conflictos:
rm pnpm-lock.yaml
pnpm install           # Regenerar
git add pnpm-lock.yaml
```

---

## Renovate/Dependabot Config

```json
// renovate.json (si se usa)
{
  "extends": ["config:base"],
  "schedule": ["every weekend"],
  "packageRules": [
    {
      "matchPackagePatterns": ["*"],
      "matchUpdateTypes": ["minor", "patch"],
      "automerge": false
    },
    {
      "matchPackagePatterns": ["eslint", "prettier", "@types/*"],
      "automerge": true
    },
    {
      "matchPackageNames": ["next", "react", "react-dom"],
      "groupName": "React/Next.js",
      "automerge": false
    }
  ],
  "vulnerabilityAlerts": {
    "enabled": true,
    "labels": ["security"]
  }
}
```

---

## Breaking Changes Conocidos

### Next.js 14 → 15

```typescript
// Cambios a considerar:
// - Turbopack por defecto
// - Async request APIs
// - fetch caching changes

// Ver: https://nextjs.org/docs/app/building-your-application/upgrading/version-15
```

### tRPC v10 → v11

```typescript
// Cambios:
// - useUtils() en lugar de useContext()
// - Nueva API de subscriptions

// Ver: https://trpc.io/docs/migrate-from-v10-to-v11
```

### Drizzle ORM Updates

```typescript
// Siempre revisar:
// - Cambios en query builder
// - Nuevas migraciones necesarias

// Ver: https://orm.drizzle.team/docs/changelog
```

---

## Monitoreo

### Herramientas

| Herramienta | Propósito | Frecuencia |
|-------------|-----------|------------|
| `pnpm audit` | Vulnerabilidades | Semanal |
| `pnpm outdated` | Updates disponibles | Mensual |
| Snyk | Security scanning | Continuo (CI) |
| Bundlephobia | Bundle analysis | Al añadir deps |

### Alertas Automáticas

```yaml
# En CI (opcional)
- name: Security Audit
  run: pnpm audit --audit-level=high
  continue-on-error: false
```

---

_Última actualización: 10 Dic 2025_
