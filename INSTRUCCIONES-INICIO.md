# 🚀 Instrucciones para Iniciar el Servidor de Desarrollo

## Método 1: Usando el Script PowerShell (RECOMENDADO)

1. Abre **PowerShell** como Administrador
2. Navega al directorio web:
   ```powershell
   cd C:\Quoorum\apps\web
   ```
3. Ejecuta el script:
   ```powershell
   .\START-DEV.ps1
   ```

## Método 2: Comando Manual Directo

Si el script anterior no funciona, ejecuta directamente:

```powershell
cd C:\Quoorum\apps\web
pnpm run dev:no-fix
```

## Método 3: Desde la Raíz del Monorepo

```powershell
cd C:\Quoorum
pnpm --filter @quoorum/web exec next dev -p 3000
```

## ✅ Señales de Éxito

Deberías ver algo como:

```
▲ Next.js 15.1.4
- Local:        http://localhost:3000

✓ Starting...
✓ Ready in 2.3s
```

Luego podrás acceder a: **http://localhost:3000**

## ❌ Si Ves Errores

### Error: "Port 3000 is already in use"
```powershell
# Detener procesos Node
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force
# Esperar 2 segundos
Start-Sleep -Seconds 2
# Volver a intentar
pnpm run dev:no-fix
```

### Error: "Module not found" o errores de compilación
```powershell
# Limpiar cache de Next.js
Remove-Item -Recurse -Force .next
# Reinstalar dependencias
pnpm install
# Volver a intentar
pnpm run dev:no-fix
```

### Error: "Cannot find module '@/lib/trpc'"
Este error **ya está corregido** en el código (commit 711a71e).
Si aún lo ves:
```powershell
# Limpiar todo
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules\.cache
# Volver a intentar
pnpm run dev:no-fix
```

## 📋 ¿Por Qué `dev:no-fix` en lugar de `dev`?

El script `dev` tiene un `predev` hook que ejecuta:
```powershell
pwsh -NoProfile -File ../../scripts/auto-fix-dev.ps1
```

Este script puede colgar o causar problemas. Usar `dev:no-fix` evita ese hook y va directo a `next dev`.

## 🔧 Debugging Adicional

Si nada funciona, ejecuta estos comandos para diagnóstico:

```powershell
# Verificar versión de Node
node --version
# Debería ser v20.x o superior

# Verificar versión de pnpm
pnpm --version
# Debería ser 8.x o 9.x

# Verificar que Next.js está instalado
pnpm list next
# Debería mostrar: next 15.1.4

# Ver el contenido del package.json
cat package.json | Select-String -Pattern '"scripts"' -Context 0,10
```

## 📞 Si Sigues Teniendo Problemas

Copia el **error completo** que aparece en la terminal y compártelo para poder ayudarte mejor.
