import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import AuditoriaClient from "./AuditoriaClient";
import { PERMISSOES } from "@/lib/perfis";
import { temPermissaoNoBanco } from "@/lib/perfisServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AuditoriaPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("perfil")
    .eq("email", user.email.toLowerCase())
    .single();

  if (!usuario || !(await temPermissaoNoBanco(supabase, usuario.perfil, PERMISSOES.AUDITORIA))) {
    redirect("/inicio");
  }

  return <AuditoriaClient />;
}

