'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn, styles } from '@/lib/utils'

export interface FormFieldGroupProps {
  /** Field label text */
  label: string
  /** Field type */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea'
  /** Current value */
  value: string | number
  /** Change handler */
  onChange: (value: string) => void
  /** Placeholder text */
  placeholder?: string
  /** Error message */
  error?: string
  /** Helper/description text */
  description?: string
  /** Whether field is required */
  required?: boolean
  /** Whether field is disabled */
  disabled?: boolean
  /** Input ID (auto-generated if not provided) */
  id?: string
  /** Additional class names for container */
  className?: string
  /** Min value for number type */
  min?: number
  /** Max value for number type */
  max?: number
  /** Step for number type */
  step?: number
  /** Rows for textarea */
  rows?: number
  /** Additional input/textarea props */
  inputClassName?: string
}

export function FormFieldGroup({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  description,
  required = false,
  disabled = false,
  id,
  className,
  min,
  max,
  step,
  rows = 3,
  inputClassName,
}: FormFieldGroupProps) {
  const generatedId = React.useId()
  const fieldId = id || generatedId

  const baseInputClasses = cn(
    styles.input.base,
    error && 'border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500',
    inputClassName
  )

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={fieldId} className={styles.colors.text.secondary}>
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </Label>

      {type === 'textarea' ? (
        <Textarea
          id={fieldId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className={cn(baseInputClasses, 'min-h-[100px]')}
        />
      ) : (
        <Input
          id={fieldId}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          className={baseInputClasses}
        />
      )}

      {description && !error && (
        <p className={cn('text-xs', styles.colors.text.tertiary)}>{description}</p>
      )}

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  )
}
