'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Download, FileText, Presentation, Table, Code, Loader2 } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { toast } from 'sonner'

interface DebateExportProps {
  debateId: string
  className?: string
}

export function DebateExport({ debateId, className }: DebateExportProps) {
  const [format, setFormat] = useState<'pdf' | 'powerpoint' | 'excel' | 'markdown' | 'json'>('pdf')
  const [isExporting, setIsExporting] = useState(false)

  const exportMutation = api.debates.export.useMutation({
    onSuccess: (data) => {
      try {
        // Decode base64 if needed
        let blob: Blob
        if (typeof data.content === 'string' && data.content.length > 100) {
          // Likely base64
          const binaryString = atob(data.content)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          blob = new Blob([bytes], { type: data.mimeType })
        } else {
          // Plain text (markdown, json)
          blob = new Blob([data.content], { type: data.mimeType })
        }

        // Download file
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = data.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        toast.success('Exportación completada')
        setIsExporting(false)
      } catch (error) {
        toast.error(`Error al descargar: ${error instanceof Error ? error.message : 'Error desconocido'}`)
        setIsExporting(false)
      }
    },
    onError: (error) => {
      toast.error(`Error al exportar: ${error.message}`)
      setIsExporting(false)
    },
  })

  const handleExport = () => {
    setIsExporting(true)
    exportMutation.mutate({
      debateId,
      format,
      includeFullTranscript: true,
      includeArgumentTree: false,
      includeConsensusTimeline: false,
    })
  }

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <Select value={format} onValueChange={(v) => setFormat(v as typeof format)}>
        <SelectTrigger className="w-[180px] bg-[#2a3942] border-[#2a3942] text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-[#111b21] border-[#2a3942]">
          <SelectItem value="pdf" className="text-white">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              PDF
            </div>
          </SelectItem>
          <SelectItem value="powerpoint" className="text-white">
            <div className="flex items-center gap-2">
              <Presentation className="h-4 w-4" />
              PowerPoint
            </div>
          </SelectItem>
          <SelectItem value="excel" className="text-white">
            <div className="flex items-center gap-2">
              <Table className="h-4 w-4" />
              Excel
            </div>
          </SelectItem>
          <SelectItem value="markdown" className="text-white">
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Markdown
            </div>
          </SelectItem>
          <SelectItem value="json" className="text-white">
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              JSON
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      <Button
        onClick={handleExport}
        disabled={isExporting}
        className="bg-purple-600 hover:bg-purple-700 text-white"
      >
        {isExporting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Exportando...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </>
        )}
      </Button>
    </div>
  )
}
