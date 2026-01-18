'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/trpc/client'
import {
  AtSign,
  MessageCircle,
  Send,
  User,
  Users,
} from "lucide-react";
import { useState } from 'react'

interface TeamMember {
  id: string
  userId: string
  roleId: string | null
  roleName: string
  isActive: boolean
  createdAt: Date
  name: string | null
  avatar: string | null
}

interface Comment {
  id: string
  author: {
    name: string
    avatar: string
  }
  createdAt: string | Date
  content: string
  mentions: string[]
}

interface TeamCollaborationProps {
  debateId: string
}

export function TeamCollaboration({ debateId }: TeamCollaborationProps) {
  const [comment, setComment] = useState('')
  const [showMentions, setShowMentions] = useState(false)

  // Fetch comments
  const { data: comments, isLoading } = api.quoorum.comments.list.useQuery({ debateId })

  // Fetch team members
  const { data: teamMembers } = api.quoorum.team.list.useQuery()

  // Create comment mutation
  const createComment = api.quoorum.comments.create.useMutation({
    onSuccess: () => {
      setComment('')
      // Refetch comments
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return

    await createComment.mutateAsync({
      debateId,
      content: comment.trim(),
    })
  }

  const handleMention = (username: string) => {
    setComment((prev) => prev + `@${username} `)
    setShowMentions(false)
  }

  return (
    <div className="space-y-4">
      {/* Team Members */}
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Equipo ({teamMembers?.length || 0})</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {teamMembers?.map((member: TeamMember) => (
              <div
                key={member.id}
                className="flex items-center gap-2 rounded-full border bg-background px-3 py-1"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={member.avatar ?? undefined} />
                  <AvatarFallback>{member.name?.[0] ?? '?'}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{member.name ?? 'Unknown'}</span>
                <Badge variant="secondary" className="text-xs">
                  {member.roleName}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comments */}
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Comentarios ({comments?.length || 0})</span>
          </div>

          <div className="space-y-4">
            {isLoading && <p className="text-sm text-muted-foreground">Cargando comentarios...</p>}

            {comments?.map((comment: Comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.author.avatar} />
                  <AvatarFallback>{comment.author.name[0]}</AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-sm font-medium">{comment.author.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleString('es-ES')}
                    </span>
                  </div>

                  <p className="text-sm text-foreground">{comment.content}</p>

                  {comment.mentions && comment.mentions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {comment.mentions.map((mention: string) => (
                        <Badge key={mention} variant="secondary" className="text-xs">
                          @{mention}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {comments && comments.length === 0 && (
              <p className="text-center text-sm text-muted-foreground">
                No hay comentarios todavía. Sé el primero en comentar.
              </p>
            )}
          </div>

          {/* Comment Form */}
          <form onSubmit={handleSubmit} className="mt-6">
            <div className="relative">
              <Textarea
                placeholder="Añade un comentario... (usa @ para mencionar)"
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value)
                  // Detect @ for mentions
                  if (e.target.value.endsWith('@')) {
                    setShowMentions(true)
                  }
                }}
                className="min-h-[80px] pr-12"
              />

              <Button
                type="submit"
                size="icon"
                className="absolute bottom-2 right-2"
                disabled={!comment.trim() || createComment.isPending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* Mentions Dropdown */}
            {showMentions && teamMembers && teamMembers.length > 0 && (
              <Card className="absolute z-10 mt-2 w-64">
                <CardContent className="p-2">
                  {teamMembers.map((member: TeamMember) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => handleMention(member.name ?? 'Unknown')}
                      className="flex w-full items-center gap-2 rounded p-2 hover:bg-accent"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={member.avatar ?? undefined} />
                        <AvatarFallback>{member.name?.[0] ?? '?'}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{member.name ?? 'Unknown'}</span>
                      <span className="text-xs text-muted-foreground">{member.roleName}</span>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}

            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <AtSign className="h-3 w-3" />
              <span>Usa @ para mencionar a miembros del equipo</span>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
