'use client'

/**
 * RAG Templates Library
 *
 * Pre-built document templates by industry/use-case
 */

import { useState } from 'react'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  FileText,
  Star,
  Download,
  Search,
  Sparkles,
  Filter,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function RAGTemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: templates, isLoading } = api.ragTemplates.list.useQuery({
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    industry: selectedIndustry !== 'all' ? selectedIndustry : undefined,
  })

  const { data: categories } = api.ragTemplates.getCategories.useQuery()
  const { data: industries } = api.ragTemplates.getIndustries.useQuery()

  const importMutation = api.ragTemplates.importTemplate.useMutation({
    onSuccess: (data) => {
      toast.success(`Template imported successfully! Created ${data.documentsCreated.length} documents`)
    },
    onError: (error) => {
      toast.error(`Failed to import template: ${error.message}`)
    },
  })

  const handleImport = async (templateId: string, templateName: string) => {
    if (!confirm(`Import "${templateName}" template?\n\nThis will create new documents in your RAG knowledge base.`)) {
      return
    }

    await importMutation.mutateAsync({
      templateId,
    })
  }

  // Filter templates by search query
  const filteredTemplates = templates?.filter((t) =>
    searchQuery
      ? t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      : true
  )

  return (
    <div className="container mx-auto max-w-7xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/settings/rag">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-purple-400" />
              RAG Templates Library
            </h1>
            <p className="text-muted-foreground mt-1">
              Pre-built document templates to jumpstart your knowledge base
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5 text-purple-400" />
            Filter Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Industry filter */}
            <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
              <SelectTrigger>
                <SelectValue placeholder="All Industries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {industries?.map((ind) => (
                  <SelectItem key={ind} value={ind}>
                    {ind.charAt(0).toUpperCase() + ind.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-white/10 rounded w-3/4" />
                <div className="h-4 bg-white/10 rounded w-full mt-2" />
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-white/10 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !filteredTemplates || filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No templates found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters or search query
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className="hover:border-purple-500/50 transition-all"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {template.name}
                      {template.isFeatured && (
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {template.description}
                    </CardDescription>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge
                    variant="outline"
                    className="bg-purple-500/20 text-purple-300 border-purple-500/30"
                  >
                    {template.category}
                  </Badge>
                  {template.industry && (
                    <Badge
                      variant="outline"
                      className="bg-blue-500/20 text-blue-300 border-blue-500/30"
                    >
                      {template.industry}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Use Cases */}
                {template.useCases && template.useCases.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">Use Cases:</div>
                    <div className="flex flex-wrap gap-1">
                      {template.useCases.slice(0, 3).map((useCase, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {useCase}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Files info */}
                <div className="text-sm text-muted-foreground">
                  <FileText className="h-4 w-4 inline mr-1" />
                  {template.templateFiles.length} file(s) included
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div>
                    {template.usageCount || 0} imports
                  </div>
                  {template.avgRating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {template.avgRating.toFixed(1)}
                    </div>
                  )}
                </div>

                {/* Import button */}
                <Button
                  onClick={() => handleImport(template.id, template.name)}
                  disabled={importMutation.isPending}
                  className="w-full gap-2"
                >
                  {importMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Import Template
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info card */}
      <Card className="bg-purple-500/10 border-purple-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-purple-400" />
            How Templates Work
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="flex items-start gap-2">
            <span className="text-purple-400 font-bold">1.</span>
            <span>
              Browse templates by category or industry to find relevant content
            </span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-purple-400 font-bold">2.</span>
            <span>
              Click "Import Template" to add documents to your RAG knowledge base
            </span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-purple-400 font-bold">3.</span>
            <span>
              Imported documents are automatically processed, chunked, and embedded
            </span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-purple-400 font-bold">4.</span>
            <span>
              Use them in your debates immediately - they'll appear in search results
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
