/**
 * Quota Monitor - Tracks AI API usage and alerts on approaching limits
 *
 * Monitors RPM, TPM, and RPD usage in real-time and triggers
 * alerts when thresholds are reached (80%, 95%, 100%).
 */

export interface QuotaLimits {
  rpm: number // Requests per minute
  tpm: number // Tokens per minute
  rpd: number // Requests per day
  tier?: string // API tier (e.g., "Free", "Tier 1", "Tier 2")
}

export interface QuotaUsage {
  requestsThisMinute: number
  tokensThisMinute: number
  requestsToday: number
  minuteStart: number
  dayStart: number
}

export interface QuotaAlert {
  provider: string
  metric: 'rpm' | 'tpm' | 'rpd'
  type: 'warning' | 'critical' | 'exceeded'
  percent: number
  current: number
  limit: number
  timestamp: number
}

type AlertCallback = (alert: QuotaAlert) => void

export class ProviderQuotaMonitor {
  private usage: QuotaUsage
  private alerts: QuotaAlert[] = []
  private alertCallbacks: AlertCallback[] = []

  constructor(
    private readonly provider: string,
    private limits: QuotaLimits
  ) {
    this.usage = {
      requestsThisMinute: 0,
      tokensThisMinute: 0,
      requestsToday: 0,
      minuteStart: Date.now(),
      dayStart: Date.now(),
    }
  }

  /**
   * Update usage after an API call
   */
  updateUsage(requests: number = 1, tokens: number = 0): void {
    this.resetIfNeeded()

    this.usage.requestsThisMinute += requests
    this.usage.tokensThisMinute += tokens
    this.usage.requestsToday += requests

    this.checkThresholds()
  }

  /**
   * Check if we should switch to a different provider
   */
  shouldSwitchProvider(): boolean {
    this.resetIfNeeded()

    const rpmPercent = (this.usage.requestsThisMinute / this.limits.rpm) * 100
    const tpmPercent = (this.usage.tokensThisMinute / this.limits.tpm) * 100
    const rpdPercent = (this.usage.requestsToday / this.limits.rpd) * 100

    // Switch if any metric is above 95%
    return rpmPercent >= 95 || tpmPercent >= 95 || rpdPercent >= 95
  }

  /**
   * Get current usage percentage
   */
  getUsagePercent(): { rpm: number; tpm: number; rpd: number } {
    this.resetIfNeeded()

    return {
      rpm: (this.usage.requestsThisMinute / this.limits.rpm) * 100,
      tpm: (this.usage.tokensThisMinute / this.limits.tpm) * 100,
      rpd: (this.usage.requestsToday / this.limits.rpd) * 100,
    }
  }

  /**
   * Get current usage status
   */
  getStatus(): {
    provider: string
    limits: QuotaLimits
    usage: QuotaUsage
    percent: { rpm: number; tpm: number; rpd: number }
    alerts: QuotaAlert[]
  } {
    return {
      provider: this.provider,
      limits: this.limits,
      usage: this.usage,
      percent: this.getUsagePercent(),
      alerts: this.alerts.slice(-20), // Last 20 alerts
    }
  }

  /**
   * Reset usage counters if time windows expired
   */
  private resetIfNeeded(): void {
    const now = Date.now()

    // Reset minute counter
    if (now - this.usage.minuteStart >= 60000) {
      this.usage.requestsThisMinute = 0
      this.usage.tokensThisMinute = 0
      this.usage.minuteStart = now
    }

    // Reset day counter
    if (now - this.usage.dayStart >= 86400000) {
      this.usage.requestsToday = 0
      this.usage.dayStart = now
    }
  }

  /**
   * Check thresholds and trigger alerts
   */
  private checkThresholds(): void {
    const { rpm, tpm, rpd } = this.getUsagePercent()

    // Check RPM
    if (rpm >= 100) {
      this.addAlert('rpm', 'exceeded', rpm)
    } else if (rpm >= 95) {
      this.addAlert('rpm', 'critical', rpm)
    } else if (rpm >= 80) {
      this.addAlert('rpm', 'warning', rpm)
    }

    // Check TPM
    if (tpm >= 100) {
      this.addAlert('tpm', 'exceeded', tpm)
    } else if (tpm >= 95) {
      this.addAlert('tpm', 'critical', tpm)
    } else if (tpm >= 80) {
      this.addAlert('tpm', 'warning', tpm)
    }

    // Check RPD
    if (rpd >= 100) {
      this.addAlert('rpd', 'exceeded', rpd)
    } else if (rpd >= 95) {
      this.addAlert('rpd', 'critical', rpd)
    } else if (rpd >= 80) {
      this.addAlert('rpd', 'warning', rpd)
    }
  }

  /**
   * Add an alert and trigger callbacks
   */
  private addAlert(
    metric: 'rpm' | 'tpm' | 'rpd',
    type: 'warning' | 'critical' | 'exceeded',
    percent: number
  ): void {
    const alert: QuotaAlert = {
      provider: this.provider,
      metric,
      type,
      percent,
      current:
        metric === 'rpm'
          ? this.usage.requestsThisMinute
          : metric === 'tpm'
            ? this.usage.tokensThisMinute
            : this.usage.requestsToday,
      limit: metric === 'rpm' ? this.limits.rpm : metric === 'tpm' ? this.limits.tpm : this.limits.rpd,
      timestamp: Date.now(),
    }

    // Avoid duplicate alerts (only add if different from last)
    const lastAlert = this.alerts[this.alerts.length - 1]
    if (
      !lastAlert ||
      lastAlert.metric !== alert.metric ||
      lastAlert.type !== alert.type ||
      Date.now() - lastAlert.timestamp > 60000 // Allow re-alert after 1 minute
    ) {
      this.alerts.push(alert)
      this.alertCallbacks.forEach((callback) => callback(alert))
    }
  }

  /**
   * Register a callback for alerts
   */
  onAlert(callback: AlertCallback): void {
    this.alertCallbacks.push(callback)
  }

  /**
   * Update quota limits (when tier upgrades)
   */
  updateLimits(limits: QuotaLimits): void {
    this.limits = limits
  }

  /**
   * Reset usage counters (for testing/debugging)
   */
  resetUsage(): void {
    this.usage = {
      requestsThisMinute: 0,
      tokensThisMinute: 0,
      requestsToday: 0,
      minuteStart: Date.now(),
      dayStart: Date.now(),
    }
  }
}

/**
 * Quota Monitor Manager - Singleton for managing multiple providers
 */
class QuotaMonitorManager {
  private monitors: Map<string, ProviderQuotaMonitor> = new Map()
  private globalAlertCallbacks: AlertCallback[] = []

  private readonly DEFAULT_LIMITS: Record<string, QuotaLimits> = {
    openai: { rpm: 3, tpm: 150_000, rpd: 200, tier: 'Free' },
    anthropic: { rpm: 5, tpm: 20_000, rpd: 50, tier: 'Free' },
    google: { rpm: 15, tpm: 1_000_000, rpd: 1_500, tier: 'Free' },
    groq: { rpm: 30, tpm: 14_400, rpd: 14_400, tier: 'Free' },
    deepseek: { rpm: 60, tpm: 100_000, rpd: 10_000, tier: 'Free' },
  }

  /**
   * Get or create a quota monitor for a provider
   */
  getOrCreate(provider: string, limits?: QuotaLimits): ProviderQuotaMonitor {
    if (!this.monitors.has(provider)) {
      const config = limits ?? this.DEFAULT_LIMITS[provider] ?? {
        rpm: 10,
        tpm: 100_000,
        rpd: 1_000,
        tier: 'Unknown',
      }
      const monitor = new ProviderQuotaMonitor(provider, config)

      // Forward alerts to global callbacks
      monitor.onAlert((alert) => {
        this.globalAlertCallbacks.forEach((callback) => callback(alert))
      })

      this.monitors.set(provider, monitor)
    }
    return this.monitors.get(provider)!
  }

  /**
   * Get existing monitor
   */
  get(provider: string): ProviderQuotaMonitor | undefined {
    return this.monitors.get(provider)
  }

  /**
   * Update usage for a provider
   */
  updateUsage(provider: string, requests: number = 1, tokens: number = 0): void {
    const monitor = this.getOrCreate(provider)
    monitor.updateUsage(requests, tokens)
  }

  /**
   * Check if provider should switch
   */
  shouldSwitchProvider(provider: string): boolean {
    const monitor = this.get(provider)
    return monitor?.shouldSwitchProvider() ?? false
  }

  /**
   * Register global alert callback
   */
  onAlert(callback: AlertCallback): void {
    this.globalAlertCallbacks.push(callback)
  }

  /**
   * Update provider limits (when tier upgrades)
   */
  updateProviderLimits(provider: string, limits: QuotaLimits): void {
    const monitor = this.getOrCreate(provider)
    monitor.updateLimits(limits)
  }

  /**
   * Reset all usage counters
   */
  resetAllUsage(): void {
    this.monitors.forEach((monitor) => monitor.resetUsage())
  }

  /**
   * Get status of all monitors
   */
  getAllStatus(): Record<string, ReturnType<ProviderQuotaMonitor['getStatus']>> {
    const status: Record<string, ReturnType<ProviderQuotaMonitor['getStatus']>> = {}
    this.monitors.forEach((monitor, provider) => {
      status[provider] = monitor.getStatus()
    })
    return status
  }
}

// Singleton instance
let monitorManagerInstance: QuotaMonitorManager | null = null

/**
 * Get the singleton quota monitor manager instance
 */
export function getQuotaMonitor(): QuotaMonitorManager {
  if (!monitorManagerInstance) {
    monitorManagerInstance = new QuotaMonitorManager()
  }
  return monitorManagerInstance
}

/**
 * Update provider quota limits (convenience function)
 */
export function updateProviderQuotaLimits(provider: string, limits: QuotaLimits): void {
  const manager = getQuotaMonitor()
  manager.updateProviderLimits(provider, limits)
}
