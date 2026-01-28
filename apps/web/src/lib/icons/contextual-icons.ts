import { MessageSquare } from 'lucide-react'
import { type IconType } from 'react-icons'
import {
  MdRocket,
  MdTrendingUp,
  MdGroups,
  MdCampaign,
  MdLightbulb,
  MdAttachMoney,
  MdSettings,
  MdShoppingCart,
  MdPerson,
  MdLanguage,
  MdPhoneAndroid,
  MdCode,
  MdStorage,
  MdSecurity,
  MdFavorite,
  MdSchool,
  MdBusiness,
  MdEmojiEvents,
  MdForum,
  MdPalette,
  MdEco,
  MdLocalHospital,
  MdDirectionsCar,
  MdHome,
  MdFlight,
  MdRestaurant,
  MdSportsEsports,
  MdMusicNote,
  MdPhotoCamera,
  MdMenuBook,
  MdScience,
  MdWork,
  MdHandshake,
  MdPieChart,
  MdEmail,
  MdNotifications,
  MdStar,
  MdLocalFireDepartment,
  MdCloud,
  MdLock,
  MdSearch,
  MdCheckCircle,
  MdHelp,
} from 'react-icons/md'

// Re-export icons for use in components
export {
  MdRocket,
  MdTrendingUp,
  MdGroups,
  MdCampaign,
  MdLightbulb,
  MdAttachMoney,
  MdSettings,
  MdShoppingCart,
  MdPerson,
  MdLanguage,
  MdPhoneAndroid,
  MdCode,
  MdStorage,
  MdSecurity,
  MdFavorite,
  MdSchool,
  MdBusiness,
  MdEmojiEvents,
  MdForum,
  MdPalette,
  MdEco,
  MdLocalHospital,
  MdDirectionsCar,
  MdHome,
  MdFlight,
  MdRestaurant,
  MdSportsEsports,
  MdMusicNote,
  MdPhotoCamera,
  MdMenuBook,
  MdScience,
  MdWork,
  MdHandshake,
  MdPieChart,
  MdEmail,
  MdNotifications,
  MdStar,
  MdLocalFireDepartment,
  MdCloud,
  MdLock,
  MdSearch,
  MdCheckCircle,
  MdHelp,
}

export type { IconType }

// Categorías de iconos con palabras clave
const iconMap: Array<{ keywords: string[]; icon: IconType }> = [
  // Negocios y ventas
  { keywords: ['venta', 'vender', 'cliente', 'compra', 'comercial', 'revenue'], icon: MdShoppingCart },
  { keywords: ['dinero', 'precio', 'costo', 'inversión', 'presupuesto', 'financ'], icon: MdAttachMoney },
  { keywords: ['deal', 'negoci', 'acuerdo', 'contrato'], icon: MdHandshake },
  { keywords: ['marketing', 'campaña', 'publicidad', 'promoción'], icon: MdCampaign },
  { keywords: ['crecimiento', 'escal', 'expansión', 'aumento'], icon: MdTrendingUp },
  { keywords: ['éxito', 'logro', 'objetivo', 'meta', 'ganar'], icon: MdEmojiEvents },

  // Productos y desarrollo
  { keywords: ['producto', 'feature', 'funcionalidad', 'desarrollo'], icon: MdRocket },
  { keywords: ['diseño', 'ui', 'ux', 'interfaz', 'visual'], icon: MdPalette },
  { keywords: ['código', 'programación', 'software', 'desarrollo'], icon: MdCode },
  { keywords: ['datos', 'database', 'información', 'analytics'], icon: MdStorage },
  { keywords: ['mobile', 'móvil', 'app', 'aplicación'], icon: MdPhoneAndroid },
  { keywords: ['web', 'sitio', 'website', 'online'], icon: MdLanguage },
  { keywords: ['cloud', 'nube', 'servidor', 'hosting'], icon: MdCloud },
  { keywords: ['seguridad', 'privacidad', 'protección', 'segur'], icon: MdSecurity },

  // Equipo y organización
  { keywords: ['equipo', 'team', 'colabor', 'grupo', 'personal'], icon: MdGroups },
  { keywords: ['líder', 'management', 'gestión', 'dirección'], icon: MdPerson },
  { keywords: ['empresa', 'compañía', 'organización', 'negocio'], icon: MdBusiness },
  { keywords: ['trabajo', 'empleo', 'carrera', 'profesional'], icon: MdWork },

  // Comunicación
  { keywords: ['comunicación', 'mensaje', 'conversación', 'chat'], icon: MdForum },
  { keywords: ['email', 'correo', 'mail'], icon: MdEmail },
  { keywords: ['notificación', 'alerta', 'aviso'], icon: MdNotifications },

  // Ideas e innovación
  { keywords: ['idea', 'innovación', 'creativ', 'concept'], icon: MdLightbulb },
  { keywords: ['estrategia', 'plan', 'táctica', 'approach'], icon: MdPieChart },
  { keywords: ['investigación', 'research', 'estudio', 'análisis'], icon: MdScience },
  { keywords: ['aprendizaje', 'educación', 'formación', 'curso'], icon: MdSchool },
  { keywords: ['libro', 'contenido', 'documentación', 'guía'], icon: MdMenuBook },

  // Industrias específicas
  { keywords: ['salud', 'médico', 'hospital', 'clínica'], icon: MdLocalHospital },
  { keywords: ['coche', 'auto', 'vehículo', 'transporte'], icon: MdDirectionsCar },
  { keywords: ['casa', 'hogar', 'vivienda', 'inmobiliaria'], icon: MdHome },
  { keywords: ['viaje', 'turismo', 'vuelo', 'destino'], icon: MdFlight },
  { keywords: ['comida', 'restaurante', 'food', 'cocina'], icon: MdRestaurant },
  { keywords: ['juego', 'game', 'gaming', 'entretenimiento'], icon: MdSportsEsports },
  { keywords: ['música', 'audio', 'sound', 'canción'], icon: MdMusicNote },
  { keywords: ['foto', 'imagen', 'video', 'visual'], icon: MdPhotoCamera },
  { keywords: ['sostenib', 'ecológico', 'verde', 'medio ambiente'], icon: MdEco },

  // Acciones y estados
  { keywords: ['configuración', 'ajuste', 'settings', 'config'], icon: MdSettings },
  { keywords: ['buscar', 'encontrar', 'search', 'explorar'], icon: MdSearch },
  { keywords: ['importante', 'priority', 'destacado', 'crítico'], icon: MdStar },
  { keywords: ['urgente', 'rápido', 'inmediato', 'hot'], icon: MdLocalFireDepartment },
  { keywords: ['completado', 'terminado', 'finished', 'done'], icon: MdCheckCircle },
  { keywords: ['pregunta', 'duda', 'question', 'cómo'], icon: MdHelp },
  { keywords: ['amor', 'pasión', 'love', 'favorito'], icon: MdFavorite },
  { keywords: ['privado', 'confidencial', 'secret'], icon: MdLock },
]

// Lista completa de todos los iconos disponibles (para distribución uniforme)
const allIcons: IconType[] = [
  MdRocket,
  MdTrendingUp,
  MdGroups,
  MdCampaign,
  MdLightbulb,
  MdAttachMoney,
  MdSettings,
  MdShoppingCart,
  MdPerson,
  MdLanguage,
  MdPhoneAndroid,
  MdCode,
  MdStorage,
  MdSecurity,
  MdFavorite,
  MdSchool,
  MdBusiness,
  MdEmojiEvents,
  MdForum,
  MdPalette,
  MdEco,
  MdLocalHospital,
  MdDirectionsCar,
  MdHome,
  MdFlight,
  MdRestaurant,
  MdSportsEsports,
  MdMusicNote,
  MdPhotoCamera,
  MdMenuBook,
  MdScience,
  MdWork,
  MdHandshake,
  MdPieChart,
  MdEmail,
  MdNotifications,
  MdStar,
  MdLocalFireDepartment,
  MdCloud,
  MdLock,
  MdSearch,
  MdCheckCircle,
  MdHelp,
]

/**
 * Genera un hash simple determinístico de una cadena
 * Usado para seleccionar iconos de manera consistente pero única
 */
function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

/**
 * Encuentra iconos relevantes basados en el contenido del debate
 */
function findRelevantIcons(
  question: string,
  tags?: string[],
  topics?: string[],
  areas?: string[]
): IconType[] {
  const relevantIcons = new Set<IconType>()
  const searchText = [
    question,
    ...(tags || []),
    ...(topics || []),
    ...(areas || []),
  ].join(' ').toLowerCase()

  // Buscar coincidencias de palabras clave
  for (const { keywords, icon } of iconMap) {
    for (const keyword of keywords) {
      if (searchText.includes(keyword)) {
        relevantIcons.add(icon)
        break // Solo añadir una vez por categoría
      }
    }
  }

  return Array.from(relevantIcons)
}

/**
 * Selecciona un icono contextual único y representativo para un debate
 * 
 * Estrategia:
 * 1. Encuentra iconos relevantes basados en pregunta, tags, topics, areas
 * 2. Si hay iconos relevantes, usa un hash del ID para seleccionar uno único
 * 3. Si no hay iconos relevantes, usa el hash para seleccionar de todos los iconos
 * 4. Esto asegura que cada debate tenga un icono diferente pero representativo
 * 
 * @param question - Pregunta del debate
 * @param debateId - ID único del debate (para hash determinístico)
 * @param tags - Tags opcionales del debate
 * @param topics - Topics opcionales del debate
 * @param areas - Areas opcionales del debate
 */
export function getContextualIcon(
  question: string,
  debateId?: string,
  tags?: string[],
  topics?: string[],
  areas?: string[]
): IconType {
  // Encontrar iconos relevantes basados en el contenido
  const relevantIcons = findRelevantIcons(question, tags, topics, areas)

  // Determinar qué conjunto de iconos usar
  const iconPool = relevantIcons.length > 0 ? relevantIcons : allIcons

  // Si no hay ID, usar la pregunta como fallback (menos ideal pero funcional)
  const hashInput = debateId || question
  const hash = simpleHash(hashInput)

  // Seleccionar icono usando hash determinístico
  const selectedIndex = hash % iconPool.length
  const selectedIcon = iconPool[selectedIndex]!

  return selectedIcon
}
