"use client"

/**
 * Admin Billing Page
 *
 * Manage users, credits, and subscriptions
 */

import { useState } from "react"
import { api } from "@/lib/trpc/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Loader2, Search, Plus, Minus, RefreshCw } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"

export default function AdminBillingPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [creditsAmount, setCreditsAmount] = useState("")
  const [creditReason, setCreditReason] = useState("")

  // Fetch billing stats
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = api.admin.getBillingStats.useQuery()

  // Search users
  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = api.admin.searchUsers.useQuery(
    { search: searchQuery, limit: 50 },
    { enabled: searchQuery.length > 0 }
  )

  // Add credits mutation
  const addCredits = api.admin.addCredits.useMutation({
    onSuccess: (data) => {
      toast.success(`Added ${data.creditsAdded} credits. New balance: ${data.newBalance}`)
      void refetchUsers()
      void refetchStats()
      setCreditsAmount("")
      setCreditReason("")
    },
    onError: (error) => {
      toast.error(`Failed to add credits: ${error.message}`)
    }
  })

  // Deduct credits mutation
  const deductCredits = api.admin.deductCredits.useMutation({
    onSuccess: (data) => {
      toast.success(`Deducted ${data.creditsDeducted} credits. New balance: ${data.newBalance}`)
      void refetchUsers()
      void refetchStats()
      setCreditsAmount("")
      setCreditReason("")
    },
    onError: (error) => {
      toast.error(`Failed to deduct credits: ${error.message}`)
    }
  })

  const handleAddCredits = async (userId: string) => {
    const amount = parseInt(creditsAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    await addCredits.mutateAsync({
      userId,
      credits: amount,
      reason: creditReason || undefined,
    })
  }

  const handleDeductCredits = async (userId: string) => {
    const amount = parseInt(creditsAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (!creditReason) {
      toast.error("Reason is required for deducting credits")
      return
    }

    await deductCredits.mutateAsync({
      userId,
      credits: amount,
      reason: creditReason,
    })
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin - Billing Management</h1>
          <p className="text-muted-foreground">
            Gestiona usuarios, créditos y suscripciones
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={() => { void refetchStats(); void refetchUsers(); }}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalUsers.toLocaleString() || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-2xl font-bold">{stats?.activeSubscriptions.toLocaleString() || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Credits Issued
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.totalCreditsIssued ?
                  (stats.totalCreditsIssued > 1000000
                    ? `${(stats.totalCreditsIssued / 1000000).toFixed(1)}M`
                    : stats.totalCreditsIssued.toLocaleString()
                  ) : 0
                }
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              MRR
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-2xl font-bold">${stats?.mrr.toLocaleString() || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Search and manage user credits
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Users Table */}
          {searchQuery.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Enter an email or name to search for users
            </div>
          ) : usersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : !users || users.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No users found
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.email}</div>
                          {user.name && (
                            <div className="text-sm text-muted-foreground">{user.name}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.tier === 'pro' ? 'default' : 'secondary'}>
                          {user.tier}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{user.credits.toLocaleString()}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? 'secondary' : 'outline'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedUserId(user.id)}
                            >
                              Manage Credits
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Manage Credits - {user.email}</DialogTitle>
                              <DialogDescription>
                                Current balance: {user.credits.toLocaleString()} credits
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Amount</label>
                                <Input
                                  type="number"
                                  placeholder="Enter credits amount"
                                  value={creditsAmount}
                                  onChange={(e) => setCreditsAmount(e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Reason (optional for add, required for deduct)</label>
                                <Input
                                  placeholder="e.g., Support compensation, Refund, etc."
                                  value={creditReason}
                                  onChange={(e) => setCreditReason(e.target.value)}
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  className="flex-1"
                                  onClick={() => handleAddCredits(user.id)}
                                  disabled={addCredits.isPending}
                                >
                                  {addCredits.isPending ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <Plus className="h-4 w-4 mr-2" />
                                  )}
                                  Add Credits
                                </Button>
                                <Button
                                  variant="destructive"
                                  className="flex-1"
                                  onClick={() => handleDeductCredits(user.id)}
                                  disabled={deductCredits.isPending}
                                >
                                  {deductCredits.isPending ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <Minus className="h-4 w-4 mr-2" />
                                  )}
                                  Remove Credits
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing Configuration */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Pricing Configuration</CardTitle>
          <CardDescription>
            Current pricing model and credit allocation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="text-sm font-medium">Credit Pricing</div>
                <div className="text-2xl font-bold">$0.005 USD</div>
                <div className="text-sm text-muted-foreground">per credit (200 credits = $1)</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Service Margin</div>
                <div className="text-2xl font-bold">75%</div>
                <div className="text-sm text-muted-foreground">markup on AI costs (1.75x multiplier)</div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="text-sm font-medium mb-2">Monthly Allocations</div>
              <div className="grid gap-2 md:grid-cols-4">
                <div className="border rounded p-3">
                  <div className="text-xs text-muted-foreground">Free</div>
                  <div className="font-bold">1,000</div>
                  <div className="text-xs">initial credits</div>
                </div>
                <div className="border rounded p-3">
                  <div className="text-xs text-muted-foreground">Starter - $29/mo</div>
                  <div className="font-bold">5,000</div>
                  <div className="text-xs">credits/month</div>
                </div>
                <div className="border rounded p-3">
                  <div className="text-xs text-muted-foreground">Pro - $49/mo</div>
                  <div className="font-bold">10,000</div>
                  <div className="text-xs">credits/month</div>
                </div>
                <div className="border rounded p-3">
                  <div className="text-xs text-muted-foreground">Business - $99/mo</div>
                  <div className="font-bold">25,000</div>
                  <div className="text-xs">credits/month</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
