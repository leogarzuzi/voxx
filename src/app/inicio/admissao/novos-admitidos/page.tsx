import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { PERMISSOES, temPermissao } from "@/lib/perfis";
import NovosAdmitidosManutencao from "./NovosAdmitidosManutencao";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NovosAdmitidosPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) redirect("/login");

  const { data: usuarioLogado } = await supabase
    .from("usuarios")
    .select("perfil, status")
    .eq("email", user.email.toLowerCase())
    .single();

  if (
    !usuarioLogado ||
    usuarioLogado.status !== "ativo" ||
    !temPermissao(usuarioLogado.perfil, PERMISSOES.NOVOS_ADMITIDOS_VISUALIZAR)
  ) {
    redirect("/inicio");
  }

  return <NovosAdmitidosManutencao />;
}