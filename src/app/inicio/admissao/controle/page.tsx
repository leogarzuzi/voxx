import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { PERMISSOES, temPermissao } from "@/lib/perfis";
import ControleAdmissoesTabela from "./ControleAdmissoesTabela";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ControleAdmissoesPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) redirect("/login");

  const emailLogado = user.email.toLowerCase();

  const { data: usuarioLogado } = await supabase
    .from("usuarios")
    .select("perfil, status")
    .eq("email", emailLogado)
    .single();

  if (
    !usuarioLogado ||
    usuarioLogado.status !== "ativo" ||
    !temPermissao(usuarioLogado.perfil, PERMISSOES.ADMISSOES_VISUALIZAR)
  ) {
    redirect("/inicio");
  }

  return (
    <main className="min-h-screen min-w-0 bg-slate-50 p-8">
      <div>
        <h1 className="text-3xl font-bold text-blue-700">Admissão</h1>

        <p className="mt-1 text-sm text-gray-500">
          Controle de Admissões
        </p>
      </div>

      <ControleAdmissoesTabela />
    </main>
  );
}