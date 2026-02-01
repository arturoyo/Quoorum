# 📋 ANÁLISIS DEL PANEL DE SETTINGS

## Secciones Actuales

El panel de settings tiene estas secciones:

1. ✅ **Perfil** - Información personal del usuario
2. ✅ **Uso** - Estadísticas de uso
3. ✅ **Facturación** - Plan y créditos (ver abajo)
4. ✅ **Equipo** - Gestión de equipo
5. ✅ **API Keys** - Claves de API
6. ✅ **Expertos Externos** - Gestión de expertos
7. ✅ **Profesionales** - Gestión de trabajadores
8. ✅ **Notificaciones** - Configuración de notificaciones
9. ✅ **Seguridad** - Configuración de seguridad

---

## 🔍 ANÁLISIS DETALLADO DE FACTURACIÓN

### Lo que TIENE actualmente:

```
Panel de Facturación
├─ Plan Actual (Free/Starter/Pro/Business)
│  └─ Botón "Gestionar" (abre modal de cambio de plan)
│  └─ Botón "Añadir créditos"
├─ Información de Créditos
│  ├─ Créditos gratis
│  ├─ Créditos mensuales (usado/total)
├─ Créditos de Actualización Diaria
│  ├─ Mostrar: 43 (valor HARDCODEADO ❌)
│  └─ Texto: "Actualizar a 300 a las 01:00 cada día"
└─ Actividad Reciente
   ├─ Tabla de facturas
   ├─ Fecha, Monto, Descargar
   └─ Botón "Ver todas las facturas" (abre Stripe)
```

### 🔴 PROBLEMAS ENCONTRADOS:

#### 1. **Créditos de Actualización Diaria - HARDCODEADO**
```tsx
<p className="text-2xl font-bold text-[var(--theme-text-primary)]">43</p>
```
❌ El "43" está hardcodeado en el componente
❌ No usa el valor real de `currentPlan?.dailyCredits`
❌ No se actualiza automáticamente
✅ **FÁCIL DE ARREGLAR**: Cambiar a `{currentPlan?.dailyCredits || 0}`

#### 2. **Créditos Pendientes NO se Muestran**
- ✅ Muestra créditos gratis
- ✅ Muestra créditos mensuales usados
- ❌ **NO muestra créditos que falta por usar** del mes actual
- ❌ **NO muestra progreso** (ej: 250 de 300 créditos usados)

#### 3. **Falta Historial de Transacciones**
- ✅ Muestra facturas (pagos al sistema)
- ❌ **NO muestra transacciones de créditos** (uso de IA)
- ❌ **NO hay detalles** de qué consumió cada crédito
- ❌ **NO hay filtros** por fecha o tipo

#### 4. **Información de Próxima Renovación**
- ✅ Muestra fecha de renovación
- ❌ **NO muestra cuándo llegan los créditos diarios**
- ❌ **NO hay notificación** de cuándo se agotarán

#### 5. **Estadísticas Faltantes**
- ❌ Promedio de créditos usados por día
- ❌ Proyección de créditos hasta fin de mes
- ❌ Comparativa con mes anterior
- ❌ Alertas de bajo saldo

#### 6. **Gestión de Créditos Limitada**
- ✅ Puede añadir créditos
- ✅ Puede cambiar de plan
- ❌ **NO puede ver el desglose** de dónde se gastan
- ❌ **NO hay forma** de ver recomendaciones de plan

---

## 🎯 CAMBIOS RECOMENDADOS (Prioridad)

### 🔴 CRÍTICO (Hazlo ya)

1. **Arreglar Hardcoded "43"**
   - Cambiar a `{currentPlan?.dailyCredits || 0}`
   - Tomar el valor del objeto `currentPlan`
   - Impacto: 5 minutos

2. **Mostrar Créditos Pendientes del Mes**
   - Calcular: `totalCredits - creditsUsed`
   - Mostrar: "250 / 300 créditos usados este mes"
   - Barra de progreso visual
   - Impacto: 10 minutos

### 🟡 IMPORTANTE (Próxima semana)

3. **Historial de Transacciones de Créditos**
   - Nueva tabla con últimas 10 transacciones
   - Columnas: Fecha, Descripción, Créditos Usados, Saldo Resultante
   - Endpoint: `api.billing.getCreditTransactions(limit: 10)`
   - Impacto: 30 minutos

4. **Estadísticas de Consumo**
   - Card con estadísticas básicas
   - Créditos usados hoy
   - Promedio diario
   - Días restantes del mes
   - Impacto: 20 minutos

### 🟢 BUENO (Futuro)

5. **Alertas de Bajo Saldo**
   - Warning si créditos < 100
   - Información de cuándo se agotan
   - Sugerencia de plan más grande

6. **Recomendación de Plan**
   - Analizar uso mensual
   - Sugerir plan más adecuado
   - Mostrar ahorro vs plan actual

---

## 📊 ESTRUCTURA DE DATOS DISPONIBLE

```typescript
// currentPlan (ya se tiene)
{
  tier: 'pro',
  credits: 5000,        // Total en cuenta
  dailyCredits: 50,     // Créditos diarios (ACTUALMENTE HARDCODEADO)
  subscription: {
    monthlyCredits: 5000,
    currentPeriodEnd: '2026-02-26T...'
  }
}

// Falta:
{
  creditsUsedThisMonth: 250,    // Ya disponible en backend
  creditsRemainingThisMonth: 4750,
  creditTransactions: [
    {
      date: '2026-01-27',
      description: 'Debate synthesis',
      creditsUsed: 50,
      balanceAfter: 4950
    }
  ]
}
```

---

## 🔧 CÓDIGO A CAMBIAR

### Cambio 1: Arreglar Hardcodeado "43"

**Archivo:** `apps/web/src/components/settings/sections/billing-section.tsx`

**Línea actual (215-216):**
```tsx
<p className="text-2xl font-bold text-[var(--theme-text-primary)]">43</p>
```

**Cambiar a:**
```tsx
<p className="text-2xl font-bold text-[var(--theme-text-primary)]">
  {currentPlan?.dailyCredits || 0}
</p>
```

**Impacto:** ⭐ MÁS IMPORTANTE - El "43" no tiene sentido en la UI

---

### Cambio 2: Añadir Barra de Progreso de Créditos

**Después de la sección de Créditos, agregar:**
```tsx
<div className="space-y-2">
  <p className="text-sm text-[var(--theme-text-tertiary)]">Progreso este mes</p>
  <div className="w-full bg-slate-700 rounded-full h-2">
    <div 
      className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
      style={{ width: `${(monthlyCredits / (currentPlan?.credits || 1)) * 100}%` }}
    />
  </div>
  <p className="text-xs text-[var(--theme-text-tertiary)]">
    {monthlyCredits} / {currentPlan?.credits || 0} créditos usados
  </p>
</div>
```

---

## 📝 RESUMEN DE FALTAS

| Funcionalidad | Tiene | Falta | Prioridad |
|---|---|---|---|
| Plan actual | ✅ | - | - |
| Créditos totales | ✅ | - | - |
| Créditos diarios | ❌ Hardcodeado | Usar valor real | 🔴 |
| Progreso mensual | ❌ | Barra visual | 🟡 |
| Historial transacciones | ❌ | Tabla completa | 🟡 |
| Estadísticas uso | ❌ | Card resumen | 🟡 |
| Alertas bajo saldo | ❌ | Warning toast | 🟢 |
| Recomendación plan | ❌ | AI suggestion | 🟢 |

---

## 💡 COMPARATIVA CON ADMIN PANEL

**Admin Panel (`/admin/users`):**
- 9 operaciones completas
- Gestión total de usuarios
- Control de créditos (add, deduct, set)

**Settings Panel (`/settings/billing`):**
- Solo ver información
- Añadir créditos (pagar)
- Cambiar plan
- Ver facturas

**Lo que FALTA en Settings:**
- Visualización clara del consumo
- Historial detallado de transacciones
- Estadísticas de uso
- Alertas y recomendaciones

---

## 🚀 PLAN DE ACCIÓN

### Fase 1 (Hoy) - 5 minutos
- [x] Identificar hardcodeado "43"
- [ ] Arreglar con `currentPlan?.dailyCredits`
- [ ] Test en dev

### Fase 2 (Hoy) - 10 minutos
- [ ] Añadir barra de progreso
- [ ] Mostrar progreso mensual
- [ ] Test visual

### Fase 3 (Mañana) - 30 minutos
- [ ] Crear endpoint `getCreditTransactions`
- [ ] Implementar tabla de historial
- [ ] Documentar

### Fase 4 (Próxima semana)
- [ ] Estadísticas avanzadas
- [ ] Alertas de bajo saldo
- [ ] Recomendación de plan
