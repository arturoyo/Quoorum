/**
 * Tooltips System
 * 
 * Contextual tooltips for better UX
 */

'use client'

import React, { useState, useRef, useEffect } from 'react'

// ============================================================================
// TOOLTIP COMPONENT
// ============================================================================

interface TooltipProps {
  content: string | React.ReactNode
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  maxWidth?: number
}

export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 500,
  maxWidth = 200,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        setCoords({ x: rect.left + rect.width / 2, y: rect.top })
      }
      setIsVisible(true)
    }, delay)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const getPositionStyles = () => {
    const offset = 8
    switch (position) {
      case 'top':
        return {
          left: coords.x,
          top: coords.y - offset,
          transform: 'translate(-50%, -100%)',
        }
      case 'bottom':
        return {
          left: coords.x,
          top: coords.y + offset,
          transform: 'translate(-50%, 0)',
        }
      case 'left':
        return {
          left: coords.x - offset,
          top: coords.y,
          transform: 'translate(-100%, -50%)',
        }
      case 'right':
        return {
          left: coords.x + offset,
          top: coords.y,
          transform: 'translate(0, -50%)',
        }
    }
  }

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-block"
      >
        {children}
      </div>

      {isVisible && (
        <div
          className="fixed z-50 bg-gray-900 text-[var(--theme-text-primary)] text-sm rounded-lg px-3 py-2 pointer-events-none"
          style={{
            ...getPositionStyles(),
            maxWidth: `${maxWidth}px`,
          }}
        >
          {content}
          <div
            className="absolute w-2 h-2 bg-gray-900 transform rotate-45"
            style={{
              [position === 'top' ? 'bottom' : 'top']: '-4px',
              [position === 'left' || position === 'right' ? 'top' : 'left']: '50%',
              transform:
                position === 'left' || position === 'right'
                  ? 'translateY(-50%) rotate(45deg)'
                  : 'translateX(-50%) rotate(45deg)',
            }}
          />
        </div>
      )}
    </>
  )
}

// ============================================================================
// PREDEFINED TOOLTIPS
// ============================================================================

export function DebateModeTooltip({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip
      content={
        <div>
          <strong>Dinámico:</strong> Selección automática de expertos
          <br />
          <strong>Estático:</strong> Set predefinido de expertos
        </div>
      }
      maxWidth={250}
    >
      {children}
    </Tooltip>
  )
}

export function ConsensusTooltip({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip
      content="Indica qué tan de acuerdo están los expertos. 70%+ es bueno, 90%+ es excelente."
      maxWidth={250}
    >
      {children}
    </Tooltip>
  )
}

export function SuccessRateTooltip({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip
      content="Probabilidad estimada de éxito basada en los argumentos de los expertos."
      maxWidth={250}
    >
      {children}
    </Tooltip>
  )
}

export function QualityScoreTooltip({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip
      content="Mide la calidad del debate: profundidad de argumentos y construcción de consenso."
      maxWidth={250}
    >
      {children}
    </Tooltip>
  )
}

export function CostTooltip({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip content="Costo total del debate basado en tokens de OpenAI utilizados." maxWidth={250}>
      {children}
    </Tooltip>
  )
}

// ============================================================================
// RICH TOOLTIP
// ============================================================================

interface RichTooltipProps {
  title: string
  description: string
  link?: {
    text: string
    href: string
  }
  children: React.ReactNode
}

export function RichTooltip({ title, description, link, children }: RichTooltipProps) {
  return (
    <Tooltip
      content={
        <div className="space-y-2">
          <div className="font-semibold">{title}</div>
          <div className="text-[var(--theme-text-secondary)] text-xs">{description}</div>
          {link && (
            <a href={link.href} className="text-blue-400 hover:text-blue-300 text-xs block">
              {link.text} →
            </a>
          )}
        </div>
      }
      maxWidth={300}
    >
      {children}
    </Tooltip>
  )
}

// ============================================================================
// INFO ICON WITH TOOLTIP
// ============================================================================

export function InfoTooltip({ content, maxWidth }: { content: string; maxWidth?: number }) {
  return (
    <Tooltip content={content} maxWidth={maxWidth}>
      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-[var(--theme-text-tertiary)] text-xs cursor-help">
        i
      </span>
    </Tooltip>
  )
}

// ============================================================================
// KEYBOARD SHORTCUT TOOLTIP
// ============================================================================

export function KeyboardShortcutTooltip({
  shortcut,
  description,
  children,
}: {
  shortcut: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Tooltip
      content={
        <div className="flex items-center gap-2">
          <kbd className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs">
            {shortcut}
          </kbd>
          <span className="text-xs">{description}</span>
        </div>
      }
      maxWidth={300}
    >
      {children}
    </Tooltip>
  )
}

// ============================================================================
// FEATURE BADGE WITH TOOLTIP
// ============================================================================

export function FeatureBadge({
  label,
  description,
  variant = 'blue',
}: {
  label: string
  description: string
  variant?: 'blue' | 'green' | 'purple' | 'orange'
}) {
  const variantClasses = {
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    orange: 'bg-orange-100 text-orange-800 border-orange-200',
  }

  return (
    <Tooltip content={description} maxWidth={250}>
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${variantClasses[variant]}`}
      >
        {label}
      </span>
    </Tooltip>
  )
}

// ============================================================================
// EXPERT TOOLTIP
// ============================================================================

export function ExpertTooltip({
  name,
  title,
  expertise,
  children,
}: {
  name: string
  title: string
  expertise: string[]
  children: React.ReactNode
}) {
  return (
    <Tooltip
      content={
        <div className="space-y-2">
          <div>
            <div className="font-semibold">{name}</div>
            <div className="text-[var(--theme-text-secondary)] text-xs">{title}</div>
          </div>
          <div>
            <div className="text-[var(--theme-text-secondary)] text-xs mb-1">Expertise:</div>
            <div className="flex flex-wrap gap-1">
              {expertise.slice(0, 3).map((exp, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-gray-800 rounded text-xs text-[var(--theme-text-secondary)]"
                >
                  {exp}
                </span>
              ))}
            </div>
          </div>
        </div>
      }
      maxWidth={300}
    >
      {children}
    </Tooltip>
  )
}

// ============================================================================
// STAT TOOLTIP
// ============================================================================

export function StatTooltip({
  value,
  label,
  trend,
  children,
}: {
  value: string | number
  label: string
  trend?: { value: number; label: string }
  children: React.ReactNode
}) {
  return (
    <Tooltip
      content={
        <div className="space-y-1">
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-[var(--theme-text-secondary)] text-xs">{label}</div>
          {trend && (
            <div
              className={`text-xs ${
                trend.value >= 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </div>
          )}
        </div>
      }
      maxWidth={200}
    >
      {children}
    </Tooltip>
  )
}
