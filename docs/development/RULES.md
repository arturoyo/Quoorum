# RULES.md — Reglas Obligatorias para IAs

> **⚠️ CUALQUIER IA QUE TRABAJE EN ESTE PROYECTO DEBE LEER Y SEGUIR ESTAS REGLAS**
>
> Estas reglas existen para proteger el proyecto de errores que han ocurrido antes.
> NO son negociables. NO hay excepciones.

---

## 🚨 REGLAS CRÍTICAS (Romper = Desastre)

### 1. NUNCA borrar archivos sin confirmación explícita

```
❌ MAL:  "Voy a limpiar estos archivos antiguos" [borra]
✅ BIEN: "Estos archivos parecen no usarse: [lista]. ¿Los borro?"
```

### 2. NUNCA hacer push a main o develop directamente

```
❌ MAL:  git push origin main
✅ BIEN: git push origin feature/mi-feature → PR → Review → Merge
```

### 3. NUNCA cambiar el schema de DB sin migración

```
❌ MAL:  Modificar schema.ts y hacer push
✅ BIEN:
  1. Modificar schema
  2. pnpm db:generate (crear migración)
  3. pnpm db:push (aplicar)
  4. Commit de schema + migración juntos
```

### 4. NUNCA hardcodear secrets o credenciales

```
❌ MAL:  const apiKey = "sk-abc123..."
✅ BIEN: const apiKey = process.env.OPENAI_API_KEY
```

### 5. NUNCA ignorar errores de TypeScript

```
❌ MAL:  // @ts-ignore
❌ MAL:  as any
✅ BIEN: Arreglar el tipo correctamente
```

### 6. NUNCA commitear sin verificar

Antes de CADA commit:

```bash
pnpm lint      # ¿Pasa?
pnpm typecheck # ¿Pasa?
pnpm test      # ¿Pasa?
pnpm build     # ¿Pasa?
```

---

## 📋 REGLAS DE CÓDIGO

### 7. SIEMPRE filtrar por user_id en queries

```typescript
// ❌ MAL - Cualquiera puede ver datos de otros
const clients = await db.select().from(clients)

// ✅ BIEN - Solo datos del usuario autenticado
const clients = await db.select().from(clients).where(eq(clients.userId, ctx.userId))
```

### 8. SIEMPRE validar input con Zod

```typescript
// ❌ MAL - Input no validado
async function createClient(data: any) {
  await db.insert(clients).values(data)
}

// ✅ BIEN - Input validado
const schema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().optional(),
})

async function createClient(data: unknown) {
  const validated = schema.parse(data)
  await db.insert(clients).values(validated)
}
```

### 9. SIEMPRE usar tipos explícitos

```typescript
// ❌ MAL
const data = await fetchData()
const items = data.map((x) => x.name)

// ✅ BIEN
const data: Client[] = await fetchData()
const items: string[] = data.map((client: Client) => client.name)
```

### 10. NUNCA dejar console.log en código

```typescript
// ❌ MAL
console.log('debugging', data)

// ✅ BIEN - Usar logger o eliminar
import { logger } from '@/lib/logger'
logger.debug('Processing data', { count: data.length })
```

---

## 📁 REGLAS DE ARCHIVOS

### 11. NUNCA crear archivos fuera de la estructura definida

```
❌ MAL:  Crear /src/helpers/random-stuff.ts
✅ BIEN: Seguir estructura de SYSTEM.md
```

Estructura permitida:

- Páginas → `apps/web/src/app/`
- Componentes → `apps/web/src/components/`
- API → `packages/api/src/routers/`
- DB → `packages/db/src/schema/`
- IA → `packages/ai/src/`

### 12. NUNCA duplicar código

```
❌ MAL:  Copiar función a otro archivo
✅ BIEN: Extraer a package compartido
```

### 13. SIEMPRE seguir convención de naming

```typescript
// Componentes: PascalCase
export function ClientCard() {}

// Hooks: camelCase con use
export function useClient() {}

// Utils: camelCase
export function formatDate() {}

// Archivos de componente: kebab-case
client - card.tsx
use - client.ts
format - date.ts
```

---

## 🔄 REGLAS DE GIT

### 14. SIEMPRE usar conventional commits

```bash
# ❌ MAL
git commit -m "fix"
git commit -m "cambios"
git commit -m "WIP"

# ✅ BIEN
git commit -m "feat(clients): añadir búsqueda por teléfono"
git commit -m "fix(auth): corregir redirect después de login"
git commit -m "docs(readme): actualizar instrucciones"
```

### 15. SIEMPRE crear branch para cada cambio

```bash
# ❌ MAL - Trabajar en develop
git checkout develop
# ... hacer cambios ...
git push

# ✅ BIEN - Branch por feature
git checkout develop
git pull
git checkout -b feature/nombre-descriptivo
# ... hacer cambios ...
git push origin feature/nombre-descriptivo
# Crear PR
```

### 16. NUNCA hacer force push en branches compartidos

```bash
# ❌ NUNCA
git push --force origin develop
git push --force origin main

# ✅ OK (solo en tu branch)
git push --force origin feature/mi-feature
```

---

## 🧪 REGLAS DE TESTING

### 17. SIEMPRE escribir tests para lógica crítica

Requiere tests:

- Autenticación
- Pagos
- Queries de datos
- Lógica de IA

```typescript
// ❌ MAL - Sin test
export function calculatePrice(items) {
  return items.reduce((sum, item) => sum + item.price, 0)
}

// ✅ BIEN - Con test
// calculate-price.ts
export function calculatePrice(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0)
}

// calculate-price.test.ts
describe('calculatePrice', () => {
  it('should sum all item prices', () => {
    const items = [{ price: 10 }, { price: 20 }]
    expect(calculatePrice(items)).toBe(30)
  })

  it('should return 0 for empty array', () => {
    expect(calculatePrice([])).toBe(0)
  })
})
```

### 18. SIEMPRE correr tests antes de PR

```bash
pnpm test
# ✅ Todos pasan → OK para PR
# ❌ Alguno falla → Arreglar primero
```

---

## 🗄️ REGLAS DE BASE DE DATOS

### 19. NUNCA modificar datos de producción manualmente

```sql
-- ❌ NUNCA en producción
DELETE FROM clients WHERE ...
UPDATE users SET ...

-- ✅ BIEN
-- Usar migraciones o scripts versionados
-- Hacer backup antes
-- Probar en staging primero
```

### 20. SIEMPRE hacer backup antes de migraciones

```bash
# Antes de aplicar migración
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Aplicar migración
pnpm db:push
```

### 21. NUNCA usar SQL raw sin parametrizar

```typescript
// ❌ MAL - SQL injection
const query = `SELECT * FROM clients WHERE name = '${name}'`

// ✅ BIEN - Parametrizado
const clients = await db.select().from(clients).where(eq(clients.name, name))
```

---

## 🚀 REGLAS DE DEPLOY

### 22. NUNCA deployar sin CI verde

```
❌ MAL:  "CI falló pero es solo lint, deploy igual"
✅ BIEN: Arreglar CI → Todo verde → Deploy
```

### 23. SIEMPRE verificar en staging antes de producción

```
1. Merge a develop
2. Deploy automático a staging
3. Probar en staging
4. Todo OK → Merge develop → main
5. Deploy a producción
```

### 24. SIEMPRE tener rollback plan

```bash
# Si algo falla en producción
git revert HEAD
git push origin main
# O volver a tag anterior
git checkout v1.2.3
```

---

## 💬 REGLAS DE COMUNICACIÓN

### 25. SIEMPRE explicar qué vas a hacer ANTES de hacerlo

```
❌ MAL:  [hace cambios grandes sin avisar]

✅ BIEN: "Voy a refactorizar el sistema de auth.
         Esto implica:
         1. Cambiar middleware
         2. Actualizar context
         3. Modificar 5 componentes
         ¿Procedo?"
```

### 26. SIEMPRE preguntar si no estás seguro

```
❌ MAL:  "Creo que esto está bien" [commit]
✅ BIEN: "No estoy seguro si debo usar X o Y. ¿Cuál prefieres?"
```

### 27. SIEMPRE reportar errores inmediatamente

```
❌ MAL:  [algo falla, intentar arreglarlo en silencio]
✅ BIEN: "He encontrado un error: [descripción].
         Antes de intentar arreglarlo, ¿quieres que investigue más?"
```

---

## ✅ CHECKLIST ANTES DE CADA CAMBIO

```
□ He leído SYSTEM.md
□ Sé en qué fase del proyecto estamos (PHASES.md)
□ Estoy en un branch de feature, no en develop/main
□ Mi código sigue las convenciones
□ He validado inputs con Zod
□ He filtrado queries por userId
□ No hay console.log
□ No hay any ni @ts-ignore
□ Los tests pasan
□ El lint pasa
□ El build pasa
□ He escrito mensaje de commit descriptivo
□ He explicado qué hice y por qué
```

---

## 🆘 QUÉ HACER SI ALGO SALE MAL

1. **PARA** - No hagas más cambios
2. **COMUNICA** - Avisa qué ha pasado
3. **DIAGNOSTICA** - `git status`, `git log`, `git diff`
4. **RECUPERA** - Ver RECOVERY.md

---

_Estas reglas existen porque hemos aprendido de errores pasados. Respétalas._
