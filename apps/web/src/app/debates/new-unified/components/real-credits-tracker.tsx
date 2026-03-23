/**
 * RealCreditsTracker Component
 *
 * Shows real credits deducted in real-time during debate creation.
 * Displays accumulated costs vs estimated costs for transparency.
 */

'use client'

import { Coins, TrendingUp, CheckCircle2 } from 'lucide-react'
import { cn, styles } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'

interface RealCreditsTrackerProps {
  realCreditsDeducted: number
  estimatedCredits?: number
  showComparison?: boolean
  variant?: 'inline' | 'card' | 'compact'
  className?: string
}

export function RealCreditsTracker({
  realCreditsDeducted,
  estimatedCredits,
  showComparison = false,
  variant = 'inline',
  className,
}: RealCreditsTrackerProps) {
  const difference = estimatedCredits ? realCreditsDeducted - estimatedCredits : 0
  const isOverEstimate = difference > 0
  const isUnderEstimate = difference < 0

  if (variant === 'compact') {
    return (
      <div className={cn('inline-flex items-center gap-1.5 text-sm', className)}>
        <Coins className="h-3.5 w-3.5 text-amber-400" />
        <span className="font-medium text-amber-400">{realCreditsDeducted}</span>
        <span className="styles.colors.text.tertiary">gastados</span>
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <Card className={cn('styles.colors.border.default styles.colors.bg.secondary backdrop-blur-xl', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-amber-500/10 p-2">
                <Coins className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium styles.colors.text.primary">
                  Créditos Gastados
                </p>
                <p className="text-xs styles.colors.text.tertiary">
                  En esta fase
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-amber-400">
                {realCreditsDeducted}
              </p>
              {showComparison && estimatedCredits !== undefined && (
                <div className="flex items-center gap-1 text-xs">
                  {isOverEstimate && (
                    <>
                      <TrendingUp className="h-3 w-3 text-red-400" />
                      <span className="text-red-400">
                        +{difference} vs estimado
                      </span>
                    </>
                  )}
                  {isUnderEstimate && (
                    <>
                      <CheckCircle2 className="h-3 w-3 text-green-400" />
                      <span className="text-green-400">
                        {Math.abs(difference)} bajo estimado
                      </span>
                    </>
                  )}
                  {!isOverEstimate && !isUnderEstimate && (
                    <span className="styles.colors.text.tertiary">
                      Según estimado
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // variant === 'inline'
  return (
    <div className={cn(
      'inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2',
      className
    )}>
      <Coins className="h-4 w-4 text-amber-400" />
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm font-semibold text-amber-400">
          {realCreditsDeducted} créditos
        </span>
        <span className="text-xs styles.colors.text.tertiary">
          gastados
        </span>
      </div>
      {showComparison && estimatedCredits !== undefined && (
        <>
          <div className="h-4 w-px bg-amber-500/30" />
          <span className="text-xs styles.colors.text.secondary">
            Est: {estimatedCredits}
          </span>
        </>
      )}
    </div>
  )
}
