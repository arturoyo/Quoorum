# 🔧 Instrucciones para Ejecutar Migraciones en Supabase

## ⚠️ IMPORTANTE

Estas migraciones deben ejecutarse **en orden** para evitar errores de sintaxis.

---

## 📋 Paso a Paso

### 1️⃣ Abrir SQL Editor de Supabase

1. Ve a: https://supabase.com/dashboard/project/kcopoxrrnvogcwdwnhjr
2. En el menú lateral izquierdo, haz click en **SQL Editor**
3. Haz click en **New query** (botón verde arriba a la derecha)

---

### 2️⃣ Ejecutar Paso 1 - Crear Función

1. Abre el archivo: `MIGRATIONS_STEP_BY_STEP.sql`
2. Copia **TODO** el contenido (Ctrl+A, Ctrl+C)
3. Pégalo en el SQL Editor de Supabase
4. Haz click en **Run** (botón verde abajo a la derecha)
5. **Resultado esperado:** Deberías ver:
   ```
   Success. No rows returned
   ```

✅ **Si ves "Success"**, continúa al siguiente paso.
❌ **Si ves error**, NO continúes. Copia el error y avísame.

---

### 3️⃣ Ejecutar Paso 2 - Políticas de TAGS

1. Abre el archivo: `MIGRATIONS_STEP_2_TAGS.sql`
2. Copia **TODO** el contenido
3. Pégalo en el SQL Editor (puedes usar la misma ventana, solo borra el SQL anterior)
4. Haz click en **Run**
5. **Resultado esperado:**
   ```
   Success. No rows returned
   ```

✅ **Si ves "Success"**, continúa al siguiente paso.
❌ **Si ves error**, detente y avísame.

---

### 4️⃣ Ejecutar Paso 3 - Políticas de Junction Tables

1. Abre el archivo: `MIGRATIONS_STEP_3_JUNCTION.sql`
2. Copia **TODO** el contenido
3. Pégalo en el SQL Editor
4. Haz click en **Run**
5. **Resultado esperado:**
   ```
   Success. No rows returned
   ```

✅ **Si ves "Success"**, continúa al paso de verificación.
❌ **Si ves error**, detente y avísame.

---

### 5️⃣ Verificar que Todo Funciona

1. Abre el archivo: `MIGRATIONS_STEP_4_VERIFY.sql`
2. Copia **TODO** el contenido
3. Pégalo en el SQL Editor
4. Haz click en **Run**
5. **Resultado esperado:** Deberías ver una tabla con resultados como:

   ```
   test                                  | result
   ------------------------------------- | ------
   Function app.current_user_id() exists | ✅ PASS

   table_name           | policy_count
   -------------------- | ------------
   Tags policies        | 4
   Client_tags policies | 3
   Conversation_tags policies | 3
   ```

   Y en los **Notices** (mensajes en la parte inferior):

   ```
   ✅ Function works correctly!
   ✅ All migrations completed!
   ```

---

## 🎉 Una vez completado

Si todos los pasos se ejecutaron sin errores:

1. **Cierra** el SQL Editor de Supabase
2. **Refresca** tu app en: https://dev.wallie.pro/dashboard
3. El error 500 de tags **debería desaparecer**
4. Deberías ver tus datos cargando correctamente

---

## ❌ Si algo falla

1. **NO continúes** con los siguientes pasos
2. **Copia el mensaje de error completo**
3. **Avísame** qué paso falló y cuál fue el error
4. NO ejecutes los archivos fuera de orden

---

## 📁 Archivos creados

- `MIGRATIONS_STEP_BY_STEP.sql` - Paso 1 (Función)
- `MIGRATIONS_STEP_2_TAGS.sql` - Paso 2 (Tags)
- `MIGRATIONS_STEP_3_JUNCTION.sql` - Paso 3 (Junction tables)
- `MIGRATIONS_STEP_4_VERIFY.sql` - Paso 4 (Verificación)
- `MIGRATIONS_INSTRUCTIONS.md` - Este archivo

---

**¿Listo?** 🚀 Comienza con el Paso 1 y avísame cuando termines!
