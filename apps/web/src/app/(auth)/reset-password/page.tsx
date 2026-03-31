"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Lock,
} from "lucide-react";

export default function ResetPasswordPage() {
  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-purple-400" />
        </div>
        <CardTitle className="text-2xl font-bold text-white">
          Restablecer contrasena
        </CardTitle>
        <CardDescription className="text-[var(--theme-text-secondary)]">
          Esta funcionalidad estara disponible proximamente.
          Contacta al administrador para restablecer tu contrasena.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Link href="/login">
          <Button variant="ghost" className="w-full text-[var(--theme-text-secondary)] hover:text-white hover:bg-white/10">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al login
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
