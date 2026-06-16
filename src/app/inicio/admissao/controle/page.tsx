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
    <main className="min-h-screen min-w-0 bg-[#11141b] p-8 text-slate-100">
      <section className="overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_14%_0%,rgba(59,130,246,0.24),transparent_32%),linear-gradient(135deg,#242833_0%,#171a23_58%,#10131a_100%)] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">
          Módulo VOXX
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
          Controle de Admissões
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
          Cadastre admissões, acompanhe pendências de SEDE e controle o envio
          para as bases do sistema.
        </p>
      </section>

      <ControleAdmissoesTabela />
    </main>
  );
}
