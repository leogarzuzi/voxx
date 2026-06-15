import { redirect } from "next/navigation";
import { PERMISSOES, temPermissao } from "@/lib/perfis";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import ControlePermutasTabela from "./ControlePermutasTabela";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ControlePermutasPage() {
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

  if (!temPermissao(usuario.perfil, PERMISSOES.PERMUTAS)) {
    redirect("/inicio");
  }

  return (
    <main className="min-h-screen min-w-0 bg-slate-50 p-8">
      <div>
        <h1 className="text-3xl font-bold text-blue-700">
          Controle de Permutas
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Gerencie trocas entre colaboradores do HMRG e outras unidades.
        </p>
      </div>

      <ControlePermutasTabela />
    </main>
  );
}
