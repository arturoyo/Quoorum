# 📚 Claude Documentation System

> **Sistema modular de documentación para IA**
> **Versión:** 1.0.0 | **Fecha:** 26 Ene 2026

---

## 🎯 OBJETIVO

Reducir el tamaño de CLAUDE.md (56K tokens → 8K tokens) dividiéndolo en módulos temáticos sin perder información.

---

## 📊 ANTES Y DESPUÉS

### ❌ ANTES (Problema)

```
CLAUDE.md: 4810 líneas, 56K tokens
└─ Demasiado grande para leer de una vez
└─ Difícil de mantener
└─ Búsquedas lentas
```

### ✅ DESPUÉS (Solución)

```
CLAUDE-CORE.md: 300 líneas, 5K tokens ← INICIO RÁPIDO
└─ Top 10 reglas críticas
└─ Referencias a módulos específicos

docs/claude/
├─ INDEX.md                    ← Mapa de navegación
├─ 01-startup-protocol.md      ← Protocolo de inicio
├─ 02-checkpoint-protocol.md   ← Checkpoints obligatorios
├─ 03-database.md              ← PostgreSQL local
├─ 04-rules.md                 ← 22 reglas inviolables
├─ 05-patterns.md              ← tRPC, Drizzle, componentes
├─ 06-prohibitions.md          ← 28 prohibiciones
├─ 07-stack.md                 ← Stack tecnológico
├─ 08-design-system.md         ← Paleta colores (MUY USADO)
├─ 09-testing.md               ← Testing patterns
├─ 10-security.md              ← Seguridad
└─ 11-faq.md                   ← Comandos + troubleshooting

CLAUDE.md: 4810 líneas, 56K tokens ← FUENTE DE VERDAD
└─ Documentación completa y detallada
└─ Búsqueda con Grep para keywords
```

---

## 🚀 CÓMO USAR ESTE SISTEMA

### Para Trabajo Diario (5 min)

1. **Lee [CLAUDE-CORE.md](../../CLAUDE-CORE.md)**
2. Consulta [INDEX.md](./INDEX.md) si necesitas algo específico

### Para Implementar Feature (10-15 min)

1. **Lee [CLAUDE-CORE.md](../../CLAUDE-CORE.md)**
2. **Consulta módulos específicos** según tu tarea:
   - Backend → [05-patterns.md](./05-patterns.md) + [10-security.md](./10-security.md)
   - Frontend → [04-rules.md](./04-rules.md) + [08-design-system.md](./08-design-system.md)
   - UI → [08-design-system.md](./08-design-system.md)

### Para Referencia Completa (30+ min)

- **Lee [CLAUDE.md](../../CLAUDE.md)** completo
- **Busca keywords** con herramienta Grep

---

## 📋 MÓDULOS DISPONIBLES

### 🚨 Críticos (Leer Primero)

- **[CLAUDE-CORE.md](../../CLAUDE-CORE.md)** - Top 10 reglas (5 min)
- **[ERRORES-COMETIDOS.md](../../ERRORES-COMETIDOS.md)** - Errores históricos (10 min)

### 📖 Fundamentos

- **[01-startup-protocol.md](./01-startup-protocol.md)** - Protocolo de inicio
- **[02-checkpoint-protocol.md](./02-checkpoint-protocol.md)** - Checkpoints obligatorios
- **[03-database.md](./03-database.md)** - PostgreSQL local

### 🔴 Reglas

- **[04-rules.md](./04-rules.md)** - 22 reglas inviolables
- **[06-prohibitions.md](./06-prohibitions.md)** - 28 prohibiciones

### 🛠️ Implementación

- **[05-patterns.md](./05-patterns.md)** - Patrones de código
- **[07-stack.md](./07-stack.md)** - Stack tecnológico
- **[08-design-system.md](./08-design-system.md)** - Paleta colores

### ✅ Calidad

- **[09-testing.md](./09-testing.md)** - Testing
- **[10-security.md](./10-security.md)** - Seguridad

### 🔧 Referencia

- **[11-faq.md](./11-faq.md)** - FAQ + comandos

---

## 🎯 GUÍA RÁPIDA POR TIPO DE TAREA

| Tarea | Lee (15 min) | Verifica |
|-------|--------------|----------|
| **Backend feature** | CLAUDE-CORE + 03-database + 05-patterns + 10-security | userId filter, Zod validation |
| **Frontend feature** | CLAUDE-CORE + 04-rules + 05-patterns + 08-design-system | Variables CSS, hooks order |
| **Modificar UI** | CLAUDE-CORE + 08-design-system | NO hardcodear colores |
| **Escribir tests** | CLAUDE-CORE + 09-testing | Coverage 80% mínimo |
| **Troubleshooting** | 11-faq | Comandos útiles |

---

## 📊 ESTADÍSTICAS

**Estado actual (26 Ene 2026):**

### Documentación

- ✅ **CLAUDE.md:** 4810 líneas, 56K tokens (fuente de verdad)
- ✅ **CLAUDE-CORE.md:** 300 líneas, 5K tokens (inicio rápido)
- ✅ **Módulos:** 11 archivos temáticos
- ✅ **Reducción:** 90% en tiempo de lectura inicial

### Proyecto

- ✅ **Deuda técnica IA:** 0 (configuración centralizada)
- ✅ **Tests:** 328 passing (369 total)
- ✅ **Documentación:** Completa y modularizada

---

## 🔄 MANTENIMIENTO

### Actualizar Documentación

1. **Cambio crítico** → Actualizar [CLAUDE-CORE.md](../../CLAUDE-CORE.md)
2. **Nueva regla** → Añadir a [04-rules.md](./04-rules.md)
3. **Nuevo patrón** → Añadir a [05-patterns.md](./05-patterns.md)
4. **Cambio en stack** → Actualizar [07-stack.md](./07-stack.md)
5. **SIEMPRE** → Actualizar [CLAUDE.md](../../CLAUDE.md) (fuente de verdad)

### Verificar Sincronización

- [ ] CLAUDE-CORE.md refleja cambios críticos
- [ ] Módulos están actualizados
- [ ] CLAUDE.md es la fuente de verdad
- [ ] Ejemplos de código funcionan
- [ ] Enlaces entre módulos funcionan

---

## 💡 BENEFICIOS DE ESTE SISTEMA

✅ **Rápido:** CLAUDE-CORE.md se lee en 5 minutos
✅ **Completo:** CLAUDE.md sigue siendo la fuente de verdad
✅ **Escalable:** Añadir módulos sin inflar el core
✅ **Buscable:** Usar Grep en CLAUDE.md para keywords
✅ **Mantenible:** Actualizar solo el módulo relevante
✅ **Organizado:** Cada módulo tiene un propósito claro

---

## 🎓 FILOSOFÍA DEL SISTEMA

### Capas de Información

```
Capa 1: CLAUDE-CORE.md (5 min)
└─ Reglas esenciales para trabajo diario
└─ Referencias a módulos específicos

Capa 2: Módulos Temáticos (3-5 min cada uno)
└─ Información detallada de un tema específico
└─ Ejemplos prácticos
└─ Enlaces a CLAUDE.md para detalles completos

Capa 3: CLAUDE.md (30+ min)
└─ Fuente de verdad con TODA la información
└─ Ejemplos exhaustivos
└─ Contexto histórico y decisiones de diseño
```

### Principios de Diseño

1. **No Repetir Información** - Un solo lugar para cada concepto
2. **Enlaces, No Duplicación** - Módulos enlazan a CLAUDE.md
3. **Fuente de Verdad Única** - CLAUDE.md es la referencia final
4. **Búsqueda Fácil** - Grep sobre CLAUDE.md para keywords
5. **Actualización Coherente** - Cambios se propagan desde CLAUDE.md

---

## 🔍 BÚSQUEDA RÁPIDA

### Buscar por Keyword

```bash
# Usar herramienta Grep sobre CLAUDE.md
Grep pattern="keyword" path="CLAUDE.md" output_mode="content"
```

### Ejemplos de Búsqueda

| Busco | Keyword | Resultado |
|-------|---------|-----------|
| Patrón tRPC | `"tRPC router"` | Sección completa con ejemplos |
| Reglas hooks | `"React hooks"` | Reglas + ejemplos |
| Seguridad | `"userId"` | Todas las menciones de autorización |
| Prohibiciones | `"console.log"` | Regla + alternativas |
| Tipos | `"any"` | Prohibiciones + type guards |

---

## 📞 SOPORTE

Si tienes dudas sobre el sistema de documentación:

1. ✅ **Busca en CLAUDE.md** con Grep
2. ✅ **Consulta [INDEX.md](./INDEX.md)** para navegación
3. ✅ **Pregunta** si no encuentras la respuesta

---

_Sistema de Documentación Modular v1.0.0 - 26 Ene 2026_
