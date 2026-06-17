import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import AuditoriaClient from "./AuditoriaClient";

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

  if (usuario?.perfil !== "Admin") {
    redirect("/inicio");
  }

  return <AuditoriaClient />;
}

