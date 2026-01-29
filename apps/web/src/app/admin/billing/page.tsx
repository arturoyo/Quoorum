"use client"

/**
 * Admin Billing & Pricing Page
 *
 * Manage users, credits, pricing configuration, and profit margins
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
import { Loader2, Search, Plus, Minus, RefreshCw, DollarSign, Users, CreditCard, TrendingUp, Settings, AlertTriangle, CheckCircle, XCircle, History, Save } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function AdminBillingPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [creditsAmount, setCreditsAmount] = useState("")
  const [creditReason, setCreditReason] = useState("")
  const [_selectedUserId, setSelectedUserId] = useState<string | null>(null)

  // Pricing configuration state
  const [editingGlobal, setEditingGlobal] = useState(false)
  const [newCreditMultiplier, setNewCreditMultiplier] = useState("")
  const [newUsdPerCredit, setNewUsdPerCredit] = useState("")
  const [changeReason, setChangeReason] = useState("")

  // Tier editing state
  const [editingTier, setEditingTier] = useState<string | null>(null)
  const [tierFormData, setTierFormData] = useState<{
    monthlyPriceUsd: string
    monthlyCredits: string
    changeReason: string
  }>({ monthlyPriceUsd: "", monthlyCredits: "", changeReason: "" })

  // Fetch cost analytics stats
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = api.admin.getCostAnalytics.useQuery({})

  // Search users
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = api.admin.listUsers.useQuery(
    { search: searchQuery, limit: 50 },
    { enabled: searchQuery.length > 0 }
  )
  const users = usersData?.users || []

  // Pricing configuration queries
  const { data: globalConfig, isLoading: globalConfigLoading, refetch: refetchGlobalConfig } = api.adminPricing.getGlobalConfig.useQuery()
  const { data: tierConfigs, isLoading: tierConfigsLoading, refetch: refetchTierConfigs } = api.adminPricing.listTierConfigs.useQuery()
  const { data: profitAnalysis, isLoading: profitAnalysisLoading, refetch: refetchProfitAnalysis } = api.adminPricing.getProfitMarginAnalysis.useQuery()
  const { data: changeHistory, isLoading: changeHistoryLoading, refetch: refetchChangeHistory } = api.adminPricing.getChangeHistory.useQuery({ limit: 20 })

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

  // Update global config mutation
  const updateGlobalConfig = api.adminPricing.updateGlobalConfig.useMutation({
    onSuccess: () => {
      toast.success("Global pricing configuration updated successfully")
      void refetchGlobalConfig()
      void refetchProfitAnalysis()
      void refetchChangeHistory()
      setEditingGlobal(false)
      setNewCreditMultiplier("")
      setNewUsdPerCredit("")
      setChangeReason("")
    },
    onError: (error) => {
      toast.error(`Failed to update configuration: ${error.message}`)
    }
  })

  // Update tier config mutation
  const updateTierConfig = api.adminPricing.updateTierConfig.useMutation({
    onSuccess: () => {
      toast.success("Tier configuration updated successfully")
      void refetchTierConfigs()
      void refetchProfitAnalysis()
      void refetchChangeHistory()
      setEditingTier(null)
      setTierFormData({ monthlyPriceUsd: "", monthlyCredits: "", changeReason: "" })
    },
    onError: (error) => {
      toast.error(`Failed to update tier: ${error.message}`)
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

  const handleUpdateGlobalConfig = async () => {
    const multiplier = parseFloat(newCreditMultiplier)
    const usdPerCredit = parseFloat(newUsdPerCredit)

    if (isNaN(multiplier) || multiplier <= 0) {
      toast.error("Credit multiplier must be a positive number")
      return
    }

    if (isNaN(usdPerCredit) || usdPerCredit <= 0) {
      toast.error("USD per credit must be a positive number")
      return
    }

    if (!changeReason) {
      toast.error("Please provide a reason for this change")
      return
    }

    await updateGlobalConfig.mutateAsync({
      creditMultiplier: multiplier,
      usdPerCredit,
      changeReason,
    })
  }

  const handleUpdateTier = async (tier: string) => {
    const monthlyPriceUsd = parseInt(tierFormData.monthlyPriceUsd)
    const monthlyCredits = parseInt(tierFormData.monthlyCredits)

    if (isNaN(monthlyPriceUsd) || monthlyPriceUsd < 0) {
      toast.error("Monthly price must be a non-negative number")
      return
    }

    if (isNaN(monthlyCredits) || monthlyCredits <= 0) {
      toast.error("Monthly credits must be a positive number")
      return
    }

    if (!tierFormData.changeReason) {
      toast.error("Please provide a reason for this change")
      return
    }

    await updateTierConfig.mutateAsync({
      tier,
      monthlyPriceUsd: monthlyPriceUsd * 100, // Convert to cents
      monthlyCredits,
      changeReason: tierFormData.changeReason,
    })
  }

  const startEditingTier = (tier: { tier: string; monthlyPriceUsd: number; monthlyCredits: number }) => {
    setEditingTier(tier.tier)
    setTierFormData({
      monthlyPriceUsd: (tier.monthlyPriceUsd / 100).toFixed(2),
      monthlyCredits: tier.monthlyCredits.toString(),
      changeReason: "",
    })
  }

  // Extract overall stats from the API response
  const overallStats = stats?.overall

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin - Billing & Pricing</h1>
          <p className="text-muted-foreground">
            Gestiona usuarios, créditos, configuración de pricing y márgenes de beneficio
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            void refetchStats()
            void refetchUsers()
            void refetchGlobalConfig()
            void refetchTierConfigs()
            void refetchProfitAnalysis()
            void refetchChangeHistory()
          }}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Debates
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-2xl font-bold">{overallStats?.totalDebates?.toLocaleString() || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Cost (USD)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-2xl font-bold">${overallStats?.totalCostUsd?.toFixed(2) || '0.00'}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Total Credits Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-2xl font-bold">
                {overallStats?.totalCreditsUsed ?
                  (overallStats.totalCreditsUsed > 1000000
                    ? `${(overallStats.totalCreditsUsed / 1000000).toFixed(1)}M`
                    : overallStats.totalCreditsUsed.toLocaleString()
                  ) : 0
                }
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-2xl font-bold">{stats?.byUser?.length || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Users, Pricing Config, Profit Analysis, History */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="pricing">Pricing Configuration</TabsTrigger>
          <TabsTrigger value="analysis">Profit Analysis</TabsTrigger>
          <TabsTrigger value="history">Change History</TabsTrigger>
        </TabsList>

        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-6">
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

          {/* Top Users by Usage */}
          {stats?.byUser && stats.byUser.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Users by Usage</CardTitle>
                <CardDescription>
                  Users with highest debate activity and credit consumption
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Total Debates</TableHead>
                        <TableHead>Credits Used</TableHead>
                        <TableHead>Cost (USD)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.byUser.slice(0, 10).map((user) => (
                        <TableRow key={user.userId}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{user.email}</div>
                              {user.name && (
                                <div className="text-sm text-muted-foreground">{user.name}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{user.totalDebates}</TableCell>
                          <TableCell>{user.totalCreditsUsed.toLocaleString()}</TableCell>
                          <TableCell>${user.totalCostUsd.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Pricing Configuration Tab */}
        <TabsContent value="pricing" className="space-y-6">
          {/* Global Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Global Pricing Configuration
                  </CardTitle>
                  <CardDescription>
                    Control credit multiplier and USD per credit ratio
                  </CardDescription>
                </div>
                {!editingGlobal && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingGlobal(true)
                      setNewCreditMultiplier(globalConfig?.creditMultiplier.toString() || "")
                      setNewUsdPerCredit(globalConfig?.usdPerCredit.toString() || "")
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Configuration
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {globalConfigLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : editingGlobal ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="creditMultiplier">Credit Multiplier (Markup)</Label>
                      <Input
                        id="creditMultiplier"
                        type="number"
                        step="0.01"
                        placeholder="e.g., 1.75"
                        value={newCreditMultiplier}
                        onChange={(e) => setNewCreditMultiplier(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Markup factor applied to API costs. Current: {globalConfig?.creditMultiplier}x
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="usdPerCredit">USD per Credit</Label>
                      <Input
                        id="usdPerCredit"
                        type="number"
                        step="0.0001"
                        placeholder="e.g., 0.01"
                        value={newUsdPerCredit}
                        onChange={(e) => setNewUsdPerCredit(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Price of each credit in USD. Current: ${globalConfig?.usdPerCredit}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="changeReason">Reason for Change (Required)</Label>
                    <Input
                      id="changeReason"
                      placeholder="e.g., Adjusting margin to improve profitability"
                      value={changeReason}
                      onChange={(e) => setChangeReason(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingGlobal(false)
                        setNewCreditMultiplier("")
                        setNewUsdPerCredit("")
                        setChangeReason("")
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpdateGlobalConfig}
                      disabled={updateGlobalConfig.isPending}
                    >
                      {updateGlobalConfig.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Credit Multiplier</div>
                    <div className="text-3xl font-bold">{globalConfig?.creditMultiplier}x</div>
                    <div className="text-sm text-muted-foreground">
                      Each credit covers ${(Number(globalConfig?.usdPerCredit || 0) / Number(globalConfig?.creditMultiplier || 1)).toFixed(5)} in API costs
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">USD per Credit</div>
                    <div className="text-3xl font-bold">${globalConfig?.usdPerCredit}</div>
                    <div className="text-sm text-muted-foreground">
                      {(1 / Number(globalConfig?.usdPerCredit || 0.01)).toFixed(0)} credits = $1 USD
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tier Configurations */}
          <Card>
            <CardHeader>
              <CardTitle>Tier Pricing Configuration</CardTitle>
              <CardDescription>
                Manage monthly pricing and credit allocations for each tier
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tierConfigsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tier</TableHead>
                        <TableHead>Monthly Price (USD)</TableHead>
                        <TableHead>Monthly Credits</TableHead>
                        <TableHead>Effective From</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tierConfigs?.map((tier) => (
                        <TableRow key={tier.tier}>
                          <TableCell>
                            <Badge
                              variant={
                                tier.tier === 'business' ? 'default' :
                                tier.tier === 'pro' ? 'secondary' :
                                'outline'
                              }
                            >
                              {tier.tierName}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {editingTier === tier.tier ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={tierFormData.monthlyPriceUsd}
                                onChange={(e) => setTierFormData({ ...tierFormData, monthlyPriceUsd: e.target.value })}
                                className="w-32"
                              />
                            ) : (
                              <span className="font-medium">${(tier.monthlyPriceUsd / 100).toFixed(2)}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingTier === tier.tier ? (
                              <Input
                                type="number"
                                value={tierFormData.monthlyCredits}
                                onChange={(e) => setTierFormData({ ...tierFormData, monthlyCredits: e.target.value })}
                                className="w-32"
                              />
                            ) : (
                              <span>{tier.monthlyCredits.toLocaleString()}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {new Date(tier.effectiveFrom).toLocaleDateString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            {editingTier === tier.tier ? (
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Reason for change..."
                                  value={tierFormData.changeReason}
                                  onChange={(e) => setTierFormData({ ...tierFormData, changeReason: e.target.value })}
                                  className="w-48"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateTier(tier.tier)}
                                  disabled={updateTierConfig.isPending}
                                >
                                  {updateTierConfig.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Save className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingTier(null)
                                    setTierFormData({ monthlyPriceUsd: "", monthlyCredits: "", changeReason: "" })
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startEditingTier(tier)}
                              >
                                Edit
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profit Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profit Margin Analysis</CardTitle>
              <CardDescription>
                Analyze profitability and breakeven points for each tier
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profitAnalysisLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Global config summary */}
                  <div className="rounded-lg border p-4 bg-muted/50">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <div className="text-sm text-muted-foreground">Credit Multiplier</div>
                        <div className="text-2xl font-bold">{profitAnalysis?.globalConfig.creditMultiplier}x</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">USD per Credit</div>
                        <div className="text-2xl font-bold">${profitAnalysis?.globalConfig.usdPerCredit}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">API Cost Coverage per Credit</div>
                        <div className="text-2xl font-bold">
                          ${(Number(profitAnalysis?.globalConfig.usdPerCredit || 0) / Number(profitAnalysis?.globalConfig.creditMultiplier || 1)).toFixed(5)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tier analysis */}
                  <div className="space-y-4">
                    {profitAnalysis?.tiers.map((tier) => (
                      <Card key={tier.tier} className={tier.isProfitable ? "" : "border-red-500"}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                              <Badge variant={
                                tier.tier === 'business' ? 'default' :
                                tier.tier === 'pro' ? 'secondary' :
                                'outline'
                              }>
                                {tier.tierName}
                              </Badge>
                              {tier.isProfitable ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-500" />
                              )}
                            </CardTitle>
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">Monthly Price</div>
                              <div className="text-xl font-bold">${tier.monthlyPriceUsd.toFixed(2)}</div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <div>
                              <div className="text-sm text-muted-foreground">Monthly Credits</div>
                              <div className="text-lg font-semibold">{tier.monthlyCredits.toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Breakeven Credits</div>
                              <div className="text-lg font-semibold">{tier.breakEvenCredits.toLocaleString()}</div>
                              <div className="text-xs text-muted-foreground">{tier.breakEvenPercentage.toFixed(1)}% of allocation</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Profit at 100% Usage</div>
                              <div className={`text-lg font-semibold ${tier.profitMarginAt100Percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ${Math.abs(tier.profitMarginAt100Percent).toFixed(2)}
                              </div>
                              <div className="text-xs text-muted-foreground">{tier.profitMarginPercentage.toFixed(1)}% margin</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Status</div>
                              <div className={`text-sm font-medium ${tier.isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                                {tier.isProfitable ? 'Profitable' : 'Losing Money'}
                              </div>
                            </div>
                          </div>
                          {!tier.isProfitable && (
                            <Alert variant="destructive" className="mt-4">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertTitle>Warning: Unprofitable Tier</AlertTitle>
                              <AlertDescription>{tier.recommendation}</AlertDescription>
                            </Alert>
                          )}
                          {tier.isProfitable && tier.profitMarginPercentage < 20 && (
                            <Alert className="mt-4">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertTitle>Low Margin</AlertTitle>
                              <AlertDescription>{tier.recommendation}</AlertDescription>
                            </Alert>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Change History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Pricing Configuration Change History
              </CardTitle>
              <CardDescription>
                Audit trail of all pricing configuration changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {changeHistoryLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : !changeHistory || changeHistory.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No change history available
                </div>
              ) : (
                <div className="space-y-4">
                  {changeHistory.map((change) => (
                    <div key={change.id} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <Badge variant={change.changeType === 'global' ? 'default' : 'secondary'}>
                            {change.changeType === 'global' ? 'Global Config' : `Tier: ${change.tier}`}
                          </Badge>
                          <div className="text-sm text-muted-foreground mt-1">
                            {new Date(change.changedAt).toLocaleString()}
                          </div>
                        </div>
                        {change.changedByEmail && (
                          <div className="text-sm text-muted-foreground">
                            by {change.changedByEmail}
                          </div>
                        )}
                      </div>
                      {change.changeReason && (
                        <div className="text-sm mb-2">
                          <span className="font-medium">Reason:</span> {change.changeReason}
                        </div>
                      )}
                      <div className="grid gap-2 md:grid-cols-2 text-sm">
                        <div>
                          <div className="text-muted-foreground">Old Values:</div>
                          <pre className="text-xs bg-muted/50 p-2 rounded mt-1">
                            {JSON.stringify(change.oldValues, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <div className="text-muted-foreground">New Values:</div>
                          <pre className="text-xs bg-muted/50 p-2 rounded mt-1">
                            {JSON.stringify(change.newValues, null, 2)}
                          </pre>
                        </div>
                      </div>
                      {change.impactSummary && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          <span className="font-medium">Impact:</span> {change.impactSummary}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
