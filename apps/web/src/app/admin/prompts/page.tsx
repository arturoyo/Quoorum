/**
 * Admin Prompts Management Page
 * 
 * Centralized interface for managing all AI system prompts
 */

'use client'

import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Trash2, Edit, Search, Copy, CheckCircle2, X } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { toast } from 'sonner'

type Category = 'debates' | 'context' | 'experts' | 'departments' | 'frameworks' | 'narrative'

const CATEGORIES: { value: Category; label: string; color: string }[] = [
  { value: 'debates', label: 'Debates', color: 'bg-blue-100 text-blue-800' },
  { value: 'context', label: 'Contexto', color: 'bg-green-100 text-green-800' },
  { value: 'experts', label: 'Expertos', color: 'bg-purple-100 text-purple-800' },
  { value: 'departments', label: 'Departamentos', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'frameworks', label: 'Frameworks', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'narrative', label: 'Narrativa', color: 'bg-rose-100 text-rose-800' },
]

interface Prompt {
  id: string
  key: string
  name: string
  description?: string
  category: Category
  prompt: string
  is_active: boolean
  version?: number
  created_at?: string
  updated_at?: string
}

export default function AdminPromptsPage() {
  const [selectedCategory, setSelectedCategory] = useState<Category>('debates')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Prompt>>({})
  const [testInput, setTestInput] = useState('')
  const [testResult, setTestResult] = useState<string | null>(null)

  // Queries
  const { data: allPrompts = [], isLoading, refetch } = api.adminPrompts.list.useQuery()

  // Mutations
  const { mutate: updatePrompt, isPending: isUpdating } = api.adminPrompts.update.useMutation({
    onSuccess: () => {
      toast.success('Prompt actualizado correctamente')
      refetch()
      setIsEditing(false)
      setSelectedPrompt(null)
    },
    onError: () => {
      toast.error('Error al actualizar el prompt')
    },
  })

  const { mutate: deletePrompt } = api.adminPrompts.delete.useMutation({
    onSuccess: () => {
      toast.success('Prompt eliminado correctamente')
      refetch()
      setSelectedPrompt(null)
    },
    onError: () => {
      toast.error('Error al eliminar el prompt')
    },
  })

  const { mutate: testPrompt, isPending: isTesting } = api.adminPrompts.test.useMutation({
    onSuccess: (data) => {
      setTestResult(data.response)
      toast.success('Prompt probado exitosamente')
    },
    onError: () => {
      toast.error('Error al probar el prompt')
    },
  })

  // Filtered prompts
  const filteredPrompts = (allPrompts as Prompt[])
    .filter((p: Prompt) => p.category === selectedCategory)
    .filter((p: Prompt) =>
      searchQuery
        ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.prompt.toLowerCase().includes(searchQuery.toLowerCase())
        : true
    )

  const handleEdit = (prompt: Prompt) => {
    setSelectedPrompt(prompt)
    setEditForm(prompt)
    setIsEditing(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedPrompt) return

    updatePrompt({
      id: selectedPrompt.id,
      updates: editForm,
    })
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este prompt?')) return
    deletePrompt({ id })
  }

  const handleTestPrompt = async () => {
    if (!selectedPrompt || !testInput.trim()) {
      toast.error('Ingresa algo para probar')
      return
    }
    testPrompt({
      promptId: selectedPrompt.id,
      testInput,
    })
  }

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key)
    toast.success(`Clave copiada: ${key}`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold">Gestión de Prompts IA</h1>
        <p className="text-muted-foreground mt-2">
          Administra todos los prompts del sistema sin necesidad de acceder al código
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Categories */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Categorías</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => {
                    setSelectedCategory(cat.value)
                    setSelectedPrompt(null)
                    setIsEditing(false)
                  }}
                  className={`w-full text-left px-4 py-2 rounded-lg transition ${
                    selectedCategory === cat.value
                      ? 'bg-purple-600 text-white font-semibold'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {cat.label}
                  <span className="text-xs ml-2 opacity-70">
                    {(allPrompts as Prompt[]).filter((p: Prompt) => p.category === cat.value).length}
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, clave o contenido..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Prompts List */}
          {!selectedPrompt ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredPrompts.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No hay prompts en esta categoría
                  </CardContent>
                </Card>
              ) : (
                filteredPrompts.map((prompt: Prompt) => (
                  <Card
                    key={prompt.id}
                    className="cursor-pointer hover:shadow-md transition"
                    onClick={() => setSelectedPrompt(prompt)}
                  >
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{prompt.name}</h3>
                            <p className="text-sm text-gray-600 font-mono">{prompt.key}</p>
                          </div>
                          <Badge
                            variant={prompt.is_active ? 'default' : 'secondary'}
                            className="ml-2"
                          >
                            {prompt.is_active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                        {prompt.description && (
                          <p className="text-sm text-gray-600">{prompt.description}</p>
                        )}
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {prompt.prompt}
                        </p>
                        {prompt.version && (
                          <p className="text-xs text-gray-400">v{prompt.version}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          ) : (
            // Detail View
            <Card>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle>{selectedPrompt.name}</CardTitle>
                  <CardDescription className="font-mono mt-2">{selectedPrompt.key}</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPrompt(null)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Editing Mode */}
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold">Nombre</label>
                      <Input
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold">Descripción</label>
                      <Input
                        value={editForm.description || ''}
                        onChange={(e) =>
                          setEditForm({ ...editForm, description: e.target.value })
                        }
                        className="mt-1"
                        placeholder="Descripción breve del prompt"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold">Prompt</label>
                      <Textarea
                        value={editForm.prompt || ''}
                        onChange={(e) => setEditForm({ ...editForm, prompt: e.target.value })}
                        className="mt-1 font-mono text-sm"
                        rows={12}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveEdit}
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Guardar
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false)
                          setEditForm({})
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* View Mode */}
                    <Tabs defaultValue="prompt" className="w-full">
                      <TabsList>
                        <TabsTrigger value="prompt">Contenido</TabsTrigger>
                        <TabsTrigger value="test">Prueba</TabsTrigger>
                        <TabsTrigger value="info">Información</TabsTrigger>
                      </TabsList>

                      <TabsContent value="prompt" className="space-y-4 mt-4">
                        <div className="bg-gray-50 p-4 rounded-lg border font-mono text-sm whitespace-pre-wrap break-words max-h-96 overflow-y-auto">
                          {selectedPrompt.prompt}
                        </div>
                        <button
                          onClick={() => handleCopyKey(selectedPrompt.key)}
                          className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                        >
                          <Copy className="h-4 w-4" />
                          Copiar clave
                        </button>
                      </TabsContent>

                      <TabsContent value="test" className="space-y-4 mt-4">
                        <div>
                          <label className="text-sm font-semibold">Input de prueba</label>
                          <Textarea
                            value={testInput}
                            onChange={(e) => setTestInput(e.target.value)}
                            placeholder="Ingresa algo para probar cómo responde el prompt..."
                            className="mt-1"
                            rows={4}
                          />
                        </div>

                        <Button
                          onClick={handleTestPrompt}
                          disabled={isTesting}
                          className="w-full"
                        >
                          {isTesting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Probando...
                            </>
                          ) : (
                            'Probar Prompt'
                          )}
                        </Button>

                        {testResult && (
                          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                            <h4 className="font-semibold text-green-900 mb-2">Resultado:</h4>
                            <p className="text-sm text-green-800 whitespace-pre-wrap break-words">
                              {testResult}
                            </p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="info" className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Estado</p>
                            <Badge
                              variant={selectedPrompt.is_active ? 'default' : 'secondary'}
                              className="mt-1"
                            >
                              {selectedPrompt.is_active ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </div>
                          {selectedPrompt.version && (
                            <div>
                              <p className="text-sm text-gray-600">Versión</p>
                              <p className="font-semibold mt-1">{selectedPrompt.version}</p>
                            </div>
                          )}
                          {selectedPrompt.created_at && (
                            <div>
                              <p className="text-sm text-gray-600">Creado</p>
                              <p className="text-sm mt-1">
                                {new Date(selectedPrompt.created_at).toLocaleDateString('es-ES')}
                              </p>
                            </div>
                          )}
                          {selectedPrompt.updated_at && (
                            <div>
                              <p className="text-sm text-gray-600">Actualizado</p>
                              <p className="text-sm mt-1">
                                {new Date(selectedPrompt.updated_at).toLocaleDateString('es-ES')}
                              </p>
                            </div>
                          )}
                        </div>

                        {selectedPrompt.description && (
                          <div>
                            <p className="text-sm text-gray-600">Descripción</p>
                            <p className="mt-1">{selectedPrompt.description}</p>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        onClick={() => handleEdit(selectedPrompt)}
                        variant="outline"
                        className="flex-1"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        onClick={() => handleDelete(selectedPrompt.id)}
                        variant="destructive"
                        className="flex-1"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
