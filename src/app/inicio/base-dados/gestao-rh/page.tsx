import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { PERMISSOES } from "@/lib/perfis";
import { temPermissaoNoBanco } from "@/lib/perfisServer";
import BaseGestaoRhClient from "./BaseGestaoRhClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BaseDadosGestaoRhPage() {
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
    !(await temPermissaoNoBanco(supabase, usuarioLogado.perfil, PERMISSOES.BASE_DADOS_GESTAO_RH))
  ) {
    redirect("/inicio");
  }

  return <BaseGestaoRhClient />;
}

