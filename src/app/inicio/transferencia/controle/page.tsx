import { redirect } from "next/navigation";
import { PERMISSOES } from "@/lib/perfis";
import { temPermissaoNoBanco } from "@/lib/perfisServer";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import ControleTransferenciasClient from "./ControleTransferenciasClient";

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

  if (!(await temPermissaoNoBanco(supabase, usuario.perfil, PERMISSOES.TRANSFERENCIAS))) {
    redirect("/inicio");
  }

  return <ControleTransferenciasClient />;
}
