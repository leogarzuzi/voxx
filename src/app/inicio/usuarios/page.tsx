import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import UsuariosClient from "./UsuariosClient";
import { PERMISSOES } from "@/lib/perfis";
import { temPermissaoNoBanco } from "@/lib/perfisServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Usuario = {
  id: string;
  nome: string | null;
  email: string;
  perfil: string;
  status: string;
  criado_em: string | null;
};

export default async function UsuariosPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  const emailLogado = user.email.toLowerCase();

  const { data: usuarioLogado } = await supabase
    .from("usuarios")
    .select("perfil, status")
    .eq("email", emailLogado)
    .single();

  if (
    !usuarioLogado ||
    usuarioLogado.status !== "ativo" ||
    !(await temPermissaoNoBanco(supabase, usuarioLogado.perfil, PERMISSOES.USUARIOS))
  ) {
    redirect("/inicio");
  }

  const { data: usuarios, error } = await supabase
    .from("usuarios")
    .select("id, nome, email, perfil, status, criado_em")
    .order("criado_em", { ascending: false });

  const { data: perfisAtivos } = await supabase
    .from("perfis_acesso")
    .select("nome")
    .eq("ativo", true)
    .order("protegido", { ascending: false })
    .order("nome");
  const perfisDisponiveis = perfisAtivos?.length
    ? perfisAtivos.map((perfil) => perfil.nome as string)
    : ["Admin", "Gerente"];

  const usuariosLista = (usuarios ?? []) as Usuario[];
  const totalUsuarios = usuariosLista.length;
  const usuariosAtivos = usuariosLista.filter(
    (usuario) => usuario.status === "ativo"
  ).length;
  const usuariosInativos = usuariosLista.filter(
    (usuario) => usuario.status !== "ativo"
  ).length;
  const administradores = usuariosLista.filter(
    (usuario) => usuario.perfil === "Admin"
  ).length;

  return (
    <UsuariosClient
      usuariosLista={usuariosLista}
      emailLogado={emailLogado}
      erroCarregamento={Boolean(error)}
      totalUsuarios={totalUsuarios}
      usuariosAtivos={usuariosAtivos}
      usuariosInativos={usuariosInativos}
      administradores={administradores}
      perfisDisponiveis={perfisDisponiveis}
    />
  );
}


