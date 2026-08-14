import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import PerfisClient from "./PerfisClient";

export const dynamic = "force-dynamic";

export default async function PerfisPage() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user?.email) redirect("/login");

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("perfil, status")
    .eq("email", auth.user.email.toLowerCase())
    .single();

  if (usuario?.perfil !== "Admin" || usuario.status !== "ativo") {
    redirect("/inicio");
  }

  return <PerfisClient />;
}
