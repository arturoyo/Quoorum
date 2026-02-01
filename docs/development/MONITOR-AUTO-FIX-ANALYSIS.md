# 🔍 ANÁLISIS: ERRORES HISTÓRICOS PARA AUTO-FIX EN MONITOR

**Fecha:** 2026-01-16
**Objetivo:** Identificar errores históricos del TIMELINE.md y ERRORES-COMETIDOS.md que pueden ser detectados y corregidos automáticamente por el monitor de desarrollo.

---

## 📊 RESUMEN EJECUTIVO

### Errores Identificados para Auto-Fix

| Categoría | Error | Frecuencia | Auto-Fixable | Prioridad |
|-----------|-------|------------|--------------|-----------|
| **TypeScript** | TS6133: Unused variables | 🔴 Alta | ✅ **YA IMPLEMENTADO** | - |
| **TypeScript** | TS4111: Index signature | 🟡 Media | ✅ Sí | 🔴 Alta |
| **TypeScript** | Missing return type | 🟡 Media | ⚠️ Parcial | 🟡 Media |
| **Database** | Column does not exist | 🔴 Alta | ⚠️ Detectable | 🔴 Alta |
| **Database** | Enum value no existe | 🟡 Media | ⚠️ Detectable | 🟡 Media |
| **Database** | Foreign key violation | 🔴 Alta | ❌ No | - |
| **Imports** | .js extensions | 🟡 Media | ✅ **YA IMPLEMENTADO** | - |
| **Imports** | Module not found | 🔴 Alta | ✅ Sí | 🔴 Alta |
| **Imports** | Missing exports | 🟡 Media | ✅ **YA IMPLEMENTADO** | - |
| **Runtime** | Console.log en prod | 🟡 Media | ✅ Sí | 🟡 Media |
| **Runtime** | Missing null checks | 🟡 Media | ⚠️ Detectable | 🟡 Media |

---

## 🔴 PRIORIDAD ALTA: Errores Críticos Frecuentes

### 1. **TS4111: Index Signature Error (Bracket Notation)**

**Síntoma:**
```
error TS4111: Property 'X' comes from an index signature, so it must be accessed with ['X'].
```

**Contexto Histórico:**
- Ocurrió en `packages/api/src/routers/wizard.ts`
- TypeScript strict mode requiere bracket notation para propiedades de index signatures
- Solución manual: Cambiar `obj.prop` → `obj['prop']` o usar type assertion controlado

**Auto-Fix Propuesto:**
```powershell
function Fix-IndexSignature {
    param($FilePath, $LineNum, $Error)
    
    # Detectar: "Property 'X' comes from an index signature"
    # Extraer nombre de propiedad del error
    # Buscar en línea: obj.prop → obj['prop']
    # Guardar archivo
}
```

**Complejidad:** 🟡 Media
**Riesgo:** 🟢 Bajo (cambio sintáctico seguro)

---

### 2. **Module Not Found (Missing Dependencies)**

**Síntoma:**
```
Module not found: Can't resolve 'module-name'
Error: Cannot find module 'module-name'
```

**Contexto Histórico:**
- Ocurrió múltiples veces durante desarrollo
- Ejemplo: `nextjs-auto-healer` no encontrado
- Causa: Dependencia no instalada o nombre incorrecto

**Auto-Fix Propuesto:**
```powershell
function Fix-MissingDependency {
    # ✅ YA EXISTE pero puede mejorarse
    # Mejoras:
    # 1. Detectar si es package interno (@quoorum/*) vs externo
    # 2. Para internos: verificar que existe en packages/
    # 3. Para externos: intentar pnpm add con nombre exacto
    # 4. Si falla, buscar en npm registry y sugerir alternativa
}
```

**Complejidad:** 🟢 Baja
**Riesgo:** 🟡 Medio (instalar dependencias puede romper cosas)

---

### 3. **Column Does Not Exist (Database Schema Mismatch)**

**Síntoma:**
```
TRPCClientError: column "column_name" does not exist
PostgreSQL error code: 42703
```

**Contexto Histórico:**
- Error #2 en ERRORES-COMETIDOS.md
- Ocurrió con `deleted_at`, `costs_by_provider`
- Causa: Schema Drizzle tiene campo pero DB no

**Auto-Fix Propuesto:**
```powershell
function Fix-MissingColumn {
    param($ColumnName, $TableName)
    
    # 1. Detectar error de columna faltante
    # 2. Buscar en schema Drizzle si el campo existe
    # 3. Si existe en schema pero no en DB:
    #    - Generar SQL: ALTER TABLE table ADD COLUMN ...
    #    - Ejecutar en PostgreSQL local (docker exec)
    #    - Reportar éxito/error
    # 4. Si NO existe en schema:
    #    - Reportar que necesita añadirse al schema primero
}
```

**Complejidad:** 🔴 Alta (requiere análisis de schema + SQL)
**Riesgo:** 🟡 Medio (modificar DB puede ser peligroso)

**Alternativa Segura:**
- Solo DETECTAR y reportar con instrucciones claras
- NO auto-ejecutar SQL (demasiado peligroso)

---

### 4. **Enum Value Does Not Exist**

**Síntoma:**
```
PostgreSQL error: invalid input value for enum enum_name: "value"
```

**Contexto Histórico:**
- Error #3 en ERRORES-COMETIDOS.md
- Ocurrió con `debate_status` enum (faltaba 'draft')
- Causa: Enum en DB no tiene valor que usa el código

**Auto-Fix Propuesto:**
```powershell
function Fix-MissingEnumValue {
    param($EnumName, $Value)
    
    # 1. Detectar error de enum value
    # 2. Generar SQL: ALTER TYPE enum_name ADD VALUE IF NOT EXISTS 'value'
    # 3. Ejecutar en PostgreSQL local
    # 4. Reportar éxito
}
```

**Complejidad:** 🟡 Media
**Riesgo:** 🟢 Bajo (añadir valor a enum es seguro)

---

## 🟡 PRIORIDAD MEDIA: Mejoras de Calidad

### 5. **Missing Return Type (TypeScript)**

**Síntoma:**
```
error TS7010: 'functionName', which lacks return type annotation
```

**Contexto:**
- TypeScript strict mode requiere tipos de retorno explícitos
- Puede inferirse en muchos casos

**Auto-Fix Propuesto:**
```powershell
function Fix-MissingReturnType {
    param($FilePath, $LineNum)
    
    # 1. Leer función
    # 2. Analizar cuerpo para inferir tipo:
    #    - return string → : string
    #    - return number → : number
    #    - return Promise → : Promise<T>
    #    - return void → : void
    # 3. Añadir tipo de retorno
    # 4. Guardar
}
```

**Complejidad:** 🔴 Alta (análisis de código complejo)
**Riesgo:** 🟡 Medio (inferencia puede ser incorrecta)

**Alternativa:**
- Solo DETECTAR y reportar
- Sugerir tipo basado en return statements

---

### 6. **Console.log en Producción**

**Síntoma:**
```
ESLint: Unexpected console statement (no-console)
```

**Contexto:**
- 14+ warnings encontrados en auditorías
- Prohibido en producción según CLAUDE.md

**Auto-Fix Propuesto:**
```powershell
function Fix-ConsoleLog {
    param($FilePath, $LineNum)
    
    # 1. Leer línea
    # 2. Detectar tipo: console.log, console.error, console.warn
    # 3. Reemplazar con logger estructurado:
    #    - console.log → logger.info
    #    - console.error → logger.error
    #    - console.warn → logger.warn
    # 4. Verificar que logger está importado
    # 5. Si no, añadir import
}
```

**Complejidad:** 🟡 Media
**Riesgo:** 🟢 Bajo (reemplazo directo)

---

### 7. **Missing Null Checks (Runtime Errors)**

**Síntoma:**
```
Runtime Error: Cannot read property 'X' of undefined
TypeError: Cannot read properties of null
```

**Contexto:**
- 60+ errores 500 reportados en auditorías
- Causa común: Acceso a propiedades sin verificar null/undefined

**Auto-Fix Propuesto:**
```powershell
function Fix-MissingNullCheck {
    param($FilePath, $LineNum, $Error)
    
    # 1. Detectar error de runtime (stack trace)
    # 2. Identificar línea problemática
    # 3. Analizar código:
    #    - obj.prop → if (obj) { obj.prop }
    #    - obj.prop → obj?.prop (optional chaining)
    # 4. Aplicar fix más seguro
    # 5. Guardar
}
```

**Complejidad:** 🔴 Muy Alta (análisis de código complejo)
**Riesgo:** 🔴 Alto (cambios pueden romper lógica)

**Alternativa:**
- Solo DETECTAR y reportar con sugerencia
- NO auto-corregir (demasiado peligroso)

---

## ✅ YA IMPLEMENTADOS

### 1. **TS6133: Unused Variables** ✅
- Función: `Fix-UnusedVariable`
- Estado: Completamente funcional
- Cobertura: Imports, parámetros, variables locales

### 2. **.js Extensions en Imports** ✅
- Función: `Fix-JsExtensions`
- Estado: Completamente funcional
- Script: `scripts/fix-imports.ps1`

### 3. **Missing Package Exports** ✅
- Función: `Fix-PackageExports`
- Estado: Completamente funcional
- Script: `scripts/auto-fix-package-exports.ps1`

---

## 🎯 PLAN DE IMPLEMENTACIÓN RECOMENDADO

### Fase 1: Errores TypeScript (Alta Prioridad, Bajo Riesgo)

1. **TS4111: Index Signature** (2-3 horas)
   - Implementar `Fix-IndexSignature`
   - Detectar y corregir bracket notation
   - Testing con casos reales

2. **Missing Return Type** (1-2 horas)
   - Implementar detección mejorada
   - Auto-fix solo para casos simples (string, number, void)
   - Reportar casos complejos

### Fase 2: Errores de Base de Datos (Alta Prioridad, Medio Riesgo)

3. **Missing Enum Value** (1-2 horas)
   - Implementar `Fix-MissingEnumValue`
   - Generar y ejecutar SQL seguro
   - Testing con PostgreSQL local

4. **Missing Column** (2-3 horas)
   - Implementar DETECCIÓN (no auto-fix)
   - Generar SQL sugerido
   - Reportar con instrucciones claras

### Fase 3: Mejoras de Calidad (Media Prioridad)

5. **Console.log** (1 hora)
   - Implementar `Fix-ConsoleLog`
   - Reemplazo directo con logger
   - Verificar imports

6. **Module Not Found** (1 hora)
   - Mejorar `Fix-MissingDependency` existente
   - Detectar packages internos vs externos
   - Mejorar sugerencias

---

## ⚠️ ERRORES NO AUTO-FIXEABLES (Requieren Intervención Manual)

### 1. **Foreign Key Violations**
- **Razón:** Requiere crear registros en múltiples tablas
- **Solución:** Solo detectar y reportar con instrucciones SQL

### 2. **Missing Null Checks (Runtime)**
- **Razón:** Análisis de código demasiado complejo
- **Solución:** Solo detectar y sugerir

### 3. **Schema Desincronizado (Supabase vs Local)**
- **Razón:** Requiere decisión estratégica (migrar vs empezar desde cero)
- **Solución:** Solo detectar y reportar

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

Para cada nuevo auto-fix:

- [ ] Función implementada en `watch-dev-complete.ps1`
- [ ] Patrón de detección añadido al monitor principal
- [ ] Testing con casos reales del TIMELINE.md
- [ ] Documentación en TIMELINE.md
- [ ] Verificación de que no rompe código existente
- [ ] Manejo de errores robusto (try-catch)

---

## 🎯 PRÓXIMOS PASOS INMEDIATOS

1. **Implementar TS4111 Fix** (más impacto, bajo riesgo)
2. **Mejorar Missing Enum Value** (frecuente, seguro)
3. **Añadir detección de Missing Column** (solo reportar, no auto-fix)

---

_Última actualización: 2026-01-16_
_Próxima revisión: Después de implementar Fase 1_
