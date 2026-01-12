# Wallie Migration Assistant
## Propuesta de Feature para Roadmap

**Versión:** 1.0
**Fecha:** 2 de Diciembre 2025
**Autor:** Documentación técnica Wallie.ai
**Prioridad propuesta:** ALTA - Diferenciador competitivo único

---

## 1. Resumen Ejecutivo

### El Problema
WhatsApp Coexistence (la función de Meta que permite usar WhatsApp Business App y API simultáneamente) **solo sincroniza 6 meses de historial**. Esto significa que:

- Un autónomo con 3 años de relación con clientes **pierde 2.5 años de contexto**
- Las IAs de competidores solo "conocen" conversaciones recientes
- Patrones de compra estacionales, preferencias históricas y contexto de negociaciones pasadas **se pierden**

### La Oportunidad
**Ningún competidor ofrece solución a este problema.** Wallie puede ser el único asistente de ventas WhatsApp que:

> *"Aprende de TODA tu historia con clientes, no solo los últimos 6 meses"*

### Impacto Estimado
| Métrica | Sin Migration Assistant | Con Migration Assistant |
|---------|------------------------|------------------------|
| Contexto disponible | 6 meses | **Ilimitado** |
| Precisión personalización | ~60% | **~95%** |
| Tiempo onboarding IA | Semanas | **Horas** |
| Diferenciación vs competencia | Igual a todos | **ÚNICO** |

---

## 2. Análisis del Problema

### 2.1 Limitaciones de WhatsApp Coexistence
```
┌─────────────────────────────────────────────────────────────┐
│  COEXISTENCE: LO QUE SE SINCRONIZA                          │
├─────────────────────────────────────────────────────────────┤
│  ✅ Contactos (todos)                                       │
│  ✅ Mensajes últimos 6 meses                                │
│  ✅ Mensajes nuevos (bidireccional)                         │
├─────────────────────────────────────────────────────────────┤
│  COEXISTENCE: LO QUE NO SE SINCRONIZA                       │
├─────────────────────────────────────────────────────────────┤
│  ❌ Historial > 6 meses                                     │
│  ❌ Grupos                                                   │
│  ❌ Mensajes efímeros/desaparecen                           │
│  ❌ Broadcast lists (se vuelven read-only)                  │
│  ❌ Medios antiguos (fotos, audios, docs)                   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Impacto en el Usuario Objetivo (Autónomo español)

**Perfil típico:**
- 150-500 contactos de clientes
- 2-5 años usando WhatsApp Business
- Conversaciones con contexto de presupuestos, preferencias, historial de compras

**Lo que pierde con límite 6 meses:**
- Patrones estacionales (ej: "este cliente siempre pide en septiembre")
- Historial de negociaciones previas
- Preferencias expresadas hace tiempo
- Contexto de relación (cumpleaños mencionados, familia, etc.)

### 2.3 Análisis Competitivo

| Competidor | Importa historial completo | Solución ofrecida |
|------------|---------------------------|-------------------|
| Clientify | ❌ | Solo 6 meses Coexistence |
| Respond.io | ❌ | Solo 6 meses Coexistence |
| Keybe AI | ❌ | Ninguna |
| Wati | ❌ | Solo 6 meses Coexistence |
| SleekFlow | ❌ | Solo 6 meses Coexistence |
| **Wallie.ai** | ✅ | **Migration Assistant** |

---

## 3. Propuesta de Solución

### 3.1 Concepto: "Wallie Migration Assistant"

Una herramienta que permite al usuario importar TODO su historial de WhatsApp a Wallie, para que la IA tenga contexto completo desde el primer día.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   📱 WhatsApp del usuario                                   │
│      (años de conversaciones)                               │
│              │                                              │
│              ▼                                              │
│   ┌─────────────────────┐                                   │
│   │ WALLIE MIGRATION    │                                   │
│   │    ASSISTANT        │                                   │
│   │                     │                                   │
│   │ • Exporta chats     │                                   │
│   │ • Parsea contenido  │                                   │
│   │ • Extrae contexto   │                                   │
│   │ • Genera embeddings │                                   │
│   └─────────────────────┘                                   │
│              │                                              │
│              ▼                                              │
│   🧠 Wallie AI con memoria completa                         │
│      "Sé que Juan prefiere entregas los martes              │
│       desde hace 2 años..."                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Modos de Operación

#### Modo A: Exportación Manual Asistida (MVP)
- Usuario exporta chats manualmente desde WhatsApp
- Wallie procesa los archivos `.txt` automáticamente
- Menor complejidad técnica, más fricción para usuario

#### Modo B: Exportación Semi-Automatizada
- scrcpy para ver móvil en PC
- Scripts automatizan clicks de exportación
- Menor fricción, mayor complejidad técnica

#### Modo C: Acceso a Backup (Avanzado)
- Extracción desde backup Google Drive/iCloud
- Requiere manejo de encriptación
- Máxima automatización, complejidad legal/técnica

---

## 4. Especificación Técnica

### 4.1 Arquitectura General

```
┌──────────────────────────────────────────────────────────────────┐
│                    WALLIE MIGRATION ASSISTANT                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │   CAPTURE   │───▶│   PROCESS   │───▶│      INTEGRATE      │  │
│  │   MODULE    │    │   ENGINE    │    │       MODULE        │  │
│  └─────────────┘    └─────────────┘    └─────────────────────┘  │
│        │                  │                      │               │
│        ▼                  ▼                      ▼               │
│  • Export manual    • Parser .txt         • Vector embeddings   │
│  • scrcpy bridge    • NLP extraction      • Cliente profiles    │
│  • Backup access    • Entity detection    • Memory system       │
│                     • Timeline build      • Style learning      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 4.2 Módulo de Captura

#### 4.2.1 Exportación Manual (Modo A)
```
Flujo usuario:
1. WhatsApp > Chat > ⋮ > Más > Exportar chat
2. Seleccionar "Sin archivos multimedia" o "Incluir multimedia"
3. Guardar en carpeta local
4. Arrastrar archivos a Wallie web

Limitaciones conocidas:
- ~40,000 mensajes por export (sin media)
- ~10,000 mensajes por export (con media)
- Proceso repetitivo si muchos contactos
```

#### 4.2.2 scrcpy Bridge (Modo B)
```python
# Dependencias
# pip install pure-python-adb
# scrcpy debe estar instalado

class ScrcpyBridge:
    """
    Automatiza exportación de chats via scrcpy + ADB
    """

    def __init__(self):
        self.adb = AdbClient(host="127.0.0.1", port=5037)
        self.device = None

    def connect(self):
        """Conecta al dispositivo Android"""
        devices = self.adb.devices()
        if devices:
            self.device = devices[0]
            return True
        return False

    def get_whatsapp_contacts(self):
        """Extrae lista de contactos de WhatsApp"""
        # Accede a la base de datos de contactos via ADB
        # Requiere permisos apropiados
        pass

    def export_chat(self, contact_id):
        """Automatiza clicks para exportar un chat específico"""
        # Secuencia de taps automatizados
        # 1. Abrir chat
        # 2. Menú > Más > Exportar
        # 3. Sin multimedia
        # 4. Guardar
        pass

    def batch_export(self, contact_ids):
        """Exporta múltiples chats secuencialmente"""
        for contact_id in contact_ids:
            self.export_chat(contact_id)
            time.sleep(2)  # Pausa entre exports
```

### 4.3 Módulo de Procesamiento

#### 4.3.1 Parser de Exports WhatsApp
```python
import re
from datetime import datetime
from dataclasses import dataclass
from typing import List, Optional

@dataclass
class WhatsAppMessage:
    timestamp: datetime
    sender: str
    content: str
    is_user: bool  # True si es el dueño del teléfono
    message_type: str  # text, media, system

@dataclass
class WhatsAppChat:
    contact_name: str
    contact_phone: Optional[str]
    messages: List[WhatsAppMessage]
    first_message_date: datetime
    last_message_date: datetime
    total_messages: int
    user_messages: int
    contact_messages: int

class WhatsAppExportParser:
    """
    Parser para archivos de exportación de WhatsApp
    Formatos soportados:
    - [DD/MM/YY, HH:MM:SS] Sender: Message
    - [DD/MM/YYYY, HH:MM:SS] Sender: Message
    - DD/MM/YY, HH:MM - Sender: Message
    """

    PATTERNS = [
        # Formato español: [15/03/23, 10:30:45]
        r'\[(\d{1,2}/\d{1,2}/\d{2,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?)\]\s*([^:]+):\s*(.+)',
        # Formato sin corchetes
        r'(\d{1,2}/\d{1,2}/\d{2,4}),\s*(\d{1,2}:\d{2})\s*-\s*([^:]+):\s*(.+)',
    ]

    SYSTEM_MESSAGES = [
        'Los mensajes y las llamadas están cifrados',
        'creó el grupo',
        'añadió a',
        'cambió el asunto',
        'cambió el ícono',
        'salió del grupo',
        'eliminó a',
        'ahora es administrador',
        'Mensaje eliminado',
        '<Multimedia omitido>',
        'Ubicación:',
        'Contacto:',
    ]

    def __init__(self, user_identifier: str = None):
        """
        user_identifier: Nombre o número del usuario para identificar
                        sus mensajes vs los del contacto
        """
        self.user_identifier = user_identifier

    def parse_file(self, file_path: str) -> WhatsAppChat:
        """Parsea un archivo de exportación completo"""
        messages = []
        current_message = None

        with open(file_path, 'r', encoding='utf-8') as f:
            for line in f:
                parsed = self._parse_line(line)
                if parsed:
                    if current_message:
                        messages.append(current_message)
                    current_message = parsed
                elif current_message:
                    # Línea de continuación del mensaje anterior
                    current_message.content += '\n' + line.strip()

        if current_message:
            messages.append(current_message)

        return self._build_chat(messages, file_path)

    def _parse_line(self, line: str) -> Optional[WhatsAppMessage]:
        """Intenta parsear una línea como mensaje"""
        for pattern in self.PATTERNS:
            match = re.match(pattern, line.strip())
            if match:
                date_str, time_str, sender, content = match.groups()

                # Detectar tipo de mensaje
                msg_type = 'text'
                if any(sys_msg in content for sys_msg in self.SYSTEM_MESSAGES):
                    msg_type = 'system'
                elif '<Multimedia omitido>' in content:
                    msg_type = 'media'

                # Determinar si es mensaje del usuario
                is_user = False
                if self.user_identifier:
                    is_user = self.user_identifier.lower() in sender.lower()

                return WhatsAppMessage(
                    timestamp=self._parse_datetime(date_str, time_str),
                    sender=sender.strip(),
                    content=content.strip(),
                    is_user=is_user,
                    message_type=msg_type
                )
        return None

    def _parse_datetime(self, date_str: str, time_str: str) -> datetime:
        """Parsea fecha y hora en varios formatos"""
        formats = [
            '%d/%m/%y %H:%M:%S',
            '%d/%m/%Y %H:%M:%S',
            '%d/%m/%y %H:%M',
            '%d/%m/%Y %H:%M',
        ]
        dt_str = f"{date_str} {time_str}"
        for fmt in formats:
            try:
                return datetime.strptime(dt_str, fmt)
            except ValueError:
                continue
        raise ValueError(f"Cannot parse datetime: {dt_str}")

    def _build_chat(self, messages: List[WhatsAppMessage],
                    file_path: str) -> WhatsAppChat:
        """Construye objeto WhatsAppChat desde lista de mensajes"""
        # Extraer nombre del contacto del nombre del archivo
        contact_name = file_path.split('/')[-1].replace('.txt', '')
        contact_name = re.sub(r'Chat de WhatsApp con ', '', contact_name)

        text_messages = [m for m in messages if m.message_type == 'text']

        return WhatsAppChat(
            contact_name=contact_name,
            contact_phone=None,  # Extraer si está disponible
            messages=messages,
            first_message_date=messages[0].timestamp if messages else None,
            last_message_date=messages[-1].timestamp if messages else None,
            total_messages=len(messages),
            user_messages=len([m for m in messages if m.is_user]),
            contact_messages=len([m for m in messages if not m.is_user])
        )
```

#### 4.3.2 Extracción de Contexto con NLP
```python
from typing import Dict, List, Any
import json

class ContextExtractor:
    """
    Extrae información relevante de negocios de conversaciones
    """

    def __init__(self, llm_client):
        self.llm = llm_client

    def extract_client_profile(self, chat: WhatsAppChat) -> Dict[str, Any]:
        """
        Analiza conversación completa y extrae perfil del cliente
        """
        # Preparar resumen de conversación para LLM
        conversation_summary = self._prepare_summary(chat)

        prompt = f"""
        Analiza esta conversación de WhatsApp entre un profesional/autónomo
        y su cliente. Extrae la siguiente información:

        CONVERSACIÓN:
        {conversation_summary}

        EXTRAER (formato JSON):
        {{
            "nombre_cliente": "...",
            "tipo_relacion": "cliente_habitual|cliente_ocasional|prospecto",
            "productos_servicios_interes": ["..."],
            "preferencias_detectadas": ["..."],
            "patron_comunicacion": {{
                "dias_preferidos": ["..."],
                "horarios_activos": ["..."],
                "estilo": "formal|informal|mixto"
            }},
            "historial_compras_mencionadas": ["..."],
            "temas_sensibles": ["..."],
            "puntos_dolor": ["..."],
            "nivel_precio_tolerado": "bajo|medio|alto|desconocido",
            "decisor": true/false,
            "urgencia_tipica": "alta|media|baja",
            "mejor_momento_contacto": "...",
            "notas_personales": ["cumpleaños mencionado", "tiene hijos", etc],
            "resumen_relacion": "..."
        }}

        Solo incluye información que puedas inferir con confianza.
        Responde SOLO con el JSON, sin explicaciones.
        """

        response = self.llm.complete(prompt)
        return json.loads(response)

    def extract_communication_style(self, chat: WhatsAppChat) -> Dict[str, Any]:
        """
        Analiza el estilo de comunicación del USUARIO (no del cliente)
        para que Wallie pueda imitarlo
        """
        user_messages = [m.content for m in chat.messages if m.is_user]
        sample = user_messages[:50]  # Muestra representativa

        prompt = f"""
        Analiza estos mensajes escritos por un profesional a su cliente.
        Extrae su ESTILO de comunicación para poder imitarlo:

        MENSAJES DEL PROFESIONAL:
        {json.dumps(sample, ensure_ascii=False, indent=2)}

        EXTRAER (formato JSON):
        {{
            "nivel_formalidad": 1-10,
            "usa_emojis": true/false,
            "emojis_frecuentes": ["😊", "👍"],
            "saludo_tipico": "Hola!", "Buenos días,",
            "despedida_tipica": "Un saludo", "Gracias!",
            "longitud_mensajes": "cortos|medios|largos",
            "usa_audios": true/false,
            "responde_rapido": true/false,
            "patrones_lenguaje": ["usa diminutivos", "tutea", etc],
            "muletillas": ["vale", "perfecto", etc],
            "tono_general": "cercano|profesional|mixto",
            "ejemplos_respuestas_tipicas": [
                {{"situacion": "cliente pregunta precio", "respuesta_tipica": "..."}},
                {{"situacion": "cliente pide descuento", "respuesta_tipica": "..."}}
            ]
        }}
        """

        response = self.llm.complete(prompt)
        return json.loads(response)

    def _prepare_summary(self, chat: WhatsAppChat) -> str:
        """Prepara resumen de conversación para análisis"""
        # Limitar a mensajes de texto, últimos 200 para no exceder tokens
        text_msgs = [m for m in chat.messages if m.message_type == 'text']

        # Tomar muestra representativa: primeros 50, últimos 100, y 50 del medio
        if len(text_msgs) > 200:
            sample = text_msgs[:50] + text_msgs[len(text_msgs)//2-25:len(text_msgs)//2+25] + text_msgs[-100:]
        else:
            sample = text_msgs

        lines = []
        for msg in sample:
            prefix = "[YO]" if msg.is_user else "[CLIENTE]"
            date = msg.timestamp.strftime("%d/%m/%y")
            lines.append(f"{date} {prefix}: {msg.content[:200]}")

        return "\n".join(lines)
```

### 4.4 Módulo de Integración

#### 4.4.1 Generación de Embeddings y Memoria
```python
from typing import List
import numpy as np

class MemoryIntegrator:
    """
    Integra contexto extraído en el sistema de memoria de Wallie
    """

    def __init__(self, embedding_model, vector_store):
        self.embedder = embedding_model
        self.vector_db = vector_store

    def create_client_memory(self,
                             chat: WhatsAppChat,
                             profile: Dict,
                             style: Dict) -> str:
        """
        Crea entrada de memoria persistente para un cliente
        """
        memory_id = f"client_{chat.contact_phone or chat.contact_name}"

        # Documento estructurado para búsqueda semántica
        memory_doc = {
            "id": memory_id,
            "type": "client_profile",
            "contact_name": chat.contact_name,
            "contact_phone": chat.contact_phone,
            "relationship_start": chat.first_message_date.isoformat(),
            "last_interaction": chat.last_message_date.isoformat(),
            "total_interactions": chat.total_messages,
            "profile": profile,
            "communication_style": style,
            "searchable_text": self._build_searchable_text(profile)
        }

        # Generar embedding del perfil completo
        embedding = self.embedder.embed(memory_doc["searchable_text"])

        # Almacenar en vector store
        self.vector_db.upsert(
            id=memory_id,
            embedding=embedding,
            metadata=memory_doc
        )

        return memory_id

    def index_conversation_chunks(self, chat: WhatsAppChat) -> List[str]:
        """
        Indexa fragmentos de conversación para búsqueda contextual
        """
        chunk_ids = []

        # Dividir conversación en chunks de ~20 mensajes
        messages = [m for m in chat.messages if m.message_type == 'text']
        chunk_size = 20

        for i in range(0, len(messages), chunk_size):
            chunk = messages[i:i+chunk_size]

            chunk_text = "\n".join([
                f"{'[Yo]' if m.is_user else '[Cliente]'}: {m.content}"
                for m in chunk
            ])

            chunk_id = f"conv_{chat.contact_name}_{i}"

            embedding = self.embedder.embed(chunk_text)

            self.vector_db.upsert(
                id=chunk_id,
                embedding=embedding,
                metadata={
                    "type": "conversation_chunk",
                    "contact_name": chat.contact_name,
                    "date_start": chunk[0].timestamp.isoformat(),
                    "date_end": chunk[-1].timestamp.isoformat(),
                    "text": chunk_text
                }
            )

            chunk_ids.append(chunk_id)

        return chunk_ids

    def _build_searchable_text(self, profile: Dict) -> str:
        """Construye texto optimizado para búsqueda semántica"""
        parts = [
            f"Cliente: {profile.get('nombre_cliente', 'Desconocido')}",
            f"Relación: {profile.get('tipo_relacion', '')}",
            f"Intereses: {', '.join(profile.get('productos_servicios_interes', []))}",
            f"Preferencias: {', '.join(profile.get('preferencias_detectadas', []))}",
            f"Resumen: {profile.get('resumen_relacion', '')}"
        ]
        return " | ".join(parts)
```

### 4.5 Interfaz de Usuario

#### 4.5.1 Web Interface (React Component)
```typescript
// components/MigrationAssistant.tsx

interface MigrationState {
  step: 'intro' | 'upload' | 'processing' | 'review' | 'complete';
  files: File[];
  progress: number;
  processedChats: ProcessedChat[];
  errors: string[];
}

interface ProcessedChat {
  contactName: string;
  messageCount: number;
  dateRange: string;
  profile: ClientProfile;
  status: 'pending' | 'processing' | 'complete' | 'error';
}

const MigrationAssistant: React.FC = () => {
  const [state, setState] = useState<MigrationState>({
    step: 'intro',
    files: [],
    progress: 0,
    processedChats: [],
    errors: []
  });

  return (
    <div className="migration-assistant">
      {state.step === 'intro' && (
        <IntroStep onStart={() => setState({...state, step: 'upload'})} />
      )}

      {state.step === 'upload' && (
        <UploadStep
          onFilesSelected={(files) => handleUpload(files)}
          onBack={() => setState({...state, step: 'intro'})}
        />
      )}

      {state.step === 'processing' && (
        <ProcessingStep
          progress={state.progress}
          currentFile={state.processedChats.find(c => c.status === 'processing')}
        />
      )}

      {state.step === 'review' && (
        <ReviewStep
          chats={state.processedChats}
          onConfirm={() => finalizeImport()}
          onEdit={(chatId) => editProfile(chatId)}
        />
      )}

      {state.step === 'complete' && (
        <CompleteStep
          summary={{
            totalChats: state.processedChats.length,
            totalMessages: state.processedChats.reduce((sum, c) => sum + c.messageCount, 0),
            dateRange: calculateTotalDateRange(state.processedChats)
          }}
        />
      )}
    </div>
  );
};

const IntroStep: React.FC<{onStart: () => void}> = ({onStart}) => (
  <div className="intro-step">
    <h2>🚀 Importa tu historial completo de WhatsApp</h2>

    <div className="benefits">
      <div className="benefit">
        <span className="icon">🧠</span>
        <h3>Wallie aprenderá de TODA tu historia</h3>
        <p>No solo los últimos 6 meses</p>
      </div>

      <div className="benefit">
        <span className="icon">⚡</span>
        <h3>Personalización desde el día 1</h3>
        <p>Conocerá el contexto de cada cliente</p>
      </div>

      <div className="benefit">
        <span className="icon">🔒</span>
        <h3>100% privado</h3>
        <p>Tus datos nunca salen de tu cuenta</p>
      </div>
    </div>

    <div className="steps-preview">
      <h3>¿Cómo funciona?</h3>
      <ol>
        <li>Exporta tus chats desde WhatsApp (te guiamos)</li>
        <li>Sube los archivos aquí</li>
        <li>Wallie analiza y aprende</li>
        <li>¡Listo! Wallie conoce a tus clientes</li>
      </ol>
    </div>

    <button className="primary" onClick={onStart}>
      Empezar importación
    </button>

    <p className="time-estimate">
      ⏱️ Tiempo estimado: 15-30 minutos según número de clientes
    </p>
  </div>
);
```

---

## 5. Fases de Implementación

### Fase 1: MVP - Exportación Manual (Semanas 1-3)
**Objetivo:** Validar concepto con usuarios early-adopter

| Tarea | Descripción | Esfuerzo |
|-------|-------------|----------|
| Parser WhatsApp | Implementar parser multi-formato | 3 días |
| UI Upload | Componente drag-and-drop | 2 días |
| Extractor básico | Extracción de contexto con LLM | 3 días |
| Integración memoria | Conectar con sistema memoria Wallie | 2 días |
| Tutorial in-app | Guía paso a paso exportación | 2 días |
| Testing | Pruebas con exports reales | 3 días |

**Entregable:** Usuario puede subir archivos .txt y Wallie aprende de ellos

### Fase 2: Mejoras UX (Semanas 4-5)
**Objetivo:** Reducir fricción del proceso

| Tarea | Descripción | Esfuerzo |
|-------|-------------|----------|
| Batch upload | Subir múltiples archivos de golpe | 2 días |
| Progress tracking | Barra progreso detallada | 1 día |
| Edición perfiles | UI para corregir perfiles extraídos | 3 días |
| Preview sistema | Ver qué "aprendió" Wallie antes de confirmar | 2 días |
| Video tutorial | Screencast del proceso completo | 1 día |

**Entregable:** Experiencia fluida de importación masiva

### Fase 3: Automatización Parcial (Semanas 6-8)
**Objetivo:** Reducir trabajo manual del usuario

| Tarea | Descripción | Esfuerzo |
|-------|-------------|----------|
| scrcpy integración | Bridge para visualizar móvil | 5 días |
| Detector contactos | Listar contactos WhatsApp vía ADB | 3 días |
| Export automatizado | Scripts de automatización clicks | 5 días |
| Selector inteligente | Sugerir qué chats importar primero | 2 días |

**Entregable:** Usuario solo selecciona, Wallie exporta automáticamente

### Fase 4: Avanzado (Semanas 9-12) - Opcional
**Objetivo:** Máxima automatización para usuarios técnicos

| Tarea | Descripción | Esfuerzo |
|-------|-------------|----------|
| Backup parser | Investigar desencripción backups | 5 días |
| Media processing | Extraer texto de imágenes/audios | 5 días |
| Sync incremental | Actualizar solo nuevos mensajes | 3 días |
| API para integradores | Endpoints para importación programática | 3 días |

---

## 6. Integración con Roadmap Existente

### 6.1 Dependencias
```
Migration Assistant DEPENDE DE:
├── Sistema de memoria Wallie (debe existir)
├── Vector store configurado (Supabase pgvector)
├── LLM para extracción (Claude API)
└── UI base de Wallie (dashboard)

Migration Assistant ALIMENTA A:
├── Style AI - Aprende estilo del usuario
├── Predictive AI - Patrones de clientes
├── Cliente Memory - Contexto por contacto
└── Emotional Detection - Historial emocional
```

### 6.2 Posición en Roadmap

**Propuesta: Insertar en Phase 2 - Post-Launch Quick Wins**

```
PHASE 2: Quick Wins (Semanas 5-8)
├── [EXISTENTE] Recordatorios inteligentes
├── [EXISTENTE] Detección oportunidades
├── [NUEVO] Migration Assistant MVP ← AQUÍ
├── [EXISTENTE] Templates personalizados
└── [EXISTENTE] Dashboard básico
```

**Justificación:**
- No bloquea MVP launch
- Aumenta valor percibido inmediatamente post-launch
- Diferenciador único en demos y marketing
- Early adopters más satisfechos

### 6.3 Impacto en Otras Features

| Feature Existente | Impacto de Migration Assistant |
|-------------------|--------------------------------|
| Style AI | +++ Más datos para aprender estilo |
| Predictive AI | +++ Patrones históricos disponibles |
| Emotional Detection | ++ Historial emocional por cliente |
| Smart Follow-up | ++ Contexto de relación más rico |
| Cliente Scoring | + Datos históricos para scoring |

---

## 7. Métricas de Éxito

### 7.1 KPIs de Adopción
| Métrica | Target MVP | Target 3 meses |
|---------|------------|----------------|
| % usuarios que inician importación | 30% | 60% |
| % usuarios que completan importación | 20% | 50% |
| Promedio chats importados por usuario | 20 | 50 |
| Promedio mensajes importados por usuario | 5,000 | 15,000 |

### 7.2 KPIs de Calidad
| Métrica | Target |
|---------|--------|
| Precisión extracción perfiles | >85% |
| Tasa error parsing | <5% |
| Tiempo procesamiento por chat | <30 segundos |
| Satisfacción usuario (NPS feature) | >40 |

### 7.3 KPIs de Impacto en Negocio
| Métrica | Sin Migration | Con Migration |
|---------|---------------|---------------|
| Tiempo hasta primera sugerencia útil | 2 semanas | 1 día |
| Precisión sugerencias semana 1 | 40% | 80% |
| Retención usuarios día 7 | 50% | 70% |
| Conversión trial a pago | 15% | 25% |

---

## 8. Riesgos y Mitigaciones

### 8.1 Riesgos Técnicos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Formatos export varían por región/versión | Alta | Media | Parser multi-formato + fallbacks |
| Límite mensajes por export | Media | Media | Documentar, sugerir export sin media |
| scrcpy no funciona en todos los Android | Media | Alta | Modo manual siempre disponible |
| Extracción LLM imprecisa | Media | Media | Review humano + edición de perfiles |
| Performance con muchos mensajes | Baja | Alta | Procesamiento en chunks, async |

### 8.2 Riesgos de Adopción

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Usuarios no completan proceso (tedioso) | Alta | Alta | Video tutorial, gamificación, progreso visible |
| Usuarios no encuentran exports | Media | Media | Guía paso a paso con screenshots |
| Privacidad concerns | Baja | Alta | Messaging claro: "datos nunca salen de tu cuenta" |

### 8.3 Riesgos Legales

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| ToS WhatsApp sobre exportación | Baja | Media | Usuario exporta, nosotros solo procesamos |
| GDPR sobre datos de terceros | Baja | Alta | Solo perfiles de clientes del usuario, no datos personales sensibles |
| Backup decryption grey area | Media | Alta | Modo backup como "avanzado/beta", opt-in explícito |

---

## 9. Posicionamiento Competitivo

### 9.1 Messaging de Marketing

**Headline principal:**
> "El único asistente WhatsApp que conoce TODA tu historia con clientes"

**Sub-headlines:**
- "Importa años de conversaciones en minutos"
- "Wallie aprende de tu pasado para predecir tu futuro"
- "No empieces de cero - trae tu contexto contigo"

### 9.2 Comparativa para Sales

```
┌────────────────────────────────────────────────────────────┐
│  "¿Por qué Wallie y no [competidor]?"                      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Con Clientify/Respond.io/Keybe:                           │
│  ❌ Solo conoce últimos 6 meses (limitación Coexistence)   │
│  ❌ Pierde contexto de relaciones de años                  │
│  ❌ IA "tonta" las primeras semanas                        │
│                                                            │
│  Con Wallie + Migration Assistant:                         │
│  ✅ Conoce TODA tu historia desde el día 1                 │
│  ✅ Entiende patrones estacionales y preferencias          │
│  ✅ Sugerencias precisas desde la primera hora             │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 9.3 Demo Script

```
DEMO: Migration Assistant (3 minutos)

[Slide 1: El problema]
"¿Cuántos años llevas hablando con clientes por WhatsApp?
¿2? ¿5? Toda esa información es ORO para vender mejor.

Pero cuando usas cualquier herramienta del mercado,
solo pueden ver los últimos 6 meses.
Es como contratar a un asistente y borrarle la memoria."

[Slide 2: La solución]
"Con Wallie, traes TODO contigo."
[Demo en vivo: subir 5 archivos de export]
[Mostrar progreso procesando]

[Slide 3: El resultado]
"Mira - Wallie ahora sabe que Juan siempre pide en septiembre,
que María prefiere entregas los martes,
y que Pedro pidió un descuento hace 2 años que no le diste."
[Mostrar perfiles generados]

[Slide 4: Call to action]
"¿Quieres que tu asistente te conozca de verdad?
Prueba Wallie gratis - importa tu historial en 15 minutos."
```

---

## 10. Próximos Pasos Inmediatos

### 10.1 Decisiones Requeridas
- [ ] ¿Aprobar inclusión en Phase 2 del roadmap?
- [ ] ¿Prioridad relativa vs otras features Phase 2?
- [ ] ¿Scope MVP: solo manual o incluir scrcpy?
- [ ] ¿Budget para desarrollo (semanas/persona)?

### 10.2 Acciones Técnicas Inmediatas (si se aprueba)
1. Spike: Obtener 10 exports reales de WhatsApp para testing parser
2. Spike: Probar extracción con Claude API - evaluar calidad
3. Design: Mockups UI del flujo completo
4. Arch: Definir schema de memoria para perfiles de cliente

### 10.3 Validación con Usuarios
- Entrevistar a 5 early adopters:
  - ¿Cuántos chats activos tienes?
  - ¿Exportarías manualmente si sabes que Wallie aprende de ello?
  - ¿Qué información de clientes antiguos te gustaría que Wallie "supiera"?

---

## Anexo A: Formato Export WhatsApp por Región

| Región | Formato fecha | Separador | Ejemplo |
|--------|---------------|-----------|---------|
| España | DD/MM/YY | , | [15/03/23, 10:30:45] |
| México | DD/MM/YY | , | [15/03/23, 10:30:45] |
| USA | MM/DD/YY | , | [03/15/23, 10:30:45 AM] |
| UK | DD/MM/YYYY | , | [15/03/2023, 10:30:45] |
| Brasil | DD/MM/YY | - | 15/03/23, 10:30 - |

---

## Anexo B: Estructura Base de Datos

```sql
-- Tabla para perfiles de cliente importados
CREATE TABLE imported_client_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallie_user_id UUID REFERENCES users(id),
    contact_name TEXT NOT NULL,
    contact_phone TEXT,
    profile_data JSONB NOT NULL,
    communication_style JSONB,
    first_message_date TIMESTAMPTZ,
    last_message_date TIMESTAMPTZ,
    total_messages INTEGER,
    import_date TIMESTAMPTZ DEFAULT NOW(),
    source TEXT DEFAULT 'whatsapp_export',
    embedding vector(1536)
);

-- Índices para búsqueda
CREATE INDEX idx_client_profiles_user ON imported_client_profiles(wallie_user_id);
CREATE INDEX idx_client_profiles_embedding ON imported_client_profiles
    USING ivfflat (embedding vector_cosine_ops);

-- Tabla para chunks de conversación
CREATE TABLE conversation_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_profile_id UUID REFERENCES imported_client_profiles(id),
    chunk_index INTEGER,
    date_start TIMESTAMPTZ,
    date_end TIMESTAMPTZ,
    content TEXT,
    embedding vector(1536)
);

CREATE INDEX idx_chunks_profile ON conversation_chunks(client_profile_id);
CREATE INDEX idx_chunks_embedding ON conversation_chunks
    USING ivfflat (embedding vector_cosine_ops);
```

---

**Documento preparado para revisión y aprobación.**

*Siguiente acción: Presentar en próximo sprint planning para decisión de inclusión.*
