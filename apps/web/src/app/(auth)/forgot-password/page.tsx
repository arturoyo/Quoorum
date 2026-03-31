"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Mail,
} from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
          <Mail className="w-8 h-8 text-purple-400" />
        </div>
        <CardTitle className="text-2xl font-bold text-white">
          Recuperar contrasena
        </CardTitle>
        <CardDescription className="text-[var(--theme-text-secondary)]">
          Para restablecer tu contrasena, contacta al administrador del sistema.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-center text-sm text-[var(--theme-text-secondary)]">
          La recuperacion automatica de contrasena estara disponible proximamente.
          Mientras tanto, solicita un restablecimiento al equipo de soporte.
        </p>
      </CardContent>

      <CardFooter className="flex flex-col space-y-4 border-t border-white/10 pt-6">
        <Link href="/login">
          <Button variant="ghost" className="text-[var(--theme-text-secondary)] hover:text-white hover:bg-white/10">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al login
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
