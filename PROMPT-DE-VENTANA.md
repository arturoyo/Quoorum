# 🎯 PROMPT DE VENTANA - Copia esto en cada sesión

---

## **VENTANA 1: [Pon aquí qué vas a hacer]**

Ejemplo: VENTANA 1: Footer Icons | VENTANA 2: Admin Prompts | VENTANA 3: Settings

```
ANTES DE EMPEZAR:
1. git pull origin main
2. git checkout -b [tipo]/[nombre]
   ├─ feat/nueva-funcionalidad
   ├─ fix/bug-corregido
   ├─ style/cambios-visuales
   ├─ refactor/reorganización
   └─ perf/optimización

MIENTRAS TRABAJAS:
✅ Edita lo que necesites
✅ Haz commits pequeños: git commit -m "descripción clara"
✅ NUNCA hagas pull si tienes cambios sin commitar
✅ Si necesitas cambiar de ventana: git stash save "qué estabas haciendo"

CUANDO TERMINES:
1. git add .
2. git commit -m "descripción final"
3. git push origin [tu-rama]
4. Merge en main solo cuando esté 100% listo

EMERGENCIA:
❌ Cambios sin guardar y necesitas cambiar ventana → git stash save "descripción"
❌ Committed algo que no querías → git revert HEAD
❌ Todo se fue al carajo → git reset --hard origin/main (¡CUIDADO!)
```

---

## **REGLA DE ORO**

```
🚀 Una rama por ventana = Sin conflictos = Sin estrés

Ventana A: git checkout -b style/footer
Ventana B: git checkout -b feat/prompts
Ventana C: git checkout -b refactor/settings

Cada una hace su vida sin tocar a las otras ✅
```

---

## **COMANDOS MÁS USADOS**

```bash
# Ver dónde estás
git status

# Cambiar rama (sin cambios sin guardar)
git checkout -b nueva-rama

# Guardar trabajo sin commitear
git stash save "WIP: qué estabas haciendo"

# Recuperar stash
git stash pop

# Commit + push en uno
git add . && git commit -m "msg" && git push origin [rama]

# Ver últimos commits
git log --oneline -5

# Volver a main y sincronizar
git checkout main && git pull origin main
```

---

## **FLUJO TÍPICO DE UNA SESIÓN**

```
📍 Llego a esta ventana
  ↓
👀 git pull origin main
  ↓
🌿 git checkout -b feat/mi-funcionalidad
  ↓
✏️ Edito archivos durante 2-3 horas
  ↓
📤 git add . && git commit -m "feat: descripción" && git push
  ↓
✅ Hecho. Esta ventana lista para nueva tarea
```

---

## **✋ ANTES DE CERRAR LA VENTANA**

```
☐ git status → ¿Hay cambios sin commitar?
   SI → git stash save "WIP: qué falta"
   NO → listo para cerrar
   
☐ git log --oneline -1 → Verifica que tu último commit está
☐ Cierra sin miedo 🎉
```

---

**Imprime esto, ponlo en tu monitor y no te compliques más** 🚀
