# 🔄 PROPUESTA: Refactorizar CLAUDE.md

> **Fecha:** 27 Ene 2026
> **Problema:** Redundancia masiva (184KB CLAUDE.md + 76KB módulos = 108KB duplicados)
> **Objetivo:** CLAUDE.md como índice maestro (~40KB), NO fuente completa

---

## 📊 Estado Actual

```
CLAUDE.md:              184 KB  (4,810 líneas) 🔴 DEMASIADO GRANDE
CLAUDE-CORE.md:           8 KB  (301 líneas)   ✅ Correcto
docs/claude/ (11 mods):  76 KB  (1,364 líneas) ✅ Correcto

REDUNDANCIA ESTIMADA: ~108 KB (40%)
```

---

## 🎯 Propuesta: Nueva Estructura

### 1. CLAUDE.md → CLAUDE-INDEX.md (40KB máximo)

**Contenido:**
```markdown
# CLAUDE.md - Índice Maestro de Documentación

## 🚀 INICIO RÁPIDO
→ Lee [CLAUDE-CORE.md](./CLAUDE-CORE.md) (5 min)

## 📚 MÓDULOS DISPONIBLES
[Tabla con 11 módulos + descripción + link]

## 🔍 BÚSQUEDA RÁPIDA
[Keywords → Módulo específico]
- "tRPC router" → [05-patterns.md](./docs/claude/05-patterns.md#trpc-router-pattern)
- "React hooks" → [04-rules.md](./docs/claude/04-rules.md#react-hooks)
- "userId security" → [10-security.md](./docs/claude/10-security.md#userid-filtering)

## 📋 CHECKPOINT PROTOCOL
[Tabla completa con links a secciones específicas]

## ⚠️ ERRORES HISTÓRICOS
→ Ver [ERRORES-COMETIDOS.md](./ERRORES-COMETIDOS.md)

## 📊 ESTADÍSTICAS
[Métricas del proyecto]

## 🔄 CHANGELOG
[Cambios recientes en documentación]
```

**NO incluir:**
- ❌ Ejemplos de código completos (están en módulos)
- ❌ Explicaciones largas (están en módulos)
- ❌ Patrones duplicados (están en 05-patterns.md)
- ❌ Stack tecnológico (está en 07-stack.md)

---

### 2. Contenido que MOVER a Módulos

#### De CLAUDE.md → 05-patterns.md
- [ ] tRPC Router Pattern completo (eliminar de CLAUDE.md)
- [ ] Schema Drizzle Pattern completo
- [ ] Server Action Pattern completo

#### De CLAUDE.md → 04-rules.md
- [ ] Regla #9 (Landing Page) completa
- [ ] Regla #10 (Dashboard) completa
- [ ] Regla #11-22 (resto de reglas)

#### De CLAUDE.md → 06-prohibitions.md
- [ ] Ejemplos específicos de prohibiciones
- [ ] 28 cosas que NUNCA hacer

#### De CLAUDE.md → 08-design-system.md
- [ ] Paleta de colores completa
- [ ] Snippets de copiar-pegar
- [ ] Templates por componente

#### De CLAUDE.md → 07-stack.md
- [ ] Stack tecnológico completo
- [ ] Librerías aprobadas
- [ ] Versiones específicas

#### De CLAUDE.md → 03-database.md
- [ ] Arquitectura híbrida explicada
- [ ] Flujo de autenticación
- [ ] Checklist de debugging

---

## ✅ Beneficios

1. **Mantenibilidad**: Cambiar info una sola vez (en el módulo)
2. **Navegación**: Más fácil encontrar info específica
3. **Performance**: Archivos más pequeños, lectura más rápida
4. **Claridad**: Una sola fuente de verdad por tema
5. **Reducción**: 184KB → 40KB en CLAUDE.md (-78%)

---

## 📋 Plan de Ejecución

### Fase 1: Análisis (30 min)
- [ ] Listar todas las secciones de CLAUDE.md
- [ ] Identificar qué ya está en módulos
- [ ] Marcar contenido a eliminar vs contenido a mover

### Fase 2: Mover Contenido (2 horas)
- [ ] Mover secciones a módulos correspondientes
- [ ] Verificar que no se pierde información
- [ ] Actualizar links internos

### Fase 3: Refactorizar CLAUDE.md (1 hora)
- [ ] Crear nueva estructura con índices
- [ ] Añadir links a módulos
- [ ] Tabla de búsqueda rápida
- [ ] Verificar que funciona el flujo de navegación

### Fase 4: Validación (30 min)
- [ ] Leer flujo completo (CLAUDE-CORE → módulo → back)
- [ ] Verificar que no hay info perdida
- [ ] Confirmar que se reduce redundancia
- [ ] Actualizar PHASES.md con nuevo estado

**Tiempo total estimado: 4 horas**

---

## ⚠️ Consideraciones

1. **No romper flujo existente**: CLAUDE-CORE.md sigue siendo el inicio
2. **Mantener CLAUDE.md**: Por si alguien lo usa como referencia completa
3. **Links relativos**: Todos los links deben funcionar en GitHub/VS Code
4. **Backward compatibility**: Comandos Grep sobre CLAUDE.md deben seguir funcionando

---

## 🎯 Resultado Esperado

```
Antes:
CLAUDE.md (184KB) ← TODO aquí (redundante con módulos)

Después:
CLAUDE-CORE.md (8KB)     ← Inicio rápido
    ↓
docs/claude/INDEX.md (8KB) ← Navegación
    ↓
CLAUDE.md (40KB)          ← Índice maestro + búsqueda rápida
    ↓
docs/claude/*.md (76KB)   ← Contenido detallado (ÚNICA fuente)

Reducción: 184KB → 40KB (-78%)
Redundancia: 40% → 5%
```

---

## 💬 Pregunta para el Usuario

**¿Aprobamos esta refactorización?**

**Pros:**
- ✅ Elimina redundancia masiva
- ✅ Mantenimiento más fácil
- ✅ Navegación más clara
- ✅ Archivos más pequeños

**Contras:**
- ⚠️ Requiere 4 horas de trabajo
- ⚠️ Puede romper flujos si no se hace bien

**Alternativa conservadora:**
- Mantener CLAUDE.md como está (referencia completa)
- Añadir disclaimer al inicio: "Este es archivo legacy, ver módulos"
- Nuevas actualizaciones solo en módulos

---

_Creado: 27 Ene 2026_
_Autor: Claude Code + Usuario_
