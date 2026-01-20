'use client'

import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Send, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useState } from 'react'
import { toast } from 'sonner'

interface DebateCommentsProps {
  debateId: string
  showHeader?: boolean
}

export function DebateComments({ debateId, showHeader = true }: DebateCommentsProps) {
  const [commentText, setCommentText] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  const { data: comments, isLoading, refetch } = api.quoorum.getComments.useQuery({ debateId })
  const addComment = api.quoorum.addComment.useMutation({
    onSuccess: () => {
      toast.success('Comentario añadido')
      setCommentText('')
      setReplyingTo(null)
      void refetch()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return

    addComment.mutate({
      debateId,
      content: commentText.trim(),
      parentId: replyingTo || undefined,
    })
  }

  if (isLoading) {
    return (
      <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  const rootComments = comments?.filter((c) => !c.parentId) || []
  const repliesByParent = new Map<string, typeof comments>()
  comments?.forEach((c) => {
    if (c.parentId) {
      const replies = repliesByParent.get(c.parentId) || []
      repliesByParent.set(c.parentId, [...replies, c])
    }
  })

  const content = (
    <div className="space-y-4">
        {/* Comment Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            placeholder="Añade un comentario..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="border-white/10 bg-slate-800/50 text-white placeholder:text-gray-500"
            rows={3}
          />
          <div className="flex justify-end gap-2">
            {replyingTo && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setReplyingTo(null)
                  setCommentText('')
                }}
              >
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              disabled={!commentText.trim() || addComment.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {addComment.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Comments List */}
        <div className="space-y-4">
          {rootComments.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No hay comentarios aún. Sé el primero en comentar!
            </div>
          ) : (
            rootComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                replies={repliesByParent.get(comment.id) || []}
                onReply={(parentId) => {
                  setReplyingTo(parentId)
                  setCommentText(`@${comment.userId.substring(0, 8)} `)
                }}
              />
            ))
          )}
        </div>
    </div>
  )

  if (!showHeader) {
    return content
  }

  return (
    <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <MessageCircle className="h-5 w-5" />
          Comentarios ({comments?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  )
}

function CommentItem({
  comment,
  replies,
  onReply,
}: {
  comment: { id: string; content: string; userId: string; createdAt: Date }
  replies: Array<{ id: string; content: string; userId: string; createdAt: Date; parentId: string | null }>
  onReply: (parentId: string) => void
}) {
  return (
    <div className="rounded-lg border border-white/5 bg-slate-800/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs text-gray-400">
              {comment.userId.substring(0, 8)}...
            </Badge>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: es })}
            </span>
          </div>
          <p className="text-sm text-gray-300">{comment.content}</p>
          {replies.length > 0 && (
            <div className="ml-4 mt-3 space-y-2 border-l-2 border-white/10 pl-4">
              {replies.map((reply) => (
                <div key={reply.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs text-gray-400">
                      {reply.userId.substring(0, 8)}...
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true, locale: es })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">{reply.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onReply(comment.id)}
          className="text-xs text-gray-400 hover:text-gray-300"
        >
          Responder
        </Button>
      </div>
    </div>
  )
}
