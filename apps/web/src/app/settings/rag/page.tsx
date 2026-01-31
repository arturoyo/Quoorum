'use client'

/**
 * RAG Document Management Page
 *
 * Allows users to upload, manage, and search their documents
 * for use in debates via RAG (Retrieval-Augmented Generation).
 */

import { useState } from 'react'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Upload,
  File,
  Trash2,
  Search,
  FileText,
  Database,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

export default function RAGPage() {
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])

  // Queries
  const { data: documents, refetch: refetchDocuments } = api.rag.listDocuments.useQuery()
  const { data: stats } = api.rag.getStats.useQuery()

  // Mutations
  const uploadMutation = api.rag.uploadDocument.useMutation({
    onSuccess: () => {
      toast.success('Document uploaded successfully')
      refetchDocuments()
      setUploadFile(null)
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`)
    },
  })

  const deleteMutation = api.rag.deleteDocument.useMutation({
    onSuccess: () => {
      toast.success('Document deleted')
      refetchDocuments()
    },
    onError: (error) => {
      toast.error(`Delete failed: ${error.message}`)
    },
  })

  const searchMutation = api.rag.testSearch.useMutation({
    onSuccess: (data) => {
      setSearchResults(data.results)
      toast.success(`Found ${data.results.length} results`)
    },
    onError: (error) => {
      toast.error(`Search failed: ${error.message}`)
    },
  })

  // Handlers
  const handleUpload = async () => {
    if (!uploadFile) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      const content = e.target?.result as string

      const fileType = uploadFile.name.split('.').pop()?.toLowerCase() as 'pdf' | 'txt' | 'md' | 'docx'

      if (!['pdf', 'txt', 'md', 'docx'].includes(fileType)) {
        toast.error('Unsupported file type. Use PDF, TXT, MD, or DOCX')
        return
      }

      await uploadMutation.mutateAsync({
        fileName: uploadFile.name,
        fileType,
        content,
        tags: [],
      })
    }

    reader.readAsText(uploadFile)
  }

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return
    await deleteMutation.mutateAsync({ documentId })
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query')
      return
    }

    await searchMutation.mutateAsync({
      query: searchQuery,
      limit: 5,
      minSimilarity: 0.5,
      hybridMode: true,
    })
  }

  return (
    <div className="container mx-auto max-w-6xl p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Database className="h-8 w-8 text-purple-400" />
          RAG Document Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Upload documents to enhance your debates with your own knowledge base
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.document_count}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Chunks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.chunk_count}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Storage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(Number(stats.total_size) / 1024).toFixed(1)} KB
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">File Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.file_type_count}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Document
          </CardTitle>
          <CardDescription>
            Upload PDF, TXT, MD, or DOCX files to add to your knowledge base
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="file">Select File</Label>
            <Input
              id="file"
              type="file"
              accept=".pdf,.txt,.md,.docx"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="mt-1"
            />
            {uploadFile && (
              <p className="text-sm text-muted-foreground mt-2">
                Selected: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <Button
            onClick={handleUpload}
            disabled={!uploadFile || uploadMutation.isPending}
            className="w-full md:w-auto"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Search Test Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Test Search
          </CardTitle>
          <CardDescription>
            Test semantic search on your uploaded documents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="search">Search Query</Label>
            <Textarea
              id="search"
              placeholder="What would you like to search for?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>

          <Button
            onClick={handleSearch}
            disabled={!searchQuery.trim() || searchMutation.isPending}
            className="w-full md:w-auto"
          >
            {searchMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search
              </>
            )}
          </Button>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="font-semibold">Results:</h3>
              {searchResults.map((result, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">
                        {result.document.fileName}
                      </CardTitle>
                      <Badge variant="secondary">
                        {(result.similarity * 100).toFixed(1)}% match
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {result.content.substring(0, 200)}...
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Your Documents
          </CardTitle>
          <CardDescription>
            Manage your uploaded documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!documents || documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No documents uploaded yet</p>
              <p className="text-sm">Upload your first document to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc: any) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <File className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <h4 className="font-medium">{doc.fileName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {doc.fileType.toUpperCase()} • {doc.chunkCount} chunks •{' '}
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(doc.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* How it Works */}
      <Card className="bg-purple-500/10 border-purple-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            How RAG Works in Debates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
            <span>
              When you create a debate, the system automatically searches your uploaded
              documents for relevant information
            </span>
          </p>
          <p className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
            <span>
              Top 5 most relevant chunks are added to the debate context
            </span>
          </p>
          <p className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
            <span>
              AI agents see your company documents and make better, context-aware decisions
            </span>
          </p>
          <p className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <span>
              Documents are private to you (or your company if company-level)
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
