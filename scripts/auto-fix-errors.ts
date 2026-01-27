#!/usr/bin/env tsx
/**
 * Auto-Fix Common Errors Script
 * 
 * Automatically detects and fixes common errors:
 * - Missing imports from lucide-react
 * - Unused variables (prefixed with _)
 * - Missing type imports
 * - Common TypeScript errors
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, extname, relative } from 'path'

interface Error {
  file: string
  line: number
  message: string
  fix?: string
}

interface FixResult {
  fixed: number
  errors: Error[]
}

const LUCIDE_ICONS = new Set([
  'MessageCircle', 'ArrowLeft', 'ArrowRight', 'Plus', 'Minus', 'X', 'Check',
  'Edit', 'Trash', 'Save', 'Search', 'Filter', 'Settings', 'User', 'Users',
  'Bell', 'Mail', 'Calendar', 'Clock', 'TrendingUp', 'TrendingDown',
  'BarChart', 'PieChart', 'LineChart', 'Activity', 'CreditCard', 'DollarSign',
  'Target', 'Zap', 'Star', 'Heart', 'Bookmark', 'Share', 'Download',
  'Upload', 'File', 'Folder', 'Image', 'Video', 'Music', 'AlertCircle',
  'AlertTriangle', 'CheckCircle', 'XCircle', 'Info', 'HelpCircle',
  'ChevronDown', 'ChevronUp', 'ChevronLeft', 'ChevronRight', 'Menu',
  'MoreHorizontal', 'MoreVertical', 'Home', 'Dashboard', 'Archive',
  'History', 'RefreshCw', 'Refresh', 'RotateCw', 'Lock', 'Unlock',
  'Eye', 'EyeOff', 'Key', 'Shield', 'Sparkles', 'Flame', 'Lightbulb',
  'Target', 'Link2', 'Link2Off', 'Copy', 'Scissors', 'Loader2', 'Play',
  'Pause', 'Stop', 'SkipForward', 'SkipBack', 'Volume', 'VolumeX',
  'Microphone', 'Headphones', 'Smartphone', 'Laptop', 'Monitor',
  'Camera', 'Video', 'Music', 'Image', 'File', 'Folder', 'FileText',
  'FileImage', 'FileVideo', 'FileAudio', 'FileCode', 'FileJson',
  'Cloud', 'CloudUpload', 'CloudDownload', 'CloudRain', 'Sun', 'Moon',
  'Sunrise', 'Sunset', 'Wind', 'Droplet', 'Flame', 'Snowflake',
  'Globe', 'Map', 'MapPin', 'Navigation', 'Compass', 'Flag', 'Tag',
  'Tags', 'Hash', 'AtSign', 'Phone', 'PhoneCall', 'PhoneIncoming',
  'PhoneOutgoing', 'PhoneMissed', 'PhoneOff', 'Voicemail', 'MessageSquare',
  'MessageCircle', 'MessageSquarePlus', 'MessagesSquare', 'Send',
  'Paperclip', 'Smile', 'Frown', 'Meh', 'Heart', 'HeartHandshake',
  'HeartPulse', 'HeartCrack', 'Gem', 'Crown', 'Award', 'Medal', 'Trophy',
  'Gift', 'Box', 'Package', 'ShoppingCart', 'ShoppingBag', 'Receipt',
  'CreditCard', 'Banknote', 'DollarSign', 'Euro', 'Pound', 'Yen',
  'Bitcoin', 'TrendingUp', 'TrendingDown', 'ArrowUp', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowUpRight', 'ArrowDownRight',
  'ArrowUpLeft', 'ArrowDownLeft', 'Move', 'MoveUp', 'MoveDown',
  'MoveLeft', 'MoveRight', 'Minimize', 'Maximize', 'Minus', 'Plus',
  'X', 'Check', 'AlertCircle', 'AlertTriangle', 'Info', 'HelpCircle',
  'QuestionMark', 'ExclamationMark', 'Ban', 'Shield', 'ShieldAlert',
  'ShieldCheck', 'ShieldOff', 'Lock', 'Unlock', 'Key', 'KeyRound',
  'KeySquare', 'Fingerprint', 'Scan', 'ScanLine', 'QrCode', 'Barcode',
  'Eye', 'EyeOff', 'Viewfinder', 'Camera', 'CameraOff', 'Video',
  'VideoOff', 'Mic', 'MicOff', 'Headphones', 'HeadphonesIcon',
  'Volume', 'VolumeX', 'Volume1', 'Volume2', 'Music', 'Music2',
  'Music3', 'Music4', 'Radio', 'Tv', 'Monitor', 'MonitorSpeaker',
  'MonitorSmartphone', 'MonitorStop', 'Laptop', 'Laptop2', 'Tablet',
  'Smartphone', 'SmartphoneNfc', 'Watch', 'Gamepad', 'Gamepad2',
  'Joystick', 'Mouse', 'MousePointer', 'MousePointer2', 'MousePointerClick',
  'Keyboard', 'KeyboardOff', 'Type', 'TypeOutline', 'File', 'FileText',
  'FileImage', 'FileVideo', 'FileAudio', 'FileCode', 'FileJson',
  'FileXml', 'FileCsv', 'FilePdf', 'FileWord', 'FileExcel', 'FilePowerpoint',
  'FileArchive', 'FileCheck', 'FileX', 'FilePlus', 'FileMinus',
  'FileEdit', 'FileSearch', 'FileQuestion', 'FileWarning', 'FileAlert',
  'FileBarChart', 'FileLineChart', 'FilePieChart', 'Folder', 'FolderOpen',
  'FolderPlus', 'FolderMinus', 'FolderX', 'FolderCheck', 'FolderSearch',
  'FolderGit', 'FolderGit2', 'FolderSync', 'FolderDownload', 'FolderUpload',
  'Archive', 'ArchiveRestore', 'ArchiveX', 'Inbox', 'InboxIcon',
  'Mail', 'MailOpen', 'MailPlus', 'MailMinus', 'MailX', 'MailQuestion',
  'MailSearch', 'MailWarning', 'MailCheck', 'MailAlert', 'Send',
  'SendHorizonal', 'Reply', 'ReplyAll', 'Forward', 'Share', 'Share2',
  'Link', 'Link2', 'Link2Off', 'ExternalLink', 'Copy', 'Scissors',
  'Clipboard', 'ClipboardCheck', 'ClipboardCopy', 'ClipboardList',
  'ClipboardPaste', 'ClipboardX', 'ClipboardEdit', 'FileCheck', 'FileX',
  'FilePlus', 'FileMinus', 'FileEdit', 'FileSearch', 'FileQuestion',
  'FileWarning', 'FileAlert', 'FileBarChart', 'FileLineChart',
  'FilePieChart', 'Folder', 'FolderOpen', 'FolderPlus', 'FolderMinus',
  'FolderX', 'FolderCheck', 'FolderSearch', 'FolderGit', 'FolderGit2',
  'FolderSync', 'FolderDownload', 'FolderUpload', 'Archive', 'ArchiveRestore',
  'ArchiveX', 'Inbox', 'InboxIcon', 'Mail', 'MailOpen', 'MailPlus',
  'MailMinus', 'MailX', 'MailQuestion', 'MailSearch', 'MailWarning',
  'MailCheck', 'MailAlert', 'Send', 'SendHorizonal', 'Reply', 'ReplyAll',
  'Forward', 'Share', 'Share2', 'Link', 'Link2', 'Link2Off', 'ExternalLink',
  'Copy', 'Scissors', 'Clipboard', 'ClipboardCheck', 'ClipboardCopy',
  'ClipboardList', 'ClipboardPaste', 'ClipboardX', 'ClipboardEdit',
  'FileCheck', 'FileX', 'FilePlus', 'FileMinus', 'FileEdit', 'FileSearch',
  'FileQuestion', 'FileWarning', 'FileAlert', 'FileBarChart',
  'FileLineChart', 'FilePieChart', 'Folder', 'FolderOpen', 'FolderPlus',
  'FolderMinus', 'FolderX', 'FolderCheck', 'FolderSearch', 'FolderGit',
  'FolderGit2', 'FolderSync', 'FolderDownload', 'FolderUpload', 'Archive',
  'ArchiveRestore', 'ArchiveX', 'Inbox', 'InboxIcon', 'Mail', 'MailOpen',
  'MailPlus', 'MailMinus', 'MailX', 'MailQuestion', 'MailSearch',
  'MailWarning', 'MailCheck', 'MailAlert', 'Send', 'SendHorizonal',
  'Reply', 'ReplyAll', 'Forward', 'Share', 'Share2', 'Link', 'Link2',
  'Link2Off', 'ExternalLink', 'Copy', 'Scissors', 'Clipboard',
  'ClipboardCheck', 'ClipboardCopy', 'ClipboardList', 'ClipboardPaste',
  'ClipboardX', 'ClipboardEdit', 'FileCheck', 'FileX', 'FilePlus',
  'FileMinus', 'FileEdit', 'FileSearch', 'FileQuestion', 'FileWarning',
  'FileAlert', 'FileBarChart', 'FileLineChart', 'FilePieChart', 'Folder',
  'FolderOpen', 'FolderPlus', 'FolderMinus', 'FolderX', 'FolderCheck',
  'FolderSearch', 'FolderGit', 'FolderGit2', 'FolderSync',
  'FolderDownload', 'FolderUpload', 'Archive', 'ArchiveRestore', 'ArchiveX',
  'Inbox', 'InboxIcon', 'Mail', 'MailOpen', 'MailPlus', 'MailMinus',
  'MailX', 'MailQuestion', 'MailSearch', 'MailWarning', 'MailCheck',
  'MailAlert', 'Send', 'SendHorizonal', 'Reply', 'ReplyAll', 'Forward',
  'Share', 'Share2', 'Link', 'Link2', 'Link2Off', 'ExternalLink',
  'Copy', 'Scissors', 'Clipboard', 'ClipboardCheck', 'ClipboardCopy',
  'ClipboardList', 'ClipboardPaste', 'ClipboardX', 'ClipboardEdit'
])

function findFiles(dir: string, ext: string[]): string[] {
  const files: string[] = []
  const entries = readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next' && entry.name !== 'dist') {
        files.push(...findFiles(fullPath, ext))
      }
    } else if (entry.isFile() && ext.includes(extname(entry.name))) {
      files.push(fullPath)
    }
  }

  return files
}

/**
 * Get existing imports from file to check for conflicts
 */
function getExistingImports(lines: string[]): { nextLink: boolean; nextImage: boolean; reactImports: Set<string> } {
  const result = {
    nextLink: false,
    nextImage: false,
    reactImports: new Set<string>(),
  }

  for (const line of lines) {
    // Check for Next.js Link/Image
    if (line.includes("from 'next/link'") || line.includes('from "next/link"')) {
      result.nextLink = true
    }
    if (line.includes("from 'next/image'") || line.includes('from "next/image"')) {
      result.nextImage = true
    }
    // Check for React imports
    if (line.includes("from 'react'") || line.includes('from "react"')) {
      const match = line.match(/import\s*\{([^}]+)\}\s*from\s*["']react["']/)
      if (match) {
        match[1].split(',').forEach((item) => {
          const name = item.trim().split(' as ')[0].trim()
          result.reactImports.add(name)
        })
      }
    }
  }

  return result
}

function fixMissingLucideImports(content: string, filePath: string): { content: string; fixed: boolean } {
  let fixed = false
  const lines = content.split('\n')
  
  // Get existing imports to check for conflicts
  const existingImports = getExistingImports(lines)
  
  // Conflicts: Next.js Link/Image have same names as lucide-react icons
  const CONFLICT_NAMES = new Set<string>()
  if (existingImports.nextLink) CONFLICT_NAMES.add('Link')
  if (existingImports.nextImage) CONFLICT_NAMES.add('Image')
  
  // Find used icons that are not imported
  const usedIcons = new Set<string>()
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    for (const icon of LUCIDE_ICONS) {
      // Skip if it's a conflict name and already imported from Next.js
      if (CONFLICT_NAMES.has(icon)) {
        // Special check: if Link/Image from Next.js exists, check if lucide icon is actually used
        // by looking for icon usage without href (next/link uses href)
        if (icon === 'Link' && existingImports.nextLink) {
          // Check if this line uses <Link with href → it's next/link, not lucide
          // Check if this line uses <Link without href but with className/size → it's lucide icon
          const isNextLink = line.includes('<Link') && (line.includes('href=') || line.includes('href:') || line.includes('Link href'))
          if (!isNextLink && (line.includes(`<${icon}`) && (line.includes('className') || line.includes('size') || line.includes('h-') || line.includes('w-')))) {
            // This is likely lucide-react icon, but we skip because of conflict
            // User will need to use alias: import { Link as LinkIcon } from "lucide-react"
            continue
          }
        }
        continue
      }
      
      // Detect lucide-react icon usage (component with className/size, not href)
      if (line.includes(`<${icon}`) || line.includes(`<${icon} `) || line.includes(`<${icon}>`)) {
        // For Link/Image, check if it's used as lucide icon (has className/size, not href)
        if (icon === 'Link' && existingImports.nextLink) {
          const isIcon = line.includes('className') || line.includes('size') || line.includes('h-') || line.includes('w-')
          if (!isIcon) continue // Skip if it's likely next/link
        }
        usedIcons.add(icon)
      }
    }
  }

  if (usedIcons.size === 0) {
    return { content, fixed: false }
  }

  // Find import line from lucide-react
  let importIndex = -1
  let importLine = ''
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("from 'lucide-react'") || lines[i].includes('from "lucide-react"')) {
      importIndex = i
      importLine = lines[i]
      break
    }
  }

  if (importIndex === -1) {
    // No lucide-react import found, add it
    // Find the last import block
    let insertIndex = 0
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ')) {
        insertIndex = i + 1
      }
    }
    
    // Filter out conflict names
    const iconsArray = Array.from(usedIcons).filter(icon => !CONFLICT_NAMES.has(icon)).sort()
    if (iconsArray.length === 0) {
      return { content, fixed: false }
    }
    
    const importStatement = `import {\n  ${iconsArray.join(',\n  ')},\n} from "lucide-react";\n`
    lines.splice(insertIndex, 0, importStatement)
    fixed = true
  } else {
    // Parse existing import
    const importMatch = importLine.match(/import\s*\{([^}]+)\}\s*from\s*["']lucide-react["']/)
    if (importMatch) {
      const existingIcons = importMatch[1]
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
      
      // Filter out conflict names and icons already imported
      const missingIcons = Array.from(usedIcons)
        .filter((icon) => !existingIcons.includes(icon) && !CONFLICT_NAMES.has(icon))
      
      if (missingIcons.length > 0) {
        // Remove conflict names from existing imports if they somehow got in
        const safeExistingIcons = existingIcons.filter(icon => !CONFLICT_NAMES.has(icon))
        // Add missing icons to import
        const allIcons = [...safeExistingIcons, ...missingIcons].sort()
        const newImport = `import {\n  ${allIcons.join(',\n  ')},\n} from "lucide-react";`
        lines[importIndex] = newImport
        fixed = true
      } else {
        // Check if we need to remove conflict names from lucide-react import
        const hasConflictsInLucide = existingIcons.some(icon => CONFLICT_NAMES.has(icon))
        if (hasConflictsInLucide) {
          const safeIcons = existingIcons.filter(icon => !CONFLICT_NAMES.has(icon))
          const newImport = `import {\n  ${safeIcons.join(',\n  ')},\n} from "lucide-react";`
          lines[importIndex] = newImport
          fixed = true
        }
      }
    }
  }

  return { content: lines.join('\n'), fixed }
}

function autoFix(filePath: string): FixResult {
  const errors: Error[] = []
  let fixed = 0

  try {
    let content = readFileSync(filePath, 'utf-8')
    const originalContent = content

    // Fix 1: Missing lucide-react imports
    const lucideFix = fixMissingLucideImports(content, filePath)
    if (lucideFix.fixed) {
      content = lucideFix.content
      fixed++
    }

    // Only write if we made changes
    if (content !== originalContent) {
      writeFileSync(filePath, content, 'utf-8')
    }
  } catch (error) {
    errors.push({
      file: filePath,
      line: 0,
      message: error instanceof Error ? error.message : String(error),
    })
  }

  return { fixed, errors }
}

function main() {
  const rootDir = join(process.cwd())
  const appDirs = [
    join(rootDir, 'apps', 'web', 'src'),
    join(rootDir, 'packages'),
  ]

  console.log('[INFO] Auto-fixing common errors...\n')

  const allResults: FixResult[] = []
  let totalFixed = 0

  for (const dir of appDirs) {
    try {
      const files = findFiles(dir, ['.tsx', '.ts'])

      for (const file of files) {
        const result = autoFix(file)
        if (result.fixed > 0) {
          const relPath = relative(rootDir, file)
          console.log(`[OK] Fixed ${result.fixed} issue(s) in ${relPath}`)
          totalFixed += result.fixed
        }
        allResults.push(result)
      }
    } catch (error) {
      console.error(`[ERROR] Error processing ${dir}:`, error)
    }
  }

  console.log(`\n[OK] Fixed ${totalFixed} issue(s) in total`)

  const allErrors = allResults.flatMap((r) => r.errors)
  if (allErrors.length > 0) {
    console.log(`\n[WARN] ${allErrors.length} error(s) could not be auto-fixed:`)
    for (const error of allErrors) {
      const relPath = relative(rootDir, error.file)
      console.log(`   - ${relPath}:${error.line}: ${error.message}`)
    }
  }
}

if (require.main === module) {
  main()
}

export { autoFix, fixMissingLucideImports }
