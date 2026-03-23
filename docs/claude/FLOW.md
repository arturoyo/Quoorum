# 📊 Flujo de Lectura para IA

> **Cómo Claude (IA) debe leer la documentación**

---

## 🔄 FLUJO VISUAL

```
┌─────────────────────────────────────────────────────────────┐
│  Claude (IA) inicia sesión                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  CLAUDE.md (en contexto del sistema)                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 🚨 INSTRUCCIÓN PARA CLAUDE (IA)                       │  │
│  │                                                        │  │
│  │ ANTES de hacer CUALQUIER cosa, DEBES leer:           │  │
│  │                                                        │  │
│  │ 1. ⭐ CLAUDE-CORE.md (5 min) ← PRIMERO                │  │
│  │ 2. docs/claude/[módulo según tarea] (3-5 min)        │  │
│  │ 3. CLAUDE.md para detalles (solo si necesario)       │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  ⭐ CLAUDE-CORE.md (OBLIGATORIO - 5 min)                    │
│                                                             │
│  ✅ Top 10 reglas críticas                                  │
│  ✅ Prohibiciones principales                               │
│  ✅ Patrones básicos                                        │
│  ✅ Referencias a módulos específicos                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    ¿Qué tarea tengo?
                            ↓
        ┌───────────────────┴───────────────────┐
        ↓                   ↓                   ↓
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  Backend      │  │  Frontend     │  │  UI/Design    │
│  Feature      │  │  Feature      │  │  Changes      │
└───────────────┘  └───────────────┘  └───────────────┘
        ↓                   ↓                   ↓
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ Leo módulos:  │  │ Leo módulos:  │  │ Leo módulo:   │
│               │  │               │  │               │
│ 03-database   │  │ 04-rules      │  │ 08-design     │
│ 05-patterns   │  │ 08-design     │  │  -system      │
│ 10-security   │  │  -system      │  │               │
└───────────────┘  └───────────────┘  └───────────────┘
        ↓                   ↓                   ↓
        └───────────────────┴───────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Implemento siguiendo los patrones                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
                  ¿Necesito más detalles?
                            ↓
                ┌───────────┴───────────┐
                ↓                       ↓
        ┌───────────────┐      ┌───────────────┐
        │  Grep sobre   │      │  Continúo     │
        │  CLAUDE.md    │      │  con la tarea │
        │  (keywords)   │      │               │
        └───────────────┘      └───────────────┘
```

---

## ⏱️ TIEMPO DE LECTURA

### Primera Sesión (Setup Completo)

```
1. CLAUDE-CORE.md                     5 min
2. ERRORES-COMETIDOS.md              10 min
3. Módulos específicos (2-3)      10-15 min
                                 ──────────
                         TOTAL: ~25-30 min
```

### Sesiones Posteriores (Trabajo Diario)

```
1. CLAUDE-CORE.md (refresh)           2 min
2. Módulo específico (si necesario)   3 min
3. Checkpoint protocol                1 min
                                   ────────
                           TOTAL: ~5-6 min
```

---

## 📋 CHECKLIST PARA CLAUDE (IA)

Antes de empezar a codear:

- [ ] ¿Leí CLAUDE-CORE.md completo?
- [ ] ¿Identifiqué qué tipo de tarea tengo?
- [ ] ¿Leí el módulo relevante para mi tarea?
- [ ] ¿Consulté el Checkpoint Protocol?
- [ ] ¿Verifiqué ERRORES-COMETIDOS.md?

Solo si todo ✅ → Empezar a codear

---

## 🎯 CASOS DE USO

### Caso 1: Implementar Router tRPC

```
1. Leo CLAUDE-CORE.md (5 min)
   └─ Reglas de seguridad, validación

2. Leo 03-database.md (3 min)
   └─ PostgreSQL local, userId obligatorio

3. Leo 05-patterns.md (4 min)
   └─ tRPC Router Pattern con ejemplos

4. Consulto 02-checkpoint-protocol.md (1 min)
   └─ Verifico: Zod validation ✅, userId filter ✅

5. Implemento el router
```

### Caso 2: Modificar UI/Componente

```
1. Leo CLAUDE-CORE.md (5 min)
   └─ Regla #13 UX/Design crítica

2. Leo 08-design-system.md (5 min)
   └─ Variables CSS, snippets de copiar-pegar

3. Consulto 02-checkpoint-protocol.md (1 min)
   └─ Verifico: Variables CSS ✅, NO hardcodear colores ✅

4. Implemento el componente
   └─ Copiando snippets de 08-design-system.md
```

### Caso 3: Troubleshooting Error

```
1. Leo 11-faq.md (3 min)
   └─ Busco el error en la sección troubleshooting

2. Si no encuentro solución:
   └─ Grep sobre CLAUDE.md con keyword del error

3. Aplico la solución documentada
```

---

## 💡 MANTRA PARA CLAUDE (IA)

```
"CLAUDE-CORE.md primero, SIEMPRE.
Módulos según mi tarea.
CLAUDE.md para detalles."
```

---

## 📊 COMPARATIVA

### ❌ ANTES (Sistema Antiguo)

```
Claude lee CLAUDE.md completo
└─ 56K tokens, 30+ min
└─ Información abrumadora
└─ Difícil de recordar
└─ Búsquedas lentas
```

### ✅ DESPUÉS (Sistema Nuevo)

```
Claude lee CLAUDE-CORE.md
├─ 5K tokens, 5 min
├─ Top 10 reglas críticas
├─ Referencias a módulos
└─ 85% más rápido

Luego consulta módulos específicos
├─ 3-5 min por módulo
├─ Solo lo necesario
└─ Información enfocada

CLAUDE.md solo para detalles
└─ Grep con keywords
└─ Referencia completa
```

---

## 🎓 BENEFICIOS PARA CLAUDE (IA)

1. **Inicio más rápido** - 5 min vs 30+ min
2. **Menos sobrecarga cognitiva** - Solo lee lo necesario
3. **Información contextual** - Módulos según la tarea
4. **Actualizaciones más fáciles** - Solo lee el módulo actualizado
5. **Mejor retención** - Información en porciones digeribles

---

_Ver [INDEX.md](./INDEX.md) para navegación completa del sistema_
