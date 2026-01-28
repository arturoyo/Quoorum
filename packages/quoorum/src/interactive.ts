/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Forum Interactive Features
 *
 * Quick WOWs interactivos: Streaming, Selection, Replay
 */

import type { DebateResult, DebateMessage } from './types'
import type { ExpertProfile } from './expert-database'
import { quoorumLogger } from './logger'

// ============================================================================
// DEBATE REPLAY
// ============================================================================

export interface ReplayOptions {
  speed?: number // messages per second (default: 1)
  pauseOnIntervention?: boolean
  showTimestamps?: boolean
}

export class DebateReplayer {
  private result: DebateResult
  private isPaused: boolean = false

  constructor(result: DebateResult) {
    this.result = result
  }

  /**
   * Reproduce el debate paso a paso
   */
  async replay(options: ReplayOptions = {}): Promise<void> {
    const speed = options.speed || 1
    const delay = 1000 / speed

    quoorumLogger.debug('Starting debate replay', {
      sessionId: this.result.sessionId,
      speed,
      roundCount: this.result.rounds.length,
    })

    for (let r = 0; r < this.result.rounds.length; r++) {
      const round = this.result.rounds[r]!

      quoorumLogger.debug(`Round ${r + 1} started`, {
        sessionId: this.result.sessionId,
        round: r + 1,
        messageCount: round.messages.length,
      })

      for (let m = 0; m < round.messages.length; m++) {
        const message = round.messages[m]!

        await this.displayMessage(message, options)

        if (options.pauseOnIntervention && message.agentKey === 'meta_moderator') {
          quoorumLogger.debug('Paused on meta-moderator intervention', {
            sessionId: this.result.sessionId,
            round: r + 1,
          })
          this.isPaused = true
          // In real implementation, would wait for user input
          await this.sleep(delay * 2)
          this.isPaused = false
        } else {
          await this.sleep(delay)
        }
      }
    }

    quoorumLogger.info('Debate replay complete', {
      sessionId: this.result.sessionId,
      finalRanking: this.result.finalRanking,
      consensusScore: this.result.consensusScore,
    })
  }

  /**
   * Salta a una ronda específica
   */
  jumpToRound(round: number): void {
    if (round >= 0 && round < this.result.rounds.length) {
      quoorumLogger.debug('Jumped to round', {
        sessionId: this.result.sessionId,
        round: round + 1,
      })
    }
  }

  /**
   * Pausa/resume el replay
   */
  togglePause(): void {
    this.isPaused = !this.isPaused
    quoorumLogger.debug(this.isPaused ? 'Replay paused' : 'Replay resumed', {
      sessionId: this.result.sessionId,
      isPaused: this.isPaused,
    })
  }

  // eslint-disable-next-line @typescript-eslint/require-await -- Synchronous display, async for interface compatibility
  private async displayMessage(message: DebateMessage, options: ReplayOptions): Promise<void> {
    const expertName = message.agentKey
      .split('_')
      .map((w) => w[0]?.toUpperCase() + w.slice(1))
      .join(' ')
    quoorumLogger.debug('Displaying message in replay', {
      sessionId: this.result.sessionId,
      agentKey: message.agentKey,
      expertName,
      messageLength: message.content.length,
      showTimestamps: options.showTimestamps,
    })
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

/**
 * Crea un replayer para un debate
 */
export function createDebateReplayer(result: DebateResult): DebateReplayer {
  return new DebateReplayer(result)
}

// ============================================================================
// INTERACTIVE EXPERT SELECTION
// ============================================================================

export interface ExpertSelectionOptions {
  autoSelected: ExpertProfile[]
  availableExperts: ExpertProfile[]
  maxExperts?: number
}

export interface ExpertSelectionResult {
  selected: ExpertProfile[]
  removed: ExpertProfile[]
  added: ExpertProfile[]
}

/**
 * Muestra selección interactiva de expertos
 */
export function displayExpertSelection(options: ExpertSelectionOptions): string {
  const maxExperts = options.maxExperts || 6

  let output = '\n[INFO] Expert Selection\n\n'
  output += '━━━ Auto-selected experts (recommended) ━━━\n\n'

  for (const expert of options.autoSelected) {
    output += `[OK] ${expert.name}\n`
    output += `   ${expert.title}\n`
    output += `   Expertise: ${expert.expertise.join(', ')}\n\n`
  }

  output += '\n💡 Want to add/remove experts?\n\n'
  output += 'Available experts:\n\n'

  const notSelected = options.availableExperts.filter(
    (e) => !options.autoSelected.some((a) => a.id === e.id)
  )

  for (const expert of notSelected.slice(0, 10)) {
    output += `[ ] ${expert.name} - ${expert.title}\n`
  }

  output += `\nCurrent: ${options.autoSelected.length}/${maxExperts} experts\n`

  return output
}

/**
 * Procesa selección de expertos (mock para demo)
 */
export function processExpertSelection(
  autoSelected: ExpertProfile[],
  toRemove: string[],
  toAdd: string[],
  availableExperts: ExpertProfile[]
): ExpertSelectionResult {
  const removed = autoSelected.filter((e) => toRemove.includes(e.id))
  const added = availableExperts.filter((e) => toAdd.includes(e.id))
  const selected = [...autoSelected.filter((e) => !toRemove.includes(e.id)), ...added]

  return { selected, removed, added }
}

// ============================================================================
// LIVE DEBATE STREAMING (MOCK)
// ============================================================================

export type StreamEventType =
  | 'round_start'
  | 'message'
  | 'intervention'
  | 'quality_check'
  | 'round_end'
  | 'debate_end'

export interface StreamEventData {
  round_start: { round: number; total: number }
  message: { message: DebateMessage }
  intervention: { message: DebateMessage }
  quality_check: { round: number; quality: number }
  round_end: { round: number }
  debate_end: {
    finalRanking: Array<{ option: string; successRate: number }>
    consensusScore: number
  }
}

export interface StreamEvent<T extends StreamEventType = StreamEventType> {
  type: T
  timestamp: Date
  data: StreamEventData[T]
}

export type StreamCallback = (event: StreamEvent) => void

/**
 * Mock de streaming de debate en tiempo real
 */
export class DebateStreamer {
  private callbacks: StreamCallback[] = []

  /**
   * Suscribe a eventos del debate
   */
  subscribe(callback: StreamCallback): () => void {
    this.callbacks.push(callback)
    return () => {
      this.callbacks = this.callbacks.filter((cb) => cb !== callback)
    }
  }

  /**
   * Emite un evento a todos los suscriptores
   */
  emit<T extends StreamEventType>(type: T, data: StreamEventData[T]): void {
    const event: StreamEvent<T> = {
      type,
      timestamp: new Date(),
      data,
    }

    for (const callback of this.callbacks) {
      callback(event)
    }
  }

  /**
   * Simula un debate en streaming
   */
  async streamDebate(result: DebateResult, delayMs: number = 1000): Promise<void> {
    for (let r = 0; r < result.rounds.length; r++) {
      const round = result.rounds[r]

      this.emit('round_start', { round: r + 1, total: result.rounds.length })
      await this.sleep(delayMs / 2)

      for (const message of round?.messages || []) {
        if (message.agentKey === 'meta_moderator') {
          this.emit('intervention', { message })
        } else {
          this.emit('message', { message })
        }
        await this.sleep(delayMs)
      }

      this.emit('quality_check', { round: r + 1, quality: 75 + Math.random() * 20 })
      await this.sleep(delayMs / 2)

      this.emit('round_end', { round: r + 1 })
      await this.sleep(delayMs / 2)
    }

    this.emit('debate_end', {
      finalRanking: result.finalRanking,
      consensusScore: result.consensusScore,
    })
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

/**
 * Crea un streamer para debates
 */
export function createDebateStreamer(): DebateStreamer {
  return new DebateStreamer()
}

/**
 * Ejemplo de uso del streamer
 */
export function exampleStreamUsage(): void {
  const streamer = createDebateStreamer()

  // Subscribe to events
  streamer.subscribe((event) => {
    switch (event.type) {
      case 'round_start': {
        const data = event.data as StreamEventData['round_start']
        quoorumLogger.debug('Streamer: Round started', {
          round: data.round,
          total: data.total,
        })
        break
      }
      case 'message': {
        const data = event.data as StreamEventData['message']
        quoorumLogger.debug('Streamer: Message', {
          agentKey: data.message.agentKey,
          messagePreview: data.message.content.substring(0, 100),
        })
        break
      }
      case 'intervention': {
        const data = event.data as StreamEventData['intervention']
        quoorumLogger.info('Streamer: Meta-moderator intervention', {
          messagePreview: data.message.content.substring(0, 100),
        })
        break
      }
      case 'quality_check': {
        const data = event.data as StreamEventData['quality_check']
        quoorumLogger.debug('Streamer: Quality check', {
          quality: data.quality,
        })
        break
      }
      case 'round_end': {
        const data = event.data as StreamEventData['round_end']
        quoorumLogger.debug('Streamer: Round ended', {
          round: data.round,
        })
        break
      }
      case 'debate_end': {
        const data = event.data as StreamEventData['debate_end']
        quoorumLogger.info('Streamer: Debate ended', {
          finalRanking: data.finalRanking,
          consensusScore: data.consensusScore,
        })
        break
      }
    }
  })

  quoorumLogger.debug('Streamer example setup complete')
}

// ============================================================================
// DEBATE TIMELINE
// ============================================================================

export interface TimelineEvent {
  round: number
  timestamp: number // relative to start (seconds)
  type: 'message' | 'intervention' | 'quality_check' | 'consensus_shift'
  description: string
  importance: 'low' | 'medium' | 'high'
}

/**
 * Genera timeline de eventos clave del debate
 */
export function generateDebateTimeline(result: DebateResult): TimelineEvent[] {
  const events: TimelineEvent[] = []
  let currentTime = 0

  for (let r = 0; r < result.rounds.length; r++) {
    const round = result.rounds[r]!

    for (const message of round?.messages || []) {
      const isIntervention = message.agentKey === 'meta_moderator'

      events.push({
        round: r + 1,
        timestamp: currentTime,
        type: isIntervention ? 'intervention' : 'message',
        description: `${message.agentKey}: ${message.content.substring(0, 50)}...`,
        importance: isIntervention ? 'high' : 'medium',
      })

      currentTime += 30 // assume 30 seconds per message
    }

    // Quality check after each round
    events.push({
      round: r + 1,
      timestamp: currentTime,
      type: 'quality_check',
      description: `Quality check: Round ${r + 1}`,
      importance: 'low',
    })

    currentTime += 10
  }

  return events
}

/**
 * Renderiza timeline visual
 */
export function renderTimeline(events: TimelineEvent[]): string {
  let output = '\n📅 Debate Timeline\n\n'

  for (const event of events) {
    const time = formatTime(event.timestamp)
    const icon = getEventIcon(event.type, event.importance)
    const indent = event.importance === 'high' ? '  ⭐ ' : '     '

    output += `${time} ${icon} ${indent}${event.description}\n`
  }

  return output
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function getEventIcon(
  type: TimelineEvent['type'],
  importance: TimelineEvent['importance']
): string {
  if (importance === 'high') return '⚡'
  if (type === 'intervention') return '🔔'
  if (type === 'message') return '💬'
  if (type === 'quality_check') return '📊'
  return '•'
}

/**
 * Imprime timeline en consola
 */
export function printTimeline(result: DebateResult): void {
  const events = generateDebateTimeline(result)
  quoorumLogger.debug('Debate timeline', {
    sessionId: result.sessionId,
    eventCount: events.length,
    events,
  })
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export const interactive = {
  createDebateReplayer,
  displayExpertSelection,
  processExpertSelection,
  createDebateStreamer,
  exampleStreamUsage,
  generateDebateTimeline,
  renderTimeline,
  printTimeline,
}
