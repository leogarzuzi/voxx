import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import BaseDadosTabela from "./BaseDadosTabela";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BaseDadosPage() {
  const supabase = await createSupabaseServerClient();

  // busca o usuário logado no Supabase Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // se não estiver logado, manda para o login
  if (!user?.email) {
    redirect("/login");
  }

  const emailLogado = user.email.toLowerCase();

  // busca o perfil e status do usuário logado
  const { data: usuarioLogado } = await supabase
    .from("usuarios")
    .select("perfil, status")
    .eq("email", emailLogado)
    .single();

  // somente Admin ou Gerente ativo pode acessar a base de dados
  if (
    !usuarioLogado ||
    usuarioLogado.status !== "ativo" ||
    !["Admin", "Gerente"].includes(usuarioLogado.perfil)
  ) {
    redirect("/inicio");
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div>
        <h1 className="text-3xl font-bold text-blue-700">Base de Dados</h1>
      </div>

      <BaseDadosTabela />
    </main>
  );
}