import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import AuditoriaTabela from "./AuditoriaTabela";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AuditoriaPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("perfil")
    .eq("email", user.email.toLowerCase())
    .single();

  if (usuario?.perfil !== "Admin") {
    redirect("/inicio");
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div>
        <h1 className="text-3xl font-bold text-blue-700">Auditoria</h1>
      </div>

      <AuditoriaTabela />
    </main>
  );
}