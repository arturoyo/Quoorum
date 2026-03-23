# ⚡ REFERENCIA RÁPIDA - Trabajar en Paralelo

## 🚀 INICIO RÁPIDO

### Opción 1: Script automático (RECOMENDADO)
```powershell
./scripts/start-work-session.ps1 -Type feat -Name footer-icons
```

### Opción 2: Manual
```bash
git pull origin main
git checkout -b feat/footer-icons
# Edita archivos...
git add .
git commit -m "descripción"
git push origin feat/footer-icons
```

---

## 📋 CHECKLIST ANTES DE EMPEZAR

```bash
☐ git status                    # Ver dónde estás
☐ git pull origin main          # Sincronizar
☐ git checkout -b tipo/nombre   # Nueva rama
☐ Empezar a editar
```

---

## 💾 COMMITS

```bash
# Añadir cambios
git add .

# Commit con mensaje claro
git commit -m "tipo: descripción breve

- Detalle 1
- Detalle 2
- Detalle 3"

# Ver commits
git log --oneline -5
```

---

## 🔄 CAMBIAR DE VENTANA SIN TERMINAR

```bash
# GUARDAR trabajo
git stash save "descripción: qué estabas haciendo"

# Al volver
git stash pop

# Ver stash guardados
git stash list
```

---

## 📤 PUSH Y MERGE

```bash
# Push (solo tu rama)
git push origin tipo/nombre

# Merge en main (cuando esté listo)
git checkout main
git pull origin main
git merge tipo/nombre
git push origin main
```

---

## 🆘 SI SE MEZCLÓ TODO

```bash
# Salva todo
git stash save "backup-$(date +%s)"

# Vuelve a punto conocido
git reset --hard origin/main

# Recupera si necesitas
git stash pop
```

---

## 📊 MONITOREO

```bash
# Ver status actual
git status

# Ver rama donde estás
git branch -v

# Monitorear en tiempo real
./scripts/monitor-git-status.ps1
```

---

## ✅ TIPOS DE RAMA VÁLIDOS

```
feat/        → Nueva funcionalidad (feat/sistema-prompts)
fix/         → Bug fix (fix/notifications-layout)
style/       → Cambios visuales (style/footer-responsive)
refactor/    → Reorganizar código (refactor/settings)
perf/        → Performance (perf/optimize-load)
docs/        → Documentación (docs/api-guide)
chore/       → Tareas (chore/update-deps)
```

---

## 🎯 EJEMPLO REAL

```bash
# Ventana 1 - Footer
./scripts/start-work-session.ps1 -Type style -Name footer-icons
# Editas footer.tsx, layout.css
git add . && git commit -m "style: center footer icons on mobile"
git push origin style/footer-icons

# Ventana 2 - Prompts (MIENTRAS editas footer)
./scripts/start-work-session.ps1 -Type feat -Name admin-prompts
# Editas admin-prompts.ts, prompts/page.tsx
git add . && git commit -m "feat: add admin prompts management"
git push origin feat/admin-prompts

# Ventana 3 - Settings
./scripts/start-work-session.ps1 -Type refactor -Name settings-org
# Editas settings components
git add . && git commit -m "refactor: organize settings panel"
git push origin refactor/settings-org

# DESPUÉS: Merge todas
git checkout main && git pull
git merge style/footer-icons
git merge feat/admin-prompts
git merge refactor/settings-org
git push origin main
```

---

## 🚫 NUNCA HAGAS ESTO

```
❌ git push --force
❌ Editar main desde dos ventanas
❌ Hacer pull sin commit primero
❌ Stash sin descripción
❌ Reset sin backup
❌ Merge sin pull primero
```

---

## ℹ️ MÁS INFORMACIÓN

Lee: `ESTRATEGIA-TRABAJO-PARALELO.md`

Ver documentación completa con ejemplos, recuperación de errores y mejores prácticas.

---

**Last Updated:** 28 Enero 2026
