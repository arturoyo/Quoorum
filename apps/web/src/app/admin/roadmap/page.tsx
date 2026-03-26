"use client"

/**
 * Admin Roadmap Page
 *
 * View and manage project roadmap items: planned, in progress, completed, blocked.
 * CRUD operations with filtering by status, priority, and category.
 */

import { useState } from "react"
import { api } from "@/lib/trpc/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Clock,
  CheckCircle,
  AlertTriangle,
  Target,
} from "lucide-react"

// ============================================================================
// CONSTANTS
// ============================================================================

type RoadmapStatus = "planned" | "in_progress" | "completed" | "blocked"
type RoadmapPriority = "low" | "medium" | "high" | "critical"
type RoadmapCategory = "feature" | "bugfix" | "infra" | "docs"

const PRIORITY_COLORS: Record<RoadmapPriority, string> = {
  critical: "bg-red-500/20 text-red-300 border-red-500/30",
  high: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  medium: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  low: "bg-white/10 text-gray-300 border-white/20",
}

const STATUS_COLORS: Record<RoadmapStatus, string> = {
  planned: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  in_progress: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  completed: "bg-green-500/20 text-green-300 border-green-500/30",
  blocked: "bg-red-500/20 text-red-300 border-red-500/30",
}

const CATEGORY_COLORS: Record<RoadmapCategory, string> = {
  feature: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  bugfix: "bg-red-500/20 text-red-300 border-red-500/30",
  infra: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  docs: "bg-white/10 text-gray-300 border-white/20",
}

const STATUS_LABELS: Record<RoadmapStatus, string> = {
  planned: "Planned",
  in_progress: "In Progress",
  completed: "Completed",
  blocked: "Blocked",
}

const PRIORITY_LABELS: Record<RoadmapPriority, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
}

const CATEGORY_LABELS: Record<RoadmapCategory, string> = {
  feature: "Feature",
  bugfix: "Bugfix",
  infra: "Infra",
  docs: "Docs",
}

// ============================================================================
// FORM STATE
// ============================================================================

interface FormData {
  title: string
  description: string
  status: RoadmapStatus
  priority: RoadmapPriority
  category: RoadmapCategory
  dueDate: string
}

const EMPTY_FORM: FormData = {
  title: "",
  description: "",
  status: "planned",
  priority: "medium",
  category: "feature",
  dueDate: "",
}

// ============================================================================
// PAGE
// ============================================================================

export default function AdminRoadmapPage() {
  const [activeTab, setActiveTab] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Build filter from active tab
  const statusFilter = activeTab === "all" ? undefined : (activeTab as RoadmapStatus)

  // Queries
  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = api.adminRoadmap.stats.useQuery()
  const { data: listData, isLoading: listLoading, refetch: refetchList } = api.adminRoadmap.list.useQuery({
    status: statusFilter,
    limit: 100,
    offset: 0,
  })

  const items = listData?.items || []

  // Mutations
  const createMutation = api.adminRoadmap.create.useMutation({
    onSuccess: () => {
      toast.success("Roadmap item created")
      void refetchList()
      void refetchStats()
      setDialogOpen(false)
      setFormData(EMPTY_FORM)
    },
    onError: (error) => {
      toast.error(`Failed to create: ${error.message}`)
    },
  })

  const updateMutation = api.adminRoadmap.update.useMutation({
    onSuccess: () => {
      toast.success("Roadmap item updated")
      void refetchList()
      void refetchStats()
      setDialogOpen(false)
      setEditingId(null)
      setFormData(EMPTY_FORM)
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`)
    },
  })

  const deleteMutation = api.adminRoadmap.delete.useMutation({
    onSuccess: () => {
      toast.success("Roadmap item deleted")
      void refetchList()
      void refetchStats()
      setDeleteConfirmId(null)
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`)
    },
  })

  // Handlers
  const handleOpenCreate = () => {
    setEditingId(null)
    setFormData(EMPTY_FORM)
    setDialogOpen(true)
  }

  const handleOpenEdit = (item: typeof items[number]) => {
    setEditingId(item.id)
    setFormData({
      title: item.title,
      description: item.description || "",
      status: item.status as RoadmapStatus,
      priority: item.priority as RoadmapPriority,
      category: item.category as RoadmapCategory,
      dueDate: item.dueDate ? new Date(item.dueDate).toISOString().split("T")[0] : "",
    })
    setDialogOpen(true)
  }

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast.error("Title is required")
      return
    }

    const dueDate = formData.dueDate
      ? new Date(formData.dueDate).toISOString()
      : null

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        title: formData.title,
        description: formData.description || null,
        status: formData.status,
        priority: formData.priority,
        category: formData.category,
        dueDate,
      })
    } else {
      createMutation.mutate({
        title: formData.title,
        description: formData.description || undefined,
        status: formData.status,
        priority: formData.priority,
        category: formData.category,
        dueDate,
      })
    }
  }

  const handleDelete = (id: string) => {
    deleteMutation.mutate({ id })
  }

  const isMutating = createMutation.isPending || updateMutation.isPending

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MapPin className="h-8 w-8 text-purple-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Roadmap</h1>
            <p className="text-sm text-[var(--theme-text-secondary)]">
              Track project milestones, tasks, and blockers
            </p>
          </div>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Target className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-[var(--theme-text-secondary)]">Planned</p>
                <p className="text-2xl font-bold text-white">
                  {statsLoading ? "-" : statsData?.planned ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-[var(--theme-text-secondary)]">In Progress</p>
                <p className="text-2xl font-bold text-white">
                  {statsLoading ? "-" : statsData?.in_progress ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-[var(--theme-text-secondary)]">Completed</p>
                <p className="text-2xl font-bold text-white">
                  {statsLoading ? "-" : statsData?.completed ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-[var(--theme-text-secondary)]">Blocked</p>
                <p className="text-2xl font-bold text-white">
                  {statsLoading ? "-" : statsData?.blocked ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs + Table */}
      <Card className="bg-slate-800/50 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-slate-900/50 border border-white/10 mb-4">
              <TabsTrigger value="all" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                All ({statsData?.total ?? 0})
              </TabsTrigger>
              <TabsTrigger value="planned" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Planned
              </TabsTrigger>
              <TabsTrigger value="in_progress" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                In Progress
              </TabsTrigger>
              <TabsTrigger value="completed" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                Completed
              </TabsTrigger>
              <TabsTrigger value="blocked" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
                Blocked
              </TabsTrigger>
            </TabsList>

          </Tabs>

          {/* Table content driven by activeTab filter */}
          {listLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
              <span className="ml-2 text-[var(--theme-text-secondary)]">Loading...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-[var(--theme-text-secondary)] mx-auto mb-3 opacity-30" />
              <p className="text-[var(--theme-text-secondary)]">No roadmap items found</p>
              <Button
                onClick={handleOpenCreate}
                variant="outline"
                className="mt-4 border-white/20 text-white hover:bg-white/10"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create first item
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-[var(--theme-text-secondary)]">Priority</TableHead>
                    <TableHead className="text-[var(--theme-text-secondary)]">Title</TableHead>
                    <TableHead className="text-[var(--theme-text-secondary)]">Category</TableHead>
                    <TableHead className="text-[var(--theme-text-secondary)]">Status</TableHead>
                    <TableHead className="text-[var(--theme-text-secondary)]">Due Date</TableHead>
                    <TableHead className="text-[var(--theme-text-secondary)] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id} className="border-white/10 hover:bg-white/5">
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={PRIORITY_COLORS[item.priority as RoadmapPriority]}
                        >
                          {PRIORITY_LABELS[item.priority as RoadmapPriority]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-white font-medium">{item.title}</p>
                          {item.description && (
                            <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5 line-clamp-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={CATEGORY_COLORS[item.category as RoadmapCategory]}
                        >
                          {CATEGORY_LABELS[item.category as RoadmapCategory]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={STATUS_COLORS[item.status as RoadmapStatus]}
                        >
                          {STATUS_LABELS[item.status as RoadmapStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[var(--theme-text-secondary)] text-sm">
                        {item.dueDate
                          ? new Date(item.dueDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[var(--theme-text-secondary)] hover:text-white hover:bg-white/10"
                            onClick={() => handleOpenEdit(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {deleteConfirmId === item.id ? (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
                                onClick={() => handleDelete(item.id)}
                                disabled={deleteMutation.isPending}
                              >
                                Confirm
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-[var(--theme-text-secondary)] hover:text-white hover:bg-white/10 text-xs"
                                onClick={() => setDeleteConfirmId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-[var(--theme-text-secondary)] hover:text-red-400 hover:bg-red-500/10"
                              onClick={() => setDeleteConfirmId(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingId ? "Edit Roadmap Item" : "New Roadmap Item"}
            </DialogTitle>
            <DialogDescription className="text-[var(--theme-text-secondary)]">
              {editingId ? "Update the details below." : "Add a new item to the project roadmap."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-[var(--theme-text-secondary)]">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Implement user notifications"
                className="bg-slate-800 border-white/10 text-white placeholder:text-gray-500"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-[var(--theme-text-secondary)]">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional details about this item..."
                rows={3}
                className="bg-slate-800 border-white/10 text-white placeholder:text-gray-500 resize-none"
              />
            </div>

            {/* Status + Priority row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[var(--theme-text-secondary)]">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => setFormData({ ...formData, status: val as RoadmapStatus })}
                >
                  <SelectTrigger className="bg-slate-800 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10">
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[var(--theme-text-secondary)]">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(val) => setFormData({ ...formData, priority: val as RoadmapPriority })}
                >
                  <SelectTrigger className="bg-slate-800 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10">
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Category + Due Date row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[var(--theme-text-secondary)]">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(val) => setFormData({ ...formData, category: val as RoadmapCategory })}
                >
                  <SelectTrigger className="bg-slate-800 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10">
                    <SelectItem value="feature">Feature</SelectItem>
                    <SelectItem value="bugfix">Bugfix</SelectItem>
                    <SelectItem value="infra">Infra</SelectItem>
                    <SelectItem value="docs">Docs</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate" className="text-[var(--theme-text-secondary)]">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="bg-slate-800 border-white/10 text-white"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isMutating}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isMutating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingId ? "Save Changes" : "Create Item"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
