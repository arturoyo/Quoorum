"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { api } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  Mail,
  Lock,
  User,
  AlertCircle,
  Github,
  Chrome,
  CheckCircle,
  Gift,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [referralValid, setReferralValid] = useState<{
    valid: boolean;
    referrerName?: string;
    message?: string;
  } | null>(null);

  const supabase = createClient();

  // Validate referral code if present
  const { data: referralValidation, isLoading: isValidatingReferral } =
    api.referrals.validateCode.useQuery(
      { code: referralCode ?? "" },
      {
        enabled: !!referralCode,
        retry: false,
      }
    );

  useEffect(() => {
    if (referralValidation) {
      setReferralValid(referralValidation);
    }
  }, [referralValidation]);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!acceptTerms) {
      setError("Debes aceptar los términos y condiciones");
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            referral_code: referralCode ?? null, // Store referral code in user metadata
          },
          emailRedirectTo: `${window.location.origin}/auth/callback${
            referralCode ? `?ref=${referralCode}` : ""
          }`,
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          setError("Este email ya está registrado. ¿Quieres iniciar sesión?");
        } else {
          setError(error.message);
        }
        return;
      }

      setSuccess(true);
    } catch {
      setError("Ha ocurrido un error. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignup = async (provider: "google" | "github") => {
    if (!acceptTerms) {
      setError("Debes aceptar los términos y condiciones");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirectTo=/dashboard${
            referralCode ? `&ref=${referralCode}` : ""
          }`,
        },
      });

      if (error) {
        setError(error.message);
        setIsLoading(false);
      }
    } catch {
      setError("Ha ocurrido un error. Inténtalo de nuevo.");
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            ¡Revisa tu email!
          </CardTitle>
          <CardDescription className="styles.colors.text.secondary">
            Te hemos enviado un enlace de confirmación a{" "}
            <span className="text-white font-medium">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm styles.colors.text.secondary">
            Haz clic en el enlace del email para activar tu cuenta y comenzar a
            usar Quoorum.
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/login")}
            className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10"
          >
            Volver al login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold text-white">
          Crea tu cuenta
        </CardTitle>
        <CardDescription className="styles.colors.text.secondary">
          Comienza gratis con 5 debates al mes
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Referral Bonus Banner */}
        {referralCode && (
          <div>
            {isValidatingReferral ? (
              <Alert className="border-purple-500/50 bg-purple-500/10">
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>Validando código de referido...</AlertDescription>
              </Alert>
            ) : referralValid?.valid ? (
              <Alert className="border-green-500/50 bg-green-500/10">
                <Gift className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-200">
                  <strong>¡Bonus de referido activado!</strong>
                  <br />
                  {referralValid.referrerName
                    ? `${referralValid.referrerName} te ha invitado. `
                    : ""}
                  Obtendrás 100 créditos adicionales al completar tu registro.
                </AlertDescription>
              </Alert>
            ) : referralValid && !referralValid.valid ? (
              <Alert variant="destructive" className="border-yellow-500/50 bg-yellow-500/10">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-yellow-200">
                  {referralValid.message || "Código de referido inválido"}
                </AlertDescription>
              </Alert>
            ) : null}
          </div>
        )}

        {/* OAuth Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => handleOAuthSignup("google")}
            disabled={isLoading}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
          >
            <Chrome className="mr-2 h-4 w-4" />
            Google
          </Button>
          <Button
            variant="outline"
            onClick={() => handleOAuthSignup("github")}
            disabled={isLoading}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
          >
            <Github className="mr-2 h-4 w-4" />
            GitHub
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full bg-white/10" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-transparent px-2 styles.colors.text.tertiary">
              O continúa con email
            </span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="styles.colors.text.secondary">
              Nombre
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 styles.colors.text.tertiary" />
              <Input
                id="name"
                type="text"
                placeholder="Tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:styles.colors.text.tertiary focus:border-purple-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="styles.colors.text.secondary">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 styles.colors.text.tertiary" />
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:styles.colors.text.tertiary focus:border-purple-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="styles.colors.text.secondary">
              Contraseña
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 styles.colors.text.tertiary" />
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                disabled={isLoading}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:styles.colors.text.tertiary focus:border-purple-500"
              />
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={acceptTerms}
              onCheckedChange={(checked) => setAcceptTerms(checked === true)}
              className="border-white/20 data-[state=checked]:bg-purple-600"
            />
            <label
              htmlFor="terms"
              className="text-sm styles.colors.text.secondary leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Acepto los{" "}
              <Link href="/terms" className="text-purple-400 hover:text-purple-300">
                términos de servicio
              </Link>{" "}
              y la{" "}
              <Link href="/privacy" className="text-purple-400 hover:text-purple-300">
                política de privacidad
              </Link>
            </label>
          </div>

          <Button
            type="submit"
            disabled={isLoading || !acceptTerms}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando cuenta...
              </>
            ) : (
              "Crear cuenta gratis"
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col space-y-4 border-t border-white/10 pt-6">
        <p className="text-center text-sm styles.colors.text.secondary">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="text-purple-400 hover:text-purple-300 font-medium"
          >
            Inicia sesión
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-white">
            Cargando...
          </CardTitle>
        </CardHeader>
      </Card>
    }>
      <SignupContent />
    </Suspense>
  );
}
