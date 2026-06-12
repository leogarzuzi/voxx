import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { PERMISSOES, temPermissao } from "@/lib/perfis";
import BaseDadosTabela from "./BaseDadosTabela";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BaseDadosColaboradoresPage() {
  const supabase = await createSupabaseServerClient();

  // busca o usuário logado no Supabase Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // se não estiver logado, manda para o login
  if (!user?.email) redirect("/login");

  const emailLogado = user.email.toLowerCase();

  // busca o perfil e status do usuário logado
  const { data: usuarioLogado } = await supabase
    .from("usuarios")
    .select("perfil, status")
    .eq("email", emailLogado)
    .single();

  // somente usuário ativo com permissão pode acessar
  if (
    !usuarioLogado ||
    usuarioLogado.status !== "ativo" ||
    !temPermissao(
      usuarioLogado.perfil,
      PERMISSOES.BASE_DADOS_COLABORADORES
    )
  ) {
    redirect("/inicio");
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div>
        <h1 className="text-3xl font-bold text-blue-700">
          Base de Dados
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Colaboradores
        </p>
      </div>

      <BaseDadosTabela />
    </main>
  );
}