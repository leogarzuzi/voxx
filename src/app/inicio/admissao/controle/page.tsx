import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { PERMISSOES, temPermissao } from "@/lib/perfis";
import ControleAdmissoesClient from "./ControleAdmissoesClient";

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

  return <ControleAdmissoesClient />;
}