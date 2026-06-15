import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import ControleDesligamentosTabela from "./ControleDesligamentosTabela";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function temAcessoDesligamento(perfil?: string | null) {
  const perfisPermitidos = [
    "Admin",
    "Gerente",
    "Admissão",
    "Admissao",
    "Desligamento",
  ];

  return !!perfil && perfisPermitidos.includes(perfil);
}

export default async function ControleDesligamentosPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("perfil, status")
    .eq("email", user.email.toLowerCase())
    .single();

  if (!usuario || usuario.status !== "ativo") {
    redirect("/login");
  }

  if (!temAcessoDesligamento(usuario.perfil)) {
    redirect("/inicio");
  }

  return (
      <main className="min-h-screen min-w-0 bg-slate-50 p-8">
        <div>
          <h1 className="text-3xl font-bold text-blue-700">Desligamento</h1>
        </div>
  
        <ControleDesligamentosTabela/>
      </main>
    );
}