# CHECKLIST_PR.md — Verificar Antes de Cada PR

> **Copia este checklist en la descripción de tu PR**

---

## Checklist obligatorio

### Código

- [ ] No hay `any` ni `@ts-ignore`
- [ ] No hay `console.log` (usar logger si necesario)
- [ ] Todas las queries de DB filtran por `userId`
- [ ] Input validado con Zod en endpoints tRPC
- [ ] Imports siguen el orden definido en CLAUDE.md
- [ ] Naming sigue convenciones (PascalCase, camelCase, etc.)

### Tests

- [ ] `pnpm lint` pasa sin errores
- [ ] `pnpm typecheck` pasa sin errores
- [ ] `pnpm test` pasa sin errores
- [ ] `pnpm build` pasa sin errores

### Git

- [ ] Branch nombrado correctamente (`feature/`, `fix/`, `hotfix/`)
- [ ] Commits siguen conventional commits
- [ ] No hay commits de merge innecesarios
- [ ] PR tiene descripción clara

### Base de datos (si aplica)

- [ ] Schema actualizado en `packages/db/src/schema/`
- [ ] Migración generada con `pnpm db:generate`
- [ ] Migración probada en local
- [ ] RLS policies actualizadas si hay nueva tabla

### UI (si aplica)

- [ ] Funciona en móvil (responsive)
- [ ] Funciona sin JavaScript (SSR)
- [ ] Loading states implementados
- [ ] Error states implementados

### Seguridad (si aplica)

- [ ] No hay secrets hardcodeados
- [ ] Endpoints protegidos con auth
- [ ] Rate limiting si es endpoint público

---

## Descripción del cambio

**¿Qué hace este PR?**

<!-- Descripción clara del cambio -->

**¿Por qué es necesario?**

<!-- Contexto y motivación -->

**¿Cómo probarlo?**

<!-- Pasos para probar manualmente -->

**Screenshots (si aplica)**

<!-- Capturas de pantalla del antes/después -->

---

## Tipo de cambio

- [ ] 🐛 Bug fix (cambio que arregla un issue)
- [ ] ✨ Nueva feature (cambio que añade funcionalidad)
- [ ] 💥 Breaking change (cambio que rompe compatibilidad)
- [ ] 📝 Documentación
- [ ] 🎨 Estilo (formato, no afecta lógica)
- [ ] ♻️ Refactor (cambio de código sin nueva feature ni fix)
- [ ] 🧪 Tests
- [ ] 🔧 Config/CI

---

## Tareas relacionadas

- Closes #<!-- número de issue -->
- Related to #<!-- número de issue -->
