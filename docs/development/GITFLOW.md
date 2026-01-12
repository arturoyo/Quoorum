# GITFLOW.md — Estrategia de Git Anti-Cagadas

> **Regla de oro: NUNCA trabajar en main. SIEMPRE poder volver atrás.**

---

## Branches

```
main            ← Producción principal. SAGRADO. Solo merges de app.
  │
  ├── app       ← Producción (app.wallie.pro). Solo merge de develop.
  │
  └── develop   ← Desarrollo (dev.wallie.pro). Integración de features.
        │
        ├── feature/xxx   ← Una feature específica
        ├── fix/xxx       ← Un bugfix
        └── hotfix/xxx    ← Urgencia en producción
```

### Flujo de Deploy

```
feature/xxx → develop → dev.wallie.pro (testing)
                  ↓
               (si OK)
                  ↓
              app → app.wallie.pro (producción)
                  ↓
                main (sincronizado con app)
```

### Reglas de branches

| Branch      | Deploy a       | Quién pushea  | Cómo llega código                   |
| ----------- | -------------- | ------------- | ----------------------------------- |
| `main`      | —              | NADIE directo | Solo merge de `app`                 |
| `app`       | app.wallie.pro | NADIE directo | Solo merge de `develop` (aprobado)  |
| `develop`   | dev.wallie.pro | NADIE directo | Solo merge de `feature/*` o `fix/*` |
| `feature/*` | —              | Desarrollo    | Commits normales                    |
| `fix/*`     | —              | Desarrollo    | Commits normales                    |
| `hotfix/*`  | —              | Emergencias   | Merge directo a app + develop       |

---

## Flujo de trabajo diario

### Empezar feature nueva

```bash
# 1. Asegúrate de estar en develop actualizado
git checkout develop
git pull origin develop

# 2. Crear branch de feature
git checkout -b feature/nombre-descriptivo

# 3. Trabajar, commits pequeños y frecuentes
git add .
git commit -m "feat(scope): descripción corta"

# 4. Push a tu branch
git push origin feature/nombre-descriptivo

# 5. Crear Pull Request → develop
# 6. Esperar que CI pase
# 7. Merge (squash preferido)
# 8. Deploy automático a dev.wallie.pro
# 9. Verificar en dev.wallie.pro
# 10. Si OK → merge develop → app → app.wallie.pro
```

### Fix de bug

```bash
git checkout develop
git pull origin develop
git checkout -b fix/descripcion-del-bug
# ... trabajar ...
git push origin fix/descripcion-del-bug
# PR → develop
```

### Hotfix en producción

```bash
git checkout app
git pull origin app
git checkout -b hotfix/descripcion-urgente
# ... fix mínimo ...
git push origin hotfix/descripcion-urgente
# PR → app (y luego merge app → develop)
```

### Deploy a producción

```bash
# 1. Verificar que develop funciona correctamente en dev.wallie.pro
# 2. Crear PR: develop → app
# 3. Revisar cambios
# 4. Merge → deploy automático a app.wallie.pro
# 5. Verificar en producción
# 6. Sincronizar: merge app → main
```

---

## Commits (Conventional Commits)

### Formato

```
tipo(scope): descripción corta

[cuerpo opcional]

[footer opcional]
```

### Tipos permitidos

| Tipo       | Cuándo usar                               |
| ---------- | ----------------------------------------- |
| `feat`     | Nueva funcionalidad                       |
| `fix`      | Corrección de bug                         |
| `docs`     | Solo documentación                        |
| `style`    | Formato, espacios (no afecta código)      |
| `refactor` | Cambio de código sin nueva feature ni fix |
| `test`     | Añadir o modificar tests                  |
| `chore`    | Mantenimiento, deps, config               |
| `perf`     | Mejora de rendimiento                     |
| `ci`       | Cambios en CI/CD                          |
| `revert`   | Revertir commit anterior                  |

### Ejemplos buenos

```bash
feat(clients): añadir búsqueda por teléfono
fix(auth): corregir redirect después de login
docs(readme): actualizar instrucciones de setup
refactor(api): extraer lógica de validación a utils
test(clients): añadir tests para crear cliente
chore(deps): actualizar next a 14.1.0
```

### Ejemplos MALOS

```bash
fix: cosas           # ❌ No descriptivo
update              # ❌ No sigue formato
WIP                 # ❌ No commitear WIP
asdfasdf            # ❌ Obviamente no
```

---

## Tags y Releases

### Versionado semántico

```
v1.2.3
│ │ │
│ │ └── PATCH: fixes, no rompe nada
│ └──── MINOR: features nuevas, compatible
└────── MAJOR: cambios que rompen compatibilidad
```

### Crear release

```bash
# 1. Estar en main actualizado
git checkout main
git pull origin main

# 2. Crear tag
git tag -a v1.0.0 -m "Release v1.0.0: MVP funcional"

# 3. Push tag
git push origin v1.0.0
```

### Tags importantes

| Tag           | Significado                |
| ------------- | -------------------------- |
| `v0.1.0`      | Primera versión funcional  |
| `v0.x.x`      | Pre-release, puede cambiar |
| `v1.0.0`      | Primera versión estable    |
| `vX.X.X-beta` | Beta pública               |
| `vX.X.X-rc1`  | Release candidate          |

---

## Protecciones de branch (GitHub)

### Configurar en GitHub → Settings → Branches

**Para `main`:**

- ✅ Require pull request before merging
- ✅ Require approvals: 1 (aunque seas solo tú, fuerza PR)
- ✅ Require status checks to pass (CI)
- ✅ Require branches to be up to date
- ✅ Do not allow bypassing

**Para `app`:**

- ✅ Require pull request before merging
- ✅ Require approvals: 1
- ✅ Require status checks to pass (CI)
- ✅ Require branches to be up to date

**Para `develop`:**

- ✅ Require pull request before merging
- ✅ Require status checks to pass (CI)

---

## Comandos de emergencia

### Ver qué ha cambiado

```bash
# Ver últimos commits
git log --oneline -20

# Ver cambios de un commit específico
git show abc1234

# Ver diferencias con develop
git diff develop

# Ver archivos modificados
git status
```

### Deshacer cambios locales

```bash
# Deshacer cambios en un archivo (no commiteado)
git checkout -- archivo.ts

# Deshacer todos los cambios locales (no commiteados)
git checkout -- .

# Deshacer último commit (mantiene cambios)
git reset --soft HEAD~1

# Deshacer último commit (BORRA cambios) ⚠️
git reset --hard HEAD~1
```

### Volver a versión anterior

```bash
# Ver tags disponibles
git tag -l

# Volver a un tag específico (crear branch)
git checkout -b recovery/desde-v1.0.0 v1.0.0

# Volver a commit específico (crear branch)
git checkout -b recovery/desde-abc1234 abc1234
```

### Revertir commit ya pusheado

```bash
# Crear nuevo commit que deshace los cambios
git revert abc1234
git push origin develop
```

### PÁNICO: Todo está roto

```bash
# 1. NO TOQUES NADA MÁS
# 2. Guarda el estado actual por si acaso
git stash

# 3. Vuelve a develop limpio
git checkout develop
git reset --hard origin/develop

# 4. Si develop también está roto, ve a último tag bueno
git checkout -b recovery/emergency v0.9.0
```

---

## Backup adicional

### Antes de cambios grandes

```bash
# Crear tag de backup
git tag -a backup/antes-de-refactor-auth -m "Backup antes de tocar auth"
git push origin backup/antes-de-refactor-auth
```

### Clonar repo como backup local

```bash
# En otra carpeta
git clone --mirror git@github.com:usuario/wallie.git wallie-backup-$(date +%Y%m%d)
```

---

## Checklist antes de cada merge

- [ ] CI está verde (lint, types, tests, build)
- [ ] He probado en local
- [ ] No hay `console.log` ni código de debug
- [ ] Los commits siguen conventional commits
- [ ] El PR tiene descripción clara
- [ ] Si toca DB, hay migración
- [ ] Si es merge a app: verificado en dev.wallie.pro

---

## Lo que NUNCA hacer

| ❌ NUNCA                                     | Por qué                    |
| -------------------------------------------- | -------------------------- |
| Push a main/app directamente                 | Rompe producción           |
| `git push --force` en main/app/develop       | Borra historial de otros   |
| Commit de node_modules                       | Repo enorme, conflictos    |
| Commit de .env                               | Expone secrets             |
| Commits gigantes                             | Imposible revisar/revertir |
| Merge sin CI verde                           | Código roto en develop     |
| Deploy a app sin verificar en dev.wallie.pro | Bugs en producción         |

---

_Última actualización: 17 Dic 2025_
