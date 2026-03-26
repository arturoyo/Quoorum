# 📚 Claude Documentation - Índice de Navegación

> **Sistema modular de documentación para IA**
> **Versión:** 1.0.0 | **Fecha:** 26 Ene 2026

---

## 🎯 INICIO RÁPIDO

### Para tareas cotidianas (5 min)
→ Lee **[CLAUDE.md](../../CLAUDE.md)** y este índice

### Para implementar features (10-15 min)
→ Lee **[CLAUDE.md](../../CLAUDE.md)** + módulos específicos existentes

### Para referencia completa (30+ min)
→ Lee **[CLAUDE.md](../../CLAUDE.md)** (56K tokens)

---

## 📋 MÓDULOS DISPONIBLES

### 🚨 Crítico - Leer Primero

| Módulo | Archivo | Contenido | Tiempo |
|--------|---------|-----------|--------|
| **Inicio Rápido** | [CLAUDE.md](../../CLAUDE.md) | Resumen operativo actual | 5 min |
| **Errores Históricos** | [ERRORES-COMETIDOS.md](../../ERRORES-COMETIDOS.md) | Errores que NO repetir | 10 min |

### 📖 Fundamentos

| # | Módulo | Archivo | Contenido |
|---|--------|---------|-----------|
| 02 | **Checkpoint Protocol** | [02-checkpoint-protocol.md](./02-checkpoint-protocol.md) | Tabla de verificaciones pre-acción |

### 🔴 Reglas y Prohibiciones

| # | Módulo | Archivo | Contenido |
|---|--------|---------|-----------|
| 04 | **Reglas Inviolables** | [04-rules.md](./04-rules.md) | 22 reglas NO negociables |

### 🛠️ Implementación

| # | Módulo | Archivo | Contenido |
|---|--------|---------|-----------|
| 05 | **Patrones Obligatorios** | [05-patterns.md](./05-patterns.md) | tRPC, Drizzle, Error Handling (2 capas) |

### ✅ Calidad y Seguridad

| # | Módulo | Archivo | Contenido |
|---|--------|---------|-----------|

### 🔧 Referencia

| # | Módulo | Archivo | Contenido |
|---|--------|---------|-----------|
| 11 | **Referencia viva** | [../../README.md](../../README.md) | Setup, comandos y estado general |

---

## 🎯 GUÍA DE USO POR TIPO DE TAREA

### 📱 Implementar Feature Frontend

**Lee (15 min):**
1. [CLAUDE.md](../../CLAUDE.md) - Estado operativo real
2. [04-rules.md](./04-rules.md) - Regla #13 (UX/Design)
3. [05-patterns.md](./05-patterns.md) - Estructura componentes

**Verifica:**
- [ ] Variables CSS (no hardcodear colores)
- [ ] Hooks ANTES de early returns
- [ ] Imports en orden correcto

---

### 🔌 Implementar Feature Backend

**Lee (15 min):**
1. [CLAUDE.md](../../CLAUDE.md) - Estado operativo real
2. [05-patterns.md](./05-patterns.md) - tRPC Router Pattern
3. [04-rules.md](./04-rules.md) - Convenciones y límites

**Verifica:**
- [ ] Schema Drizzle con timestamps
- [ ] Validación Zod en input
- [ ] Filtro userId en queries
- [ ] Tests unitarios

---

### 🎨 Modificar UI/Componentes

**Lee (10 min):**
1. [CLAUDE.md](../../CLAUDE.md) - Estado operativo real
2. [04-rules.md](./04-rules.md) - Regla #13 (UX/Design)

**Verifica:**
- [ ] Usa variables CSS de tema
- [ ] NO hardcodear colores (text-white, bg-white/5, etc.)
- [ ] Funciona en light Y dark mode
- [ ] Snippets de copiar-pegar

---

### 🔐 Implementar Autenticación/Seguridad

**Lee (15 min):**
1. [CLAUDE.md](../../CLAUDE.md) - Estado operativo real
2. [04-rules.md](./04-rules.md) - Reglas del repo
3. [05-patterns.md](./05-patterns.md) - Patrones y validación

**Verifica:**
- [ ] Supabase solo para Auth
- [ ] Validación Zod en todos los inputs
- [ ] Autorización (userId) en queries
- [ ] Sanitización de output

---

### 🧪 Escribir Tests

**Lee (10 min):**
1. [CLAUDE.md](../../CLAUDE.md) - Estado operativo real
2. [README.md](../../README.md) - Comandos de testing actuales

**Verifica:**
- [ ] Coverage mínimo 80%
- [ ] Tests de validación Zod
- [ ] Tests de autorización (userId)
- [ ] Tests E2E para flujos críticos

---

### 🐛 Debugging / Troubleshooting

**Lee (5 min):**
1. [README.md](../../README.md) - Comandos y setup
2. [04-rules.md](./04-rules.md) - Errores comunes del repo

**Comandos útiles:**
```bash
# Limpiar cache
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules/.cache

# Verificar puerto ocupado
Get-Process | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force

# TypeCheck + Lint
pnpm typecheck && pnpm lint
```

---

## 🔍 BÚSQUEDA RÁPIDA

### Buscar por Keyword en CLAUDE.md

```bash
# Usar herramienta Grep
Grep pattern="keyword" path="CLAUDE.md" output_mode="content"
```

### Ejemplos de búsqueda:

- **"tRPC router"** → Patrón de routers
- **"React hooks"** → Reglas de hooks
- **"userId"** → Seguridad y autorización
- **"console.log"** → Prohibiciones
- **"any"** → Prohibiciones de tipos

---

## 📊 ESTADÍSTICAS DEL PROYECTO

**Estado actual (26 Ene 2026):**
- ✅ **CLAUDE.md:** 4810 líneas, 56K tokens
- ✅ **Deuda técnica IA:** 0 (configuración centralizada)
- ✅ **Tests:** 328 passing (369 total)
- ✅ **Documentación:** Completa y modularizada

---

## 🚀 MANTENIMIENTO

### Actualizar documentación:

1. **Cambio crítico** → Actualizar [CLAUDE.md](../../CLAUDE.md)
2. **Nueva regla** → Añadir a [04-rules.md](./04-rules.md)
3. **Nuevo patrón** → Añadir a [05-patterns.md](./05-patterns.md)
4. **Cambio en stack** → Documentarlo en [README.md](../../README.md)

### Verificar sincronización:

- [ ] CLAUDE.md refleja cambios críticos
- [ ] Módulos están actualizados
- [ ] CLAUDE.md es la fuente de verdad
- [ ] Ejemplos de código funcionan

---

## 💡 TIPS FINALES

✅ **Usa CLAUDE.md** para trabajo diario (5 min)
✅ **Consulta módulos** para tareas específicas (3-5 min)
✅ **Busca en CLAUDE.md** para referencia completa
✅ **Pregunta ANTES** si no encuentras la respuesta

❌ **NO asumas** estructuras o patrones
❌ **NO inventes** sin consultar documentación
❌ **NO ignores** las reglas críticas

---

_Sistema modular de documentación v1.0.0 - 26 Ene 2026_
