# 🛑 Checkpoint Protocol

> **ANTES de ejecutar cualquier acción importante, CONSULTA la sección relevante**

---

## 📋 Tabla de Checkpoints Obligatorios

| 🎯 Acción que vas a hacer      | 📖 Sección a consultar | 🔍 Qué verificar |
| ------------------------------ | --------------------- | ---------------- |
| **ANTES de empezar el día**    | `pnpm preflight` | ⚡ Ejecutar PRE-FLIGHT CHECKS (2 min) |
| **ANTES de cualquier cambio**  | `pnpm preflight` | ⚡ Verificar sistema está OK |
| **CUALQUIER cambio de código** | [ERRORES-COMETIDOS.md](../../ERRORES-COMETIDOS.md) | ⚠️ ¿Ya cometimos este error antes? ¿Cómo prevenirlo? |
| **Usar herramienta `Bash`**    | [CLAUDE-CORE.md](../../CLAUDE-CORE.md#1-herramientas-dedicadas--bash) | ¿Contiene grep/sed/awk/cat/find? → Usar herramienta dedicada |
| **Modificar landing page**     | [04-rules.md](./04-rules.md#9-landing-page) | ⚠️ Solo componentes oficiales - NO usar _archived/ |
| **Modificar dashboard webapp** | [04-rules.md](./04-rules.md#10-dashboard) | ⚠️ ÚNICO archivo - PointsWidget OBLIGATORIO |
| **Restaurar desde producción** | [CLAUDE.md](../../CLAUDE.md#git-restaurar-desde-producción) | ⚠️ SIEMPRE `git checkout main --` NO copiar de otras ubicaciones |
| **Crear nuevo archivo .tsx**   | [apps/web/src/app/INDEX.md](../../apps/web/src/app/INDEX.md) | ⚠️ CONSULTAR INDEX.md primero - ¿Ya existe? ¿Duplicado? |
| **Escribir componente**        | [05-patterns.md](./05-patterns.md#estructura-componentes) | Orden: hooks → state → handlers → effects → render |
| **Editar archivo existente**   | [04-rules.md](./04-rules.md#1-leer-documentación-primero) | ¿Lo leí con `Read` primero? |
| **Crear tRPC router**          | [05-patterns.md](./05-patterns.md#trpc-router-pattern) | Validación Zod + filtro userId + error handling |
| **Crear schema DB**            | [05-patterns.md](./05-patterns.md#schema-drizzle-pattern) | Timestamps + relations + types inferidos |
| **Hacer query a DB**           | [10-security.md](./10-security.md#autorización) | ¿Filtra por `userId`? ¿Validación Zod? |
| **Hacer commit**               | [CLAUDE.md](../../CLAUDE.md#checklist-pre-commit) | TypeCheck + Lint + Tests + No console.log |
| **Crear nueva feature**        | [04-rules.md](./04-rules.md#7-orden-desarrollo) | Backend First: Schema → Router → Tests → UI |
| **Usar `any` o `@ts-ignore`**  | [06-prohibitions.md](./06-prohibitions.md#any) | ❌ NUNCA - Buscar alternativa correcta |
| **Añadir `console.log`**       | [06-prohibitions.md](./06-prohibitions.md#consolelog) | ❌ NUNCA en prod - Usar logger estructurado |
| **Duplicar código**            | [04-rules.md](./04-rules.md#3-arquitectura) | ¿Puedo extraer función/componente reutilizable? |
| **Cambiar imports**            | [CLAUDE.md](../../CLAUDE.md#orden-de-imports-fijo) | React → Third-party → Internal → Local → Types |
| **Manejar errores**            | [10-security.md](./10-security.md) | Validación + Autorización + Sanitización |
| **Escribir tests**             | [09-testing.md](./09-testing.md) | Coverage mínimo 80% + Test cases críticos |
| **Usar `--no-verify`**         | [CLAUDE.md](../../CLAUDE.md#cross-platform-hooks) | ⚠️ Solo si hook falla por entorno + verificar manualmente |
| **Verificar CI/CD**            | [CLAUDE.md](../../CLAUDE.md#cicd) | ¿Pipeline pasó? ¿Qué job falló? |
| **Modificar cualquier UI**     | [08-design-system.md](./08-design-system.md) | ⚠️ Paleta oficial? Inputs text-white? Botones púrpura? Verificar dark mode |
| **Escribir componente React** | [06-prohibitions.md](./06-prohibitions.md#react-hooks) | ⚠️ ¿TODOS los hooks están ANTES de early returns? ¿Uso `enabled` para condicionar? |
| **Crear type/enum** | [05-patterns.md](./05-patterns.md#type-inference) | ⚠️ ¿Ya existe en DB? Inferir en lugar de duplicar |

---

## 🚨 PROCESO OBLIGATORIO

```
1. Identifico qué acción voy a hacer
   ↓
2. Consulto tabla de checkpoints
   ↓
3. Leo la sección relevante de CLAUDE.md
   ↓
4. Verifico que mi acción cumple las reglas
   ↓
5. SOLO ENTONCES ejecuto la acción
```

---

## ⚡ Ejemplo de Uso Correcto

```
Yo pienso: "Voy a crear un nuevo router tRPC para gestionar notificaciones"
         ↓
Consulto tabla: "Crear tRPC router → Ver [tRPC Router Pattern]"
         ↓
Leo sección tRPC Router Pattern
         ↓
Verifico mi plan:
  ✅ Schemas de validación Zod al inicio
  ✅ Filtrado por userId en queries
  ✅ Error handling con TRPCError
  ✅ Mutations con onSuccess callbacks
         ↓
Ejecuto: Creo el router siguiendo el patrón exacto
```

---

## 💡 TIP

**Si tienes duda sobre tu acción, es señal de que DEBES consultar CLAUDE.md primero.**

---

_Ver [INDEX.md](./INDEX.md) para más módulos de documentación_
