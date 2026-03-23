'use client'

import { Editor } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'

interface MonacoPromptEditorProps {
  value: string
  onChange: (value: string) => void
  height?: string
  placeholder?: string
  readOnly?: boolean
}

export function MonacoPromptEditor({
  value,
  onChange,
  height = '400px',
  placeholder,
  readOnly = false,
}: MonacoPromptEditorProps) {
  const handleEditorChange = (newValue: string | undefined) => {
    onChange(newValue || '')
  }

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    // Configure Monaco editor for prompt templates
    editor.updateOptions({
      minimap: { enabled: false },
      wordWrap: 'on',
      lineNumbers: 'on',
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      scrollBeyondLastLine: false,
      readOnly,
    })
  }

  return (
    <div className="border rounded-md overflow-hidden bg-zinc-950">
      <Editor
        height={height}
        defaultLanguage="markdown"
        theme="vs-dark"
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          wordWrap: 'on',
          lineNumbers: 'on',
          fontSize: 13,
          scrollBeyondLastLine: false,
          readOnly,
          suggest: {
            snippetsPreventQuickSuggestions: false,
          },
        }}
        loading={
          <div className="flex items-center justify-center h-full bg-zinc-950 text-zinc-400">
            Cargando editor...
          </div>
        }
      />
      {placeholder && !value && (
        <div className="absolute inset-0 flex items-start justify-start p-4 text-zinc-500 pointer-events-none">
          {placeholder}
        </div>
      )}
    </div>
  )
}
