/**
 * Command Palette (Spotlight-style)
 * 
 * OMG-level productivity feature
 * Press Cmd+K to access everything instantly
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ============================================================================
// TYPES
// ============================================================================

interface Command {
  id: string
  title: string
  description?: string
  icon?: string
  category: 'debates' | 'experts' | 'templates' | 'actions' | 'navigation'
  keywords: string[]
  action: () => void
  shortcut?: string
}

// ============================================================================
// COMMAND PALETTE
// ============================================================================

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Open with Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }

      if (e.key === 'Escape') {
        setIsOpen(false)
        setSearch('')
        setSelectedIndex(0)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Commands
  const commands: Command[] = useMemo(
    () => [
      // Debates
      {
        id: 'new-debate',
        title: 'New Debate',
        description: 'Start a new strategic debate',
        icon: '💬',
        category: 'debates',
        keywords: ['new', 'create', 'debate', 'start'],
        action: () => {
          // Navigate to new debate
          setIsOpen(false)
        },
        shortcut: 'N',
      },
      {
        id: 'view-debates',
        title: 'View All Debates',
        description: 'See your debate history',
        icon: '📋',
        category: 'debates',
        keywords: ['view', 'list', 'all', 'debates', 'history'],
        action: () => {
          // Navigate to debates list
          setIsOpen(false)
        },
      },
      {
        id: 'schedule-debate',
        title: 'Schedule Debate',
        description: 'Schedule a debate for later',
        icon: '⏰',
        category: 'debates',
        keywords: ['schedule', 'later', 'time', 'calendar'],
        action: () => {
          setIsOpen(false)
        },
      },

      // Experts
      {
        id: 'view-experts',
        title: 'Browse Experts',
        description: 'See all available experts',
        icon: '👥',
        category: 'experts',
        keywords: ['experts', 'browse', 'view', 'all'],
        action: () => {
          setIsOpen(false)
        },
      },
      {
        id: 'create-expert',
        title: 'Create Custom Expert',
        description: 'Add your own expert',
        icon: '➕',
        category: 'experts',
        keywords: ['create', 'custom', 'expert', 'new', 'add'],
        action: () => {
          setIsOpen(false)
        },
      },

      // Templates
      {
        id: 'browse-templates',
        title: 'Browse Templates',
        description: 'See all debate templates',
        icon: '📄',
        category: 'templates',
        keywords: ['templates', 'browse', 'view'],
        action: () => {
          setIsOpen(false)
        },
      },
      {
        id: 'create-template',
        title: 'Create Template',
        description: 'Save a custom template',
        icon: '✨',
        category: 'templates',
        keywords: ['create', 'template', 'save', 'custom'],
        action: () => {
          setIsOpen(false)
        },
      },

      // Actions
      {
        id: 'export-pdf',
        title: 'Export to PDF',
        description: 'Export current debate as PDF',
        icon: '📥',
        category: 'actions',
        keywords: ['export', 'pdf', 'download', 'save'],
        action: () => {
          setIsOpen(false)
        },
        shortcut: 'E',
      },
      {
        id: 'share-debate',
        title: 'Share Debate',
        description: 'Share with your team',
        icon: '🔗',
        category: 'actions',
        keywords: ['share', 'link', 'team', 'collaborate'],
        action: () => {
          setIsOpen(false)
        },
        shortcut: 'S',
      },
      {
        id: 'copy-summary',
        title: 'Copy Summary',
        description: 'Copy debate summary to clipboard',
        icon: '📋',
        category: 'actions',
        keywords: ['copy', 'summary', 'clipboard'],
        action: () => {
          setIsOpen(false)
        },
      },

      // Navigation
      {
        id: 'go-analytics',
        title: 'Analytics Dashboard',
        description: 'View your analytics',
        icon: '📊',
        category: 'navigation',
        keywords: ['analytics', 'dashboard', 'stats', 'metrics'],
        action: () => {
          setIsOpen(false)
        },
        shortcut: 'A',
      },
      {
        id: 'go-settings',
        title: 'Settings',
        description: 'Configure Quoorum settings',
        icon: '⚙️',
        category: 'navigation',
        keywords: ['settings', 'config', 'preferences'],
        action: () => {
          setIsOpen(false)
        },
      },
      {
        id: 'keyboard-shortcuts',
        title: 'Keyboard Shortcuts',
        description: 'View all shortcuts',
        icon: '⌨️',
        category: 'navigation',
        keywords: ['keyboard', 'shortcuts', 'keys', 'help'],
        action: () => {
          setIsOpen(false)
        },
        shortcut: '?',
      },
    ],
    []
  )

  // Filter commands
  const filteredCommands = useMemo(() => {
    if (!search) return commands

    const searchLower = search.toLowerCase()
    return commands.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(searchLower) ||
        cmd.description?.toLowerCase().includes(searchLower) ||
        cmd.keywords.some((kw) => kw.includes(searchLower))
    )
  }, [commands, search])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        filteredCommands[selectedIndex]?.action()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, filteredCommands])

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setIsOpen(false)}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
      />

      {/* Command Palette */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-50"
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
          {/* Search Input */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔍</span>
              <input
                type="text"
                placeholder="Type a command or search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="flex-1 text-lg outline-none bg-transparent"
              />
              <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 rounded border border-gray-300">
                ESC
              </kbd>
            </div>
          </div>

          {/* Commands List */}
          <div className="max-h-[400px] overflow-y-auto">
            {filteredCommands.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-lg mb-2">No commands found</p>
                <p className="text-sm">Try a different search term</p>
              </div>
            ) : (
              <div className="p-2">
                {/* Group by category */}
                {['debates', 'experts', 'templates', 'actions', 'navigation'].map((category) => {
                  const categoryCommands = filteredCommands.filter((cmd) => cmd.category === category)
                  if (categoryCommands.length === 0) return null

                  return (
                    <div key={category} className="mb-4">
                      <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {category}
                      </div>
                      {categoryCommands.map((cmd) => {
                        const globalIndex = filteredCommands.indexOf(cmd)
                        const isSelected = globalIndex === selectedIndex

                        return (
                          <motion.button
                            key={cmd.id}
                            onClick={cmd.action}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                              isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100'
                            }`}
                            whileHover={{ x: 4 }}
                            transition={{ duration: 0.1 }}
                          >
                            <span className="text-2xl">{cmd.icon}</span>
                            <div className="flex-1 text-left">
                              <div className="font-medium">{cmd.title}</div>
                              {cmd.description && (
                                <div className="text-sm text-gray-500">{cmd.description}</div>
                              )}
                            </div>
                            {cmd.shortcut && (
                              <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 rounded border border-gray-300">
                                {cmd.shortcut}
                              </kbd>
                            )}
                          </motion.button>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 font-mono bg-white rounded border border-gray-300">↑</kbd>
                <kbd className="px-1.5 py-0.5 font-mono bg-white rounded border border-gray-300">↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 font-mono bg-white rounded border border-gray-300">↵</kbd>
                Select
              </span>
            </div>
            <span>Press ⌘K to open anytime</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ============================================================================
// COMMAND PALETTE TRIGGER BUTTON
// ============================================================================

export function CommandPaletteTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <span>🔍</span>
      <span>Search...</span>
      <kbd className="ml-auto px-2 py-0.5 text-xs font-mono bg-gray-100 rounded border border-gray-300">
        ⌘K
      </kbd>
    </button>
  )
}
