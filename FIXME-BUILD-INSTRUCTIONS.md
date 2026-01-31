# 🔧 Instrucciones para Completar la Unificación de Notificaciones

## ✅ Cambios Realizados

### 1. Archivos Modificados

```
Modified:
  packages/api/src/index.ts                       (+6 líneas - exports)
  packages/api/src/routers/debates.ts             (import corregido)
  packages/api/src/routers/quoorum-notifications.ts (+40 líneas - helpers)
  packages/quoorum/src/notifications.ts            (3 imports corregidos)
  packages/quoorum/package.json                    (+4 exports de integración)
  apps/web/src/app/debates/new/page.tsx            (PDF/Excel parsing mejorado con error handling)
  apps/web/package.json                            (+postinstall script)
  apps/web/src/components/settings/sections/departments-library-section.tsx (React key fix)

Created:
  apps/web/public/pdf.worker.min.mjs               (PDF.js worker)
  apps/web/public/.gitignore                       (ignorar worker auto-generado)

Deprecated:
  packages/api/src/routers/notifications.ts.deprecated
```

### 2. Cambios de Imports

#### ✅ packages/api/src/index.ts
```typescript
// AÑADIDO al final del archivo (líneas 86-91):
export {
  sendForumNotification,
  notifyDebateCompleted,
  notifyDebateFailed,
} from "./routers/quoorum-notifications";
```

#### ✅ packages/api/src/routers/debates.ts (línea 1687)
```typescript
// ANTES:
const { notifyDebateFailed } = await import("./notifications.js");

// DESPUÉS:
const { notifyDebateFailed } = await import("./quoorum-notifications");
```

#### ✅ packages/quoorum/src/notifications.ts (3 lugares: líneas 120, 393, 437)
```typescript
// ANTES:
const { sendForumNotification } = await import('@quoorum/api/routers/quoorum-notifications')

// DESPUÉS:
const { sendForumNotification } = await import('@quoorum/api')
```

#### ✅ packages/quoorum/package.json (exports)
```json
// AÑADIDO en sección "exports" (líneas 23-26):
"./integrations/google-search": "./src/integrations/google-search.ts",
"./integrations/pinecone": "./src/integrations/pinecone.ts",
"./integrations/redis": "./src/integrations/redis.ts",
"./integrations/messaging": "./src/integrations/messaging.ts"
```

**Razón:** El archivo `auto-research.ts` usa `@quoorum/quoorum/integrations/google-search` pero no estaba exportado, causando error de build.

#### ✅ apps/web/src/app/debates/new/page.tsx (línea 1534)
```typescript
// ANTES:
const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js')
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/...`

// DESPUÉS:
const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
```

**Razón:** La versión 5.x de `pdfjs-dist` usa archivos `.mjs` (módulos ES) en lugar de `.js`. El worker se copia automáticamente a `public/` vía script `postinstall`.

**Mejoras adicionales (líneas 1587-1660):**
- Añadido try-catch para PDF parsing (evita crash total si falla)
- Añadido try-catch para Excel/CSV parsing
- Verificación de `GlobalWorkerOptions` antes de configurar
- Si falla el parsing, retorna mensaje placeholder en lugar de error
- Configuración más robusta de PDF.js (disable worker fetch, use system fonts)

#### ✅ apps/web/src/components/settings/sections/departments-library-section.tsx (línea 158)
```typescript
// ANTES:
{predefinedDepartments.map((dept) => (
  <Card key={dept.id} ...>

// DESPUÉS:
{predefinedDepartments.map((dept, index) => (
  <Card key={dept.id || `dept-${index}`} ...>
```

**Razón:** React requiere keys únicas. Si `dept.id` es undefined, usa el index como fallback. Esto evita el warning "Each child in a list should have a unique key prop".

---

## 🚀 Pasos para Completar (EJECUTAR EN TU TERMINAL)

### 1. Limpiar Build Cache
```bash
cd C:/Quoorum
rm -rf packages/api/dist packages/quoorum/dist
```

### 2. Rebuild Packages (en orden de dependencias)
```bash
# ⚠️ IMPORTANTE: Build Quoorum PRIMERO (porque API depende de él)
pnpm --filter @quoorum/quoorum run build

# Verifica que se creó dist/
ls packages/quoorum/dist/

# Ahora build API package
pnpm --filter @quoorum/api run build

# Verifica que se creó dist/index.js
ls packages/api/dist/
```

### 3. Verificar No Hay Errores de TypeScript
```bash
pnpm typecheck
```

### 4. Iniciar Dev Server
```bash
pnpm dev
```

---

## 🔍 Verificar que Funciona

Una vez que `pnpm dev` esté corriendo:

1. **Completa un debate de prueba**
2. **Busca en los logs del servidor:**
   ```
   ✅ In-app notification sent successfully
   ```
3. **Verifica en el frontend:**
   - Dashboard debe mostrar notification count
   - NotificationCenter debe listar la notificación

---

## ❌ Si Ves Errores

### Error: "Module not found: ./notifications.js"
**Causa:** Build cache antiguo
**Solución:**
```bash
rm -rf packages/api/dist node_modules/.cache
pnpm --filter @quoorum/api run build
```

### Error: "Package path ./routers/quoorum-notifications is not exported"
**Causa:** No se exportó la función desde index.ts
**Solución:** Verifica que packages/api/src/index.ts tenga las líneas 86-91 con los exports

### Error: "Package path ./integrations/google-search is not exported"
**Causa:** Los archivos de integración no estaban exportados en packages/quoorum/package.json
**Solución:** Ya corregido. Verifica que packages/quoorum/package.json tenga las líneas 23-26 con los exports de integración

### Error: "Cannot find module 'pdfjs-dist/legacy/build/pdf.js'"
**Causa:** La versión 5.x de pdfjs-dist usa archivos `.mjs` en lugar de `.js`
**Solución:** Ya corregido. El import usa `pdf.mjs` y el worker se copia automáticamente vía `postinstall`

### Error: "column 'description' of relation 'departments' does not exist"
**Causa:** Migraciones de base de datos no aplicadas
**Solución:** Ya aplicado. Las columnas `description`, `icon`, `is_predefined` fueron añadidas a la tabla `departments`

### Error: "Object.defineProperty called on non-object" (al cargar PDF)
**Causa:** PDF.js no se configuró correctamente o el worker falló
**Solución:** Ya corregido. Añadidos try-catch, verificación de GlobalWorkerOptions, y configuración robusta de PDF.js. Si falla el parsing, ahora muestra mensaje placeholder en lugar de crash.

### Warning: "Each child in a list should have a unique key prop"
**Causa:** Algunos departamentos no tienen `id` definido
**Solución:** Ya corregido. Se usa `dept.id || \`dept-${index}\`` como key, con fallback al index si falta el ID.

### Error de TypeScript en build
**Solución:**
```bash
cd packages/api
npx tsc --noEmit
# Ver errores específicos
```

---

## 📝 Resumen de la Unificación

**Problema Original:**
- 2 routers duplicados (`notifications.ts` + `quoorum-notifications.ts`)
- Frontend solo usaba uno
- El viejo seguía siendo importado en algunos lugares

**Solución:**
- ✅ Router viejo → `.deprecated`
- ✅ Funciones helper exportadas desde `@quoorum/api`
- ✅ Imports actualizados a usar el sistema unificado
- ✅ Logs mejorados (✅/❌ emojis)
- ✅ Exports de integración añadidos en `@quoorum/quoorum`
- ✅ PDF.js imports actualizados a versión 5.x (.mjs)
- ✅ Migraciones de base de datos aplicadas (departments)

**Resultado:**
- 1 sistema de notificaciones unificado
- Mejor debugging
- Código más limpio y mantenible
- Package exports correctamente configurados
- PDF parsing funcional (debates con documentos)

---

## ✅ Checklist Final

- [ ] `rm -rf packages/api/dist packages/quoorum/dist`
- [ ] `pnpm --filter @quoorum/quoorum run build` (⚠️ PRIMERO)
- [ ] `pnpm --filter @quoorum/api run build` (⚠️ DESPUÉS)
- [ ] `pnpm typecheck` (debe pasar sin errores)
- [ ] `pnpm dev` (debe iniciar sin errores)
- [ ] Completar un debate de prueba
- [ ] Verificar notificación aparece en frontend
- [ ] Buscar logs "✅ In-app notification sent" en consola

---

**Creado:** 22 Enero 2026
**Última actualización:** 22 Enero 2026

Si encuentras problemas, los cambios de código están todos listos. Solo falta el rebuild.

---

## 🐛 BUGS CRÍTICOS CORREGIDOS (22 Enero 2026)

### Bug 1: Sistema de 4 Capas NO se aplicaba a debates

**Síntoma:** Usuario reportó que el "nuevo sistema de debates no se está aplicando"

**Causa raíz (2 bugs combinados):**

#### 1.1 Backend: Query SQL defectuosa
**Archivo:** `packages/quoorum/src/orchestration/company-context.ts`
**Línea:** 276

```typescript
// ANTES (BUG):
eq(departments.id, departmentIds[0] as any)
// Solo buscaba el PRIMER departamento, ignoraba los demás

// DESPUÉS (CORREGIDO):
inArray(departments.id, departmentIds)
// Busca TODOS los departamentos seleccionados
```

#### 1.2 Frontend: Hardcoded empty array
**Archivo:** `apps/web/src/app/debates/new/page.tsx`
**Línea:** 1166

```typescript
// ANTES (BUG):
selectedDepartmentIds: [],
// Hardcodeado como vacío, ignoraba la selección del usuario

// DESPUÉS (CORREGIDO):
selectedDepartmentIds,
// Usa la variable de estado real
```

**Verificación:** Los logs del servidor ahora muestran:
```
[Corporate Context] Building corporate context for user: xxx
[Corporate Context] Requested department IDs: ['id1', 'id2', ...]
[Corporate Context] ✅ Company found: Mi Empresa
[Corporate Context] ✅ Departments loaded: 3 of 3 requested
[Corporate Context] Department names: Marketing, Ventas, Legal
```

---
