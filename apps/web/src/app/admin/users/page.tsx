"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { api } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Loader2,
  Users,
  Search,
  Plus,
  Minus,
  MoreVertical,
  ChevronDown,
} from "lucide-react";

type DialogType = "add-credits" | "deduct-credits" | "set-credits" | "change-tier" | "change-role" | "view-details" | null;

export default function AdminUsersPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const [userSearch, setUserSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [creditsAmount, setCreditsAmount] = useState(1000);
  const [creditReason, setCreditReason] = useState("");
  const [selectedTier, setSelectedTier] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");

  // Auth check
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      } else {
        setIsAuthenticated(true);
      }
    }
    checkAuth();
  }, [router, supabase.auth]);

  // Queries
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = api.admin.listUsers.useQuery(
    {
      search: userSearch || undefined,
      tier: tierFilter !== "all" ? (tierFilter as any) : undefined,
      role: roleFilter !== "all" ? (roleFilter as any) : undefined,
      limit: 50,
    },
    { enabled: isAuthenticated && userSearch.length >= 3 }
  );
  const users = usersData?.users;

  // Mutations
  const addCredits = api.admin.addCredits.useMutation({
    onSuccess: (data) => {
      toast.success(`✓ ${data.creditsAdded} créditos añadidos. Nuevo saldo: ${data.newBalance}`);
      resetDialog();
      void refetchUsers();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deductCredits = api.admin.deductCredits.useMutation({
    onSuccess: (data) => {
      toast.success(`✓ ${data.creditsDeducted} créditos deducidos. Nuevo saldo: ${data.newBalance}`);
      resetDialog();
      void refetchUsers();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateUserCredits = api.admin.updateUserCredits.useMutation({
    onSuccess: (data) => {
      toast.success(`✓ Créditos establecidos a ${creditsAmount}`);
      resetDialog();
      void refetchUsers();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateUserTier = api.admin.updateUserTier.useMutation({
    onSuccess: () => {
      toast.success(`✓ Tier actualizado a ${selectedTier}`);
      resetDialog();
      void refetchUsers();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateUserRole = api.admin.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success(`✓ Rol actualizado a ${selectedRole}`);
      resetDialog();
      void refetchUsers();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetDialog = () => {
    setActiveDialog(null);
    setSelectedUser(null);
    setCreditsAmount(1000);
    setCreditReason("");
    setSelectedTier("");
    setSelectedRole("");
  };

  const openDialog = (dialog: DialogType, user: any) => {
    setSelectedUser(user);
    setCreditsAmount(1000);
    setCreditReason("");
    setSelectedTier(user.tier);
    setSelectedRole(user.role);
    setActiveDialog(dialog);
  };

  const handleAddCredits = () => {
    if (!selectedUser || creditsAmount <= 0) {
      toast.error("Cantidad inválida");
      return;
    }
    addCredits.mutate({
      userId: selectedUser.id,
      credits: creditsAmount,
      reason: creditReason || undefined,
    });
  };

  const handleDeductCredits = () => {
    if (!selectedUser || creditsAmount <= 0) {
      toast.error("Cantidad inválida");
      return;
    }
    if (!creditReason.trim()) {
      toast.error("La razón es requerida para deducir créditos");
      return;
    }
    deductCredits.mutate({
      userId: selectedUser.id,
      credits: creditsAmount,
      reason: creditReason,
    });
  };

  const handleSetCredits = () => {
    if (!selectedUser || creditsAmount < 0) {
      toast.error("Cantidad inválida");
      return;
    }
    updateUserCredits.mutate({
      userId: selectedUser.id,
      credits: creditsAmount,
    });
  };

  const handleChangeTier = () => {
    if (!selectedUser || !selectedTier) return;
    updateUserTier.mutate({
      userId: selectedUser.id,
      tier: selectedTier as any,
    });
  };

  const handleChangeRole = () => {
    if (!selectedUser || !selectedRole) return;
    updateUserRole.mutate({
      userId: selectedUser.id,
      role: selectedRole as any,
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--theme-bg-primary)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 pb-24">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[var(--theme-text-primary)] flex items-center gap-3">
            <Users className="h-8 w-8 text-purple-400" />
            Gestión de Usuarios
          </h1>
          <p className="mt-2 text-[var(--theme-text-secondary)]">
            Busca, filtra y gestiona usuarios, créditos, tiers y roles
          </p>
        </div>

        {/* User Management */}
        <Card className="border-[var(--theme-border)] bg-[var(--theme-bg-primary)]/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-[var(--theme-text-primary)] flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-400" />
              Gestión de Usuarios
            </CardTitle>
            <CardDescription className="text-[var(--theme-text-secondary)]">
              Busca usuarios y gestiona sus créditos, tier y rol
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search and Filters */}
            <div className="flex gap-2 flex-wrap">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--theme-text-secondary)]" />
                <Input
                  placeholder="Buscar por email o nombre (mínimo 3 caracteres)..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-10 border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)]"
                />
              </div>
              
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="w-[130px] border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)]">
                  <SelectValue placeholder="Tier" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--theme-bg-tertiary)] border-[var(--theme-border)]">
                  <SelectItem value="all">Todos los Tiers</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                </SelectContent>
              </Select>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[130px] border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)]">
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--theme-bg-tertiary)] border-[var(--theme-border)]">
                  <SelectItem value="all">Todos los Roles</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Loading State */}
            {usersLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 text-purple-500 animate-spin" />
              </div>
            )}

            {/* No Results */}
            {!usersLoading && userSearch.length >= 3 && users && users.length === 0 && (
              <div className="text-center py-8 text-[var(--theme-text-secondary)]">
                No se encontraron usuarios
              </div>
            )}

            {/* Users Table */}
            {!usersLoading && users && users.length > 0 && (
              <div className="border border-white/10 rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-[var(--theme-text-secondary)]">Email</TableHead>
                      <TableHead className="text-[var(--theme-text-secondary)]">Nombre</TableHead>
                      <TableHead className="text-[var(--theme-text-secondary)]">Tier</TableHead>
                      <TableHead className="text-[var(--theme-text-secondary)]">Créditos</TableHead>
                      <TableHead className="text-[var(--theme-text-secondary)]">Rol</TableHead>
                      <TableHead className="text-[var(--theme-text-secondary)]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="border-white/10 hover:bg-white/5">
                        <TableCell className="text-white font-medium">{user.email}</TableCell>
                        <TableCell className="text-[var(--theme-text-secondary)]">{user.name}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className="border-purple-500/40 text-purple-300 bg-purple-500/10 cursor-pointer hover:bg-purple-500/20"
                            onClick={() => openDialog("change-tier", user)}
                          >
                            {user.tier}
                            <ChevronDown className="h-3 w-3 ml-1" />
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[var(--theme-text-primary)] font-mono font-bold">
                          {user.credits.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className="border-blue-500/40 text-blue-300 bg-blue-500/10 cursor-pointer hover:bg-blue-500/20"
                            onClick={() => openDialog("change-role", user)}
                          >
                            {user.role}
                            <ChevronDown className="h-3 w-3 ml-1" />
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[var(--theme-bg-tertiary)] border-[var(--theme-border)]">
                              <DropdownMenuItem 
                                onClick={() => openDialog("add-credits", user)}
                                className="text-[var(--theme-text-primary)] cursor-pointer"
                              >
                                <Plus className="h-4 w-4 mr-2 text-green-400" />
                                Añadir Créditos
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => openDialog("deduct-credits", user)}
                                className="text-[var(--theme-text-primary)] cursor-pointer"
                              >
                                <Minus className="h-4 w-4 mr-2 text-red-400" />
                                Deducir Créditos
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => openDialog("set-credits", user)}
                                className="text-[var(--theme-text-primary)] cursor-pointer"
                              >
                                <Plus className="h-4 w-4 mr-2 text-blue-400" />
                                Establecer Créditos
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-white/10" />
                              <DropdownMenuItem 
                                onClick={() => openDialog("view-details", user)}
                                className="text-[var(--theme-text-primary)] cursor-pointer"
                              >
                                Detalles
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {userSearch.length < 3 && (
              <div className="text-center py-8 text-[var(--theme-text-secondary)] text-sm">
                Escribe al menos 3 caracteres para buscar usuarios
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      {/* Add Credits Dialog */}
      <Dialog open={activeDialog === "add-credits"} onOpenChange={(open) => !open && resetDialog()}>
        <DialogContent className="border-white/10 bg-slate-900/95 backdrop-blur-xl text-white">
          <DialogHeader>
            <DialogTitle>Añadir Créditos</DialogTitle>
            <DialogDescription className="text-[var(--theme-text-secondary)]">
              Añadir créditos a <strong>{selectedUser?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 rounded-lg bg-[var(--theme-bg-tertiary)]/50 border border-[var(--theme-border)]">
              <p className="text-xs text-[var(--theme-text-secondary)] mb-1">Saldo Actual</p>
              <p className="text-xl font-bold text-white">{selectedUser?.credits.toLocaleString() || 0} créditos</p>
            </div>
            <div className="space-y-2">
              <Label>Cantidad de Créditos</Label>
              <Input
                type="number"
                min="1"
                value={creditsAmount}
                onChange={(e) => setCreditsAmount(parseInt(e.target.value) || 0)}
                className="border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)]"
              />
            </div>
            <div className="space-y-2">
              <Label>Razón (opcional)</Label>
              <Input
                placeholder="Ej: Créditos de bienvenida, soporte técnico..."
                value={creditReason}
                onChange={(e) => setCreditReason(e.target.value)}
                className="border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)]"
              />
            </div>
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <p className="text-xs text-[var(--theme-text-secondary)]">
                Nuevo saldo: <strong className="text-white">{(selectedUser?.credits || 0) + creditsAmount}</strong> créditos
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={resetDialog}
              className="border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddCredits}
              disabled={addCredits.isPending || creditsAmount <= 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {addCredits.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Añadiendo...</>
              ) : (
                <><Plus className="mr-2 h-4 w-4" />Añadir Créditos</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deduct Credits Dialog */}
      <Dialog open={activeDialog === "deduct-credits"} onOpenChange={(open) => !open && resetDialog()}>
        <DialogContent className="border-white/10 bg-slate-900/95 backdrop-blur-xl text-white">
          <DialogHeader>
            <DialogTitle>Deducir Créditos</DialogTitle>
            <DialogDescription className="text-[var(--theme-text-secondary)]">
              Deducir créditos de <strong>{selectedUser?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 rounded-lg bg-[var(--theme-bg-tertiary)]/50 border border-[var(--theme-border)]">
              <p className="text-xs text-[var(--theme-text-secondary)] mb-1">Saldo Actual</p>
              <p className="text-xl font-bold text-white">{selectedUser?.credits.toLocaleString() || 0} créditos</p>
            </div>
            <div className="space-y-2">
              <Label>Cantidad a Deducir</Label>
              <Input
                type="number"
                min="1"
                max={selectedUser?.credits || 0}
                value={creditsAmount}
                onChange={(e) => setCreditsAmount(parseInt(e.target.value) || 0)}
                className="border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)]"
              />
            </div>
            <div className="space-y-2">
              <Label>Razón (requerida)</Label>
              <Input
                placeholder="Ej: Error de sistema, cambio de plan..."
                value={creditReason}
                onChange={(e) => setCreditReason(e.target.value)}
                className="border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)]"
              />
            </div>
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-xs text-[var(--theme-text-secondary)]">
                Nuevo saldo: <strong className="text-white">{Math.max(0, (selectedUser?.credits || 0) - creditsAmount)}</strong> créditos
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={resetDialog}
              className="border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeductCredits}
              disabled={deductCredits.isPending || creditsAmount <= 0 || !creditReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {deductCredits.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deduciendo...</>
              ) : (
                <><Minus className="mr-2 h-4 w-4" />Deducir Créditos</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Credits Dialog */}
      <Dialog open={activeDialog === "set-credits"} onOpenChange={(open) => !open && resetDialog()}>
        <DialogContent className="border-white/10 bg-slate-900/95 backdrop-blur-xl text-white">
          <DialogHeader>
            <DialogTitle>Establecer Créditos</DialogTitle>
            <DialogDescription className="text-[var(--theme-text-secondary)]">
              Establecer valor exacto de créditos para <strong>{selectedUser?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 rounded-lg bg-[var(--theme-bg-tertiary)]/50 border border-[var(--theme-border)]">
              <p className="text-xs text-[var(--theme-text-secondary)] mb-1">Saldo Actual</p>
              <p className="text-xl font-bold text-white">{selectedUser?.credits.toLocaleString() || 0} créditos</p>
            </div>
            <div className="space-y-2">
              <Label>Nuevo Saldo</Label>
              <Input
                type="number"
                min="0"
                value={creditsAmount}
                onChange={(e) => setCreditsAmount(parseInt(e.target.value) || 0)}
                className="border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)]"
              />
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <p className="text-xs text-[var(--theme-text-secondary)]">
                Se establecerá el saldo a: <strong className="text-white">{creditsAmount}</strong> créditos
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={resetDialog}
              className="border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSetCredits}
              disabled={updateUserCredits.isPending || creditsAmount < 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateUserCredits.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Estableciendo...</>
              ) : (
                <>Establecer Créditos</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Tier Dialog */}
      <Dialog open={activeDialog === "change-tier"} onOpenChange={(open) => !open && resetDialog()}>
        <DialogContent className="border-white/10 bg-slate-900/95 backdrop-blur-xl text-white">
          <DialogHeader>
            <DialogTitle>Cambiar Tier</DialogTitle>
            <DialogDescription className="text-[var(--theme-text-secondary)]">
              Cambiar plan para <strong>{selectedUser?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 rounded-lg bg-[var(--theme-bg-tertiary)]/50 border border-[var(--theme-border)]">
              <p className="text-xs text-[var(--theme-text-secondary)] mb-1">Tier Actual</p>
              <p className="text-xl font-bold text-white">{selectedUser?.tier}</p>
            </div>
            <div className="space-y-2">
              <Label>Seleccionar Nuevo Tier</Label>
              <Select value={selectedTier} onValueChange={setSelectedTier}>
                <SelectTrigger className="border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[var(--theme-bg-tertiary)] border-[var(--theme-border)]">
                  <SelectItem value="free">Free (10 créditos/día)</SelectItem>
                  <SelectItem value="starter">Starter (25 créditos/día)</SelectItem>
                  <SelectItem value="pro">Pro (50 créditos/día)</SelectItem>
                  <SelectItem value="business">Business (100 créditos/día)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30 text-xs text-[var(--theme-text-secondary)]">
              El usuario recibirá créditos diarios según su nuevo tier a partir del próximo refresh.
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={resetDialog}
              className="border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleChangeTier}
              disabled={updateUserTier.isPending || selectedTier === selectedUser?.tier}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {updateUserTier.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Actualizando...</>
              ) : (
                <>Cambiar Tier</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={activeDialog === "change-role"} onOpenChange={(open) => !open && resetDialog()}>
        <DialogContent className="border-white/10 bg-slate-900/95 backdrop-blur-xl text-white">
          <DialogHeader>
            <DialogTitle>Cambiar Rol</DialogTitle>
            <DialogDescription className="text-[var(--theme-text-secondary)]">
              Cambiar permisos de <strong>{selectedUser?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 rounded-lg bg-[var(--theme-bg-tertiary)]/50 border border-[var(--theme-border)]">
              <p className="text-xs text-[var(--theme-text-secondary)] mb-1">Rol Actual</p>
              <p className="text-xl font-bold text-white">{selectedUser?.role}</p>
            </div>
            <div className="space-y-2">
              <Label>Seleccionar Nuevo Rol</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[var(--theme-bg-tertiary)] border-[var(--theme-border)]">
                  <SelectItem value="member">Member (usuario regular)</SelectItem>
                  <SelectItem value="admin">Admin (acceso a panel)</SelectItem>
                  <SelectItem value="super_admin">Super Admin (control total)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-[var(--theme-text-secondary)]">
              ⚠️ Cambiar a admin/super_admin otorgará acceso al panel de administración.
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={resetDialog}
              className="border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleChangeRole}
              disabled={updateUserRole.isPending || selectedRole === selectedUser?.role}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateUserRole.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Actualizando...</>
              ) : (
                <>Cambiar Rol</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={activeDialog === "view-details"} onOpenChange={(open) => !open && resetDialog()}>
        <DialogContent className="border-white/10 bg-slate-900/95 backdrop-blur-xl text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Usuario</DialogTitle>
            <DialogDescription className="text-[var(--theme-text-secondary)]">
              Información completa de <strong>{selectedUser?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {/* Información Básica */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-purple-400">Información Básica</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-[var(--theme-text-secondary)]">Email</p>
                  <p className="text-sm text-white font-mono">{selectedUser?.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[var(--theme-text-secondary)]">Nombre</p>
                  <p className="text-sm text-white">{selectedUser?.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[var(--theme-text-secondary)]">Tier</p>
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40">{selectedUser?.tier}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[var(--theme-text-secondary)]">Rol</p>
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40">{selectedUser?.role}</Badge>
                </div>
              </div>
            </div>

            {/* Créditos */}
            <div className="space-y-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <h3 className="font-semibold text-sm text-purple-400">Créditos</h3>
              <p className="text-2xl font-bold text-white">{selectedUser?.credits.toLocaleString()} créditos</p>
            </div>

            {/* Información de Creación */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-purple-400">Historial</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-[var(--theme-text-secondary)]">Creado el</p>
                  <p className="text-sm text-white">{new Date(selectedUser?.createdAt).toLocaleDateString('es-ES')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[var(--theme-text-secondary)]">Última actualización</p>
                  <p className="text-sm text-white">{new Date(selectedUser?.updatedAt).toLocaleDateString('es-ES')}</p>
                </div>
              </div>
            </div>

            {/* Estado */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-purple-400">Estado</h3>
              <Badge className={selectedUser?.isActive ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}>
                {selectedUser?.isActive ? "Activo" : "Inactivo"}
              </Badge>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
