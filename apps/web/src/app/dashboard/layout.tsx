import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // MODE TEST: Permitir acceso con cookie especial (solo en desarrollo)
  const isTestMode = process.env.NODE_ENV !== 'production'
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  const testAuthCookie = cookieStore.get('test-auth-bypass')?.value

  if (isTestMode && testAuthCookie === 'test@quoorum.pro') {
    // En modo test, permitir acceso sin validar Supabase
    return <>{children}</>;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <>{children}</>;
}
