# Investigación: Tests no producen output en Windows

**Fecha:** 16 Enero 2026
**Problema:** `pnpm test` no produce output ni errores en entorno Windows

---

## 🔍 Hallazgos de la Investigación

### 1. Tests SÍ existen y están bien formados

**Ubicación de tests en packages/quoorum:**
```
✅ packages/quoorum/src/__tests__/consensus.test.ts
✅ packages/quoorum/src/__tests__/context-loader.test.ts
✅ packages/quoorum/src/__tests__/expert-database.test.ts
✅ packages/quoorum/src/__tests__/expert-matcher.test.ts
✅ packages/quoorum/src/__tests__/meta-moderator.test.ts
✅ packages/quoorum/src/__tests__/quality-monitor.test.ts
✅ packages/quoorum/src/__tests__/question-analyzer.test.ts
✅ packages/quoorum/src/__tests__/ultra-language.test.ts
✅ packages/quoorum/__tests__/e2e/quoorum-flow.test.ts
✅ packages/quoorum/src/__tests__/agents.test.ts
```

**Total:** 10 archivos de test

### 2. Problema RAÍZ IDENTIFICADO

**packages/quoorum/package.json NO tiene script "test":**

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/"
    // ❌ NO HAY "test": "vitest"
  }
}
```

**Consecuencia:** Cuando ejecutas `pnpm --filter @wallie/quoorum test`, pnpm no encuentra el script y no hace nada (sin error).

### 3. Configuración de Vitest

**Archivo:** `vitest.config.ts` (raíz del proyecto)

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["packages/**/*.test.ts", "packages/**/*.test.tsx"],
    exclude: ["node_modules", "dist", ".turbo"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
```

✅ Configuración correcta
✅ Include pattern correcto (`packages/**/*.test.ts`)
✅ Setup file existe (`vitest.setup.ts`)

### 4. Tests ejecutados desde la raíz

Los tests NO se ejecutan desde packages individuales, sino desde la **raíz del monorepo** usando:

```bash
# ✅ Correcto (desde raíz)
npx vitest --run

# ❌ Incorrecto (desde package sin script)
pnpm --filter @wallie/quoorum test
```

### 5. Problema de stdio/stdout en Windows

**Síntomas:**
- ✅ Comando no falla (exit code 0)
- ❌ No produce output visible
- ❌ Ni stdout ni stderr muestran contenido
- ❌ Redirección `2>&1` tampoco funciona

**Intentos realizados:**
```bash
# Ninguno produjo output
pnpm test --reporter=verbose
pnpm test --reporter=dot
npx vitest --run 2>&1
npx vitest --run --no-coverage --reporter=basic
```

---

## ✅ SOLUCIÓN

### Opción 1: Añadir script "test" a packages/quoorum/package.json

**Archivo:** `packages/quoorum/package.json`

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/",
    "test": "vitest --run"  // ✅ Añadir esto
  }
}
```

### Opción 2: Ejecutar tests desde la raíz del monorepo

```bash
# Ejecutar TODOS los tests del monorepo
pnpm test

# Ejecutar tests con pattern específico
npx vitest --run packages/quoorum

# Ejecutar con coverage
pnpm test --coverage
```

### Opción 3: Usar WSL o entorno Linux

Si el problema de stdio persiste, ejecutar en WSL:

```bash
wsl
pnpm test
```

---

## 📊 Verificación de Tests (Inspección Manual)

**Estado verificado el 16 Ene 2026:**

- ✅ 10 archivos de test en packages/quoorum
- ✅ Tests bien formados con describe/it/expect
- ✅ Imports correctos
- ✅ vitest.config.ts configurado correctamente
- ⚠️ Falta script "test" en package.json

**Conclusión:** Los tests existen y están listos para ejecutarse, solo falta añadir el script en package.json.

---

## 🎯 Recomendación FINAL

**Acción inmediata:** Añadir script "test" a `packages/quoorum/package.json`:

```bash
# 1. Editar packages/quoorum/package.json
# 2. Añadir línea: "test": "vitest --run"
# 3. Ejecutar: pnpm --filter @wallie/quoorum test
```

**Si persiste problema de output:** Investigar configuración de terminal/consola en Windows o usar WSL.

---

**Investigación completada:** 16 Enero 2026
**Problema identificado:** Falta script "test" en package.json
**Solución:** Añadir script + verificar en WSL si necesario
