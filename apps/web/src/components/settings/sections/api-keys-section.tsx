'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Loader2,
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  Key,
} from 'lucide-react'

interface ApiKeysSectionProps {
  isInModal?: boolean
}

export function ApiKeysSection({ isInModal = false }: ApiKeysSectionProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKey, setNewKey] = useState<string | null>(null)
  const [showKey, setShowKey] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Auth check (runs BEFORE query)
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (!isInModal) {
          router.push('/login')
        }
        return
      }
      setIsAuthenticated(true)
    }
    checkAuth()
  }, [router, supabase.auth, isInModal])

  // Queries (only execute when authenticated)
  const { data: apiKeys, isLoading, refetch } = api.apiKeys.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  )

  // Mutations
  const createKey = api.apiKeys.create.useMutation({
    onSuccess: (data) => {
      setNewKey(data.key)
      setNewKeyName('')
      toast.success('API key creada correctamente')
      void refetch()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const deleteKey = api.apiKeys.delete.useMutation({
    onSuccess: () => {
      toast.success('API key eliminada')
      void refetch()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleCreateKey = () => {
    if (!newKeyName.trim()) {
      toast.error('Por favor, introduce un nombre para la API key')
      return
    }
    createKey.mutate({ name: newKeyName })
  }

  const handleDeleteKey = (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta API key? Esta acción no se puede deshacer.')) {
      deleteKey.mutate({ id })
    }
  }

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text)
    toast.success('Copiado al portapapeles')
  }

  const handleCloseDialog = () => {
    setNewKey(null)
    setNewKeyName('')
    setShowKey(false)
    setIsDialogOpen(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-[var(--theme-text-primary)]">API Keys</h1>
        <p className="text-[var(--theme-text-secondary)]">
          Gestiona tus claves de acceso a la API de Quoorum
        </p>
      </div>

      <Card className="bg-[var(--theme-bg-secondary)] border-[var(--theme-border)]">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-[var(--theme-text-primary)]">Tus API Keys</CardTitle>
            <CardDescription className="text-[var(--theme-text-secondary)]">
              Crea y administra tus claves de acceso
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="mr-2 h-4 w-4" />
                Nueva API Key
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[var(--theme-bg-secondary)] border-[var(--theme-border)]">
              <DialogHeader>
                <DialogTitle className="text-[var(--theme-text-primary)]">
                  Crear Nueva API Key
                </DialogTitle>
                <DialogDescription className="text-[var(--theme-text-secondary)]">
                  Dale un nombre descriptivo a tu API key para identificarla
                  fácilmente.
                </DialogDescription>
              </DialogHeader>

              {newKey ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />
                      <div>
                        <p className="text-yellow-300 font-medium">
                          Guarda esta key ahora
                        </p>
                        <p className="text-yellow-200/70 text-sm mt-1">
                          No podrás ver esta key de nuevo. Guárdala en un lugar
                          seguro.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      type={showKey ? 'text' : 'password'}
                      value={newKey}
                      readOnly
                      className="bg-[var(--theme-bg-tertiary)] border-[var(--theme-border)] text-[var(--theme-text-primary)] font-mono"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowKey(!showKey)}
                      className="text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-primary)]"
                    >
                      {showKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(newKey)}
                      className="text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-primary)]"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  <DialogFooter>
                    <Button
                      onClick={handleCloseDialog}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Listo
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                <>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="keyName" className="text-[var(--theme-text-secondary)]">
                        Nombre
                      </Label>
                      <Input
                        id="keyName"
                        placeholder="Ej: Production API"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        className="bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)]"
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      onClick={handleCreateKey}
                      disabled={createKey.isLoading}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {createKey.isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creando...
                        </>
                      ) : (
                        'Crear API Key'
                      )}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {apiKeys && apiKeys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="w-12 h-12 text-[var(--theme-text-tertiary)] mx-auto mb-4" />
              <p className="text-[var(--theme-text-tertiary)]">No tienes API keys aún</p>
              <p className="text-[var(--theme-text-tertiary)] text-sm mt-1">
                Crea una para empezar a usar la API de Quoorum
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys?.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-[var(--theme-bg-tertiary)]"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[var(--theme-text-primary)] font-medium">{key.name}</p>
                      <Badge className="bg-gray-500/20 text-[var(--theme-text-tertiary)]">
                        {key.prefix}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-[var(--theme-text-tertiary)]">
                      <span>
                        Creada:{' '}
                        {new Date(key.createdAt).toLocaleDateString('es-ES')}
                      </span>
                      {key.lastUsedAt && (
                        <span>
                          Último uso:{' '}
                          {new Date(key.lastUsedAt).toLocaleDateString('es-ES')}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteKey(key.id)}
                    disabled={deleteKey.isLoading}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-[var(--theme-bg-secondary)] border-[var(--theme-border)]">
        <CardHeader>
          <CardTitle className="text-[var(--theme-text-primary)]">Documentación API</CardTitle>
          <CardDescription className="text-[var(--theme-text-secondary)]">
            Aprende a usar la API de Quoorum
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-[var(--theme-bg-tertiary)] font-mono text-sm">
            <p className="text-[var(--theme-text-tertiary)]"># Ejemplo de uso</p>
            <p className="text-purple-400 mt-2">
              curl https://api.quoorum.ai/v1/debates \
            </p>
            <p className="text-[var(--theme-text-secondary)] pl-4">
              -H &quot;Authorization: Bearer YOUR_API_KEY&quot; \
            </p>
            <p className="text-[var(--theme-text-secondary)] pl-4">
              -H &quot;Content-Type: application/json&quot; \
            </p>
            <p className="text-[var(--theme-text-secondary)] pl-4">
              -d &apos;&#123;&quot;question&quot;: &quot;...&quot;&#125;&apos;
            </p>
          </div>

          <Link href="/docs/api" className="block mt-4">
            <Button
              variant="outline"
              className="w-full border-[var(--theme-border)] text-[var(--theme-text-primary)] hover:bg-purple-500/10"
            >
              Ver Documentación Completa
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}