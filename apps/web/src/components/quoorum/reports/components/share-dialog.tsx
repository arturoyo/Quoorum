'use client'

/**
 * ShareDialog Component
 *
 * Dialog for generating and sharing report links.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/trpc/client'
import { CheckCircle, Copy, Loader2, Share2 } from 'lucide-react'
import { toast } from 'sonner'

interface ShareDialogProps {
  id: string
  shareToken: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onShared?: () => void
}

export function ShareDialog({
  id,
  shareToken,
  open,
  onOpenChange,
  onShared,
}: ShareDialogProps) {
  const [copied, setCopied] = useState(false)

  const shareReport = api.quoorumReports.share.useMutation({
    onSuccess: () => {
      toast.success('Enlace de compartir generado')
      onShared?.()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const shareUrl = shareToken
    ? `${window.location.origin}/quoorum/reports/shared/${shareToken}`
    : null

  const handleCopy = async () => {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleGenerateLink = () => {
    shareReport.mutate({ id, expiresInDays: 7 })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[#2a3942] bg-[#202c33] text-[#e9edef]">
        <DialogHeader>
          <DialogTitle>Compartir Informe</DialogTitle>
          <DialogDescription className="text-[#8696a0]">
            Genera un enlace para compartir este informe
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {shareUrl ? (
            <div className="space-y-2">
              <Label>Enlace para compartir</Label>
              <div className="flex gap-2">
                <Input readOnly value={shareUrl} className="border-[#2a3942] bg-[#111b21]" />
                <Button
                  variant="outline"
                  onClick={handleCopy}
                  className="shrink-0 border-[#2a3942] bg-[#111b21]"
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-[#8696a0]">Este enlace expira en 7 días</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#2a3942] py-8">
              <Share2 className="h-10 w-10 text-[#8696a0]" />
              <p className="mt-3 text-sm text-[#8696a0]">
                Genera un enlace para compartir este informe
              </p>
              <Button
                onClick={handleGenerateLink}
                disabled={shareReport.isPending}
                className="mt-4 bg-[#00a884] hover:bg-[#00a884]/90"
              >
                {shareReport.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Share2 className="mr-2 h-4 w-4" />
                )}
                Generar Enlace
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[#2a3942] bg-[#111b21]"
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
