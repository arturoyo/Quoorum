# 🎨 GUÍA VISUAL: Migración de Colores Hardcodeados a Variables CSS

> **Versión:** 1.0.0 | **Fecha:** 26 Ene 2026
> **Propósito:** Prevenir colores hardcodeados que rompen light mode

---

## 🚨 PROBLEMA: Colores Hardcodeados Rompen Light Mode

### ❌ ANTES (Hardcoded - FALLA en light mode)

```tsx
// 🔴 PROBLEMA: Estos colores NO funcionan en light mode
export function ClientCard({ client }: Props) {
  return (
    <div className="rounded-lg bg-white/5 border border-white/10 p-6">
      <h3 className="text-xl font-semibold text-white">
        {client.name}
      </h3>
      <p className="text-gray-400 mt-2">
        {client.email}
      </p>
      <span className="text-gray-500 text-sm">
        Cliente desde {formatDate(client.createdAt)}
      </span>
    </div>
  )
}
```

**Resultado en DARK MODE:**
```
✅ Card visible (bg-white/5 sobre fondo oscuro)
✅ Texto visible (text-white sobre fondo oscuro)
✅ Email visible (text-gray-400 sobre fondo oscuro)
```

**Resultado en LIGHT MODE:**
```
❌ Card INVISIBLE (bg-white/5 sobre fondo blanco)
❌ Texto INVISIBLE (text-white sobre fondo blanco)
❌ Bordes INVISIBLES (border-white/10 sobre fondo blanco)
```

---

## ✅ SOLUCIÓN 1: Variables CSS de Tema

### ✅ DESPUÉS (Con variables - funciona en AMBOS modos)

```tsx
// 🟢 CORRECTO: Variables CSS se adaptan automáticamente
export function ClientCard({ client }: Props) {
  return (
    <div className="rounded-lg bg-[var(--theme-landing-card)] border border-[var(--theme-landing-border)] p-6">
      <h3 className="text-xl font-semibold text-[var(--theme-text-primary)]">
        {client.name}
      </h3>
      <p className="text-[var(--theme-text-secondary)] mt-2">
        {client.email}
      </p>
      <span className="text-[var(--theme-text-tertiary)] text-sm">
        Cliente desde {formatDate(client.createdAt)}
      </span>
    </div>
  )
}
```

**Resultado en DARK MODE:**
```
✅ Card visible (--theme-landing-card = rgba(255,255,255,0.03))
✅ Texto visible (--theme-text-primary = #ffffff)
✅ Email visible (--theme-text-secondary = #aebac1)
```

**Resultado en LIGHT MODE:**
```
✅ Card visible (--theme-landing-card = rgba(241,245,249,0.8))
✅ Texto visible (--theme-text-primary = #0f172a)
✅ Email visible (--theme-text-secondary = #64748b)
```

---

## ✅ SOLUCIÓN 2: Componentes Themed (Recomendado)

### ✅ DESPUÉS (Componente wrapper - aún más simple)

```tsx
import { ThemedCard } from '@/components/ui/themed-card'
import { ThemedText } from '@/components/ui/themed-text'

export function ClientCard({ client }: Props) {
  return (
    <ThemedCard variant="landing">
      <ThemedCard.Header>
        <ThemedCard.Title>{client.name}</ThemedCard.Title>
        <ThemedCard.Description>{client.email}</ThemedCard.Description>
      </ThemedCard.Header>
      <ThemedCard.Content>
        <ThemedText.Tertiary as="span" className="text-sm">
          Cliente desde {formatDate(client.createdAt)}
        </ThemedText.Tertiary>
      </ThemedCard.Content>
    </ThemedCard>
  )
}
```

**Ventajas:**
- ✅ Automáticamente adaptativo light/dark
- ✅ Consistencia garantizada
- ✅ Menos código repetitivo
- ✅ Más fácil de mantener

---

## 📋 TABLA DE EQUIVALENCIAS

### Fondos (Backgrounds)

| ❌ Hardcoded (NO usar)              | ✅ Variable CSS                        | 🎯 Componente Themed |
|------------------------------------|----------------------------------------|----------------------|
| `bg-white/5`                       | `bg-[var(--theme-landing-card)]`       | `<ThemedCard>`       |
| `bg-white/10`                      | `bg-[var(--theme-landing-glass)]`      | `<ThemedCard variant="glass">` |
| `bg-gray-800`                      | `bg-[var(--theme-bg-secondary)]`       | `<ThemedCard variant="default">` |
| `bg-gray-900`                      | `bg-[var(--theme-bg-primary)]`         | —                    |
| `bg-gray-700`                      | `bg-[var(--theme-bg-tertiary)]`        | —                    |

### Texto (Text Colors)

| ❌ Hardcoded (NO usar)              | ✅ Variable CSS                        | 🎯 Componente Themed |
|------------------------------------|----------------------------------------|----------------------|
| `text-white`                       | `text-[var(--theme-text-primary)]`     | `<ThemedText.Primary>` |
| `text-gray-400`                    | `text-[var(--theme-text-secondary)]`   | `<ThemedText.Secondary>` |
| `text-gray-500`                    | `text-[var(--theme-text-tertiary)]`    | `<ThemedText.Tertiary>` |
| `text-gray-600`                    | `text-[var(--theme-text-muted)]`       | `<ThemedText.Muted>` |

### Bordes (Borders)

| ❌ Hardcoded (NO usar)              | ✅ Variable CSS                        |
|------------------------------------|----------------------------------------|
| `border-white/10`                  | `border-[var(--theme-landing-border)]` |
| `border-white/20`                  | `border-[var(--theme-landing-glass-border)]` |
| `border-gray-700`                  | `border-[var(--theme-border)]`         |

### Inputs y Controles

| ❌ Hardcoded (NO usar)              | ✅ Variable CSS                        | 🎯 Componente Themed |
|------------------------------------|----------------------------------------|----------------------|
| `bg-gray-800 border-gray-700`      | `bg-[var(--theme-bg-input)] border-[var(--theme-border)]` | `<ThemedInput>` |
| `placeholder:text-gray-500`        | `placeholder:text-[var(--theme-text-tertiary)]` | `<ThemedInput>` |

---

## 🎯 CASOS DE USO COMPLETOS

### Caso 1: Landing Page Card

#### ❌ ANTES

```tsx
<div className="rounded-lg bg-white/5 border border-white/10 p-6 hover:bg-white/10">
  <h3 className="text-xl font-bold text-white">
    80+ Expertos IA
  </h3>
  <p className="text-gray-400 mt-2">
    Simula equipos ejecutivos completos con expertos en SaaS, VC, Marketing, etc.
  </p>
</div>
```

#### ✅ DESPUÉS (Opción 1: Variables CSS)

```tsx
<div className="rounded-lg bg-[var(--theme-landing-card)] border border-[var(--theme-landing-border)] p-6 hover:bg-[var(--theme-landing-card-hover)]">
  <h3 className="text-xl font-bold text-[var(--theme-text-primary)]">
    80+ Expertos IA
  </h3>
  <p className="text-[var(--theme-text-secondary)] mt-2">
    Simula equipos ejecutivos completos con expertos en SaaS, VC, Marketing, etc.
  </p>
</div>
```

#### ✅ DESPUÉS (Opción 2: Componente Themed - RECOMENDADO)

```tsx
<ThemedCard variant="landing" className="p-6">
  <ThemedCard.Title>80+ Expertos IA</ThemedCard.Title>
  <ThemedCard.Description className="mt-2">
    Simula equipos ejecutivos completos con expertos en SaaS, VC, Marketing, etc.
  </ThemedCard.Description>
</ThemedCard>
```

---

### Caso 2: Input de Formulario

#### ❌ ANTES

```tsx
<div className="space-y-2">
  <label className="text-sm font-medium text-white">
    Nombre del cliente
  </label>
  <input
    type="text"
    placeholder="Juan García"
    className="w-full rounded-md bg-gray-800 border border-gray-700 text-white placeholder:text-gray-500 px-3 py-2"
  />
</div>
```

#### ✅ DESPUÉS (Opción 1: Variables CSS)

```tsx
<div className="space-y-2">
  <label className="text-sm font-medium text-[var(--theme-text-secondary)]">
    Nombre del cliente
  </label>
  <input
    type="text"
    placeholder="Juan García"
    className="w-full rounded-md bg-[var(--theme-bg-input)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-tertiary)] px-3 py-2"
  />
</div>
```

#### ✅ DESPUÉS (Opción 2: Componente Themed - RECOMENDADO)

```tsx
<div className="space-y-2">
  <ThemedLabel>Nombre del cliente</ThemedLabel>
  <ThemedInput
    type="text"
    placeholder="Juan García"
    className="w-full"
  />
</div>
```

---

### Caso 3: Botón con Variantes

#### ❌ ANTES

```tsx
// Botón primario
<button className="rounded-md bg-purple-600 hover:bg-purple-700 text-white px-4 py-2">
  Crear Debate
</button>

// Botón secundario
<button className="rounded-md bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white px-4 py-2">
  Cancelar
</button>
```

#### ✅ DESPUÉS (Variables CSS)

```tsx
// Botón primario (purple OK - es color de acento)
<button className="rounded-md bg-purple-600 hover:bg-purple-700 text-white px-4 py-2">
  Crear Debate
</button>

// Botón secundario
<button className="rounded-md bg-[var(--theme-bg-input)] hover:bg-purple-600 border border-[var(--theme-border)] hover:border-purple-600 text-[var(--theme-text-primary)] px-4 py-2">
  Cancelar
</button>
```

#### ✅ DESPUÉS (Componente Themed - RECOMENDADO)

```tsx
<ThemedButton variant="primary">
  Crear Debate
</ThemedButton>

<ThemedButton variant="secondary">
  Cancelar
</ThemedButton>
```

---

## ⚠️ EXCEPCIONES PERMITIDAS

### Colores de Acento (Purple/Cyan - OK hardcodear)

```tsx
// ✅ PERMITIDO - Colores de acento (purple theme)
<button className="bg-purple-600 hover:bg-purple-700 text-white">
  Acción Principal
</button>

// ✅ PERMITIDO - Iconos con color de acento
<Sparkles className="text-purple-400" />

// ✅ PERMITIDO - Fondos de mensaje de usuario
<div className="bg-purple-600 text-white rounded-lg p-3">
  Mensaje del usuario
</div>
```

**Regla:**
- **Purple/Cyan para acentos** → ✅ OK hardcodear
- **Fondos, bordes, texto base** → ❌ NUNCA hardcodear, usar variables

---

## 🔍 CÓMO DETECTAR VIOLACIONES

### Pre-commit Hook (Automático)

El hook `.husky/pre-commit` ejecuta automáticamente `scripts/check-code-violations.sh` que detecta:

```bash
✅ Detecta patrones prohibidos:
   - bg-white/[0-9]
   - text-white (excepto en accentos)
   - bg-black
   - border-white/[0-9]
   - text-gray-[0-9]

❌ Rechaza el commit si encuentra violaciones
```

### ESLint (Build time)

```json
// .eslintrc.cjs ya configurado
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "no-console": "error"
  }
}
```

---

## 📚 REFERENCIAS

### Variables CSS Disponibles

Ver archivo completo: `apps/web/src/app/globals.css`

```css
/* Texto */
--theme-text-primary: #ffffff (dark) | #0f172a (light)
--theme-text-secondary: #aebac1 (dark) | #64748b (light)
--theme-text-tertiary: #8696a0 (dark) | #94a3b8 (light)
--theme-text-muted: #667781 (dark) | #cbd5e1 (light)

/* Fondos */
--theme-bg-primary: #0b141a (dark) | #ffffff (light)
--theme-bg-secondary: #111b21 (dark) | #f8fafc (light)
--theme-bg-tertiary: #202c33 (dark) | #f1f5f9 (light)
--theme-bg-input: #2a3942 (dark) | #f8fafc (light)

/* Landing */
--theme-landing-bg: #0b141a (dark) | #ffffff (light)
--theme-landing-card: rgba(255,255,255,0.03) (dark) | rgba(241,245,249,0.8) (light)
--theme-landing-border: rgba(255,255,255,0.05) (dark) | rgba(148,163,184,0.3) (light)
--theme-landing-glass: rgba(255,255,255,0.02) (dark) | rgba(248,250,252,0.6) (light)

/* Bordes */
--theme-border: #2a3942 (dark) | #e2e8f0 (light)
```

### Componentes Themed Disponibles

```tsx
// Cards
import { ThemedCard } from '@/components/ui/themed-card'
<ThemedCard variant="default" | "landing" | "glass">
  <ThemedCard.Header>...</ThemedCard.Header>
  <ThemedCard.Title>...</ThemedCard.Title>
  <ThemedCard.Description>...</ThemedCard.Description>
  <ThemedCard.Content>...</ThemedCard.Content>
  <ThemedCard.Footer>...</ThemedCard.Footer>
</ThemedCard>

// Texto
import { ThemedText } from '@/components/ui/themed-text'
<ThemedText.Primary>...</ThemedText.Primary>
<ThemedText.Secondary>...</ThemedText.Secondary>
<ThemedText.Tertiary>...</ThemedText.Tertiary>
<ThemedText.Muted>...</ThemedText.Muted>

// Inputs
import { ThemedInput, ThemedTextarea, ThemedLabel, ThemedButton } from '@/components/ui/themed-input'
<ThemedLabel>...</ThemedLabel>
<ThemedInput placeholder="..." />
<ThemedTextarea placeholder="..." />
<ThemedButton variant="primary" | "secondary" | "ghost" | "destructive">...</ThemedButton>
```

---

## ✅ CHECKLIST DE MIGRACIÓN

Cuando encuentres código con colores hardcodeados:

- [ ] Identifica el tipo de elemento (card, texto, input, botón)
- [ ] Busca la variable CSS equivalente en `globals.css`
- [ ] Si existe componente themed, úsalo (RECOMENDADO)
- [ ] Si no, usa variable CSS con `bg-[var(--theme-*)]`
- [ ] Verifica visualmente en DARK y LIGHT mode
- [ ] Commit y el pre-commit hook verificará automáticamente

---

## 🎯 REGLA DE ORO

> **"Si un color puede cambiar entre light/dark mode, NUNCA lo hardcodees. Usa variables CSS de tema."**

**Ejemplos:**
- ✅ `bg-purple-600` → OK (color de acento, no cambia)
- ❌ `bg-white/5` → MAL (fondo, cambia entre modos)
- ✅ `text-purple-400` → OK (icono de acento)
- ❌ `text-white` → MAL (texto base, cambia entre modos)
- ✅ `bg-[var(--theme-landing-card)]` → PERFECTO (adaptativo)
- ✅ `<ThemedCard>` → IDEAL (componente wrapper)

---

_Última actualización: 26 Ene 2026_
_Versión: 1.0.0_
_Ver también: CLAUDE-CORE.md (Regla #6 y #13)_
