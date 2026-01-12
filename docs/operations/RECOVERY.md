# RECOVERY.md — Guía de Recuperación

> **Cuando algo sale mal, este documento te dice exactamente qué hacer.**
>
> No entres en pánico. Casi todo tiene solución.

---

## 🚨 Paso 0: PARA y respira

Antes de hacer NADA más:

1. **No hagas más cambios** - Podrías empeorar la situación
2. **Guarda evidencia** - Screenshot del error, copia el mensaje
3. **Identifica el problema** - ¿Qué tipo de error es?

---

## Índice de problemas

| Problema                           | Ir a sección                |
| ---------------------------------- | --------------------------- |
| "He roto el código y no compila"   | [A1](#a1-código-roto)       |
| "He borrado archivos por error"    | [A2](#a2-archivos-borrados) |
| "La base de datos está mal"        | [A3](#a3-base-de-datos)     |
| "El deploy falló"                  | [A4](#a4-deploy-fallido)    |
| "La app en producción no funciona" | [A5](#a5-producción-rota)   |
| "He subido secrets a Git"          | [A6](#a6-secrets-expuestos) |
| "No sé qué ha cambiado"            | [A7](#a7-diagnóstico)       |
| "Quiero volver a como estaba ayer" | [A8](#a8-volver-atrás)      |

---

## A1: Código roto

### Síntomas

- `pnpm build` falla
- `pnpm typecheck` tiene errores
- La app no arranca

### Solución rápida

```bash
# 1. Ver qué has cambiado
git status
git diff

# 2. Si los cambios no son importantes, descartalos
git checkout -- .

# 3. Si quieres guardar los cambios pero volver a estado limpio
git stash
git checkout develop
# Luego recuperas con: git stash pop
```

### Solución si ya hiciste commit

```bash
# Ver últimos commits
git log --oneline -10

# Volver al commit anterior (mantiene cambios como "uncommitted")
git reset --soft HEAD~1

# Volver al commit anterior (DESCARTA cambios) ⚠️
git reset --hard HEAD~1
```

---

## A2: Archivos borrados

### Si NO has hecho commit

```bash
# Recuperar archivo específico
git checkout -- ruta/al/archivo.ts

# Recuperar todos los archivos borrados
git checkout -- .
```

### Si YA hiciste commit

```bash
# Encontrar el commit donde existía el archivo
git log --all --full-history -- ruta/al/archivo.ts

# Recuperar archivo de ese commit
git checkout <commit-hash> -- ruta/al/archivo.ts
```

### Si hiciste push

```bash
# Crear commit que revierte los cambios
git revert <commit-hash>
git push
```

---

## A3: Base de datos

### "La migración falló"

```bash
# 1. Ver estado de migraciones
pnpm db:status

# 2. Si es desarrollo, puedes resetear (BORRA DATOS)
pnpm db:reset

# 3. Si es staging/prod, restaurar backup
pg_restore -d $DATABASE_URL backup_YYYYMMDD.sql
```

### "Los datos están corruptos"

```bash
# 1. NO TOQUES NADA
# 2. Hacer backup del estado actual (aunque esté mal)
pg_dump $DATABASE_URL > backup_corrupted_$(date +%Y%m%d_%H%M%S).sql

# 3. Restaurar último backup bueno
pg_restore -d $DATABASE_URL backup_bueno.sql
```

### "He borrado datos por error"

Si tienes backup:

```bash
# Restaurar tabla específica
pg_restore -d $DATABASE_URL -t nombre_tabla backup.sql
```

Si NO tienes backup pero tienes Supabase:

- Ve al dashboard de Supabase
- Database → Backups → Point-in-time Recovery (si está disponible)

---

## A4: Deploy fallido

### En Vercel

```bash
# 1. Ver logs del deploy
# Dashboard de Vercel → Deployments → Click en el fallido → Logs

# 2. Si es error de build, arreglar en local primero
pnpm build

# 3. Si necesitas rollback inmediato
# Dashboard → Deployments → Buscar último deploy bueno → "..." → Promote to Production
```

### Desde CLI

```bash
# Ver deployments
vercel ls

# Rollback a deployment anterior
vercel rollback [deployment-url]
```

---

## A5: Producción rota

### Paso 1: Verificar qué está roto

```bash
# ¿La app carga?
curl https://wallie.ai

# ¿La API responde?
curl https://wallie.ai/api/health

# ¿Hay errores en Sentry?
# Ir a sentry.io → Ver errores recientes
```

### Paso 2: Rollback inmediato

**Opción A: Rollback en Vercel**

- Dashboard → Deployments → Deploy anterior → Promote to Production

**Opción B: Rollback con Git**

```bash
# Revertir último merge a main
git checkout main
git revert HEAD
git push origin main
# Vercel re-deploya automáticamente
```

### Paso 3: Comunicar

Si hay usuarios afectados:

- Poner página de mantenimiento
- Avisar por email/redes si es necesario

---

## A6: Secrets expuestos

### ¡URGENTE! Si has subido un secret a Git

```bash
# 1. INMEDIATAMENTE: Rotar el secret
# - Ir al servicio (OpenAI, Stripe, etc.)
# - Generar nueva API key
# - Revocar la antigua

# 2. Actualizar en Vercel/servidor
# - Cambiar variable de entorno

# 3. Limpiar del historial de Git (opcional pero recomendado)
# Usar BFG Repo-Cleaner
brew install bfg
bfg --replace-text passwords.txt repo.git

# O git filter-branch (más lento)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch ruta/al/archivo" \
  --prune-empty --tag-name-filter cat -- --all
```

### Prevenir en el futuro

1. Verificar `.gitignore` incluye `.env*`
2. Usar `git-secrets` para bloquear commits con secrets
3. Usar variables de entorno, nunca hardcodear

---

## A7: Diagnóstico

### "No sé qué ha cambiado"

```bash
# Ver estado actual
git status

# Ver cambios no commiteados
git diff

# Ver últimos commits
git log --oneline -20

# Ver qué cambió en un commit específico
git show <commit-hash>

# Ver quién cambió qué línea
git blame ruta/al/archivo.ts

# Buscar cuándo se introdujo un bug
git bisect start
git bisect bad                 # Versión actual está mal
git bisect good v1.0.0         # Esta versión estaba bien
# Git te va llevando por commits hasta encontrar el culpable
```

### "La app funcionaba ayer"

```bash
# Ver commits de ayer
git log --since="yesterday" --oneline

# Probar versión de ayer
git checkout HEAD~5  # O el hash del commit de ayer
pnpm install
pnpm dev
# ¿Funciona? El bug está en commits posteriores
```

---

## A8: Volver atrás

### Volver a un commit específico (crear branch)

```bash
git checkout -b recovery/from-commit-abc123 abc123
```

### Volver a un tag específico

```bash
git checkout -b recovery/from-v1.0.0 v1.0.0
```

### Volver develop a como estaba en origin

```bash
git checkout develop
git reset --hard origin/develop
```

### Volver todo a como estaba hace X commits

```bash
# Ver historial
git log --oneline -20

# Crear branch de recuperación desde hace 5 commits
git checkout -b recovery/5-commits-ago HEAD~5
```

---

## 🧰 Comandos útiles de emergencia

```bash
# === DIAGNÓSTICO ===
git status                    # Estado actual
git log --oneline -10         # Últimos commits
git diff                      # Cambios no commiteados
git diff HEAD~1               # Cambios del último commit

# === DESHACER LOCAL ===
git checkout -- .             # Descartar todos los cambios locales
git checkout -- archivo.ts    # Descartar cambios en un archivo
git stash                     # Guardar cambios temporalmente
git stash pop                 # Recuperar cambios guardados

# === DESHACER COMMITS ===
git reset --soft HEAD~1       # Deshacer commit, mantener cambios
git reset --hard HEAD~1       # Deshacer commit Y cambios ⚠️
git revert HEAD               # Crear commit que deshace el anterior

# === RECUPERAR ===
git reflog                    # Ver TODA la historia (incluso borrada)
git checkout <hash>           # Ir a cualquier punto
git cherry-pick <hash>        # Traer un commit específico
```

---

## 📞 Si nada funciona

1. **No borres nada más**
2. **Haz una copia del directorio actual** (por si acaso)
   ```bash
   cp -r wallie wallie-backup-emergency
   ```
3. **Clona el repo de nuevo**
   ```bash
   git clone git@github.com:usuario/wallie.git wallie-fresh
   ```
4. **Compara** qué archivos son diferentes
5. **Copia** solo lo que necesites del backup

---

## 🛡️ Prevención

Para que esto no vuelva a pasar:

1. **Commits pequeños y frecuentes** - Más fácil identificar y revertir
2. **Branches por feature** - main/develop siempre estables
3. **CI obligatorio** - No merge sin tests verdes
4. **Backups de DB** - Antes de cada migración
5. **Tags por release** - Puntos de recuperación claros

---

_Guarda este documento a mano. Cuando lo necesites, no tendrás tiempo de buscarlo._
