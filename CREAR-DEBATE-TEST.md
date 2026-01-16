# 🧪 Cómo Crear el Debate de Prueba

## ⚠️ Problema Actual

Estás viendo un debate ANTIGUO (creado antes de los fixes) que tiene:
```
❌ OpenSource 0.0%
❌ A/B Testing 0.0%
❌ User Segmentation 0.0%
```

Para ver los fixes funcionando, necesitas crear un **DEBATE NUEVO**.

---

## 📝 Pasos para Crear Debate Nuevo

### 1. Iniciar Sesión
```
http://localhost:3000/login
```

**Si no tienes cuenta:**
- Opción A: Crear cuenta nueva
- Opción B: Usar credenciales existentes

### 2. Ir a Crear Nuevo Debate
Después de iniciar sesión:
```
http://localhost:3000/debates/new
```

### 3. Llenar el Formulario
**Pregunta de prueba (copiar exactamente):**
```
¿Qué es mejor ChatGPT o Perplexity para programar?
```

**Contexto (opcional, pero recomendado):**
```
Estamos evaluando herramientas de IA para desarrollo de software.
Necesitamos una que ayude con debugging, generación de código y
búsqueda de documentación.
```

### 4. Iniciar Debate
Click en "Iniciar Debate" o "Crear Debate"

### 5. Esperar Ejecución
El debate tardará aproximadamente 1-2 minutos. Verás:
- ✅ Fase "deliberando" expandida automáticamente
- ✅ Mensajes de múltiples agentes (Optimista, Analista, Crítico)
- ✅ Mensajes legibles (NO emojis comprimidos)
- ✅ Barra de progreso: "3 de ~5 agentes"

---

## ✅ Resultado Esperado

### En el Ranking Final deberías ver:

```
📊 Ranking Final de Opciones

1. ChatGPT - 65%
   ✅ Pros: Mejor comprensión de código, más modelos
   ❌ Cons: Sin búsqueda en tiempo real
   👥 Supporters: Optimista, Analista

2. Perplexity - 55%
   ✅ Pros: Búsqueda en tiempo real, fuentes citadas
   ❌ Cons: Menos potente en reasoning
   👥 Supporters: Crítico

3. Usar ambos según contexto - 75%
   ✅ Pros: Aprovecha fortalezas de cada uno
   ❌ Cons: Requiere más tiempo
   👥 Supporters: Sintetizador
```

### ❌ NO Deberías Ver:
```
1. OpenSource - 0.0%
2. A/B Testing - 0.0%
3. User Segmentation - 0.0%
```

---

## 🗂️ Ver Debates Existentes

Para ver lista de debates:
```
http://localhost:3000/debates
```

Ahí verás:
- Debates antiguos (con el ranking incorrecto)
- Debates nuevos (con el ranking correcto)

**Identifica el debate nuevo por:**
- ✅ Fecha de creación más reciente
- ✅ Pregunta: "¿Qué es mejor ChatGPT o Perplexity..."

---

## 🔍 Troubleshooting

### "No puedo iniciar sesión"
**Solución:** Crea una cuenta nueva en `/signup` o verifica credenciales

### "El debate no aparece en la lista"
**Solución:** Refresca la página (`F5`) o espera unos segundos

### "El debate falló"
**Solución:**
1. Verifica que las API keys estén configuradas (OPENAI_API_KEY, etc.)
2. Revisa los logs del servidor en la terminal
3. Intenta crear otro debate

### "Sigo viendo el ranking viejo"
**Solución:** Estás viendo un debate ANTIGUO. Busca el debate NUEVO en la lista por fecha de creación

---

## 🎯 URLs Rápidas

| Acción | URL |
|--------|-----|
| Login | http://localhost:3000/login |
| Nuevo Debate | http://localhost:3000/debates/new |
| Lista de Debates | http://localhost:3000/debates |
| Dashboard | http://localhost:3000/dashboard |

---

## 💡 Tip

Una vez creado el debate nuevo, **guarda su URL** para poder volver a verlo:
```
http://localhost:3000/debates/[id]
```

Ejemplo:
```
http://localhost:3000/debates/clx7k2m9p0000...
```
