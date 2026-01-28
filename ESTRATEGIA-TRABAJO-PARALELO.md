# 🚀 ESTRATEGIA DEFINITIVA: Trabajar en Paralelo SIN PERDER CAMBIOS

> **Actualizado:** 28 Enero 2026
> **Versión:** 1.0
> **Autor:** Arturo + Claude Opus 4.5

---

## 📋 EL PROBLEMA

Cuando trabajas en múltiples ventanas/sesiones de VS Code en paralelo:
- Los cambios de una ventana se **pierden** en otra
- Se crean conflictos de merge automáticos
- El `.git/config` se queda inconsistente
- Los stash se mezclan y confunden

**Causa raíz:** Cambiar de rama o hacer pull en una ventana afecta a todas las otras que trabajan en la misma rama.

---

## ✅ LA SOLUCIÓN: UNA RAMA POR SESIÓN

### **Regla de Oro**
```
┌─────────────────────────────────────┐
│ 1 Rama = 1 Sesión = 0 Conflictos   │
└─────────────────────────────────────┘
```

### **Ejemplo Perfecto**

```
Tu pantalla 1 (Footer)          Tu pantalla 2 (Prompts)      Tu pantalla 3 (Settings)
├─ git checkout -b              ├─ git checkout -b           ├─ git checkout -b
│  fix/footer-icons             │  feat/system-prompts       │  refactor/settings
│                                │                            │
├─ Editas footer.tsx            ├─ Editas admin-prompts.ts   ├─ Editas settings.tsx
├─ Editas layout.css            ├─ Editas prompts/page.tsx   ├─ Editas layout.tsx
│                                │                            │
├─ git add & commit             ├─ git add & commit          ├─ git add & commit
├─ git push origin              ├─ git push origin           ├─ git push origin
│  fix/footer-icons             │  feat/system-prompts       │  refactor/settings
└─                              └─                           └─

↓ DESPUÉS, CUANDO ESTÉN LISTOS

git checkout main
git pull origin main
git merge fix/footer-icons && git push
git merge feat/system-prompts && git push
git merge refactor/settings && git push
```

---

## 🎯 CHECKLIST ANTES DE EMPEZAR CUALQUIER TAREA

```bash
□ Abrir terminal en la ventana actual
□ Ejecutar: git status
□ Ejecutar: git pull origin main (para sincronizar)
□ Ejecutar: git checkout -b <nombre-rama> (nueva rama)
□ AHORA SÍ, empezar a editar archivos
```

### **Ejemplo con nomenclatura**

```bash
# Footer
git checkout -b style/footer-mobile-icons

# Prompts
git checkout -b feat/admin-prompts-management

# Settings
git checkout -b refactor/settings-organization

# Bug fix
git checkout -b fix/notifications-layout

# Performance
git checkout -b perf/bundle-optimization
```

---

## 💾 COMMIT Y PUSH CORRECTAMENTE

### **Cuando termines la tarea EN ESA RAMA**

```bash
# Ver qué cambios hay
git status

# Añadir los cambios
git add .
git add -p  # Para añadir parcialmente si quieres

# Commit con mensaje claro
git commit -m "style: center footer icons on mobile devices

- Hide text labels on small screens
- Show icons with tooltips
- Improve tap targets for mobile
- Maintain full text on desktop"

# Pushear SOLO esta rama
git push origin style/footer-mobile-icons
```

### **Si necesitas cambiar de ventana SIN terminar**

```bash
# Guarda el trabajo en stash CON NOMBRE DESCRIPTIVO
git stash save "WIP: footer icons - 70% done, need responsive tests"

# Al volver a esa rama
git stash pop  # Recupera lo guardado
# O si el stash tiene número
git stash pop stash@{0}
```

---

## 🔀 FUSIONAR CUANDO ESTÉ TODO LISTO

### **NUNCA pushees directamente a main desde múltiples ventanas**

```bash
# ✅ CORRECTO:
git checkout main
git pull origin main           # Sincroniza con remoto
git merge style/footer-mobile-icons  # Merge local
git push origin main          # Push una sola vez

# ❌ INCORRECTO:
# No hagas: git push origin feature:main
# No hagas: git push --force
# No hagas: git rebase main en paralelo desde otras sesiones
```

---

## 🆘 SI YA ESTÁ TODO MEZCLADO (Recuperación)

### **Paso 1: Salvar lo que trabajaste hoy**

```bash
# Guarda el estado actual en stash
git stash save "backup-todo-hoy-$(date +%s)"

# Lista los stash
git stash list
```

### **Paso 2: Resetear a un punto conocido bueno**

```bash
# Sincroniza con remoto
git fetch origin

# Resetea a main remoto (CUIDADO: pierde cambios locales)
git reset --hard origin/main

# O si quieres recuperar los cambios del stash
git stash pop
```

### **Paso 3: Crear rama nueva y rehacer**

```bash
git checkout -b recovery/cambios-perdidos

# Edita los archivos
# Commit
git commit -am "refactor: recuperar cambios del 28/01"

# Push
git push origin recovery/cambios-perdidos

# Merge en main cuando esté verificado
```

---

## 📊 MONITOREO EN TIEMPO REAL

### **En cada sesión, ejecuta esto CADA HORA**

```bash
# Ver estado actual
git status

# Ver la rama donde estás
git branch -v

# Ver cambios sin stagear
git diff --stat

# Ver commits recientes
git log --oneline -10
```

### **Script PowerShell para automatizar**

```powershell
# Guardar como: scripts/check-git-status.ps1

Clear-Host
Write-Host "=== GIT STATUS ===" -ForegroundColor Cyan
git status

Write-Host "`n=== RAMA ACTUAL ===" -ForegroundColor Cyan
git branch

Write-Host "`n=== ÚLTIMOS COMMITS ===" -ForegroundColor Cyan
git log --oneline -5

Write-Host "`n=== STASH ===" -ForegroundColor Cyan
git stash list

Write-Host "`n=== CAMBIOS ===" -ForegroundColor Cyan
git diff --stat
```

Ejecutar:
```bash
./scripts/check-git-status.ps1
```

---

## ⚠️ ERRORES COMUNES A EVITAR

| ❌ NO HAGAS | ✅ HAZ ESTO |
|-----------|----------|
| `git push --force` | `git push origin rama` |
| Editar en main desde múltiples ventanas | Editar en ramas separadas |
| `git merge` sin `pull` primero | `git pull origin main` → `git merge` |
| Stash sin descripción | `git stash save "descripción clara"` |
| Pull en medio de commits | Commit/push primero, luego pull |
| Reset sin backup | `git stash save` primero |

---

## 🎓 FLUJO RECOMENDADO PARA TI

### **Tu caso específico (3 pantallas)**

```
PANTALLA 1: Debates & Core Features
└─ git checkout -b feat/debate-improvements
   ├─ debates.ts
   ├─ debate-components/
   └─ commit → push → merge cuando esté

PANTALLA 2: Admin Panel & Prompts
└─ git checkout -b feat/admin-management
   ├─ admin/prompts/page.tsx
   ├─ admin/settings/
   └─ commit → push → merge cuando esté

PANTALLA 3: UI/Style & Responsive
└─ git checkout -b style/responsive-design
   ├─ components/layout/
   ├─ components/footer/
   └─ commit → push → merge cuando esté

INTEGRACIÓN FINAL:
git checkout main
git pull origin main
git merge feat/debate-improvements
git merge feat/admin-management
git merge style/responsive-design
git push origin main
```

---

## 🚀 COMANDO RÁPIDO: "Empezar sesión nueva"

Guarda esto como un alias en PowerShell:

```powershell
# Añade a tu $PROFILE
function git-session {
    param([string]$type = "feat", [string]$name)
    
    if (-not $name) {
        Write-Error "Uso: git-session feat nombre-rama"
        return
    }
    
    $branch = "$type/$name"
    Write-Host "Creando rama: $branch" -ForegroundColor Green
    
    git pull origin main
    git checkout -b $branch
    
    Write-Host "✅ Rama lista: $branch" -ForegroundColor Green
    git branch -v
}

# Uso:
# git-session feat footer-icons
# git-session fix notifications
# git-session refactor settings
```

---

## 📞 SI ALGO SALE MAL

```bash
# Recuperar último commit
git reflog

# Ver qué pasó
git log --oneline --all --graph

# Preguntar: ¿Qué rama debería estar?
git branch -a

# En caso de pánico absoluto
git stash save "panic-backup-$(date +%Y%m%d-%H%M%S)"
git reset --hard origin/main
```

---

## ✨ CONCLUSIÓN

**Antes:**
```
❌ Múltiples ventanas → cambios se pierden
❌ Un pull afecta a todo
❌ Conflictos constantes
```

**Ahora:**
```
✅ Una rama por sesión
✅ Sin interferencias
✅ Cambios 100% seguros
```

**Recuerda:** 
> *"Una rama por sesión, un commit por cambio, un push por rama."*

---

**Última actualización:** 2026-01-28
**Status:** ✅ IMPLEMENTADO Y PROBADO
