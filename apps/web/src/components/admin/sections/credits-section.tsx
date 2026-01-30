/**
 * Credits Section
 * Gestión masiva de créditos
 */

'use client'

import { useState } from 'react'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Plus } from 'lucide-react'

export function CreditsSection({ isInModal = false }: { isInModal?: boolean }) {
  const [userId, setUserId] = useState('')
  const [credits, setCredits] = useState(0)

  const updateCredits = api.admin.updateUserCredits.useMutation({
    onSuccess: () => {
      toast.success('Créditos actualizados')
      setUserId('')
      setCredits(0)
    },
    onError: (error) => {
      toast.error(error.message || 'Error al actualizar créditos')
    },
  })

  const handleSubmit = () => {
    if (!userId || credits < 0) {
      toast.error('Datos inválidos')
      return
    }
    updateCredits.mutate({ userId, credits })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Gestión de Créditos</h2>
        <p className="text-sm styles.colors.text.secondary mt-1">
          Actualiza créditos de usuarios individuales
        </p>
      </div>

      <Card className="bg-slate-900/60 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white">Actualizar Créditos</CardTitle>
          <CardDescription className="styles.colors.text.secondary">
            Ingresa el ID del usuario y la cantidad de créditos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId" className="styles.colors.text.secondary">
              User ID (UUID)
            </Label>
            <Input
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="00000000-0000-0000-0000-000000000000"
              className="bg-slate-800/60 border-purple-500/30 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="credits" className="styles.colors.text.secondary">
              Créditos
            </Label>
            <Input
              id="credits"
              type="number"
              value={credits}
              onChange={(e) => setCredits(parseInt(e.target.value) || 0)}
              className="bg-slate-800/60 border-purple-500/30 text-white"
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={updateCredits.isPending}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {updateCredits.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Actualizar Créditos
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
