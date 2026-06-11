import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import UsuariosTabela from "./UsuariosTabela";

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

  // busca o usuário logado no Supabase Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // se não estiver logado, manda para o login
  if (!user?.email) {
    redirect("/login");
  }

  const emailLogado = user.email.toLowerCase();

  // busca o perfil e status do usuário logado dentro da tabela usuarios
  const { data: usuarioLogado } = await supabase
    .from("usuarios")
    .select("perfil, status")
    .eq("email", emailLogado)
    .single();

  // somente Admin ativo pode acessar a gestão de usuários
  if (
    !usuarioLogado ||
    usuarioLogado.perfil !== "Admin" ||
    usuarioLogado.status !== "ativo"
  ) {
    redirect("/inicio");
  }

  // busca todos os usuários cadastrados no sistema
  const { data: usuarios, error } = await supabase
    .from("usuarios")
    .select("id, nome, email, perfil, status, criado_em")
    .order("criado_em", { ascending: false });

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div>
        <h1 className="text-3xl font-bold text-blue-700">
          Gestão de Usuários
        </h1>
      </div>

      {error && (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Erro ao carregar usuários.
        </p>
      )}

      <UsuariosTabela
        usuariosIniciais={(usuarios ?? []) as Usuario[]}
        emailLogado={emailLogado}
      />
    </main>
  );
}