# 🤖 Sistema de Auto-Detección y Corrección de Errores

Sistema automatizado para detectar y corregir errores comunes en el servidor de desarrollo de Next.js.

## 📋 Comandos Disponibles

### Verificación Rápida
```bash
pnpm check:errors
```
Verifica errores actuales en los logs del servidor de desarrollo.

### Monitoreo Continuo
```bash
pnpm watch:errors
```
Monitorea los logs en tiempo real y muestra alertas cuando detecta errores.

### Auto-Corrección
```bash
# Aplicar correcciones automáticas
pnpm fix:errors

# Ver qué se haría sin aplicar cambios (dry run)
pnpm fix:errors:dry
```

### Monitor Inteligente (Recomendado)
```bash
pnpm monitor:smart
```
Monitorea continuamente y **aplica correcciones automáticamente** cuando detecta errores.

## 🔧 Errores que se Corrigen Automáticamente

### ✅ Port 3000 Already in Use
**Detección:** `EADDRINUSE: address already in use :::3000`  
**Solución:** Libera el puerto 3000 terminando los procesos que lo usan.

### ✅ Module Not Found / Can't Resolve
**Detección:** `Module not found`, `Can't resolve @quoorum/*`  
**Solución:** 
- Reinstala dependencias (`pnpm install`)
- Reconstruye paquetes afectados (`@quoorum/db`, `@quoorum/api`, `@quoorum/workers`)

### ✅ Build Cache Issues
**Detección:** Errores relacionados con `dist/` o `.next/`  
**Solución:** Limpia carpetas `dist/` y `.next/` para forzar rebuild.

### ⚠️ TypeScript Errors
**Detección:** `Type error`, `TS####`  
**Solución:** Muestra detalles del error. **Requiere corrección manual del código.**

### ⚠️ Missing Environment Variables
**Detección:** `process.env.* is not defined`  
**Solución:** Muestra información. **Requiere configuración manual.**

## 📊 Flujo de Trabajo Recomendado

### Opción 1: Monitor Inteligente (Automático)
```bash
# En una terminal, inicia el monitor inteligente
pnpm monitor:smart

# En otra terminal, inicia el servidor
pnpm dev --filter @quoorum/web
```

El monitor detectará y corregirá errores automáticamente.

### Opción 2: Verificación Manual
```bash
# 1. Ver errores actuales
pnpm check:errors

# 2. Si hay errores corregibles, aplicar fixes
pnpm fix:errors

# 3. Verificar que se corrigieron
pnpm check:errors

# 4. Reiniciar servidor si es necesario
pnpm dev --filter @quoorum/web
```

## 🎯 Ejemplos de Uso

### Ejemplo 1: Error de Puerto Ocupado
```bash
$ pnpm check:errors
⚠️  FOUND 1 ERROR(S):
🔴 Runtime Error
Error: listen EADDRINUSE: address already in use :::3000

$ pnpm fix:errors
🔧 Auto-fix Dev Errors
🔍 Detected: Port 3000 is in use
   → Stopping process 12345 (node)
   ✅ Port 3000 freed

✅ Fixes Applied:
   • Port 3000 freed
```

### Ejemplo 2: Error de Módulo No Encontrado
```bash
$ pnpm check:errors
⚠️  FOUND 1 ERROR(S):
🔴 Module Resolution
Module not found: Can't resolve '@quoorum/workers/client'

$ pnpm fix:errors
🔧 Auto-fix Dev Errors
🔍 Detected: Module resolution error
   → Reinstalling dependencies...
   ✅ Dependencies reinstalled
   → Rebuilding packages...
   ✅ Packages rebuilt

✅ Fixes Applied:
   • Module resolution (reinstalled deps)
```

### Ejemplo 3: Monitor Inteligente
```bash
$ pnpm monitor:smart
🤖 Smart Dev Monitor
   Auto-detection: ✅ Enabled
   Auto-fix: ✅ Enabled
   Check interval: 10s

[12:00:00] ✅ No errors
[12:00:10] ✅ No errors
[12:00:20] ⚠️  1 error(s) detected

⚠️  1 new error(s) detected!
🔴 Runtime Error
Error: listen EADDRINUSE: address already in use :::3000

🔧 Attempting auto-fix...
   → Stopping process 12345 (node)
   ✅ Port 3000 freed
✅ Fixes applied! Error count reduced.

[12:00:30] ✅ No errors
```

## 🔍 Archivos del Sistema

- `scripts/check-dev-errors.ps1` - Verificación rápida de errores
- `scripts/monitor-dev-logs.ps1` - Monitoreo continuo (solo detección)
- `scripts/auto-fix-dev-errors.ps1` - Auto-corrección de errores comunes
- `scripts/smart-dev-monitor.ps1` - Monitor inteligente (detección + auto-fix)

## ⚙️ Configuración

Los scripts leen automáticamente los logs de:
```
C:\Users\Usuario\.cursor\projects\c-Quoorum\terminals\*.txt
```

No requiere configuración adicional.

## 🚨 Limitaciones

1. **TypeScript Errors**: Requieren corrección manual del código
2. **Environment Variables**: Requieren configuración manual
3. **Lógica de Negocio**: Errores de lógica requieren revisión manual
4. **Max Auto-Fix Attempts**: El monitor inteligente intenta máximo 3 veces antes de requerir intervención manual

## 💡 Tips

- Usa `pnpm fix:errors:dry` primero para ver qué se haría sin aplicar cambios
- El monitor inteligente es ideal para desarrollo continuo
- Si los auto-fixes no resuelven el problema, revisa los logs manualmente con `pnpm check:errors`
