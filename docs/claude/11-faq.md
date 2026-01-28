# ❓ FAQ y Comandos Útiles

---

## 🛠️ COMANDOS ÚTILES

### Desarrollo

```bash
# Iniciar todo
pnpm dev

# Iniciar solo web
pnpm dev --filter web

# Iniciar un package específico
pnpm dev --filter @proyecto/api

# Pre-flight checks
pnpm preflight
```

### Base de Datos

```bash
# Generar migraciones
pnpm db:generate

# Aplicar migraciones
pnpm db:push

# Reset DB (dev only)
pnpm db:reset

# Abrir studio
pnpm db:studio

# Seed data
pnpm db:seed
```

### Calidad

```bash
# TypeScript check
pnpm typecheck

# Lint
pnpm lint

# Lint + fix
pnpm lint:fix

# Format
pnpm format

# Tests
pnpm test

# Tests con coverage
pnpm test --coverage

# Tests E2E
pnpm test:e2e
```

### Build & Deploy

```bash
# Build producción
pnpm build

# Preview build
pnpm preview
```

### Git

```bash
# Commit convencional
git commit -m "feat(clients): add client creation"
git commit -m "fix(auth): resolve token issue"
git commit -m "docs: update CLAUDE.md"

# Verificar secrets
git secrets --scan

# Restaurar desde producción
git checkout main -- archivo.tsx
```

---

## ❓ FAQ

### ¿Dónde pongo un nuevo componente?

```
Específico de una página → apps/web/src/components/[feature]/
Reutilizado en varias páginas → apps/web/src/components/shared/
Reutilizado entre packages → packages/ui/src/components/
```

### ¿Cómo añado una nueva tabla a la DB?

```bash
# 1. Crear schema
packages/db/src/schema/nueva-tabla.ts

# 2. Exportar en index
packages/db/src/schema/index.ts

# 3. Generar migración
pnpm db:generate

# 4. Aplicar migración
pnpm db:push

# 5. Verificar en studio
pnpm db:studio
```

### ¿Cómo añado un nuevo endpoint API?

```bash
# 1. Crear/editar router
packages/api/src/routers/mi-router.ts

# 2. Añadir al root
packages/api/src/root.ts

# 3. Escribir tests
packages/api/src/routers/__tests__/mi-router.test.ts

# 4. Usar en frontend
api.miRouter.miProcedure.useQuery()
```

### ¿Qué hacer si TypeScript da error?

```typescript
// 1. NO usar @ts-ignore
// 2. NO usar any
// 3. SÍ: Investigar el tipo correcto

// Si es un tipo de librería externa:
import type { ExternalType } from 'libreria'

// Si necesitas crear un tipo:
interface MiTipo {
  campo: string
}

// Si es un tipo inferido de Zod:
type MiTipo = z.infer<typeof miSchema>

// Si es un tipo inferido de Drizzle:
type MiTabla = typeof miTabla.$inferSelect
```

---

## 🐛 TROUBLESHOOTING

### Error: Cannot find module './XXXX.js'

**Causa raíz:** Next.js cache corrupto (`.next/` folder)

**Solución:**
```bash
# Limpiar cache
cd apps/web
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules/.cache
pnpm next dev -p 3000
```

**Cuándo ocurre:** Después de refactors masivos (10+ archivos), cambios de imports, renombres de archivos

---

### 🔥 Next.js Cache Issues - Guía Completa

**⚠️ PROBLEMA FRECUENTE:** Next.js usa cache agresivo para velocidad, pero se desincroniza en cambios masivos.

#### Por qué ocurre

Next.js cachea resultados de build en `.next/`:
```
.next/
  ├── cache/                 # Builds previos
  ├── routes-manifest.json   # Mapa de rutas compiladas
  ├── app-paths-manifest.json
  └── server/                # Código servidor compilado
```

**El problema:**
1. Cambias 40+ archivos (ej: refactor de colores)
2. Next.js intenta Hot Module Replacement (HMR)
3. Cache tiene estado viejo, archivo real tiene estado nuevo
4. **Mismatch** → Error: routes-manifest corrupto / módulo no encontrado

#### Tipos de cambios "peligrosos" (probabilidad de cache error)

| Tipo de Cambio | Riesgo | Por Qué |
|----------------|--------|---------|
| **Cambiar imports/paths** | 🔴 ALTO | Webpack regenera chunk mappings |
| **Refactor masivo (10+ archivos)** | 🔴 ALTO | Cache no puede seguir el ritmo |
| **Renombrar archivos/componentes** | 🔴 ALTO | Route manifest se desincroniza |
| **Cambiar classNames (40+ archivos)** | 🟡 MEDIO | Tailwind recompila todo |
| **Añadir console.log** | 🟢 BAJO | No afecta build |
| **Cambiar texto JSX** | 🟢 BAJO | HMR funciona bien |

#### Solución preventiva

```bash
# ANTES de refactor masivo o cambio de imports:
rm -rf .next node_modules/.cache
pnpm dev

# Resultado: Cache fresco, sin estado previo
```

#### Solución curativa (ya tienes el error)

```bash
# Windows PowerShell
cd C:\Quoorum\apps\web
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules\.cache

# Detener procesos Node
Get-Process | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force
Start-Sleep -Seconds 2

# Reiniciar limpio
pnpm next dev -p 3000
```

```bash
# Linux/macOS
cd apps/web
rm -rf .next node_modules/.cache
pkill -9 node
pnpm next dev -p 3000
```

#### UTF-8 en Windows: El problema del emoji

**Error común:**
```
Windows stdio in console mode does not support writing non-UTF-8 byte sequences
```

**Causa:**
1. Windows PowerShell usa codepage 850 (no UTF-8 nativo)
2. Next.js/Node.js escribe UTF-8 a console
3. Emoji en código → UTF-8 bytes → PowerShell explota
4. **Todo el dev server se cae**

**Solución DEFINITIVA:** Usar WSL2 (ver sección siguiente)

#### Plataformas comparadas

| Plataforma | Cache Issues | UTF-8 Issues | Recomendación |
|------------|--------------|--------------|---------------|
| **Windows Native** | 🔴 Frecuentes | 🔴 Emojis = 💥 | ⚠️ Evitar emojis + limpiar cache |
| **WSL2** | 🟢 Raros | 🟢 Sin problemas | ✅ **MEJOR opción Windows** |
| **macOS** | 🟢 Raros | 🟢 Sin problemas | ✅ Ideal |
| **Linux** | 🟢 Raros | 🟢 Sin problemas | ✅ Ideal |

#### Regla práctica

```bash
# ¿Vas a cambiar más de 10 archivos?
rm -rf .next node_modules/.cache && pnpm dev

# ¿Vas a cambiar imports/paths/renombrar?
rm -rf .next node_modules/.cache && pnpm dev

# ¿Solo cambias contenido JSX/classNames en 1-5 archivos?
# No hace falta limpiar, HMR funciona bien
```

#### Referencias

- **CLAUDE.md Regla #0:** NUNCA emojis en código ejecutable
- **CLAUDE.md Regla #20:** Cache corrupto - siempre limpiar .next primero
- **WSL2 Setup:** Ver sección siguiente

---

### 🐧 WSL2 Setup (Recomendado para Windows)

**Por qué WSL2 es mejor que Windows nativo:**
- ✅ UTF-8 nativo (sin problemas con emojis)
- ✅ Mejor file watching (menos cache issues)
- ✅ Builds más rápidos
- ✅ Compatible con scripts bash/zsh
- ✅ Mismo entorno que producción (Linux)

**Instalación:**
```powershell
# 1. Instalar WSL2 (PowerShell como Admin)
wsl --install

# 2. Reiniciar PC

# 3. Configurar usuario Ubuntu (se abre automático)
# Username: tu-nombre
# Password: tu-password

# 4. Actualizar Ubuntu
sudo apt update && sudo apt upgrade -y

# 5. Instalar Node.js 20 (via nvm recomendado)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# 6. Instalar pnpm
npm install -g pnpm

# 7. Acceder a tu proyecto Windows desde WSL2
cd /mnt/c/Quoorum

# 8. Instalar dependencias
pnpm install

# 9. Iniciar servidor
pnpm dev
```

**Acceder a archivos WSL desde Windows:**
```
\\wsl$\Ubuntu\home\tu-usuario\
# O si clonaste desde Windows:
/mnt/c/Quoorum/
```

**Configurar VS Code con WSL2:**
```bash
# 1. Instalar extensión "WSL" en VS Code
# 2. En WSL2 terminal:
code .
# Abre VS Code conectado a WSL2
```

**Ventajas adicionales:**
- ✅ Docker nativo (sin Docker Desktop)
- ✅ Performance de I/O muchísimo mejor
- ✅ Scripts bash funcionan sin modificar
- ✅ git funciona nativamente

---

### Error: EADDRINUSE (Puerto ocupado)

**Solución:**
```bash
# Windows PowerShell
Get-Process | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force
Start-Sleep -Seconds 2
pnpm next dev -p 3000

# Linux/macOS
lsof -ti:3000 | xargs kill -9
pnpm next dev -p 3000
```

### Error: Foreign key constraint violation

**Solución:**
```bash
# 1. Verificar perfil existe
docker exec quoorum-postgres psql -U postgres -d quoorum -c \
  "SELECT id, user_id FROM profiles WHERE user_id = 'AUTH_USER_ID';"

# 2. Si NO existe, crear perfil
docker exec quoorum-postgres psql -U postgres -d quoorum -c "
  INSERT INTO profiles (id, user_id, email, name, role, is_active)
  VALUES ('PROFILE_ID', 'AUTH_USER_ID', 'email@example.com', 'User', 'user', true)
  ON CONFLICT (id) DO NOTHING;
"
```

### Error: Pre-commit hook fails

**Si el hook falla por entorno (no por código):**
```bash
# Verificar manualmente
pnpm typecheck && pnpm lint

# Si pasa, usar --no-verify
git commit --no-verify -m "feat: mi cambio"
```

### Error: Tests failing

**Solución:**
```bash
# Verificar versión de vitest
pnpm list vitest

# Actualizar si necesario
pnpm update vitest

# Limpiar cache de tests
pnpm test --clearCache

# Correr tests individuales
pnpm test clients.test.ts
```

### Error: Build fails en Vercel

**Solución:**
```bash
# Verificar build local
pnpm build

# Limpiar node_modules
Remove-Item -Recurse -Force node_modules
pnpm install

# Verificar .env variables en Vercel
```

---

## 🔍 BÚSQUEDA RÁPIDA

### Buscar en CLAUDE.md

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

## 🚀 CI/CD

### Estado Actual

**⚠️ GitHub Actions NO configurado** (16 Ene 2026)

```
❌ GitHub Actions NO CONFIGURADO
   - Directorio .github/workflows/ NO EXISTE
   - Pipeline documentado es ASPIRACIONAL

✅ Alternativas funcionando:
   - Validación local con Husky (.husky/pre-commit)
   - Vercel CI/CD operativo (builds automáticos)
   - Validación manual: pnpm typecheck, pnpm lint
```

**¿Por qué NO usamos GitHub Actions?**
1. ❌ **Cobra dinero** (consumo de minutos)
2. ✅ **Husky funciona** (pre-commit hooks locales)
3. ✅ **Vercel CI/CD activo** (builds automáticos)

### Sistema de Validación Local

```bash
# Pre-commit hooks (.husky/pre-commit)
# Ejecuta automáticamente antes de cada commit:
- TypeScript check
- ESLint
- Tests unitarios
- Detección de console.log
- Git secrets scan
```

### Relación con Vercel

```
Local (Husky)           Vercel (CI/CD)
      ↓                        ↓
  TypeCheck                 Build
  Lint                      Deploy Preview
  Tests                     Deploy Production
      ↓                        ↓
  ✅ Commit               ✅ Live
```

### Verificar Estado de Deployment

```bash
# Ver deployments de Vercel
vercel ls

# Ver logs de último deployment
vercel logs

# Ver preview de rama
vercel inspect [deployment-url]
```

---

## ✅ CHECKLIST PRE-COMMIT

### Script Automático

**Ubicación:** `scripts/pre-commit.sh`

```bash
#!/bin/bash
echo "[INFO] Ejecutando verificaciones pre-commit..."

# 1. TypeScript
echo "→ Verificando TypeScript..."
pnpm typecheck || exit 1

# 2. Lint
echo "→ Ejecutando linter..."
pnpm lint || exit 1

# 3. Tests
echo "→ Ejecutando tests..."
pnpm test --run || exit 1

# 4. No console.log
echo "→ Buscando console.log..."
if grep -r "console\." apps/web/src packages/*/src --include="*.ts" --include="*.tsx" | grep -v "node_modules" | grep -v ".test."; then
  echo "[ERROR] Encontrado console.log en código de producción"
  exit 1
fi

# 5. Git secrets
echo "→ Verificando secrets..."
git secrets --scan || exit 1

echo "[OK] Todas las verificaciones pasaron"
```

### Checklist Manual

**Antes de cada commit, verificar:**

- [ ] **TypeScript sin errores** (`pnpm typecheck`)
- [ ] **Lint sin warnings** (`pnpm lint`)
- [ ] **Tests pasan** (`pnpm test`)
- [ ] **No hay `console.log`** en producción
- [ ] **No hay `any`** en tipos nuevos
- [ ] **No hay secrets** en código
- [ ] **Queries filtran por `userId`** (seguridad)
- [ ] **Input validado con Zod**
- [ ] **Commit message** sigue convención
- [ ] **Tests añadidos** para código nuevo

### Bypass del Pre-commit Hook

**⚠️ Solo usar si el hook falla por entorno (no por código):**

```bash
# Verificar manualmente PRIMERO
pnpm typecheck && pnpm lint

# Si pasa, entonces bypass
git commit --no-verify -m "feat: mi cambio"
```

**Regla:** Si usas `--no-verify`, SIEMPRE ejecuta validaciones manualmente primero.

---

## 💡 TIPS FINALES

✅ **Pregunta ANTES** si no encuentras la respuesta
✅ **Busca en código** ejemplos similares
✅ **Lee ERRORES-COMETIDOS.md** antes de cambios
❌ **NO asumas** estructuras o patrones
❌ **NO inventes** sin consultar documentación

---

_Ver [INDEX.md](./INDEX.md) para más módulos de documentación_
