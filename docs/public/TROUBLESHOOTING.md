# 🛠️ Solución de Problemas - Guía Completa

**Resuelve los problemas más comunes de Wallie con soluciones paso a paso.**

---

## 🎯 Problemas Más Comunes

### Índice Rápido

1. [WhatsApp no conecta](#whatsapp-no-conecta)
2. [Código QR no funciona](#código-qr-no-funciona)
3. [Mensajes no se sincronizan](#mensajes-no-se-sincronizan)
4. [Wallie no responde automáticamente](#wallie-no-responde-automáticamente)
5. [No veo todos mis contactos](#no-veo-todos-mis-contactos)
6. [Estadísticas no se actualizan](#estadísticas-no-se-actualizan)
7. [Wallie responde cosas incorrectas](#wallie-responde-cosas-incorrectas)
8. [Olvidé mi contraseña](#olvidé-mi-contraseña)
9. [Mi cuenta está bloqueada](#mi-cuenta-está-bloqueada)
10. [Problemas de facturación](#problemas-de-facturación)

---

## 📱 WhatsApp

### WhatsApp no conecta

**Síntomas:**

- El código QR aparece pero no pasa nada al escanearlo
- Mensaje: "No se pudo establecer conexión"
- WhatsApp dice "Dispositivo no compatible"

#### Solución 1: Verificar Requisitos

```
✅ Checklist básico:

1. WhatsApp instalado y actualizado
   → Ve a App Store/Google Play
   → Busca "WhatsApp"
   → Si dice "Actualizar", hazlo

2. Teléfono con internet activo
   → Abre navegador en el móvil
   → Intenta cargar google.com
   → Si no carga, conecta WiFi o datos

3. Wallie en navegador actualizado
   → Chrome 90+, Firefox 88+, Safari 14+
   → Evita navegadores antiguos
```

#### Solución 2: Verificar Límite de Dispositivos

WhatsApp permite máximo **4 dispositivos vinculados**.

```
Pasos:
1. Abre WhatsApp en tu teléfono
2. Menú ⋮ → Dispositivos vinculados
3. Verás lista de dispositivos:

   📱 Mi PC - Activo ahora
   💻 WhatsApp Web - Hace 2h
   🖥️ Tablet - Hace 3 días
   📟 Otro - Hace 1 semana

4. Si tienes 4 ya, cierra sesión de uno:
   → Toca el dispositivo
   → "Cerrar sesión"

5. Vuelve a Wallie e intenta conectar
```

#### Solución 3: Limpiar Sesiones Antiguas

```
1. En WhatsApp → Dispositivos vinculados
2. Cierra sesión de TODOS los dispositivos
3. Espera 2 minutos
4. En Wallie → Configuración → WhatsApp
5. Click "Desconectar" (si aparece)
6. Refresca página (F5)
7. Click "Conectar WhatsApp"
8. Escanea código QR fresco
```

#### Solución 4: Verificar Permisos de Cámara

**Android:**

```
1. Configuración del teléfono
2. Apps → WhatsApp
3. Permisos → Cámara
4. Asegúrate está en "Permitir"
```

**iOS:**

```
1. Ajustes → Privacidad
2. Cámara
3. Busca WhatsApp
4. Activa el interruptor
```

#### Solución 5: Reiniciar Todo

```
1. Cierra WhatsApp completamente (forzar detención)
2. Cierra navegador de Wallie
3. Reinicia tu teléfono
4. Reinicia tu computadora
5. Abre primero WhatsApp (espera que cargue)
6. Luego abre Wallie
7. Intenta conectar de nuevo
```

#### Solución 6: Cambiar de Navegador

A veces el navegador bloquea la conexión.

```
✅ Navegadores recomendados:
- Chrome (mejor compatibilidad)
- Firefox
- Edge
- Safari (macOS)

❌ Evitar:
- Internet Explorer
- Opera Mini
- Navegadores móviles (usa PC/Mac)
```

---

### Código QR no funciona

**Síntomas:**

- El QR aparece pero WhatsApp dice "Código inválido"
- QR se actualiza constantemente
- Escaneas pero no pasa nada

#### Solución 1: QR Expirado

Los códigos QR expiran en **60 segundos**.

```
1. No preparescannear con antelación
2. Abre WhatsApp PRIMERO
3. Ve a "Vincular dispositivo"
4. LUEGO genera QR en Wallie
5. Escanea inmediatamente
```

#### Solución 2: Escaneo Incorrecto

```
✅ Cómo escanear correctamente:

1. Abre WhatsApp en tu teléfono
2. Android: Menú ⋮ → Dispositivos vinculados
   iOS: Configuración → Dispositivos vinculados
3. Toca "Vincular un dispositivo"
4. Apunta la cámara al QR de Wallie
5. Centra el QR en el recuadro
6. Mantén estable 2-3 segundos
7. NO hagas captura de pantalla del QR
```

#### Solución 3: Pantalla Muy Oscura/Clara

```
Si el QR no escanea:
1. Sube brillo de tu pantalla PC/Mac al 100%
2. Desactiva Night Mode / Luz nocturna
3. Si es de día, evita reflejo solar directo
4. Si es de noche, enciende lámpara detrás de ti
```

#### Solución 4: QR Distorsionado

```
Si el código QR se ve pixelado:
1. Refresca la página (F5)
2. Aumenta zoom del navegador (Ctrl + +)
3. Asegúrate pantalla no está duplicada/proyectando
```

---

### Mensajes no se sincronizan

**Síntomas:**

- Recibes mensaje en WhatsApp pero no aparece en Wallie
- Envías desde Wallie pero no llega al cliente
- Delay de 5+ minutos

#### Solución 1: Verificar Estado de Conexión

```
1. Ve a Configuración → WhatsApp
2. Busca indicador de estado:

   ✅ Conectado (verde)  → OK
   🔄 Sincronizando...   → Espera 2 min
   ❌ Desconectado (rojo) → Reconectar

3. Si está desconectado:
   → Click "Reconectar"
   → Escanea QR de nuevo
```

#### Solución 2: Teléfono Sin Internet

WhatsApp **requiere** que tu teléfono esté online.

```
Verifica:
1. Abre WhatsApp en tu teléfono
2. Intenta enviar mensaje a ti mismo
3. Si no envía → Problema de internet:

   ✅ Activa WiFi o datos móviles
   ✅ Verifica saldo/plan de datos
   ✅ Reinicia router WiFi si está lento
```

#### Solución 3: Modo Ahorro de Batería

Algunos modos extremos cierran WhatsApp en segundo plano.

**Android:**

```
1. Configuración → Batería
2. Optimización de batería
3. Busca WhatsApp
4. Selecciona "No optimizar"
```

**iOS:**

```
1. Ajustes → Batería
2. Modo de bajo consumo → Desactivar
   (O añade WhatsApp a excepciones)
```

#### Solución 4: WhatsApp Desactualizado

```
1. App Store / Google Play Store
2. Busca "WhatsApp"
3. Si hay actualización disponible, instala
4. Reinicia WhatsApp
5. Verifica sincronización en Wallie
```

#### Solución 5: Refresco Manual

```
Si solo un mensaje específico no sincroniza:

1. En Wallie, ve a esa conversación
2. Click botón "Refrescar" (↻)
3. O recarga la página completa (F5)
```

---

### Wallie no responde automáticamente

**Síntomas:**

- Llegan mensajes de clientes pero Wallie no contesta
- Wallie está en "modo sugerencias" cuando creías que estaba automático
- Solo respondes tú manualmente

#### Solución 1: Verificar Modo de Autonomía

```
1. Configuración → Agente IA → Autonomía
2. Verifica qué modo está activo:

   🟢 Automático: Wallie responde directamente
   🟡 Sugerencias: Wallie propone, TÚ apruebas
   🔴 Manual: Solo tú respondes

3. Si está en Manual o Sugerencias:
   → Cambia a "Automático"
   → Guarda cambios
```

#### Solución 2: Verificar Horario de Trabajo

Wallie **solo responde en tu horario configurado**.

```
1. Configuración → Horario de Trabajo
2. Verifica:

   Lun-Vie: 9:00 - 18:00
   Sáb-Dom: Cerrado

3. Si recibes mensaje fuera de horario:
   → Wallie NO responde (esperado)
   → Envía mensaje automático "Fuera de horario" (si lo configuraste)

4. Para probar:
   → Envíate mensaje DENTRO del horario
```

#### Solución 3: Cliente en Lista de "No Molestar"

```
Algunos contactos pueden estar marcados como "No automatizar".

1. Ve a la conversación del cliente
2. Mira la etiqueta/estado
3. Si dice "❌ No automatizar":
   → Edita contacto
   → Quita etiqueta "No molestar"
   → Guarda
```

#### Solución 4: Palabras Clave de Derivación

Si el mensaje del cliente tiene ciertas palabras, Wallie deriva a humano.

```
Palabras clave comunes:
- "urgente"
- "reclamación"
- "cancelar"
- "hablar con responsable"

Verifica:
1. Configuración → Agente IA → Palabras clave
2. Lista de palabras que disparan alerta
3. Si el mensaje del cliente las contiene:
   → Wallie te notifica
   → TÚ debes responder manualmente
```

#### Solución 5: Wallie Está Aprendiendo

En los primeros días, Wallie espera más aprobación.

```
Primeros 7 días:
- Wallie propone muchas respuestas
- Tú apruebas/corriges
- Es normal que no responda solo

Después de 20-30 conversaciones:
- Wallie gana confianza
- Empieza a responder más automáticamente
```

---

## 👥 Contactos y Conversaciones

### No veo todos mis contactos

**Síntomas:**

- Tienes 100 contactos en WhatsApp pero en Wallie solo aparecen 20
- Falta un cliente específico

#### Solución 1: Conversaciones Activas

Wallie **solo muestra contactos con conversaciones activas**.

```
Definición de "activo":
✅ Mensajes en últimos 30 días
✅ O marcado como "Importante"

Si un contacto no te escribe en 30 días:
→ Pasa a "Archivados"
→ Para verlo: Filtro "Mostrar archivados"
```

#### Solución 2: Sincronización Inicial Incompleta

```
Si acabas de conectar WhatsApp:

1. Sincronización inicial toma 5-10 min
2. Ve a Dashboard → Verás barra de progreso:
   "Sincronizando... 75% completado"

3. Espera a que llegue a 100%
4. Refresca página (F5)
```

#### Solución 3: Contacto No Guardado en WhatsApp

```
Si el contacto es solo un número (no tiene nombre):
→ Wallie lo importa como "Sin nombre"
→ Aparece al final de la lista

Para encontrarlo:
1. Clientes → Buscar por número
   Ejemplo: +34612345678
```

#### Solución 4: Refrescar Manualmente

```
1. Configuración → WhatsApp
2. Click "Sincronizar ahora"
3. Espera 2-3 minutos
4. Refresca Wallie (F5)
```

---

### No puedo eliminar un cliente

**Síntomas:**

- Click en "Eliminar" pero el cliente sigue ahí
- Mensaje de error al borrar

#### Solución: Soft Delete

Wallie hace "borrado suave" (datos se archivan, no se eliminan).

```
1. Abre el cliente
2. Click menú (⋮)
3. "Archivar" (en lugar de eliminar)
4. El cliente se oculta de la vista principal

Para eliminación permanente (GDPR):
1. Configuración → Datos → Exportar/Eliminar
2. Solicita "Borrado permanente de cliente X"
3. Se procesa en 48h
```

---

## 🤖 Inteligencia Artificial

### Wallie responde cosas incorrectas

**Síntomas:**

- Wallie da información equivocada sobre tu negocio
- Inventa precios o detalles
- Tono inapropiado

#### Solución 1: Entrenar con Correcciones

```
Cada vez que Wallie se equivoca:

1. NO apruebes la respuesta
2. Edita manualmente la respuesta correcta
3. Envía tu versión corregida
4. Wallie aprende de la corrección

Ejemplo:
Wallie dice: "Nuestro precio es 50€"
Correcto: 45€

→ Editas a "45€" antes de enviar
→ Wallie registra: "Siempre decir 45€, no 50€"
```

#### Solución 2: Configurar Base de Conocimiento

```
1. Configuración → Agente IA → Conocimiento
2. Añade información clave:

   Precios:
   - Plan Básico: 29€
   - Plan Pro: 49€

   Horario:
   - Lun-Vie: 9-18h

   Servicios:
   - Consultoría
   - Implementación

3. Guarda
4. Wallie priorizará esta información
```

#### Solución 3: Ajustar Tono de Voz

```
Si Wallie es demasiado formal/informal:

1. Configuración → Agente IA → Personalidad
2. Selecciona tono:

   😊 Amigable y cercano
   💼 Profesional y formal
   🎯 Directo y conciso
   ⚡ Energético

3. Prueba con "Ver ejemplos"
4. Guarda el que prefieras
```

#### Solución 4: Bloquear Temas

```
Si Wallie NO debe hablar de ciertos temas:

1. Configuración → Agente IA → Restricciones
2. Añade temas prohibidos:

   ❌ No hablar de política
   ❌ No dar consejos médicos
   ❌ No confirmar citas (solo sugerir)

3. Si cliente pregunta sobre tema prohibido:
   → Wallie responde: "Para esto, te conecto con mi equipo"
   → Te notifica
```

---

### Wallie tarda mucho en responder

**Síntomas:**

- Cliente envía mensaje
- Wallie tarda 2-5 minutos en contestar
- Debería ser casi instantáneo

#### Solución 1: Verificar Plan

```
Plan Starter:
- Respuestas en ~30-60 segundos
- Normal si hay cola

Plan Pro:
- Respuestas en ~5-15 segundos
- Prioridad en servidor

Si necesitas velocidad:
→ Upgrade a Pro
```

#### Solución 2: Complejidad del Mensaje

```
Mensajes simples: 5-10 seg
"Hola" → Respuesta rápida

Mensajes complejos: 20-40 seg
"Necesito presupuesto para proyecto X con características Y, Z..."
→ Wallie analiza más a fondo

Esto es esperado.
```

#### Solución 3: Verificar Estado del Sistema

```
1. Ve a status.wallie.pro
2. Verifica que todos los servicios están OK:

   ✅ API: Operacional
   ✅ IA: Operacional
   ✅ WhatsApp: Operacional

3. Si hay incidencia:
   → Espera resolución
   → Te notificamos por email
```

---

## 📊 Estadísticas

### Estadísticas no se actualizan

**Síntomas:**

- Dashboard muestra datos de hace 2 días
- Cerraste una venta pero no aparece en ingresos

#### Solución 1: Tiempo de Actualización

```
Las estadísticas se actualizan cada 15 minutos.

Si hiciste una acción hace menos de 15 min:
→ Espera 10-15 min más
→ Refresca página (F5)
```

#### Solución 2: Caché del Navegador

```
1. Ctrl + Shift + R (Windows/Linux)
   Cmd + Shift + R (Mac)
   → Fuerza recarga sin caché

2. O:
   Ctrl + F5 (forzar refresh)
```

#### Solución 3: Datos No Registrados

```
Para que aparezcan ingresos:

1. Marca conversación como "Ganada"
2. Ingresa "Valor del trato"
3. Guarda

Si no hiciste esto:
→ Wallie no sabe que cerraste venta
→ Ve a la conversación y márcala ahora
```

---

## 🔒 Cuenta y Seguridad

### Olvidé mi contraseña

```
1. Ve a wallie.pro/login
2. Click "¿Olvidaste tu contraseña?"
3. Ingresa tu email
4. Recibirás email con link de recuperación
5. Link válido por 1 hora
6. Click en link → Crea nueva contraseña
7. Inicia sesión

⚠️ Si no recibes email:
→ Revisa carpeta SPAM
→ Verifica que escribiste bien el email
→ Espera 5 minutos (a veces se demora)
→ Intenta "Reenviar email"
```

---

### Mi cuenta está bloqueada

**Síntomas:**

- "Tu cuenta ha sido temporalmente bloqueada"
- No puedes iniciar sesión

#### Causa 1: Demasiados Intentos Fallidos

```
Después de 5 intentos de contraseña incorrecta:
→ Cuenta bloqueada 30 minutos

Solución:
1. Espera 30 minutos
2. Usa "Olvidé contraseña" para resetear
```

#### Causa 2: Actividad Sospechosa

```
Si detectamos login desde país inusual:
→ Bloqueamos por seguridad

Solución:
1. Revisa email → Habrá notificación
2. Si fuiste tú:
   → Click "Sí, fui yo" en email
   → Cuenta desbloqueada

3. Si NO fuiste tú:
   → Click "No, no fui yo"
   → Cambia contraseña inmediatamente
   → Activa 2FA
```

#### Causa 3: Falta de Pago

```
Si tu tarjeta fue rechazada:
→ Cuenta limitada (solo lectura)

Solución:
1. Configuración → Facturación
2. Actualiza método de pago
3. Click "Reintentar pago"
4. Cuenta reactivada en 1 hora
```

---

## 💳 Facturación

### Mi tarjeta fue rechazada

#### Error: "Pago rechazado"

```
Causas comunes:
1. Fondos insuficientes
2. Tarjeta expirada
3. Límite de compras online
4. Tarjeta no habilitada para pagos internacionales

Soluciones:
1. Verifica saldo/límite con tu banco
2. Revisa fecha de expiración
3. Llama a tu banco:
   "Quiero autorizar pago a Wallie (Stripe)"
4. Intenta otra tarjeta
5. Usa PayPal como alternativa
```

#### Error: "3D Secure falló"

```
Tu banco requiere verificación adicional.

Solución:
1. Asegúrate de tener app del banco instalada
2. Autoriza notificación que llegue
3. O usa contraseña SMS que recibirás
4. Reintenta pago
```

---

### No recibí factura

```
Las facturas se envían automáticamente a tu email de registro.

Si no la recibes:
1. Revisa SPAM
2. Búsca email de noreply@wallie.pro
3. Verifica que tu email en perfil es correcto:
   → Configuración → Perfil → Email

4. Descarga manual:
   → Configuración → Facturación → Historial
   → Click en factura → Descargar PDF
```

---

### Quiero cambiar método de pago

```
1. Configuración → Facturación
2. Sección "Método de pago"
3. Click "Cambiar"
4. Ingresa nueva tarjeta
5. Guarda
6. La anterior se elimina automáticamente

⚠️ El cambio aplica desde próximo cobro
```

---

## 🌐 Problemas Técnicos

### La aplicación va lenta

```
1. Verifica tu conexión:
   → speedtest.net
   → Velocidad mínima: 5 Mbps

2. Cierra tabs innecesarias del navegador
   (Cada tab consume RAM)

3. Limpia caché:
   Chrome: Ctrl + Shift + Delete
   → Selecciona "Imágenes y archivos en caché"
   → Borra últimas 24 horas

4. Actualiza navegador a última versión

5. Intenta modo incógnito:
   Ctrl + Shift + N (Chrome)
   → Si va rápido = problema de extensión
```

---

### Error 500: Algo salió mal

```
Error del servidor (no es tu culpa).

Solución inmediata:
1. Refresca página (F5)
2. Si persiste, espera 2 minutos
3. Intenta de nuevo

Si persiste 10+ minutos:
1. Revisa status.wallie.pro
2. Si hay incidencia activa:
   → Nuestro equipo ya está trabajando

3. Si no hay incidencia reportada:
   → Contacta soporte@wallie.pro
   → Incluye: hora exacta, qué estabas haciendo
```

---

### No puedo subir archivos

```
Tamaño máximo:
- Plan Starter: 10 MB por archivo
- Plan Pro: 25 MB por archivo

Formatos permitidos:
✅ Imágenes: JPG, PNG, GIF
✅ Documentos: PDF, DOCX, XLSX
✅ Audio: MP3, M4A

Si error "Archivo muy grande":
→ Comprime imagen (tinypng.com)
→ O divide en 2 archivos
```

---

## 📞 Cuándo Contactar Soporte

### Contacta soporte si:

- ✅ Probaste todas las soluciones aquí
- ✅ El problema persiste >24 horas
- ✅ Afecta a tu negocio (no puedes trabajar)
- ✅ Ves error que no entiendes

### Cómo contactar:

```
📧 Email: soporte@wallie.pro
💬 Chat: wallie.pro (Plan Pro)
📞 Urgencias críticas: Solicita llamada en chat

Incluye SIEMPRE:
1. Email de tu cuenta
2. Descripción del problema
3. Pasos que ya intentaste
4. Captura de pantalla si aplica
5. Fecha/hora exacta si es error puntual
```

---

## ✅ Checklist "Mi Wallie No Funciona"

Antes de contactar soporte, verifica:

```
[ ] Refresqué la página (F5)
[ ] Cerré sesión y volví a entrar
[ ] Limpié caché del navegador
[ ] Probé en otro navegador
[ ] Verifiqué mi conexión a internet
[ ] Revisé status.wallie.pro
[ ] WhatsApp está conectado (ícono verde)
[ ] Estoy en mi horario de trabajo
[ ] No hay mensajes en SPAM
[ ] Intenté desde otro dispositivo
[ ] Leí esta guía completa

Si todo falla:
→ Contacta soporte con detalles
```

---

¡La mayoría de problemas tienen solución en minutos! 🚀
