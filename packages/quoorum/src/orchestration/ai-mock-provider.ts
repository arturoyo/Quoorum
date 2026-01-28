/**
 * Mock AI Provider - For testing without real API calls
 */

import type { AIProvider, GenerateOptions } from './ai-debate-types'

// ============================================================================
// MOCK PROVIDER
// ============================================================================

export class MockAIProvider implements AIProvider {
  // eslint-disable-next-line @typescript-eslint/require-await -- Mock implementation, synchronous
  async generateResponse(prompt: string, _options?: GenerateOptions): Promise<string> {
    // Simulate AI response based on prompt content
    if (prompt.includes('Abogado del Diablo')) {
      return this.getDevilsAdvocateResponse()
    }
    if (prompt.includes('PRE-MORTEM')) {
      return this.getPreMortemResponse()
    }
    if (prompt.includes('MÁXIMO 3 ORACIONES')) {
      return this.getGutCheckResponse()
    }
    if (prompt.includes('Como') && prompt.includes('analiza esta decisión')) {
      return this.getMentorResponse()
    }
    return this.getDebateResponse()
  }

  private getDevilsAdvocateResponse(): string {
    return `[ERROR] Razones por las que esto podría ser un error:
1. El timing podría no ser el adecuado para el mercado
2. Los recursos necesarios podrían estar subestimados significativamente
3. La competencia podría reaccionar más rápido de lo esperado
4. El equipo actual no tiene experiencia en este tipo de ejecución
5. Los assumptions de mercado no están validados con datos reales

🟡 Escenarios de fracaso:
- Si el mercado no responde en 3 meses, el runway se agota
- Si el equipo no está alineado, la ejecución fallará
- Si aparece un competidor bien financiado, serás aplastado

🔵 Lo que piensan los que no están de acuerdo:
- "Es demasiado pronto para este movimiento"
- "Deberíamos consolidar antes de expandir"
- "Los números no cuadran"

[WARN] El elephant in the room: ¿Realmente tienes product-market fit o solo early adopters entusiastas?

💡 Alternativa: Considera un piloto más pequeño primero. Valida con 10 clientes antes de escalar.`
  }

  private getPreMortemResponse(): string {
    return `💀 CAUSA DE MUERTE: Subestimamos la complejidad de ejecución y el tiempo necesario.

🚩 SEÑALES IGNORADAS:
- El equipo ya estaba estirado al máximo
- Los datos de mercado eran del año pasado
- Ningún cliente grande había confirmado interés real
- El competitor principal anunció features similares

📉 TIMELINE DEL FRACASO:
- Mes 1-2: Optimismo inicial, todo parece ir bien
- Mes 3-4: Primeros problemas, retrasos "menores"
- Mes 5-6: Crisis silenciosa, el equipo empieza a dudar
- Mes 7-9: Modo pánico, pivots desesperados
- Mes 10-12: Aceptación del fracaso, postmortem

👤 RESPONSABLES:
- CEO: Debería haber validado assumptions antes de apostar
- CTO: Debería haber sido más honesto sobre capacidad técnica
- Board: Debería haber exigido más checkpoints

💰 COSTE REAL:
- €500K en desarrollo que no sirvió
- 8 meses de tiempo perdido
- 3 empleados clave que se fueron
- Oportunidad de pivotar a algo mejor

🔄 ALTERNATIVA: Pilot de 30 días con 5 clientes antes de invertir en desarrollo completo.

🛡️ PREVENCIÓN:
- Validar supuestos con clientes reales esta semana
- Establecer kill criteria claros antes de empezar
- Definir checkpoints mensuales con métricas específicas`
  }

  private getGutCheckResponse(): string {
    return `SÍ, pero con condiciones.
El concepto es sólido pero la ejecución es donde falla la mayoría.
¿Tienes el equipo correcto y el timing adecuado para ejecutar esto?`
  }

  private getMentorResponse(): string {
    return `Mi consejo directo: El problema que describes es real, pero tu solución necesita validación.

[ERROR] RED FLAGS:
- No veo tracción real todavía
- El mercado es más competitivo de lo que describes
- Tu diferenciación no es clara

[OK] GREEN FLAGS:
- Entiendes el problema desde dentro
- El timing del mercado parece correcto
- Tienes capacidad técnica para ejecutar

📋 ACCIONES INMEDIATAS:
- Habla con 10 clientes potenciales esta semana
- Define tu métrica north star
- Lanza algo simple en 2 semanas

RATING: 6/10
INVERTIRÍA: No todavía, pero me interesa seguir la evolución.`
  }

  private getDebateResponse(): string {
    return `Desde mi perspectiva:

1. **Posición**: A favor, con reservas importantes

2. **Argumentos principales**:
   - Alineación con objetivos estratégicos a largo plazo
   - Potencial de crecimiento significativo si se ejecuta bien
   - Timing razonable dada la situación del mercado
   - Capacidad del equipo para ejecutar

3. **Evidencia**:
   - Datos de mercado muestran crecimiento del 15% anual
   - Competidores han validado el modelo
   - Feedback inicial de clientes es positivo

4. **Riesgos**:
   - Recursos necesarios pueden estar subestimados
   - Dependencia de factores externos no controlables
   - Capacidad de ejecución del equipo actual

5. **Recomendación**: Proceder con un enfoque gradual, estableciendo checkpoints claros para validar assumptions antes de comprometer recursos significativos.`
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createMockProvider(): AIProvider {
  return new MockAIProvider()
}
