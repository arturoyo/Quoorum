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
import { toast } from "sonner";
import {
  Loader2,
  Users,
  Search,
  Plus,
} from "lucide-react";

export default function AdminUsersPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAddCreditsDialogOpen, setIsAddCreditsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    email: string;
    name: string;
    credits: number;
  } | null>(null);
  const [creditsToAdd, setCreditsToAdd] = useState(1000);
  const [creditReason, setCreditReason] = useState("");
  const [userSearch, setUserSearch] = useState("");

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
      limit: 20,
    },
    { enabled: isAuthenticated && userSearch.length >= 3 }
  );
  const users = usersData?.users;

  // Mutations
  const addCredits = api.admin.addCredits.useMutation({
    onSuccess: (data) => {
      toast.success(`✓ ${data.creditsAdded} créditos añadidos. Nuevo saldo: ${data.newBalance}`);
      setIsAddCreditsDialogOpen(false);
      setSelectedUser(null);
      setCreditsToAdd(1000);
      setCreditReason("");
      void refetchUsers();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleAddCredits = (user: { id: string; email: string; name: string; credits: number; tier: string; role: string }) => {
    setSelectedUser({
      id: user.id,
      email: user.email,
      name: user.name,
      credits: user.credits,
    });
    setIsAddCreditsDialogOpen(true);
  };

  const confirmAddCredits = () => {
    if (!selectedUser) return;
    if (creditsToAdd <= 0) {
      toast.error("Los créditos deben ser positivos");
      return;
    }

    addCredits.mutate({
      userId: selectedUser.id,
      credits: creditsToAdd,
      reason: creditReason || undefined,
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
    <div className="container mx-auto px-6 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[var(--theme-text-primary)] flex items-center gap-3">
            <Users className="h-8 w-8 text-purple-400" />
            Gestión de Usuarios
          </h1>
          <p className="mt-2 text-[var(--theme-text-secondary)]">
            Busca usuarios por email y gestiona sus créditos (para soporte técnico)
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
              Busca usuarios por email y gestiona sus créditos (para soporte técnico)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--theme-text-secondary)]" />
                <Input
                  placeholder="Buscar por email o nombre (mínimo 3 caracteres)..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-10 border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)]"
                />
              </div>
            </div>

            {usersLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 text-purple-500 animate-spin" />
              </div>
            )}

            {!usersLoading && userSearch.length >= 3 && users && users.length === 0 && (
              <div className="text-center py-8 text-[var(--theme-text-secondary)]">
                No se encontraron usuarios
              </div>
            )}

            {!usersLoading && users && users.length > 0 && (
              <div className="border border-white/10 rounded-lg overflow-hidden">
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
                      <TableRow key={user.id} className="border-white/10">
                        <TableCell className="text-white">{user.email}</TableCell>
                        <TableCell className="text-[var(--theme-text-secondary)]">{user.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-purple-500/40 text-purple-300 bg-purple-500/10">
                            {user.tier}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[var(--theme-text-primary)] font-mono">
                          {user.credits.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-blue-500/40 text-blue-300 bg-blue-500/10">
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => handleAddCredits(user)}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Añadir Créditos
                          </Button>
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

      {/* Add Credits Dialog */}
      <Dialog open={isAddCreditsDialogOpen} onOpenChange={setIsAddCreditsDialogOpen}>
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
                value={creditsToAdd}
                onChange={(e) => setCreditsToAdd(parseInt(e.target.value) || 0)}
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
                Nuevo saldo: <strong className="text-white">{(selectedUser?.credits || 0) + creditsToAdd}</strong> créditos
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddCreditsDialogOpen(false)}
              className="border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-tertiary)]"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmAddCredits}
              disabled={addCredits.isPending || creditsToAdd <= 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {addCredits.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Añadiendo...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Añadir Créditos
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
