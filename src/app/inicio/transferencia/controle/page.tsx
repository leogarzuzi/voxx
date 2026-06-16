import { redirect } from "next/navigation";
import { PERMISSOES, temPermissao } from "@/lib/perfis";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import ControleTransferenciasTabela from "./ControleTransferenciasTabela";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ControleTransferenciasPage() {
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

  if (!temPermissao(usuario.perfil, PERMISSOES.TRANSFERENCIAS)) {
    redirect("/inicio");
  }

  return (
    <main className="min-h-screen min-w-0 bg-[#11141b] p-8 text-slate-100">
      <section className="overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_14%_0%,rgba(59,130,246,0.24),transparent_32%),linear-gradient(135deg,#242833_0%,#171a23_58%,#10131a_100%)] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">
          Módulo VOXX
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
          Controle de Transferências
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
          Gerencie entradas e saídas de colaboradores por transferência entre
          unidades.
        </p>
      </section>

      <ControleTransferenciasTabela />
    </main>
  );
}
