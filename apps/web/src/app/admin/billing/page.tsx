"use client"

/**
 * Admin Billing Page
 *
 * Manage users, credits, and subscriptions
 */

import { useState } from "react"
import { api } from "@/lib/api"
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
import { Loader2, Search, Plus, Minus } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function AdminBillingPage() {
  const [searchEmail, setSearchEmail] = useState("")
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [creditsToAdd, setCreditsToAdd] = useState("")

  // In a real implementation, you'd query users from the database
  // For now, this is a placeholder UI

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin - Billing Management</h1>
        <p className="text-muted-foreground">
          Gestiona usuarios, créditos y suscripciones
        </p>
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
            <div className="text-2xl font-bold">1,234</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">456</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Credits Issued
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.5M</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              MRR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$18,450</div>
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
                placeholder="Search by email..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button>Search</Button>
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Example rows - in production, map from API data */}
                <TableRow>
                  <TableCell>
                    <div>
                      <div className="font-medium">john@example.com</div>
                      <div className="text-sm text-muted-foreground">John Doe</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge>Pro</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">8,450</div>
                    <div className="text-sm text-muted-foreground">10,000/month</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">Active</Badge>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          Manage Credits
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Manage Credits</DialogTitle>
                          <DialogDescription>
                            Add or remove credits for this user
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Amount</label>
                            <Input
                              type="number"
                              placeholder="Enter credits amount"
                              value={creditsToAdd}
                              onChange={(e) => setCreditsToAdd(e.target.value)}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button className="flex-1">
                              <Plus className="h-4 w-4 mr-2" />
                              Add Credits
                            </Button>
                            <Button variant="destructive" className="flex-1">
                              <Minus className="h-4 w-4 mr-2" />
                              Remove Credits
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>
                    <div>
                      <div className="font-medium">sarah@example.com</div>
                      <div className="text-sm text-muted-foreground">Sarah Smith</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">Free</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">850</div>
                    <div className="text-sm text-muted-foreground">1,000 initial</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">None</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      Manage Credits
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
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
