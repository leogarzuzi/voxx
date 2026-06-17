import { redirect } from "next/navigation";
import { PERMISSOES, temPermissao } from "@/lib/perfis";
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

  if (!temPermissao(usuario.perfil, PERMISSOES.TRANSFERENCIAS)) {
    redirect("/inicio");
  }

  return <ControleTransferenciasClient />;
}
