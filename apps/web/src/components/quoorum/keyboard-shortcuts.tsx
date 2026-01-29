/**
 * Keyboard Shortcuts for Quoorum
 * 
 * Quick bonus: Keyboard shortcuts for power users
 */

'use client'

import React, { useEffect, useState } from 'react'
import {
  Key,
  Keyboard,
} from "lucide-react";


// ============================================================================
// KEYBOARD SHORTCUTS HOOK
// ============================================================================

export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase()
      const ctrl = event.ctrlKey || event.metaKey
      const shift = event.shiftKey
      const alt = event.altKey
      
      // Build shortcut string
      let shortcut = ''
      if (ctrl) shortcut += 'ctrl+'
      if (shift) shortcut += 'shift+'
      if (alt) shortcut += 'alt+'
      shortcut += key
      
      // Execute shortcut if exists
      const handler = shortcuts[shortcut]
      if (handler) {
        event.preventDefault()
        handler()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

// ============================================================================
// SHORTCUTS MODAL
// ============================================================================

export function KeyboardShortcutsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null
  
  const shortcuts = [
    { keys: ['Ctrl', 'N'], description: 'Crear nuevo debate' },
    { keys: ['Ctrl', 'K'], description: 'Buscar debates' },
    { keys: ['Ctrl', 'S'], description: 'Guardar debate' },
    { keys: ['Ctrl', 'E'], description: 'Exportar a PDF' },
    { keys: ['Ctrl', 'D'], description: 'Duplicar debate' },
    { keys: ['Ctrl', 'Shift', 'D'], description: 'Eliminar debate' },
    { keys: ['Ctrl', 'A'], description: 'Ver analytics' },
    { keys: ['Ctrl', 'X'], description: 'Ver expertos' },
    { keys: ['Ctrl', 'R'], description: 'Refrescar' },
    { keys: ['Ctrl', 'H'], description: 'Ver ayuda' },
    { keys: ['Escape'], description: 'Cerrar modal' },
    { keys: ['/', '?'], description: 'Ver atajos de teclado' },
  ]
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[var(--theme-text-primary)]">Atajos de Teclado</h2>
          <button 
            onClick={onClose}
            className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-tertiary)] transition-colors text-2xl"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-3">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <span className="text-[var(--theme-text-secondary)]">{shortcut.description}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((key, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span className="text-[var(--theme-text-secondary)] mx-1">+</span>}
                    <kbd className="px-3 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono">
                      {key}
                    </kbd>
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 text-sm text-[var(--theme-text-tertiary)] text-center">
          Presiona <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">?</kbd> en cualquier momento para ver esta ayuda
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SHORTCUTS PROVIDER
// ============================================================================

export function ForumKeyboardShortcuts({ children }: { children: React.ReactNode }) {
  const [showHelp, setShowHelp] = useState(false)
  
  useKeyboardShortcuts({
    '?': () => setShowHelp(true),
    'escape': () => setShowHelp(false),
  })
  
  return (
    <>
      {children}
      <KeyboardShortcutsModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </>
  )
}
